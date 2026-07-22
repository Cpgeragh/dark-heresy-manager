import { describe, expect, it } from "vitest";
import {
  sanitizeDiceInput,
  sanitizeNonNegativeIntegerInput,
  sanitizePositiveIntegerInput,
} from "../../src/utils/formInput";

describe("sanitizeNonNegativeIntegerInput", () => {
  it("removes non-digits and redundant leading zeroes", () => {
    expect(sanitizeNonNegativeIntegerInput("00a12.3")).toBe("123");
  });

  it("preserves a single zero", () => {
    expect(sanitizeNonNegativeIntegerInput("000")).toBe("0");
  });
});

describe("sanitizePositiveIntegerInput", () => {
  it("removes non-digits and all leading zeroes", () => {
    expect(sanitizePositiveIntegerInput("00a12.3")).toBe("123");
  });

  it("removes zero when no positive value remains", () => {
    expect(sanitizePositiveIntegerInput("000")).toBe("");
  });
});

describe("sanitizeDiceInput", () => {
  it("normalises case and removes unsupported characters", () => {
    expect(sanitizeDiceInput(" 2D10 + 3 ")).toBe("2d103");
  });

  it("collapses additional dice separators", () => {
    expect(sanitizeDiceInput("2dd10")).toBe("2d10");
  });
});
