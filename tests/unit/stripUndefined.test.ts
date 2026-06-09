import { describe, it, expect } from "vitest";
import { stripUndefined } from "../../src/utils/stripUndefined";

describe("stripUndefined — primitives", () => {
  it("passes a string through unchanged", () => {
    expect(stripUndefined("hello")).toBe("hello");
  });

  it("passes a number through unchanged", () => {
    expect(stripUndefined(42)).toBe(42);
  });

  it("passes a boolean through unchanged", () => {
    expect(stripUndefined(true)).toBe(true);
  });

  it("passes null through unchanged (null is not undefined)", () => {
    expect(stripUndefined(null)).toBeNull();
  });

  it("passes 0 through unchanged", () => {
    expect(stripUndefined(0)).toBe(0);
  });

  it("passes empty string through unchanged", () => {
    expect(stripUndefined("")).toBe("");
  });
});

describe("stripUndefined — objects", () => {
  it("removes top-level undefined values", () => {
    const input = { a: 1, b: undefined, c: "x" };
    expect(stripUndefined(input)).toEqual({ a: 1, c: "x" });
  });

  it("preserves null values (only undefined is stripped, not null)", () => {
    const input = { a: null, b: undefined };
    expect(stripUndefined(input)).toEqual({ a: null });
  });

  it("returns empty object when all values are undefined", () => {
    expect(stripUndefined({ a: undefined, b: undefined })).toEqual({});
  });

  it("returns empty object unchanged", () => {
    expect(stripUndefined({})).toEqual({});
  });

  it("recursively removes undefined from nested objects", () => {
    const input = { outer: { inner: undefined, kept: 1 } };
    expect(stripUndefined(input)).toEqual({ outer: { kept: 1 } });
  });

  it("recursively removes deeply nested undefined values", () => {
    const input = { a: { b: { c: undefined, d: 2 } } };
    expect(stripUndefined(input)).toEqual({ a: { b: { d: 2 } } });
  });

  it("preserves falsy-but-defined values (0, false, empty string)", () => {
    const input = { count: 0, active: false, label: "" };
    expect(stripUndefined(input)).toEqual({ count: 0, active: false, label: "" });
  });

  it("handles a realistic character field with optional undefined properties", () => {
    const input = {
      name: "Bolter",
      damage: "1d10+5",
      specialRules: undefined,
      craftsmanship: undefined,
      equipped: true,
    };
    expect(stripUndefined(input)).toEqual({
      name: "Bolter",
      damage: "1d10+5",
      equipped: true,
    });
  });
});

describe("stripUndefined — arrays", () => {
  it("returns empty array unchanged", () => {
    expect(stripUndefined([])).toEqual([]);
  });

  it("preserves primitive array elements unchanged", () => {
    expect(stripUndefined([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("recursively strips undefined from objects inside arrays", () => {
    const input = [
      { a: 1, b: undefined },
      { c: 2 },
    ];
    expect(stripUndefined(input)).toEqual([{ a: 1 }, { c: 2 }]);
  });

  it("handles arrays of nested objects", () => {
    const input = [{ weapon: { equipped: undefined, name: "Bolter" } }];
    expect(stripUndefined(input)).toEqual([{ weapon: { name: "Bolter" } }]);
  });

  it("handles an array inside an object (mixed nesting)", () => {
    const input = {
      weapons: [
        { name: "Knife", rarity: undefined },
        { name: "Sword", rarity: "Uncommon" },
      ],
    };
    expect(stripUndefined(input)).toEqual({
      weapons: [{ name: "Knife" }, { name: "Sword", rarity: "Uncommon" }],
    });
  });
});
