import { describe, expect, it } from "vitest";
import { formatFirstNameInput } from "../../src/utils/firstName";

describe("formatFirstNameInput", () => {
  it("capitalizes the first character", () => {
    expect(formatFirstNameInput("cormac")).toBe("Cormac");
  });

  it("preserves the existing no-spaces first-name rule", () => {
    expect(formatFirstNameInput("cormac byrne")).toBe("Cormacbyrne");
  });

  it("allows the field to be cleared", () => {
    expect(formatFirstNameInput("   ")).toBe("");
  });
});
