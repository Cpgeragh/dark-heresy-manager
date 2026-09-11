import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecoveryLookup } from "../../src/hooks/useRecoveryLookup";
import { lookupRecoveryCharacter } from "../../src/services/recoveryLookupService";
import { ClientCodeAttemptLimitError } from "../../src/utils/clientCodeAttemptLimit";

vi.mock("../../src/services/recoveryLookupService", () => ({
  lookupRecoveryCharacter: vi.fn(),
}));

const mockLookup = vi.mocked(lookupRecoveryCharacter);

describe("useRecoveryLookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets data on a found result", async () => {
    const found = {
      campaignId: "c1",
      characterId: "ch1",
      characterName: "Brother Corvus",
      campaignName: "The Calixis Conspiracy",
      ownership: "unclaimed" as const,
    };
    mockLookup.mockResolvedValue({ status: "found", result: found });

    const { result } = renderHook(() => useRecoveryLookup());
    await act(() => result.current.lookup("DH-TEST-0001"));

    expect(result.current.data).toEqual(found);
    expect(result.current.error).toBeNull();
    expect(mockLookup).toHaveBeenCalledWith("DH-TEST-0001");
  });

  it("sets a not-found error and leaves data null", async () => {
    mockLookup.mockResolvedValue({ status: "not-found" });

    const { result } = renderHook(() => useRecoveryLookup());
    await act(() => result.current.lookup("DH-TEST-0002"));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("No character found with this recovery code.");
  });

  it("sets a missing-data error and leaves data null", async () => {
    mockLookup.mockResolvedValue({ status: "missing-data" });

    const { result } = renderHook(() => useRecoveryLookup());
    await act(() => result.current.lookup("DH-TEST-0003"));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Recovery code points to missing data.");
  });

  it("sets a generic error when the lookup throws", async () => {
    mockLookup.mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useRecoveryLookup());
    await act(() => result.current.lookup("DH-TEST-0004"));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Unexpected error during lookup.");
  });

  it("shows the retry time when the local attempt limit is reached", async () => {
    mockLookup.mockRejectedValue(
      new ClientCodeAttemptLimitError("recovery", Date.now() + 15 * 60 * 1_000, Date.now())
    );

    const { result } = renderHook(() => useRecoveryLookup());
    await act(() => result.current.lookup("DH-TEST-0005"));

    expect(result.current.error).toBe(
      "5-attempt recovery-code limit reached. Try again in 15 minutes."
    );
  });

  it("clears a previous result and error when reset", async () => {
    mockLookup.mockResolvedValue({ status: "not-found" });

    const { result } = renderHook(() => useRecoveryLookup());
    await act(() => result.current.lookup("DH-TEST-0006"));
    expect(result.current.error).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("ignores a lookup result that completes after reset", async () => {
    const found = {
      campaignId: "c1",
      characterId: "ch1",
      characterName: "Brother Corvus",
      campaignName: "The Calixis Conspiracy",
      ownership: "unclaimed" as const,
    };
    let resolveLookup!: (value: { status: "found"; result: typeof found }) => void;
    mockLookup.mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve;
      })
    );

    const { result } = renderHook(() => useRecoveryLookup());
    let lookupPromise!: Promise<void>;
    act(() => {
      lookupPromise = result.current.lookup("DH-TEST-0007");
    });
    act(() => result.current.reset());

    await act(async () => {
      resolveLookup({ status: "found", result: found });
      await lookupPromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });
});
