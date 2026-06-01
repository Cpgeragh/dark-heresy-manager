// tests/unit/useCampaignsForUser.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../src/firebase", () => ({ db: {} }));

const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockCollection = vi.fn(() => "collection-ref");
const mockCollectionGroup = vi.fn(() => "group-ref");
const mockDoc = vi.fn(() => "doc-ref");
const mockQuery = vi.fn((...args) => args[0]);
const mockWhere = vi.fn(() => "where-clause");

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  collectionGroup: (...args: unknown[]) => mockCollectionGroup(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

import { useCampaignsForUser } from "../../src/hooks/useCampaignsForUser";

function makeDocSnap(id: string, data: object, exists = true) {
  return { id, data: () => data, exists: () => exists };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCampaignsForUser — DM role", () => {
  it("returns campaigns from Firestore when role is dm", async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        makeDocSnap("c1", { dmId: "uid-1", name: "Campaign Alpha" }),
        makeDocSnap("c2", { dmId: "uid-1", name: "Campaign Beta" }),
      ],
    });

    const { result } = renderHook(() => useCampaignsForUser("uid-1", "dm"));

    await waitFor(() => expect(result.current.campaigns).toHaveLength(2));
    expect(result.current.campaigns[0].id).toBe("c1");
    expect(result.current.campaigns[1].id).toBe("c2");
    expect(result.current.error).toBeNull();
  });

  it("returns empty array when no campaigns exist for DM", async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const { result } = renderHook(() => useCampaignsForUser("uid-dm", "dm"));

    await waitFor(() => expect(result.current.campaigns).toEqual([]));
    expect(result.current.error).toBeNull();
  });
});

describe("useCampaignsForUser — player role", () => {
  it("returns campaigns by looking up character campaign IDs", async () => {
    const charDoc1 = {
      ...makeDocSnap("char-1", { userId: "uid-p" }),
      ref: { parent: { parent: { id: "camp-1" } } },
    };
    const charDoc2 = {
      ...makeDocSnap("char-2", { userId: "uid-p" }),
      ref: { parent: { parent: { id: "camp-2" } } },
    };

    mockGetDocs.mockResolvedValueOnce({ docs: [charDoc1, charDoc2] });
    mockGetDoc
      .mockResolvedValueOnce(makeDocSnap("camp-1", { name: "Alpha" }))
      .mockResolvedValueOnce(makeDocSnap("camp-2", { name: "Beta" }));

    const { result } = renderHook(() => useCampaignsForUser("uid-p", "player"));

    await waitFor(() => expect(result.current.campaigns).toHaveLength(2));
    expect(result.current.campaigns.map((c) => c.id)).toEqual(["camp-1", "camp-2"]);
  });

  it("deduplicates campaign IDs when a player has multiple characters in the same campaign", async () => {
    const makeChar = (id: string, campId: string) => ({
      ...makeDocSnap(id, { userId: "uid-p" }),
      ref: { parent: { parent: { id: campId } } },
    });

    mockGetDocs.mockResolvedValueOnce({
      docs: [makeChar("char-a", "camp-1"), makeChar("char-b", "camp-1"), makeChar("char-c", "camp-2")],
    });
    mockGetDoc
      .mockResolvedValueOnce(makeDocSnap("camp-1", { name: "Alpha" }))
      .mockResolvedValueOnce(makeDocSnap("camp-2", { name: "Beta" }));

    const { result } = renderHook(() => useCampaignsForUser("uid-p", "player"));

    await waitFor(() => expect(result.current.campaigns).toHaveLength(2));
    // camp-1 appears twice in characters — getDoc should only be called twice (deduplicated)
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
  });

  it("excludes campaign docs that do not exist", async () => {
    const charDoc = {
      ...makeDocSnap("char-1", { userId: "uid-p" }),
      ref: { parent: { parent: { id: "ghost-camp" } } },
    };

    mockGetDocs.mockResolvedValueOnce({ docs: [charDoc] });
    mockGetDoc.mockResolvedValueOnce(makeDocSnap("ghost-camp", {}, false));

    const { result } = renderHook(() => useCampaignsForUser("uid-p", "player"));

    await waitFor(() => expect(result.current.campaigns).toEqual([]));
  });
});

describe("useCampaignsForUser — error handling", () => {
  it("sets error state when Firestore throws", async () => {
    mockGetDocs.mockRejectedValueOnce(new Error("permission-denied"));

    const { result } = renderHook(() => useCampaignsForUser("uid-1", "dm"));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/failed to load/i);
  });
});

describe("useCampaignsForUser — cleanup", () => {
  it("does not call setState after unmount", async () => {
    let resolveDocs!: (v: { docs: object[] }) => void;
    mockGetDocs.mockReturnValueOnce(new Promise((res) => { resolveDocs = res; }));

    const { result, unmount } = renderHook(() => useCampaignsForUser("uid-1", "dm"));
    unmount();

    // Resolve after unmount — should not trigger a state update or warning
    resolveDocs({ docs: [makeDocSnap("c1", { name: "Alpha" })] });

    // Give React a tick to process any lingering state updates
    await new Promise((r) => setTimeout(r, 0));

    expect(result.current.campaigns).toEqual([]);
  });
});
