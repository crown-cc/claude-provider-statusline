import type { GlmLimit, ProviderContext, ProviderResult } from "../types";
import { formatPercent } from "../utils/format";
import { fetchJson } from "../utils/http";
import { peakMarker } from "../utils/peak";

interface GlmQuotaResponse {
  success?: boolean;
  code?: number;
  msg?: string;
  data?: {
    limits?: GlmLimit[];
    level?: string;
  };
  limits?: GlmLimit[];
}

type GlmWindow = "5h" | "week" | "month";

type ParsedWindow = {
  label: GlmWindow;
  percentage: number;
  nextResetTime?: number;
};

const UNSUPPORTED_WINDOWS_ERROR =
  "GLM quota response did not contain supported TOKENS_LIMIT windows";

function numeric(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
}

function normalizeTimestamp(value: unknown): number | undefined {
  const timestamp = numeric(value);

  if (timestamp === undefined || timestamp <= 0) return undefined;
  return timestamp < 1_000_000_000_000 ? timestamp * 1_000 : timestamp;
}

function formatResetTime(timestamp: number): string | undefined {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return undefined;

  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.month}-${values.day} ${values.hour}:${values.minute}`;
}

function classifyTokenWindow(limit: GlmLimit): GlmWindow | undefined {
  if (String(limit.type ?? "").toUpperCase() !== "TOKENS_LIMIT") {
    return undefined;
  }

  const unit = numeric(limit.unit);

  // Confirmed by the real GLM Coding Plan response:
  // unit 3 = rolling five-hour quota, unit 6 = rolling weekly quota.
  if (unit === 3) return "5h";
  if (unit === 6) return "week";

  // GLM currently does not return a monthly token window in the provided
  // response. Keep semantic support for a future documented monthly
  // TOKENS_LIMIT without treating TIME_LIMIT as a monthly token quota.
  const text = JSON.stringify(limit).toLowerCase();
  if (/month|monthly|30d|30[\s_-]*day/.test(text)) return "month";

  return undefined;
}

function remainingPercent(limit: GlmLimit): number | undefined {
  const direct = numeric(
    limit.percentage ?? limit.usedPercentage ?? limit.used_percentage,
  );
  if (direct !== undefined) return 100 - direct;

  const remaining = numeric(limit.remaining);
  const used = numeric(
    limit.currentValue ?? limit.current_value ?? limit.used ?? limit.usage,
  );
  const total = numeric(limit.limit ?? limit.total ?? limit.maxValue ?? limit.max_value);

  if (remaining !== undefined && total !== undefined && total > 0) {
    return (remaining / total) * 100;
  }

  if (used !== undefined && total !== undefined && total > 0) {
    return 100 - (used / total) * 100;
  }

  return undefined;
}

function parseTokenWindows(limits: GlmLimit[]): ParsedWindow[] {
  const windows = new Map<GlmWindow, ParsedWindow>();

  for (const limit of limits) {
    const label = classifyTokenWindow(limit);
    if (!label || windows.has(label)) continue;

    const percentage = remainingPercent(limit);
    if (percentage === undefined) continue;

    windows.set(label, {
      label,
      percentage,
      nextResetTime: normalizeTimestamp(limit.nextResetTime ?? limit.next_reset_time),
    });
  }

  const order: GlmWindow[] = ["5h", "week", "month"];
  return order.flatMap((label) => {
    const window = windows.get(label);
    return window ? [window] : [];
  });
}

function glmOrigin(baseUrl?: string): string {
  const value = baseUrl ?? "";

  if (value.includes("open.bigmodel.cn")) return "https://open.bigmodel.cn";
  if (value.includes("api.z.ai")) return "https://api.z.ai";

  return process.env.GLM_QUOTA_BASE_URL?.replace(/\/+$/, "") ?? "https://api.z.ai";
}

async function queryWithAuthFallback<T>(
  url: string,
  apiKey: string,
  timeoutMs: number,
): Promise<T> {
  let lastError: unknown;

  for (const authorization of [apiKey, `Bearer ${apiKey}`]) {
    try {
      return await fetchJson<T>(
        url,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Language": "en-US,en",
            "Content-Type": "application/json",
            Authorization: authorization,
          },
        },
        timeoutMs,
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function validateResponse(body: GlmQuotaResponse): void {
  const successfulCode = body.code === undefined || body.code === 0 || body.code === 200;

  if (body.success === false || !successfulCode) {
    throw new Error(body.msg || `GLM quota API returned code ${body.code ?? "unknown"}`);
  }
}

export async function queryGlm(context: ProviderContext): Promise<ProviderResult> {
  const origin = glmOrigin(context.baseUrl);
  const body = await queryWithAuthFallback<GlmQuotaResponse>(
    `${origin}/api/monitor/usage/quota/limit`,
    context.apiKey,
    context.timeoutMs,
  );

  validateResponse(body);

  const limits = body.data?.limits ?? body.limits ?? [];
  if (!Array.isArray(limits) || limits.length === 0) {
    throw new Error("GLM quota response did not contain data.limits");
  }

  const windows = parseTokenWindows(limits);
  if (windows.length === 0) {
    throw new Error(UNSUPPORTED_WINDOWS_ERROR);
  }

  const quotaParts = windows.map(
    (window) => `${window.label} ${formatPercent(window.percentage)}`,
  );

  const nextResetTime = windows
    .map((window) => window.nextResetTime)
    .filter((value): value is number => value !== undefined)
    .sort((left, right) => left - right)[0];

  const resetText = nextResetTime ? formatResetTime(nextResetTime) : undefined;
  const parts = resetText ? [...quotaParts, `reset ${resetText}`] : quotaParts;
  const marker = peakMarker("glm");

  return {
    provider: "glm",
    text: marker ? [...parts, marker].join(" · ") : parts.join(" · "),
  };
}
