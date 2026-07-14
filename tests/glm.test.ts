import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryGlm } from "../src/providers/glm";
import type { ProviderContext } from "../src/types";

const originalFetch = globalThis.fetch;

const providerContext: ProviderContext = {
  apiKey: "test-glm-api-key",
  baseUrl: "https://api.z.ai/api/anthropic",
  timeoutMs: 1_000,
};

function mockResponse(body: unknown, status = 200): void {
  globalThis.fetch = vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as typeof fetch;
}

beforeEach(() => {
  vi.useFakeTimers();
  // 01:00 in Asia/Shanghai, inside the GLM off-peak window.
  vi.setSystemTime(new Date("2026-07-14T17:00:00.000Z"));
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("queryGlm", () => {
  it("parses the real GLM response and displays the next reset time", async () => {
    mockResponse({
      code: 200,
      msg: "Operation successful",
      data: {
        limits: [
          {
            type: "TOKENS_LIMIT",
            unit: 3,
            number: 5,
            percentage: 0,
          },
          {
            type: "TOKENS_LIMIT",
            unit: 6,
            number: 1,
            percentage: 100,
            nextResetTime: 1783850426998,
          },
          {
            type: "TIME_LIMIT",
            unit: 5,
            number: 1,
            usage: 1000,
            currentValue: 0,
            remaining: 1000,
            percentage: 0,
            nextResetTime: 1786096826995,
            usageDetails: [
              { modelCode: "search-prime", usage: 0 },
              { modelCode: "web-reader", usage: 0 },
              { modelCode: "zread", usage: 0 },
            ],
          },
        ],
        level: "pro",
      },
      success: true,
    });

    const result = await queryGlm(providerContext);

    expect(result.provider).toBe("glm");
    expect(result.text).toContain("5h 100%");
    expect(result.text).toContain("week 0%");
    expect(result.text).toMatch(/reset \d{2}-\d{2} \d{2}:\d{2}/);
    expect(result.text).not.toContain("month");
    expect(result.text).not.toContain("TIME_LIMIT");
    expect(result.text).not.toContain("⚡");
  });

  it("shows a compact marker during peak hours", async () => {
    vi.setSystemTime(new Date("2026-07-14T04:00:00.000Z"));
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 0 }],
      },
    });

    const result = await queryGlm(providerContext);
    expect(result.text).toBe("5h 100% · ⚡ peak");
  });

  it("does not treat percentage zero as a missing value", async () => {
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [{ type: "TOKENS_LIMIT", unit: 3, number: 5, percentage: 0 }],
      },
    });

    const result = await queryGlm(providerContext);
    expect(result.text).toBe("5h 100%");
  });

  it("shows only token windows returned by the API", async () => {
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [{ type: "TOKENS_LIMIT", unit: 6, number: 1, percentage: 42 }],
      },
    });

    const result = await queryGlm(providerContext);

    expect(result.text).toBe("week 58%");
    expect(result.text).not.toContain("5h");
    expect(result.text).not.toContain("month");
    expect(result.text).not.toContain("?");
  });

  it("ignores TIME_LIMIT entries instead of treating them as monthly token quota", async () => {
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [
          { type: "TOKENS_LIMIT", unit: 3, number: 5, percentage: 18 },
          {
            type: "TIME_LIMIT",
            unit: 5,
            number: 1,
            currentValue: 300,
            remaining: 700,
            percentage: 30,
          },
        ],
      },
    });

    const result = await queryGlm(providerContext);

    expect(result.text).toBe("5h 82%");
    expect(result.text).not.toContain("30%");
    expect(result.text).not.toContain("month");
  });

  it("supports a future semantic monthly TOKENS_LIMIT without guessing a numeric unit", async () => {
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [
          { type: "TOKENS_LIMIT", unit: 3, percentage: 12 },
          {
            type: "TOKENS_LIMIT",
            unit: "monthly",
            window: "monthly",
            percentage: 34,
          },
        ],
      },
    });

    const result = await queryGlm(providerContext);
    expect(result.text).toBe("5h 88% · month 66%");
  });

  it("throws the documented error when no supported token windows exist", async () => {
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [
          { type: "TIME_LIMIT", unit: 5, percentage: 20 },
          { type: "TOKENS_LIMIT", unit: 999, percentage: 30 },
        ],
      },
    });

    await expect(queryGlm(providerContext)).rejects.toThrow(
      "GLM quota response did not contain supported TOKENS_LIMIT windows",
    );
  });

  it("accepts both GLM success codes 0 and 200", async () => {
    mockResponse({
      code: 0,
      success: true,
      data: {
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 8 }],
      },
    });

    const result = await queryGlm(providerContext);
    expect(result.text).toBe("5h 92%");
  });

  it("throws the GLM API message for an unsuccessful response", async () => {
    mockResponse({
      code: 401,
      msg: "Invalid API key",
      success: false,
    });

    await expect(queryGlm(providerContext)).rejects.toThrow("Invalid API key");
  });

  it("uses the domestic quota endpoint for open.bigmodel.cn", async () => {
    mockResponse({
      code: 200,
      success: true,
      data: {
        limits: [{ type: "TOKENS_LIMIT", unit: 3, percentage: 10 }],
      },
    });

    await queryGlm({
      ...providerContext,
      baseUrl: "https://open.bigmodel.cn/api/anthropic",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://open.bigmodel.cn/api/monitor/usage/quota/limit",
      expect.any(Object),
    );
  });
});
