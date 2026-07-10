import type {
  AppConfig,
  ClaudeProviderSettings,
  ProviderName,
  ProviderResult,
} from "../types";
import { resolveProvider } from "./provider-resolver";
import { getProviderQuery } from "../providers/registry";

export type DoctorCheckStatus = "ok" | "warn" | "error";

export interface DoctorCheck {
  label: string;
  status: DoctorCheckStatus;
  message: string;
}

export interface DoctorReport {
  checks: DoctorCheck[];
  provider: ProviderName;
  quotaTest?: ProviderResult;
  ready: boolean;
  success: boolean;
}

function check(
  label: string,
  status: DoctorCheckStatus,
  message: string,
): DoctorCheck {
  return { label, status, message };
}

export async function runDoctor(
  settings: ClaudeProviderSettings,
  config: AppConfig,
): Promise<DoctorReport> {
  const provider = resolveProvider(
    {
      model: settings.model,
    },
    settings,
    config,
  );

  const checks: DoctorCheck[] = [
    check("Claude settings", "ok", settings.settingsPath),
    settings.baseUrl
      ? check("Base URL", "ok", settings.baseUrl)
      : check("Base URL", "error", "not set"),
    settings.model
      ? check("Model", "ok", settings.model)
      : check("Model", "warn", "not set; provider detection will rely on Base URL"),
    settings.apiKey
      ? check("API key", "ok", "found")
      : check("API key", "error", "not found"),
    provider !== "unknown"
      ? check("Provider", "ok", provider)
      : check("Provider", "error", "unable to detect from Base URL or model"),
  ];

  const query = provider === "unknown" ? undefined : getProviderQuery(provider);
  if (provider !== "unknown" && !query) {
    checks.push(check("Provider adapter", "error", `no adapter registered for ${provider}`));
  }

  const ready = Boolean(
    settings.baseUrl
    && settings.apiKey
    && provider !== "unknown"
    && query,
  );

  if (!ready || !query || !settings.apiKey) {
    checks.push(check(
      "Quota query",
      "warn",
      "skipped because required configuration is incomplete",
    ));

    return {
      checks,
      provider,
      ready: false,
      success: false,
    };
  }

  try {
    const quotaTest = await query({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      timeoutMs: config.timeoutMs,
    });

    checks.push(check("Quota query", "ok", quotaTest.text));

    return {
      checks,
      provider,
      quotaTest,
      ready: true,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push(check("Quota query", "error", message));

    return {
      checks,
      provider,
      ready: true,
      success: false,
    };
  }
}
