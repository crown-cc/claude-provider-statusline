import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config";
import { contextSegment } from "../src/statusline/segments/context";
import type { StatusLineContext } from "../src/statusline/types";

function createContext(input: StatusLineContext["input"] = {}): StatusLineContext {
  return {
    input,
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
    },
  };
}

describe("contextSegment", () => {
  it("calculates zero percent when used_percentage is null", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 1_000_000,
          used_percentage: null,
          current_usage: {},
        },
      }),
    );

    expect(result).toBe("ctx 0/1.0m 0%");
  });
});
