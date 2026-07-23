import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacterHelpers } from "../../src/hooks/useCharacterHelpers";
import type { Character, Characteristics } from "../../src/types/Character";
import type { CharField } from "../../src/types/Character";

const BLANK: CharField = { base: 0, advances: 0 };

function makeCharacteristics(overrides: Partial<Record<keyof Characteristics, CharField>> = {}): Characteristics {
  return {
    ws: BLANK, bs: BLANK, s: BLANK, t: BLANK, ag: BLANK, int: BLANK, per: BLANK, wp: BLANK, fel: BLANK,
    ...overrides,
  };
}

const makeCharacter = (overrides: Partial<Character> = {}): Character =>
  ({
    id: "char-1",
    characteristics: makeCharacteristics(),
    corruption: { points: 0, malignancies: [] },
    talentsAndTraits: { homeworld: "", talents: [], traits: [] },
    ...overrides,
  } as Character);

describe("useCharacterHelpers", () => {
  describe("getEffectiveCharTotal", () => {
    it("equals the raw total when there are no corruption modifiers", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ s: { base: 30, advances: 0 } }),
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getEffectiveCharTotal("s")).toBe(30);
    });

    it("applies a positive modifier (Brute: +10 Strength)", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ s: { base: 30, advances: 0 } }),
        corruption: {
          points: 0,
          malignancies: [],
          minorMutations: [{ id: "m1", referenceId: "brute", name: "Brute" }],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getEffectiveCharTotal("s")).toBe(40);
    });

    it("applies a negative modifier (Brute: -10 Agility)", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ ag: { base: 30, advances: 0 } }),
        corruption: {
          points: 0,
          malignancies: [],
          minorMutations: [{ id: "m1", referenceId: "brute", name: "Brute" }],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getEffectiveCharTotal("ag")).toBe(20);
    });

    it("floors the result at 1, never negative", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ ag: { base: 5, advances: 0 } }),
        corruption: {
          points: 0,
          malignancies: [],
          minorMutations: [{ id: "m1", referenceId: "brute", name: "Brute" }],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getEffectiveCharTotal("ag")).toBe(1);
    });

    it("returns the raw total (0) when character is null, without throwing", () => {
      const { result } = renderHook(() => useCharacterHelpers({ character: null }));
      expect(() => result.current.getEffectiveCharTotal("s")).not.toThrow();
      expect(result.current.getEffectiveCharTotal("s")).toBe(0);
    });
  });

  describe("getCharBonus", () => {
    it("derives the bonus from the effective total (÷10, floored)", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ s: { base: 30, advances: 0 } }),
        corruption: {
          points: 0,
          malignancies: [],
          minorMutations: [{ id: "m1", referenceId: "brute", name: "Brute" }],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      // effective total = 40 → bonus = 4
      expect(result.current.getCharBonus("s")).toBe(4);
    });

    it("applies no multiplier when there's no Unnatural Characteristic trait", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ t: { base: 40, advances: 0 } }),
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getCharBonus("t")).toBe(4);
    });

    it("doubles the bonus with one Unnatural Characteristic (Toughness) entry", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ t: { base: 40, advances: 0 } }),
        talentsAndTraits: {
          homeworld: "",
          talents: [],
          traits: [
            { uid: "u1", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Toughness)", specialisation: "Toughness" },
          ],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getCharBonus("t")).toBe(8);
    });

    it("triples the bonus with two Unnatural Characteristic (Toughness) entries (repeatable)", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ t: { base: 40, advances: 0 } }),
        talentsAndTraits: {
          homeworld: "",
          talents: [],
          traits: [
            { uid: "u1", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Toughness)", specialisation: "Toughness" },
            { uid: "u2", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Toughness)", specialisation: "Toughness" },
          ],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getCharBonus("t")).toBe(12);
    });

    it("doesn't apply the multiplier to a different characteristic", () => {
      const character = makeCharacter({
        characteristics: makeCharacteristics({ t: { base: 40, advances: 0 }, s: { base: 40, advances: 0 } }),
        talentsAndTraits: {
          homeworld: "",
          talents: [],
          traits: [
            { uid: "u1", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Toughness)", specialisation: "Toughness" },
          ],
        },
      });
      const { result } = renderHook(() => useCharacterHelpers({ character }));
      expect(result.current.getCharBonus("s")).toBe(4);
    });
  });
});
