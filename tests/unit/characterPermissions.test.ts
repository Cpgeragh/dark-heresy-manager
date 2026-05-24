import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacterPermissions } from "../../src/hooks/useCharacterPermissions";
import type { Character } from "../../src/types/Character";

const makeCharacter = (overrides: Partial<Character> = {}): Character =>
  ({
    id: "char-1",
    userId: "player-1",
    isEditableByPlayer: false,
    campaignId: "campaign-1",
    recoveryCode: "DH-TEST-CODE",
    ...overrides,
  } as Character);

describe("useCharacterPermissions", () => {
  describe("allowedToEdit", () => {
    it("DM with dmReadOnly=false can edit", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter(),
          userId: "dm-1",
          isDM: true,
          dmReadOnly: false,
        })
      );
      expect(result.current.allowedToEdit).toBe(true);
    });

    it("DM with dmReadOnly=true cannot edit", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter(),
          userId: "dm-1",
          isDM: true,
          dmReadOnly: true,
        })
      );
      expect(result.current.allowedToEdit).toBe(false);
    });

    it("player who owns and character is editable can edit", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-1", isEditableByPlayer: true }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: true,
        })
      );
      expect(result.current.allowedToEdit).toBe(true);
    });

    it("player who owns but character is not editable cannot edit", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-1", isEditableByPlayer: false }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: true,
        })
      );
      expect(result.current.allowedToEdit).toBe(false);
    });

    it("player who does not own character cannot edit", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-2", isEditableByPlayer: true }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: true,
        })
      );
      expect(result.current.allowedToEdit).toBe(false);
    });

    it("null character returns false", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: null,
          userId: "player-1",
          isDM: false,
          dmReadOnly: false,
        })
      );
      expect(result.current.allowedToEdit).toBe(false);
    });
  });

  describe("isOwner", () => {
    it("returns true when userId matches character.userId", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-1" }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: false,
        })
      );
      expect(result.current.isOwner).toBe(true);
    });

    it("returns false when userId does not match", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-2" }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: false,
        })
      );
      expect(result.current.isOwner).toBe(false);
    });

    it("returns false when userId is null", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-1" }),
          userId: null,
          isDM: false,
          dmReadOnly: false,
        })
      );
      expect(result.current.isOwner).toBe(false);
    });
  });

  describe("canPlayerRelease", () => {
    it("returns true when player owns the character", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-1" }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: false,
        })
      );
      expect(result.current.canPlayerRelease).toBe(true);
    });

    it("returns false when DM owns the character (DM uses force release instead)", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "dm-1" }),
          userId: "dm-1",
          isDM: true,
          dmReadOnly: false,
        })
      );
      expect(result.current.canPlayerRelease).toBe(false);
    });

    it("returns false when player does not own the character", () => {
      const { result } = renderHook(() =>
        useCharacterPermissions({
          character: makeCharacter({ userId: "player-2" }),
          userId: "player-1",
          isDM: false,
          dmReadOnly: false,
        })
      );
      expect(result.current.canPlayerRelease).toBe(false);
    });
  });
});
