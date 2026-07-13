import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config";
import { tokensSegment } from "../src/statusline/segments/tokens";
import type { StatusLineContext } from "../src/statusline/types";

function createContext(
  metrics: Partial<StatusLineContext["metrics"]> = {},
): StatusLineContext {
  return {
    input: {},
    config: DEFAULT_CONFIG,
    settings: { settingsPath: "/tmp/settings.json" },
    model: { id: "glm-5", displayName: "GLM-5" },
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
  it("shows total input, output, and cache percentage", () => {
    const result = tokensSegment.render(
      createContext({
        inputTokens: 5_700,
        outputTokens: 3_300,
        cacheReadTokens: 67_500,
      }),
    );

    expect(result).toBe("tokens 73.2k↑ 3.3k↓ │ cache 92.2%");
  });
});
