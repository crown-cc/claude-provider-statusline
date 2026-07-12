import { describe, expect, it } from "vitest";

import { formatMoney } from "../src/utils/format";

describe("formatMoney", () => {
  it("always keeps two decimal places for CNY balances", () => {
    expect(formatMoney("38", "CNY")).toBe("¥38.00");
    expect(formatMoney("38.5", "CNY")).toBe("¥38.50");
    expect(formatMoney("38.567", "CNY")).toBe("¥38.57");
  });
});
