import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClaimActions } from "../../src/hooks/useClaimActions";
import { claimCharacter as claimCharacterService } from "../../src/services/characterService";

vi.mock("../../src/services/characterService", () => ({
  claimCharacter: vi.fn(),
}));

const mockClaimCharacter = vi.mocked(claimCharacterService);

describe("useClaimActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to characterService's claimCharacter with the given code", async () => {
    mockClaimCharacter.mockResolvedValue({ campaignId: "c1", characterId: "ch1" });
    const { result } = renderHook(() => useClaimActions());

    const outcome = await act(() => result.current.claimCharacter("DH-AAAA-BBBB"));

    expect(mockClaimCharacter).toHaveBeenCalledWith("DH-AAAA-BBBB");
    expect(outcome).toEqual({ campaignId: "c1", characterId: "ch1" });
  });

  it("propagates a rejection from the service", async () => {
    mockClaimCharacter.mockRejectedValue(new Error("Already claimed"));
    const { result } = renderHook(() => useClaimActions());

    await expect(result.current.claimCharacter("DH-AAAA-BBBB")).rejects.toThrow(
      "Already claimed"
    );
  });
});
