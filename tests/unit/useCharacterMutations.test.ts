// tests/unit/useCharacterMutations.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCharacterMutations } from "../../src/hooks/useCharacterMutations";
import { patchCharacterField as patchCharacterFieldService } from "../../src/services/characterService";
import type { Character } from "../../src/types/Character";

vi.mock("../../src/services/characterService", () => ({
  forceAssignCharacter: vi.fn(),
  forceReleaseCharacter: vi.fn(),
  patchCharacterField: vi.fn(),
  releaseCharacter: vi.fn(),
  updateCharacter: vi.fn(),
}));

const mockToastError = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: vi.fn() }),
}));

const mockPatchCharacterField = vi.mocked(patchCharacterFieldService);

const baseCharacter = { id: "char-1" } as Character;

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
});
