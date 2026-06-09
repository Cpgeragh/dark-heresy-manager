import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePsychicPowers } from "../../src/hooks/usePsychicPowers";
import type { PsychicBlock } from "../../src/types/Character";

const emptyPsychic: PsychicBlock = {
  psyRating: 0,
  disciplines: [],
  minorPowers: [],
  majorPowers: [],
};

const psychicWithPowers: PsychicBlock = {
  psyRating: 3,
  disciplines: ["Telepathy"],
  minorPowers: [
    { id: "p1", name: "Sense Presence", known: true, isMinor: true },
    { id: "p2", name: "Deja Vu", known: true, isMinor: true },
  ],
  majorPowers: [
    { id: "p3", name: "Mind Probe", known: true, isMinor: false },
  ],
};

describe("usePsychicPowers", () => {
  describe("addPower", () => {
    it("adds a minor power with correct properties", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: emptyPsychic, editable: true, onUpdate })
      );
      act(() => result.current.addMinorPower());
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.minorPowers).toHaveLength(1);
      expect(updated.minorPowers[0].isMinor).toBe(true);
      expect(updated.minorPowers[0].known).toBe(true);
      expect(updated.minorPowers[0].name).toBe("");
    });

    it("adds a major power with isMinor=false", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: emptyPsychic, editable: true, onUpdate })
      );
      act(() => result.current.addMajorPower());
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.majorPowers).toHaveLength(1);
      expect(updated.majorPowers[0].isMinor).toBe(false);
    });

    it("does nothing when editable is false", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: emptyPsychic, editable: false, onUpdate })
      );
      act(() => result.current.addMinorPower());
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("appends to existing powers without replacing them", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: true, onUpdate })
      );
      act(() => result.current.addMinorPower());
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.minorPowers).toHaveLength(3);
    });
  });

  describe("removePower", () => {
    it("removes a minor power by id", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: true, onUpdate })
      );
      act(() => result.current.removeMinorPower("p1"));
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.minorPowers).toHaveLength(1);
      expect(updated.minorPowers[0].name).toBe("Deja Vu");
    });

    it("removes a major power by id", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: true, onUpdate })
      );
      act(() => result.current.removeMajorPower("p3"));
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.majorPowers).toHaveLength(0);
    });

    it("does nothing when editable is false", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: false, onUpdate })
      );
      act(() => result.current.removeMinorPower("p1"));
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("updatePower", () => {
    it("updates a field on a minor power", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: true, onUpdate })
      );
      act(() => result.current.updateMinorPower(0, "name", "Renamed Power"));
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.minorPowers[0].name).toBe("Renamed Power");
      expect(updated.minorPowers[1].name).toBe("Deja Vu");
    });

    it("updates known field on a major power", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: true, onUpdate })
      );
      act(() => result.current.updateMajorPower(0, "known", false));
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.majorPowers[0].known).toBe(false);
    });

    it("does nothing when editable is false", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: false, onUpdate })
      );
      act(() => result.current.updateMinorPower(0, "name", "Should Not Update"));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("does not mutate other powers when updating one", () => {
      const onUpdate = vi.fn();
      const { result } = renderHook(() =>
        usePsychicPowers({ psychic: psychicWithPowers, editable: true, onUpdate })
      );
      act(() => result.current.updateMinorPower(0, "name", "Changed"));
      const updated: PsychicBlock = onUpdate.mock.calls[0][0];
      expect(updated.majorPowers).toEqual(psychicWithPowers.majorPowers);
    });
  });
});
