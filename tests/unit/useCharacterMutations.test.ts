// tests/unit/useCharacterMutations.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCharacterMutations } from "../../src/hooks/useCharacterMutations";
import {
  patchCharacterField as patchCharacterFieldService,
  patchCharacterFields as patchCharacterFieldsService,
} from "../../src/services/characterService";
import type { Character } from "../../src/types/Character";

vi.mock("../../src/services/characterService", () => ({
  forceAssignCharacter: vi.fn(),
  forceReleaseCharacter: vi.fn(),
  patchCharacterField: vi.fn(),
  patchCharacterFields: vi.fn(),
  releaseCharacter: vi.fn(),
  updateCharacter: vi.fn(),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToast = { error: mockToastError, success: mockToastSuccess };
vi.mock("../../src/components/Toast", () => ({
  useToast: () => mockToast,
}));

const mockPatchCharacterField = vi.mocked(patchCharacterFieldService);
const mockPatchCharacterFields = vi.mocked(patchCharacterFieldsService);

const baseCharacter = {
  id: "char-1",
  characteristics: {
    ws: { base: 30, advances: 0 },
    bs: { base: 30, advances: 0 },
    s: { base: 30, advances: 0 },
    t: { base: 30, advances: 0 },
    ag: { base: 30, advances: 0 },
    int: { base: 30, advances: 0 },
    per: { base: 30, advances: 0 },
    wp: { base: 30, advances: 0 },
    fel: { base: 30, advances: 0 },
  },
} as Character;

describe("useCharacterMutations: patchField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls patchCharacterField with the campaign, character, field, and value", async () => {
    mockPatchCharacterField.mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: true,
      })
    );

    await act(() => result.current.patchField("notes", "Hello"));

    expect(mockPatchCharacterField).toHaveBeenCalledWith("camp-1", "char-1", "notes", "Hello");
  });

  it("does nothing when not allowed to edit", async () => {
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: false,
      })
    );

    await act(() => result.current.patchField("notes", "Hello"));

    expect(mockPatchCharacterField).not.toHaveBeenCalled();
  });

  it("shows an error toast and does not throw when the Function call fails", async () => {
    mockPatchCharacterField.mockRejectedValue(new Error("permission-denied"));
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: true,
      })
    );

    await act(() => result.current.patchField("notes", "Hello"));

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining("permission-denied"));
  });

  it("keeps generic mutation callbacks stable when a fresh character snapshot remains available", () => {
    const { result, rerender } = renderHook(
      ({ character }: { character: Character | null }) =>
        useCharacterMutations({
          campaignId: "camp-1",
          characterId: "char-1",
          character,
          allowedToEdit: true,
        }),
      { initialProps: { character: baseCharacter as Character | null } }
    );
    const initial = {
      updateField: result.current.updateField,
      patchField: result.current.patchField,
      patchFields: result.current.patchFields,
    };

    rerender({ character: { ...baseCharacter, notes: "new snapshot" } as Character });

    expect(result.current.updateField).toBe(initial.updateField);
    expect(result.current.patchField).toBe(initial.patchField);
    expect(result.current.patchFields).toBe(initial.patchFields);
  });
});

describe("useCharacterMutations: updateCharacteristic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges the changed stat into the full characteristics map and calls patchCharacterField", async () => {
    mockPatchCharacterField.mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: true,
      })
    );

    await act(() => result.current.updateCharacteristic("ws", { base: 30, advances: 2 }));

    expect(mockPatchCharacterField).toHaveBeenCalledWith("camp-1", "char-1", "characteristics", {
      ...baseCharacter.characteristics,
      ws: { base: 30, advances: 2 },
    });
  });

  it("does nothing when not allowed to edit", async () => {
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: false,
      })
    );

    await act(() => result.current.updateCharacteristic("ws", { base: 30, advances: 2 }));

    expect(mockPatchCharacterField).not.toHaveBeenCalled();
  });

  it("shows an error toast and does not throw when the Function call fails", async () => {
    mockPatchCharacterField.mockRejectedValue(new Error("permission-denied"));
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: true,
      })
    );

    await act(() => result.current.updateCharacteristic("ws", { base: 30, advances: 2 }));

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining("permission-denied"));
  });
});

describe("useCharacterMutations: patchFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls patchCharacterFields with the campaign, character, and the fields map", async () => {
    mockPatchCharacterFields.mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: true,
      })
    );

    await act(() =>
      result.current.patchFields({
        talentsAndTraits: { talents: [], traits: [] },
        psychic: { psyRating: 1 },
      })
    );

    expect(mockPatchCharacterFields).toHaveBeenCalledWith("camp-1", "char-1", {
      talentsAndTraits: { talents: [], traits: [] },
      psychic: { psyRating: 1 },
    });
  });

  it("does nothing when not allowed to edit", async () => {
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: false,
      })
    );

    await act(() => result.current.patchFields({ psychic: { psyRating: 1 } }));

    expect(mockPatchCharacterFields).not.toHaveBeenCalled();
  });

  it("shows an error toast and does not throw when the Function call fails", async () => {
    mockPatchCharacterFields.mockRejectedValue(new Error("permission-denied"));
    const { result } = renderHook(() =>
      useCharacterMutations({
        campaignId: "camp-1",
        characterId: "char-1",
        character: baseCharacter,
        allowedToEdit: true,
      })
    );

    await act(() => result.current.patchFields({ psychic: { psyRating: 1 } }));

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining("permission-denied"));
  });
});
