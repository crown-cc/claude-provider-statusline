import { describe, expect, it } from "vitest";
import { StatusLineRenderer } from "../src/statusline/renderer";
import type { StatusLineContext } from "../src/statusline/types";
import { DEFAULT_CONFIG } from "../src/config";

const context: StatusLineContext = {
  input: {},
  config: DEFAULT_CONFIG,
  settings: { settingsPath: "/tmp/settings.json" },
  model: { id: "test", displayName: "Test" },
  provider: "unknown",
  metrics: {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0,
  },
};

describe("StatusLineRenderer", () => {
  it("renders segments by order", async () => {
    const renderer = new StatusLineRenderer({ separator: " | " })
      .register(
        { id: "second", order: 20, render: () => "B" },
        { id: "first", order: 10, render: () => "A" },
      );

    await expect(renderer.render(context)).resolves.toBe("A | B");
  });

  it("supports replace and remove", async () => {
    const renderer = new StatusLineRenderer()
      .register({ id: "value", order: 10, render: () => "old" })
      .replace({ id: "value", order: 10, render: () => "new" })
      .register({ id: "remove", order: 20, render: () => "x" })
      .remove("remove");

    await expect(renderer.render(context)).resolves.toBe("new");
  });

  it("skips disabled and empty segments", async () => {
    const renderer = new StatusLineRenderer()
      .register(
        { id: "hidden", order: 10, enabled: () => false, render: () => "hidden" },
        { id: "empty", order: 20, render: () => null },
        { id: "visible", order: 30, render: () => "visible" },
      );

    await expect(renderer.render(context)).resolves.toBe("visible");
  });
});
