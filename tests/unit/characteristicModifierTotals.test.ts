import { describe, it, expect } from "vitest";
import {
  getCharacteristicModifierTotals,
  getCharacteristicModifierSources,
} from "../../src/mechanics/corruption/characteristicModifierTotals";
import type { CorruptionBlock, CorruptionMalignancyEntry, CorruptionMutationEntry } from "../../src/types/Character";

function malignancy(referenceId: string, extra: Partial<CorruptionMalignancyEntry> = {}): CorruptionMalignancyEntry {
  return { id: referenceId, referenceId, name: referenceId, ...extra };
}

function mutation(referenceId: string, extra: Partial<CorruptionMutationEntry> = {}): CorruptionMutationEntry {
  return { id: referenceId, referenceId, name: referenceId, ...extra };
}

describe("getCharacteristicModifierTotals", () => {
  it("returns nothing for an empty corruption block", () => {
    expect(getCharacteristicModifierTotals({ points: 0, malignancies: [] })).toEqual({});
  });

  it("sums flat modifiers across multiple characteristics (Brute: +10 S, +10 T, -10 Ag)", () => {
    const corruption: CorruptionBlock = { points: 0, malignancies: [], minorMutations: [mutation("brute")] };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ s: 10, t: 10, ag: -10 });
  });

  it("uses the player's rolled value for a roll1d10 modifier (Palsy: -1d10 Ag)", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [malignancy("palsy", { rolledModifiers: { ag: 6 } })],
    };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ ag: -6 });
  });

  it("treats a missing rolled value as 0", () => {
    const corruption: CorruptionBlock = { points: 0, malignancies: [malignancy("palsy")] };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ ag: 0 });
  });

  it("keeps two independent rolls separate (Tox Blood: Int and Fel each roll on their own)", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [],
      minorMutations: [mutation("tox-blood", { rolledModifiers: { int: 3, fel: 8 } })],
    };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ int: -3, fel: -8 });
  });

  it("stacks modifiers on the same characteristic from different entries and categories", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [malignancy("dark-hearted", { rolledModifiers: { fel: 4 } })],
      minorMutations: [mutation("big-eyes")],
    };
    // dark-hearted: fel -4 (rolled); big-eyes: per +10, fel -10 (flat) → fel totals -14
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ per: 10, fel: -14 });
  });

  it("ignores the legacy plain-string malignancies format but still counts mutations", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: "Some old free-text malignancy notes",
      minorMutations: [mutation("brute")],
    };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ s: 10, t: 10, ag: -10 });
  });

  it("ignores custom entries with no referenceId", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [{ id: "custom-1", name: "Homemade Affliction", custom: true }],
    };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({});
  });

  it("ignores an unrecognised referenceId", () => {
    const corruption: CorruptionBlock = { points: 0, malignancies: [malignancy("not-a-real-id")] };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({});
  });

  it("also sums modifiers from majorMutations, not just malignancies and minorMutations", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [],
      majorMutations: [mutation("necrophage")],
    };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ t: 10 });
  });

  it("handles a single entry with mixed flat and roll1d10 modifiers together (Aberration)", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [],
      majorMutations: [mutation("aberration", { rolledModifiers: { int: 4 } })],
    };
    expect(getCharacteristicModifierTotals(corruption)).toEqual({ s: 10, ag: 10, int: -4, fel: -10 });
  });
});

describe("getCharacteristicModifierSources", () => {
  it("returns nothing for an empty corruption block", () => {
    expect(getCharacteristicModifierSources({ points: 0, malignancies: [] }, "ag")).toEqual([]);
  });

  it("returns a single source for a malignancy affecting the requested characteristic", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [malignancy("palsy", { rolledModifiers: { ag: 6 } })],
    };
    expect(getCharacteristicModifierSources(corruption, "ag")).toEqual([
      { name: "Palsy", type: "Malignancy", amount: -6 },
    ]);
  });

  it("labels minor and major mutations correctly", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [],
      minorMutations: [mutation("brute")],
      majorMutations: [mutation("necrophage")],
    };
    expect(getCharacteristicModifierSources(corruption, "s")).toEqual([
      { name: "Brute", type: "Minor Mutation", amount: 10 },
    ]);
    expect(getCharacteristicModifierSources(corruption, "t")).toEqual([
      { name: "Brute", type: "Minor Mutation", amount: 10 },
      { name: "Necrophage", type: "Major Mutation", amount: 10 },
    ]);
  });

  it("returns nothing for a characteristic with no active modifiers, even when others are active", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [malignancy("palsy", { rolledModifiers: { ag: 6 } })],
    };
    expect(getCharacteristicModifierSources(corruption, "wp")).toEqual([]);
  });

  it("uses the reference name, not whatever name is stored on the entry", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: [malignancy("palsy", { name: "some-stale-stored-name", rolledModifiers: { ag: 6 } })],
    };
    expect(getCharacteristicModifierSources(corruption, "ag")).toEqual([
      { name: "Palsy", type: "Malignancy", amount: -6 },
    ]);
  });

  it("ignores legacy string malignancies and custom entries", () => {
    const corruption: CorruptionBlock = {
      points: 0,
      malignancies: "some old free text",
      minorMutations: [{ id: "custom-1", name: "Homemade Affliction", custom: true }],
    };
    expect(getCharacteristicModifierSources(corruption, "ag")).toEqual([]);
  });
});
