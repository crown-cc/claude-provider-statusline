import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../src/config";
import { resolveProvider } from "../src/services/provider-resolver";

describe("resolveProvider", () => {
  it("detects DeepSeek from base URL", () => {
    expect(resolveProvider(
      { model: { id: "claude-sonnet", display_name: "Sonnet" } },
      {
        settingsPath: "/tmp/settings.json",
        baseUrl: "https://api.deepseek.com/anthropic",
      },
      DEFAULT_CONFIG,
    )).toBe("deepseek");
  });

  it("detects GLM from model name", () => {
    expect(resolveProvider(
      { model: { id: "glm-5", display_name: "GLM-5" } },
      { settingsPath: "/tmp/settings.json" },
      DEFAULT_CONFIG,
    )).toBe("glm");
  });
});
