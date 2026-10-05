import { describe, it, expect } from "vitest";
import { isDeepEqual } from "../../src/utils/isDeepEqual";

describe("isDeepEqual", () => {
  it("treats identical primitives as equal and different primitives as unequal", () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual("a", "a")).toBe(true);
    expect(isDeepEqual(1, 2)).toBe(false);
    expect(isDeepEqual(1, "1")).toBe(false);
    expect(isDeepEqual(null, undefined)).toBe(false);
  });

  it("compares arrays by length and element order", () => {
    expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(isDeepEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(isDeepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  it("compares nested objects regardless of key order", () => {
    expect(isDeepEqual({ a: 1, b: { c: [1, { d: 2 }] } }, { b: { c: [1, { d: 2 }] }, a: 1 })).toBe(
      true
    );
    expect(isDeepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 3 } })).toBe(false);
  });

  it("ignores keys whose value is undefined", () => {
    expect(isDeepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(isDeepEqual({ a: 1, b: undefined }, { a: 1, c: 2 })).toBe(false);
  });

  it("does not treat an array and an object as equal", () => {
    expect(isDeepEqual([], {})).toBe(false);
    expect(isDeepEqual({ 0: "a" }, ["a"])).toBe(false);
  });
});
