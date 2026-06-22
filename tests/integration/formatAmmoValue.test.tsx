// tests/integration/formatAmmoValue.test.tsx
import { describe, it, expect } from "vitest";

import {
  formatMoneyForDisplay,
  formatMoneyInput,
  sanitizeMoneyInput,
} from "../../src/ui/moneyFormat";

describe("money formatting", () => {
  it("renders a symbol, formatted whole number, and Thrones", () => {
    expect(formatMoneyForDisplay("1000 Thrones")).toBe("₮ 1,000 Thrones");
    expect(formatMoneyForDisplay(30)).toBe("₮ 30 Thrones");
  });

  it("normalizes empty and missing values to zero", () => {
    expect(formatMoneyForDisplay("—")).toBe("₮ 0 Thrones");
    expect(formatMoneyForDisplay("")).toBe("₮ 0 Thrones");
    expect(formatMoneyInput("")).toBe("0 Thrones");
  });

  it("keeps custom cost input to non-negative whole-number digits", () => {
    expect(sanitizeMoneyInput("1,200.75 Thrones")).toBe("120075");
    expect(sanitizeMoneyInput("-50")).toBe("50");
  });
});
