import { describe, expect, it } from "vitest";

import {
  formatMoneyForDisplay,
  formatMoneyInput,
  openEndedCostMinimum,
  sanitizeMoneyInput,
} from "../../src/ui/format/moneyFormat";

describe("money formatting", () => {
  it("renders a symbol and a formatted whole number with no word Thrones", () => {
    expect(formatMoneyForDisplay("1000 Thrones")).toBe("₮ 1,000");
    expect(formatMoneyForDisplay(30)).toBe("₮ 30");
    expect(formatMoneyForDisplay("10,000+")).toBe("₮ 10,000+");
    expect(formatMoneyForDisplay("0 Thrones")).toBe("₮ 0");
  });

  it("shows a dash for an unknown cost", () => {
    expect(formatMoneyForDisplay("—")).toBe("₮ —");
    expect(formatMoneyForDisplay("")).toBe("₮ —");
    expect(formatMoneyForDisplay("Varies")).toBe("₮ —");
    expect(formatMoneyForDisplay(undefined)).toBe("₮ —");
  });

  it("still counts an unknown cost as zero when it is parsed", () => {
    expect(formatMoneyInput("")).toBe("0 Thrones");
    expect(formatMoneyInput("—")).toBe("0 Thrones");
    expect(formatMoneyInput("Varies")).toBe("0 Thrones");
  });

  it("reads the lowest cost of a price written with a plus sign", () => {
    expect(openEndedCostMinimum("10,000+")).toBe(10000);
    expect(openEndedCostMinimum("20+ Thrones")).toBe(20);
    expect(openEndedCostMinimum("500 Thrones")).toBeUndefined();
    expect(openEndedCostMinimum("—")).toBeUndefined();
    expect(openEndedCostMinimum(undefined)).toBeUndefined();
  });

  it("keeps custom cost input to non-negative whole-number digits", () => {
    expect(sanitizeMoneyInput("1,200.75 Thrones")).toBe("120075");
    expect(sanitizeMoneyInput("-50")).toBe("50");
  });
});
