import { describe, it, expect } from "vitest";
import {
  getInsanityTrackEntry,
  getNextInsanityTrackEntry,
  getNextInsanityDegreeEntry,
  getInsanityDisorderRef,
  getMentalTraumaRef,
} from "../../src/features/insanity/insanityReference";

describe("getInsanityTrackEntry", () => {
  it("finds the right band at each boundary", () => {
    expect(getInsanityTrackEntry(0).degree).toBe("Stable");
    expect(getInsanityTrackEntry(9).degree).toBe("Stable");
    expect(getInsanityTrackEntry(10).degree).toBe("Unsettled");
    expect(getInsanityTrackEntry(39).degree).toBe("Unsettled");
    expect(getInsanityTrackEntry(40).degree).toBe("Disturbed");
  });

  it("treats 100+ as the terminal band with no upper limit", () => {
    expect(getInsanityTrackEntry(100).terminal).toBe(true);
    expect(getInsanityTrackEntry(250).terminal).toBe(true);
  });

  it("clamps negative or missing points to 0", () => {
    expect(getInsanityTrackEntry(-5).degree).toBe("Stable");
  });
});

describe("getNextInsanityTrackEntry", () => {
  it("returns the very next band regardless of degree", () => {
    expect(getNextInsanityTrackEntry(5)?.pointsLabel).toBe("10-19");
  });

  it("returns undefined once in the terminal band", () => {
    expect(getNextInsanityTrackEntry(100)).toBeUndefined();
  });
});

describe("getNextInsanityDegreeEntry", () => {
  it("skips bands sharing the current degree (Unsettled spans three bands)", () => {
    // At 15 points (Unsettled), the next *different* degree is Disturbed at 40,
    // not the next Unsettled band at 20.
    expect(getNextInsanityDegreeEntry(15)?.pointsLabel).toBe("40-49");
  });

  it("skips the repeated Disturbed band the same way", () => {
    // At 45 points (Disturbed), 50-59 is also Disturbed — the next different degree is Unhinged at 60.
    expect(getNextInsanityDegreeEntry(45)?.pointsLabel).toBe("60-69");
  });
});

describe("getInsanityDisorderRef", () => {
  it("finds a known disorder by id", () => {
    expect(getInsanityDisorderRef("phobia-fear-of-the-dead")?.name).toBe("Fear of the Dead");
  });

  it("returns undefined for a missing or unknown id", () => {
    expect(getInsanityDisorderRef(undefined)).toBeUndefined();
    expect(getInsanityDisorderRef("not-a-real-id")).toBeUndefined();
  });
});

describe("getMentalTraumaRef", () => {
  it("finds a known trauma by its roll range", () => {
    expect(getMentalTraumaRef("41-70")?.name).toBe("Compulsive Behaviour");
  });

  it("returns undefined for a missing or unknown roll", () => {
    expect(getMentalTraumaRef(undefined)).toBeUndefined();
    expect(getMentalTraumaRef("not-a-roll")).toBeUndefined();
  });
});
