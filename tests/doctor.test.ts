import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config";
import { runDoctor } from "../src/services/doctor";
import { registerProvider } from "../src/providers/registry";

const originalDeepSeek = async () => ({
  provider: "deepseek" as const,
  text: "balance ¥1.00",
});

afterEach(() => {
  registerProvider("deepseek", originalDeepSeek);
});

describe("runDoctor", () => {
  it("skips quota query when configuration is incomplete", async () => {
    const report = await runDoctor(
      { settingsPath: "/tmp/settings.json" },
      DEFAULT_CONFIG,
    );

    expect(report.ready).toBe(false);
    expect(report.success).toBe(false);
    expect(report.checks.at(-1)?.message).toContain("skipped");
  });

  it("runs a live provider query when configuration is complete", async () => {
    registerProvider("deepseek", async () => ({
      provider: "deepseek",
      text: "balance ¥42.00",
    }));

    const report = await runDoctor(
      {
        settingsPath: "/tmp/settings.json",
        baseUrl: "https://api.deepseek.com/anthropic",
        apiKey: "secret",
        model: "deepseek-chat",
      },
      DEFAULT_CONFIG,
    );

    expect(report.ready).toBe(true);
    expect(report.success).toBe(true);
    expect(report.quotaTest?.text).toBe("balance ¥42.00");
  });

  it("reports a failed live provider query", async () => {
    registerProvider("deepseek", async () => {
      throw new Error("HTTP 401: invalid key");
    });

    const report = await runDoctor(
      {
        settingsPath: "/tmp/settings.json",
        baseUrl: "https://api.deepseek.com/anthropic",
        apiKey: "bad-key",
      },
      DEFAULT_CONFIG,
    );

    expect(report.ready).toBe(true);
    expect(report.success).toBe(false);
    expect(report.checks.at(-1)?.message).toContain("401");
  });
});
