import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "../src/config";

describe("DEFAULT_CONFIG", () => {
  it("refreshes DeepSeek and GLM provider data every 15 seconds", () => {
    expect(DEFAULT_CONFIG.refresh.providerCacheSeconds.deepseek).toBe(15);
    expect(DEFAULT_CONFIG.refresh.providerCacheSeconds.glm).toBe(15);
    expect(DEFAULT_CONFIG.refresh.providerCacheSeconds.default).toBe(30);
  });
});
