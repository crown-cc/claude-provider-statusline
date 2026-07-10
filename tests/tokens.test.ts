import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config";
import { tokensSegment } from "../src/statusline/segments/tokens";
import type { StatusLineContext } from "../src/statusline/types";

function createContext(metrics: Partial<StatusLineContext["metrics"]> = {}): StatusLineContext {
  return {
    input: {},
    config: DEFAULT_CONFIG,
    settings: {
      settingsPath: "/tmp/settings.json",
    },
    model: {
      id: "glm-5",
      displayName: "GLM-5",
    },
    provider: "glm",
    metrics: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      ...metrics,
    },
  };
}

describe("tokensSegment", () => {
  it("shows usage breakdown and cache percentage", () => {
    const result = tokensSegment.render(
      createContext({
        inputTokens: 73_200,
        outputTokens: 3_300,
        cacheReadTokens: 1_100_000,
        cacheWriteTokens: 0,
        totalTokens: 1_176_500,
      }),
    );

    expect(result).toBe("usage 76.5k (73.2k↑ 3.3k↓) │ cache 93.8%");
  });

  it("shows zero usage and zero cache percentage when no tokens exist", () => {
    const result = tokensSegment.render(createContext());

    expect(result).toBe("usage 0 (0↑ 0↓) │ cache 0.0%");
  });

  it("calculates usage from input and output only", () => {
    const result = tokensSegment.render(
      createContext({
        inputTokens: 100_000,
        outputTokens: 20_000,
        cacheReadTokens: 900_000,
        cacheWriteTokens: 50_000,
        totalTokens: 1_070_000,
      }),
    );

    expect(result).toContain("usage 120.0k (100.0k↑ 20.0k↓)");
  });

  it("does not include cache write tokens in cache percentage", () => {
    const result = tokensSegment.render(
      createContext({
        inputTokens: 100_000,
        outputTokens: 10_000,
        cacheReadTokens: 900_000,
        cacheWriteTokens: 500_000,
        totalTokens: 1_510_000,
      }),
    );

    expect(result).toContain("cache 90.0%");
  });

  it("shows zero cache percentage when there are input tokens but no cache reads", () => {
    const result = tokensSegment.render(
      createContext({
        inputTokens: 50_000,
        outputTokens: 5_000,
      }),
    );

    expect(result).toBe("usage 55.0k (50.0k↑ 5.0k↓) │ cache 0.0%");
  });
});
