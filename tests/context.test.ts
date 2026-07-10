import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config";
import { contextSegment } from "../src/statusline/segments/context";
import type { StatusLineContext } from "../src/statusline/types";
import type { ClaudeStatusInput } from "../src/types";

function createContext(input: ClaudeStatusInput = {}): StatusLineContext {
  return {
    input,
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
    },
  };
}

describe("contextSegment", () => {
  it("shows a placeholder when context_window is unavailable", () => {
    const result = contextSegment.render(createContext());

    expect(result).toBe("ctx —");
  });

  it("shows zero percent when the context size is known and usage is zero", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 1_000_000,
          current_usage: {},
        },
      }),
    );

    expect(result).toBe("ctx 0/1.0m 0%");
  });

  it("shows zero percent when current_usage is unavailable", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 1_000_000,
        },
      }),
    );

    expect(result).toBe("ctx 0/1.0m 0%");
  });

  it("uses used_percentage provided by Claude Code", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 1_000_000,
          used_percentage: 12,
          current_usage: {
            input_tokens: 20_000,
            cache_creation_input_tokens: 10_000,
            cache_read_input_tokens: 90_000,
          },
        },
      }),
    );

    expect(result).toBe("ctx 120.0k/1.0m 12%");
  });

  it("calculates percentage when used_percentage is unavailable", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 200_000,
          current_usage: {
            input_tokens: 10_000,
            cache_creation_input_tokens: 10_000,
            cache_read_input_tokens: 30_000,
          },
        },
      }),
    );

    expect(result).toBe("ctx 50.0k/200.0k 25%");
  });

  it("does not include output tokens in context usage", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 200_000,
          current_usage: {
            input_tokens: 10_000,
            output_tokens: 100_000,
            cache_creation_input_tokens: 10_000,
            cache_read_input_tokens: 30_000,
          },
        },
      }),
    );

    expect(result).toBe("ctx 50.0k/200.0k 25%");
  });

  it("shows used tokens without percentage when context size is unavailable", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          current_usage: {
            input_tokens: 8_000,
            cache_creation_input_tokens: 2_000,
            cache_read_input_tokens: 10_000,
          },
        },
      }),
    );

    expect(result).toBe("ctx 20.0k");
  });

  it("shows the provided percentage when context size is unavailable", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          used_percentage: 18,
        },
      }),
    );

    expect(result).toBe("ctx 18%");
  });

  it("calculates zero percent when used_percentage is null", () => {
    const result = contextSegment.render(
      createContext({
        context_window: {
          context_window_size: 1_000_000,
          used_percentage: null,
          current_usage: {},
        } as unknown as ClaudeStatusInput["context_window"],
      }),
    );

    expect(result).toBe("ctx 0/1.0m 0%");
  });
});
