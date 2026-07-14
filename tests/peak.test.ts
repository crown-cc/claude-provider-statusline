import { describe, expect, it } from "vitest";

import { isProviderPeakTime, peakMarker } from "../src/utils/peak";

function chinaTime(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 6, 14, hour - 8, minute));
}

describe("provider peak windows", () => {
  it("shows DeepSeek marker only outside 00:30-08:30 China time", () => {
    expect(peakMarker("deepseek", chinaTime(0, 29))).toBe("⚡");
    expect(peakMarker("deepseek", chinaTime(0, 30))).toBeUndefined();
    expect(peakMarker("deepseek", chinaTime(8, 29))).toBeUndefined();
    expect(peakMarker("deepseek", chinaTime(8, 30))).toBe("⚡");
  });

  it("shows GLM marker only outside 00:00-08:00 China time", () => {
    expect(isProviderPeakTime("glm", chinaTime(0))).toBe(false);
    expect(isProviderPeakTime("glm", chinaTime(7, 59))).toBe(false);
    expect(isProviderPeakTime("glm", chinaTime(8))).toBe(true);
    expect(peakMarker("glm", chinaTime(12))).toBe("⚡");
  });

  it("does not mark unknown providers as peak", () => {
    expect(peakMarker("unknown", chinaTime(12))).toBeUndefined();
  });
});
