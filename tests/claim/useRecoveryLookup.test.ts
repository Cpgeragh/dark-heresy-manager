import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecoveryLookup } from "../../src/pages/ClaimCharacter/hooks/useRecoveryLookup";

/* -----------------------------
   MOCK AUTH
------------------------------ */
vi.mock("../../src/firebase", () => {
  return {
    auth: {
      get currentUser() {
        return { uid: mockUid };
      },
    },
    db: {},
  };
});

let mockUid: string | null = null;

/* -----------------------------
   MOCK FIRESTORE
------------------------------ */
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<any>("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
  };
});

import { getDoc } from "firebase/firestore";

function mockGetDocSequence(docs: any[]) {
  let call = 0;
  (getDoc as any).mockImplementation(() => {
    return Promise.resolve(docs[call++]);
  });
}

describe("useRecoveryLookup ownership derivation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUid = null;
  });

  it("returns unclaimed when character has no userId", async () => {
    mockUid = "A";

    mockGetDocSequence([
      { exists: () => true, data: () => ({ campaignId: "c1", characterId: "ch1" }) },
      { exists: () => true, data: () => ({ name: "Campaign" }) },
      { exists: () => true, data: () => ({ userId: null }) },
    ]);

    const { result } = renderHook(() => useRecoveryLookup());

    await act(() => result.current.lookup("DH-TEST-0001"));

    expect(result.current.data?.ownership).toBe("unclaimed");
  });

  it("returns claimed-by-you when owned by current user", async () => {
    mockUid = "A";

    mockGetDocSequence([
      { exists: () => true, data: () => ({ campaignId: "c1", characterId: "ch1" }) },
      { exists: () => true, data: () => ({}) },
      { exists: () =>
          true,
        data: () => ({ userId: "A", isEditableByPlayer: true }),
      },
    ]);

    const { result } = renderHook(() => useRecoveryLookup());

    await act(() => result.current.lookup("DH-TEST-0002"));

    expect(result.current.data?.ownership).toBe("claimed-by-you");
  });

  it("returns claimed-by-other when owned by another user", async () => {
    mockUid = "B";

    mockGetDocSequence([
      { exists: () => true, data: () => ({ campaignId: "c1", characterId: "ch1" }) },
      { exists: () => true, data: () => ({}) },
      { exists: () =>
          true,
        data: () => ({ userId: "A", isEditableByPlayer: true }),
      },
    ]);

    const { result } = renderHook(() => useRecoveryLookup());

    await act(() => result.current.lookup("DH-TEST-0003"));

    expect(result.current.data?.ownership).toBe("claimed-by-other");
  });

  it("returns locked when owned and editing disabled", async () => {
    mockUid = "B";

    mockGetDocSequence([
      { exists: () => true, data: () => ({ campaignId: "c1", characterId: "ch1" }) },
      { exists: () => true, data: () => ({}) },
      { exists: () =>
          true,
        data: () => ({ userId: "A", isEditableByPlayer: false }),
      },
    ]);

    const { result } = renderHook(() => useRecoveryLookup());

    await act(() => result.current.lookup("DH-TEST-0004"));

    expect(result.current.data?.ownership).toBe("locked");
  });
});