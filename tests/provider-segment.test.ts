import { describe, expect, it } from "vitest";

import { formatProviderQuotaText } from "../src/statusline/segments/provider";

describe("formatProviderQuotaText", () => {
  it("adds left to GLM quota windows", () => {
    expect(
      formatProviderQuotaText(
        "glm",
        "5h 100% · week 59% · reset 07-12 18:00",
      ),
    ).toBe("5h 100% left · week 59% left · reset 07-12 18:00");
  });

  it("does not duplicate left", () => {
    expect(formatProviderQuotaText("glm", "5h 100% left")).toBe(
      "5h 100% left",
    );
  });

  it("does not change other providers", () => {
    expect(formatProviderQuotaText("deepseek", "balance ¥38.50")).toBe(
      "balance ¥38.50",
    );
  });
});
