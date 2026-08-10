import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockBatchDeleteRefs, mockDoc, mockGetDocs, mockServerTimestamp, mockUpdateDoc } =
  vi.hoisted(() => ({
    mockBatchDeleteRefs: vi.fn().mockResolvedValue(undefined),
    mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
    mockGetDocs: vi.fn(),
    mockServerTimestamp: vi.fn(() => "server-timestamp"),
    mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => args.slice(1).join("/"),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: vi.fn(),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

vi.mock("../../src/utils/firestoreBatchDelete", () => ({
  batchDeleteRefs: (...args: unknown[]) => mockBatchDeleteRefs(...args),
}));

import { archiveCampaign, deleteCampaign, restoreCampaign } from "../../src/services/campaignService";

// A fake QuerySnapshot: `getDocs` is stubbed per collection path below.
function snapshot(docs: { id: string; ref: string; data?: Record<string, unknown> }[]) {
  return {
    docs: docs.map((d) => ({ id: d.id, ref: d.ref, data: () => d.data ?? {} })),
  };
}

const emptySnapshot = snapshot([]);

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateDoc.mockResolvedValue(undefined);
  mockBatchDeleteRefs.mockResolvedValue(undefined);
});

describe("campaign archive operations", () => {
  it("archives the requested campaign using a server timestamp", async () => {
    await archiveCampaign("camp-1");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-1");
    expect(mockServerTimestamp).toHaveBeenCalledOnce();
    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-1", {
      archivedAt: "server-timestamp",
    });
  });

  it("restores the requested campaign by clearing its archive timestamp", async () => {
    await restoreCampaign("camp-2");

    expect(mockDoc).toHaveBeenCalledWith("mock-db", "campaigns", "camp-2");
    expect(mockServerTimestamp).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith("campaigns/camp-2", {
      archivedAt: null,
    });
  });

  it("preserves Firestore failures for the caller to handle", async () => {
    const error = new Error("write failed");
    mockUpdateDoc.mockRejectedValueOnce(error);

    await expect(archiveCampaign("camp-3")).rejects.toBe(error);
  });
});

describe("deleteCampaign", () => {
  it("gathers every character's claim log, XP proposals, and recovery index entry, every session, every message thread and its messages, every custom item and its version history, and the campaign itself", async () => {
    mockGetDocs.mockImplementation(async (path: string) => {
      switch (path) {
        case "campaigns/camp-1/characters":
          return snapshot([
            { id: "char-1", ref: "campaigns/camp-1/characters/char-1", data: { recoveryCode: "DH-AAAA-1111" } },
          ]);
        case "campaigns/camp-1/characters/char-1/claimLog":
          return snapshot([{ id: "log-1", ref: "campaigns/camp-1/characters/char-1/claimLog/log-1" }]);
        case "campaigns/camp-1/characters/char-1/xpProposals":
          return snapshot([{ id: "prop-1", ref: "campaigns/camp-1/characters/char-1/xpProposals/prop-1" }]);
        case "campaigns/camp-1/sessions":
          return snapshot([{ id: "sess-1", ref: "campaigns/camp-1/sessions/sess-1" }]);
        case "campaigns/camp-1/threads":
          return snapshot([{ id: "char-1", ref: "campaigns/camp-1/threads/char-1" }]);
        case "campaigns/camp-1/threads/char-1/messages":
          return snapshot([{ id: "msg-1", ref: "campaigns/camp-1/threads/char-1/messages/msg-1" }]);
        case "campaigns/camp-1/customItems":
          return snapshot([{ id: "item-1", ref: "campaigns/camp-1/customItems/item-1" }]);
        case "campaigns/camp-1/customItems/item-1/versions":
          return snapshot([{ id: "ver-1", ref: "campaigns/camp-1/customItems/item-1/versions/ver-1" }]);
        default:
          return emptySnapshot;
      }
    });

    await deleteCampaign("camp-1");

    expect(mockBatchDeleteRefs).toHaveBeenCalledOnce();
    const [dbArg, refs] = mockBatchDeleteRefs.mock.calls[0];
    expect(dbArg).toBe("mock-db");
    expect(refs).toEqual(
      expect.arrayContaining([
        "campaigns/camp-1/characters/char-1/claimLog/log-1",
        "campaigns/camp-1/characters/char-1/xpProposals/prop-1",
        "recoveryIndex/DH-AAAA-1111",
        "campaigns/camp-1/characters/char-1",
        "campaigns/camp-1/sessions/sess-1",
        "campaigns/camp-1/threads/char-1/messages/msg-1",
        "campaigns/camp-1/threads/char-1",
        "campaigns/camp-1/customItems/item-1/versions/ver-1",
        "campaigns/camp-1/customItems/item-1",
        "campaigns/camp-1",
      ])
    );
    expect(refs).toHaveLength(10);
  });

  it("skips the recovery index entry for a character with no recorded recovery code", async () => {
    mockGetDocs.mockImplementation(async (path: string) => {
      if (path === "campaigns/camp-2/characters") {
        return snapshot([{ id: "char-1", ref: "campaigns/camp-2/characters/char-1", data: {} }]);
      }
      return emptySnapshot;
    });

    await deleteCampaign("camp-2");

    const [, refs] = mockBatchDeleteRefs.mock.calls[0];
    expect(refs).not.toEqual(expect.arrayContaining([expect.stringContaining("recoveryIndex")]));
  });

  it("propagates failures from the batch delete", async () => {
    mockGetDocs.mockResolvedValue(emptySnapshot);
    const error = new Error("delete failed");
    mockBatchDeleteRefs.mockRejectedValueOnce(error);

    await expect(deleteCampaign("camp-3")).rejects.toBe(error);
  });
});
