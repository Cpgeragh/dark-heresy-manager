import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacterSheet } from "../../src/pages/CharacterSheet/useCharacterSheet";
import type { Character } from "../../src/types/Character";

const useCampaignMock = vi.fn();
vi.mock("../../src/hooks/useCampaign", () => ({
  useCampaign: (...args: unknown[]) => useCampaignMock(...args),
}));

const useDMOverrideMock = vi.fn();
vi.mock("../../src/hooks/useDMOverride", () => ({
  useDMOverride: () => useDMOverrideMock(),
}));

const useCharacterDataMock = vi.fn();
vi.mock("../../src/hooks/useCharacterData", () => ({
  useCharacterData: (...args: unknown[]) => useCharacterDataMock(...args),
}));

const useCharacterPermissionsMock = vi.fn();
vi.mock("../../src/hooks/useCharacterPermissions", () => ({
  useCharacterPermissions: (...args: unknown[]) => useCharacterPermissionsMock(...args),
}));

const useCharacterMutationsMock = vi.fn();
vi.mock("../../src/hooks/useCharacterMutations", () => ({
  useCharacterMutations: (...args: unknown[]) => useCharacterMutationsMock(...args),
}));

const useCharacterHelpersMock = vi.fn();
vi.mock("../../src/hooks/useCharacterHelpers", () => ({
  useCharacterHelpers: (...args: unknown[]) => useCharacterHelpersMock(...args),
}));

const mutationsResult = {
  updateField: vi.fn(),
  updateFields: vi.fn(),
  patchField: vi.fn(),
  updateCharacteristic: vi.fn(),
  releaseCharacter: vi.fn(),
  dmForceRelease: vi.fn(),
  dmForceAssign: vi.fn(),
  dmToggleEdit: vi.fn(),
  isUpdating: false,
  isReleasing: false,
  isDmForceReleasing: false,
  isDmForceAssigning: false,
  isDmTogglingEdit: false,
};

const helpersResult = {
  getCharField: vi.fn(),
  getCharTotal: vi.fn(),
  getEffectiveCharTotal: vi.fn(),
  getCharBonus: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: null });
  useDMOverrideMock.mockReturnValue({ dmReadOnly: true, toggleDmReadOnly: vi.fn() });
  useCharacterDataMock.mockReturnValue({ character: undefined, loading: false, error: null });
  useCharacterPermissionsMock.mockReturnValue({
    allowedToEdit: false,
    isOwner: false,
    canPlayerRelease: false,
  });
  useCharacterMutationsMock.mockReturnValue(mutationsResult);
  useCharacterHelpersMock.mockReturnValue(helpersResult);
});

function renderSheetHook(args: Partial<Parameters<typeof useCharacterSheet>[0]> = {}) {
  return renderHook(() =>
    useCharacterSheet({
      campaignIdParam: "campaign-1",
      characterIdParam: "char-1",
      effectiveUserId: "user-1",
      ...args,
    })
  );
}

describe("useCharacterSheet", () => {
  it("resolves path to null when either id param is missing", () => {
    const { result } = renderSheetHook({ characterIdParam: undefined });
    expect(result.current.path).toBeNull();
  });

  it("resolves a real path when both id params are present", () => {
    const { result } = renderSheetHook();
    expect(result.current.path).toEqual({ campaignId: "campaign-1", characterId: "char-1" });
  });

  it("computes isDM from the campaign's dmId matching the effective user", () => {
    useCampaignMock.mockReturnValue({
      campaign: { id: "campaign-1", dmId: "user-1" },
      loading: false,
      error: null,
    });
    const { result } = renderSheetHook();
    expect(result.current.isDM).toBe(true);

    useCampaignMock.mockReturnValue({
      campaign: { id: "campaign-1", dmId: "someone-else" },
      loading: false,
      error: null,
    });
    const { result: result2 } = renderSheetHook();
    expect(result2.current.isDM).toBe(false);
  });

  it("combines campaign and character loading into one flag", () => {
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: true, error: null });
    useCharacterDataMock.mockReturnValue({ character: undefined, loading: false, error: null });
    const { result } = renderSheetHook();
    expect(result.current.characterLoading).toBe(true);
  });

  it("prefers the character error over the campaign error", () => {
    const characterError = new Error("character failed");
    const campaignError = new Error("campaign failed");
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: campaignError });
    useCharacterDataMock.mockReturnValue({ character: undefined, loading: false, error: characterError });
    const { result } = renderSheetHook();
    expect(result.current.characterError).toBe(characterError);
  });

  it("falls back to the campaign error when there is no character error", () => {
    const campaignError = new Error("campaign failed");
    useCampaignMock.mockReturnValue({ campaign: undefined, loading: false, error: campaignError });
    useCharacterDataMock.mockReturnValue({ character: undefined, loading: false, error: null });
    const { result } = renderSheetHook();
    expect(result.current.characterError).toBe(campaignError);
  });

  it("defaults memberIds to an empty array when the campaign has none", () => {
    useCampaignMock.mockReturnValue({ campaign: { id: "campaign-1" }, loading: false, error: null });
    const { result } = renderSheetHook();
    expect(result.current.memberIds).toEqual([]);
  });

  it("passes through the campaign's real memberIds when present", () => {
    useCampaignMock.mockReturnValue({
      campaign: { id: "campaign-1", memberIds: ["a", "b"] },
      loading: false,
      error: null,
    });
    const { result } = renderSheetHook();
    expect(result.current.memberIds).toEqual(["a", "b"]);
  });

  it("forwards permissions, helpers, and mutations unchanged", () => {
    const character = { id: "char-1" } as Character;
    useCharacterDataMock.mockReturnValue({ character, loading: false, error: null });
    useCharacterPermissionsMock.mockReturnValue({
      allowedToEdit: true,
      isOwner: true,
      canPlayerRelease: true,
    });
    const { result } = renderSheetHook();

    expect(result.current.character).toBe(character);
    expect(result.current.allowedToEdit).toBe(true);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.canPlayerRelease).toBe(true);
    expect(result.current.getCharField).toBe(helpersResult.getCharField);
    expect(result.current.updateField).toBe(mutationsResult.updateField);
    expect(result.current.patchField).toBe(mutationsResult.patchField);
    expect(result.current.releaseCharacter).toBe(mutationsResult.releaseCharacter);
    expect(result.current.isReleasing).toBe(false);
  });

  it("passes the character to useCharacterPermissions/useCharacterMutations/useCharacterHelpers", () => {
    const character = { id: "char-1" } as Character;
    useCharacterDataMock.mockReturnValue({ character, loading: false, error: null });
    renderSheetHook();

    expect(useCharacterPermissionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ character })
    );
    expect(useCharacterMutationsMock).toHaveBeenCalledWith(expect.objectContaining({ character }));
    expect(useCharacterHelpersMock).toHaveBeenCalledWith({ character });
  });
});
