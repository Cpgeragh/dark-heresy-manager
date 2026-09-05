import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCollection,
  mockDocumentId,
  mockGetDocs,
  mockLimit,
  mockOrderBy,
  mockQuery,
  mockStartAfter,
  mockUseQuerySubscription,
  mockWhere,
} = vi.hoisted(() => ({
  mockCollection: vi.fn((...path: unknown[]) => ({ type: "collection", path })),
  mockDocumentId: vi.fn(() => "__name__"),
  mockGetDocs: vi.fn(),
  mockLimit: vi.fn((value: number) => ({ type: "limit", value })),
  mockOrderBy: vi.fn((field: unknown, direction: string) => ({
    type: "orderBy",
    field,
    direction,
  })),
  mockQuery: vi.fn((...parts: unknown[]) => ({ type: "query", parts })),
  mockStartAfter: vi.fn((...values: unknown[]) => ({ type: "startAfter", values })),
  mockUseQuerySubscription: vi.fn(() => ({ data: [], loading: false, error: null })),
  mockWhere: vi.fn((field: string, operator: string, value: unknown) => ({
    type: "where",
    field,
    operator,
    value,
  })),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  documentId: () => mockDocumentId(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => mockLimit(value),
  orderBy: (field: unknown, direction: string) => mockOrderBy(field, direction),
  query: (...args: unknown[]) => mockQuery(...args),
  startAfter: (...values: unknown[]) => mockStartAfter(...values),
  where: (field: string, operator: string, value: unknown) => mockWhere(field, operator, value),
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn(() => vi.fn()),
}));

vi.mock("../../src/firebase", () => ({ db: "db", functions: "functions" }));

vi.mock("../../src/services/customItemService", () => ({
  customItemsCollectionRef: (campaignId: string) => ({
    type: "custom-items",
    campaignId,
  }),
}));

vi.mock("../../src/firebase/converters", () => ({
  charactersCollectionGroupRef: () => ({ type: "characters-collection-group" }),
  charactersCollectionRef: (campaignId: string) => ({
    type: "characters-collection",
    campaignId,
  }),
}));

vi.mock("../../src/hooks/useFirestoreSubscription", () => ({
  useQuerySubscription: (...args: unknown[]) => mockUseQuerySubscription(...args),
}));

vi.mock("../../src/components/Toast/ToastContext", () => ({
  useToast: () => ({ error: vi.fn() }),
}));

import { useClaimLogs } from "../../src/hooks/useClaimLogs";
import { useCampaignCharacters } from "../../src/hooks/useCampaignCharacters";
import { useCampaignCustomItems } from "../../src/hooks/useCampaignCustomItems";
import { usePlayerCharacters } from "../../src/hooks/usePlayerCharacters";
import { useSessions } from "../../src/hooks/useSessions";
import { useThreadMessages } from "../../src/hooks/useThreadMessages";

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuerySubscription.mockReturnValue({ data: [], loading: false, error: null });
  mockGetDocs.mockResolvedValue({ docs: [] });
});

describe("bounded Firestore hooks", () => {
  it("filters a campaign character query to the current owner for a player", () => {
    renderHook(() => useCampaignCharacters("campaign-1", "player-1", false));

    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "player-1");
    expect(mockLimit).toHaveBeenCalledWith(100);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "campaign-characters:campaign-1:owner:player-1",
      expect.any(Function)
    );
  });

  it("allows the DM's bounded campaign character query without an owner filter", () => {
    renderHook(() => useCampaignCharacters("campaign-1", "dm-1", true));

    expect(mockWhere).not.toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(100);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "campaign-characters:campaign-1:dm",
      expect.any(Function)
    );
  });

  it("does not query campaign characters until the campaign role is known", () => {
    renderHook(() => useCampaignCharacters("campaign-1", "user-1", null));

    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(null, null, expect.any(Function));
  });

  it("subscribes the DM to bounded full session documents", () => {
    renderHook(() => useSessions("campaign-1", true));

    expect(mockCollection).toHaveBeenCalledWith("db", "campaigns", "campaign-1", "sessions");
    expect(mockLimit).toHaveBeenCalledWith(200);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "sessions:campaign-1:dm",
      expect.any(Function)
    );
  });

  it("subscribes a player only to bounded member-safe session summaries", () => {
    renderHook(() => useSessions("campaign-1", false));

    expect(mockCollection).toHaveBeenCalledWith(
      "db",
      "campaigns",
      "campaign-1",
      "sessionSummaries"
    );
    expect(mockLimit).toHaveBeenCalledWith(200);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "sessions:campaign-1:member",
      expect.any(Function)
    );
  });

  it("does not query sessions until the campaign role is known", () => {
    renderHook(() => useSessions("campaign-1", null));

    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(null, null, expect.any(Function));
  });

  it("filters a player's characters on the server and caps the result", () => {
    renderHook(() => usePlayerCharacters("user-1"));

    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(mockLimit).toHaveBeenCalledWith(1_000);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "player-characters:user-1",
      expect.any(Function)
    );
  });

  it("loads only the latest page of thread messages", () => {
    renderHook(() => useThreadMessages("campaign-1", "character-1"));

    expect(mockOrderBy).toHaveBeenCalledWith("timestamp", "desc");
    expect(mockOrderBy).toHaveBeenCalledWith("__name__", "desc");
    expect(mockLimit).toHaveBeenCalledWith(100);
  });

  it("loads older thread messages only after an explicit request", async () => {
    const latestMessages = Array.from({ length: 100 }, (_, index) => ({
      id: `message-${index + 100}`,
      fromUid: "user-1",
      text: `Message ${index + 100}`,
      timestamp: { marker: index + 100 },
      read: true,
    }));
    mockUseQuerySubscription.mockReturnValue({
      data: latestMessages,
      loading: false,
      error: null,
    });
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "message-99",
          data: () => ({
            fromUid: "user-1",
            text: "Message 99",
            timestamp: { marker: 99 },
            read: true,
          }),
        },
      ],
    });

    const { result } = renderHook(() => useThreadMessages("campaign-1", "character-1"));

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(result.current.hasOlderMessages).toBe(true);

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(mockStartAfter).toHaveBeenCalledWith({ marker: 100 }, "message-100");
    expect(result.current.messages[0].id).toBe("message-99");
    expect(result.current.hasOlderMessages).toBe(false);
  });

  it("does not construct a claim-log query until it is enabled", () => {
    renderHook(() => useClaimLogs("campaign-1", "character-1", false));

    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(null, null, expect.any(Function));
  });

  it("caps an enabled claim-log query", () => {
    renderHook(() => useClaimLogs("campaign-1", "character-1", true));

    expect(mockOrderBy).toHaveBeenCalledWith("timestamp", "desc");
    expect(mockLimit).toHaveBeenCalledWith(50);
  });

  it("filters a multi-category custom-item subscription in Firestore", () => {
    renderHook(() =>
      useCampaignCustomItems({
        campaignId: "campaign-1",
        categories: ["weapon", "armour"],
        mode: "admin",
      })
    );

    expect(mockWhere).toHaveBeenCalledWith("category", "in", ["armour", "weapon"]);
    expect(mockUseQuerySubscription).toHaveBeenCalledWith(
      expect.anything(),
      "custom-items:admin:campaign-1:armour+weapon",
      expect.any(Function)
    );
  });
});
