import { describe, it, expect } from "vitest";
import {
  getCorruptionTrackEntry,
  getNextCorruptionTrackEntry,
  getNextMalignancyTestPoints,
} from "../../src/features/corruption/corruptionReference";

describe("getCorruptionTrackEntry", () => {
  it("treats 0 as Tainted even though the first band's min is 1", () => {
    expect(getCorruptionTrackEntry(0).degree).toBe("Tainted");
  });

  it("finds the right band at each boundary", () => {
    expect(getCorruptionTrackEntry(1).degree).toBe("Tainted");
    expect(getCorruptionTrackEntry(30).degree).toBe("Tainted");
    expect(getCorruptionTrackEntry(31).degree).toBe("Soiled");
    expect(getCorruptionTrackEntry(90).degree).toBe("Debased");
    expect(getCorruptionTrackEntry(99).degree).toBe("Profane");
  });

  it("treats 100+ as the terminal Damned band with no upper limit", () => {
    expect(getCorruptionTrackEntry(100).terminal).toBe(true);
    expect(getCorruptionTrackEntry(500).terminal).toBe(true);
  });

  it("clamps negative points to 0 (Tainted)", () => {
    expect(getCorruptionTrackEntry(-10).degree).toBe("Tainted");
  });
});

describe("getNextCorruptionTrackEntry", () => {
  it("returns the very next band", () => {
    expect(getNextCorruptionTrackEntry(15)?.degree).toBe("Soiled");
  });

  it("returns undefined once in the terminal band", () => {
    expect(getNextCorruptionTrackEntry(100)).toBeUndefined();
  });
});

describe("getNextMalignancyTestPoints", () => {
  it("rounds up to the next multiple of 10", () => {
    expect(getNextMalignancyTestPoints(0)).toBe(10);
    expect(getNextMalignancyTestPoints(5)).toBe(10);
    expect(getNextMalignancyTestPoints(99)).toBe(100);
  });

  it("sitting exactly on a multiple of 10 still means the test after that one", () => {
    // At exactly 10 points (having just taken a test), the next one is at 20, not 10 again.
    expect(getNextMalignancyTestPoints(10)).toBe(20);
  });

  it("returns undefined once in the terminal band", () => {
    expect(getNextMalignancyTestPoints(100)).toBeUndefined();
  });
});
