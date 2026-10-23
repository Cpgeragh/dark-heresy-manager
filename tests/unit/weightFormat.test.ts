import { describe, expect, it } from "vitest";
import { formatWeightForDisplay, readWeightKg } from "../../src/ui/format/weightFormat";

describe("readWeightKg", () => {
  it.each([
    ["4 kg", 4],
    ["4", 4],
    ["4kg", 4],
    ["0.5 kg", 0.5],
    ["6 kg†", 6],
    ["50 kg†", 50],
    ["4 kg case", 4],
    ["+2 kg", 2],
    ["-1 kg", -1],
  ])("reads %s as %s kg", (text, kg) => {
    expect(readWeightKg(text)).toBe(kg);
  });

  it.each(["", "Varies", "varies", "variable", "heavy"])("reads %j as unknown", (text) => {
    expect(readWeightKg(text)).toBeNull();
  });

  it.each(["-", "—", "n/a", "none"])("reads %j as 0 kg", (text) => {
    expect(readWeightKg(text)).toBe(0);
  });

  it("reads a missing weight as unknown", () => {
    expect(readWeightKg(undefined)).toBeNull();
    expect(readWeightKg(null)).toBeNull();
  });
});

describe("formatWeightForDisplay", () => {
  it("shows a plain weight with its unit", () => {
    expect(formatWeightForDisplay("4 kg")).toBe("4 kg");
    expect(formatWeightForDisplay("0.5")).toBe("0.5 kg");
  });

  it("drops a footnote dagger and shows the number", () => {
    expect(formatWeightForDisplay("6 kg†")).toBe("6 kg");
  });

  it("shows a weight with extra words as written", () => {
    expect(formatWeightForDisplay("4 kg case")).toBe("4 kg case");
  });

  it("keeps the plus sign of an upgrade weight", () => {
    expect(formatWeightForDisplay("+2 kg")).toBe("+2 kg");
  });

  it("shows 0 kg for a dash and the word Varies for Varies", () => {
    expect(formatWeightForDisplay("—")).toBe("0 kg");
    expect(formatWeightForDisplay("Varies")).toBe("Varies");
  });

  it("shows nothing for an empty weight", () => {
    expect(formatWeightForDisplay("")).toBe("");
    expect(formatWeightForDisplay(undefined)).toBe("");
  });

  it("shows 0 kg for a negative weight", () => {
    expect(formatWeightForDisplay("-1 kg")).toBe("0 kg");
  });
});
