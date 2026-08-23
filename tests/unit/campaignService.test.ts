import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockBatch,
  mockBatchDeleteRefs,
  mockDeleteCharacter,
  mockDeleteDoc,
  mockDoc,
  mockGetDocs,
  mockServerTimestamp,
  mockSetDoc,
  mockUpdateDoc,
} = vi.hoisted(() => ({
  mockBatch: {
    commit: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  },
  mockBatchDeleteRefs: vi.fn().mockResolvedValue(undefined),
  mockDeleteCharacter: vi.fn().mockResolvedValue(undefined),
  mockDeleteDoc: vi.fn().mockResolvedValue(undefined),
  mockDoc: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockGetDocs: vi.fn(),
  mockServerTimestamp: vi.fn(() => "server-timestamp"),
  mockSetDoc: vi.fn().mockResolvedValue(undefined),
  mockUpdateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) =>
    args.length === 2 ? args.join("/") : args.slice(1).join("/"),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  documentId: () => "__name__",
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => ({ type: "limit", value }),
  orderBy: (...args: unknown[]) => ({ type: "orderBy", args }),
  query: (source: unknown) => source,
  serverTimestamp: () => mockServerTimestamp(),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  startAfter: (...args: unknown[]) => ({ type: "startAfter", args }),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  writeBatch: () => mockBatch,
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

vi.mock("../../src/utils/firestoreBatchDelete", () => ({
  batchDeleteRefs: (...args: unknown[]) => mockBatchDeleteRefs(...args),
}));

vi.mock("../../src/services/characterService", () => ({
  deleteCharacter: (...args: unknown[]) => mockDeleteCharacter(...args),
}));

import {
  archiveCampaign,
  createCampaign,
  deleteCampaign,
  restoreCampaign,
  updateCampaignName,
} from "../../src/services/campaignService";

// A fake QuerySnapshot: `getDocs` is stubbed per collection path below.
function snapshot(docs: { id: string; ref: string; data?: Record<string, unknown> }[]) {
  return {
    docs: docs.map((d) => ({ id: d.id, ref: d.ref, data: () => d.data ?? {} })),
    empty: docs.length === 0,
  };
}

const emptySnapshot = snapshot([]);

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateDoc.mockResolvedValue(undefined);
  mockBatchDeleteRefs.mockResolvedValue(undefined);
  mockDeleteCharacter.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
  mockBatch.commit.mockResolvedValue(undefined);
  mockSetDoc.mockResolvedValue(undefined);
});

describe("campaign input validation", () => {
  it("rejects a non-text campaign name before creating a Firestore reference", async () => {
    await expect(createCampaign(42 as unknown as string, "dm-1")).rejects.toThrow(
      "Campaign name must be text"
    );
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("rejects a non-text renamed campaign value before writing", async () => {
    await expect(updateCampaignName("camp-1", false as unknown as string)).rejects.toThrow(
      "Campaign name must be text"
    );
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
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
  it("processes characters, sessions, threads, messages, custom items, versions, and the campaign in bounded steps", async () => {
    mockGetDocs.mockImplementation(async (path: string) => {
      switch (path) {
        case "campaigns/camp-1/characters":
          return snapshot([
            {
              id: "char-1",
              ref: "campaigns/camp-1/characters/char-1",
              data: { recoveryCode: "DH-AAAA-1111" },
            },
          ]);
        case "campaigns/camp-1/sessions":
          return snapshot([{ id: "sess-1", ref: "campaigns/camp-1/sessions/sess-1" }]);
        case "campaigns/camp-1/threads":
          return snapshot([{ id: "char-1", ref: "campaigns/camp-1/threads/char-1" }]);
        case "campaigns/camp-1/threads/char-1/messages":
          return snapshot([{ id: "msg-1", ref: "campaigns/camp-1/threads/char-1/messages/msg-1" }]);
        case "campaigns/camp-1/customItems":
          return snapshot([{ id: "item-1", ref: "campaigns/camp-1/customItems/item-1" }]);
        case "campaigns/camp-1/customItems/item-1/versions":
          return snapshot([
            { id: "ver-1", ref: "campaigns/camp-1/customItems/item-1/versions/ver-1" },
          ]);
        default:
          return emptySnapshot;
      }
    });

    await deleteCampaign("camp-1");

    expect(mockDeleteCharacter).toHaveBeenCalledWith("camp-1", "char-1", "DH-AAAA-1111");
    expect(mockBatch.delete).toHaveBeenCalledWith("campaigns/camp-1/sessions/sess-1");
    expect(mockBatch.delete).toHaveBeenCalledWith("campaigns/camp-1/threads/char-1/messages/msg-1");
    expect(mockBatch.delete).toHaveBeenCalledWith(
      "campaigns/camp-1/customItems/item-1/versions/ver-1"
    );
    expect(mockBatchDeleteRefs).toHaveBeenCalledWith("mock-db", [
      "campaigns/camp-1/threads/char-1",
    ]);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "campaigns/camp-1/customItems/item-1",
      expect.objectContaining({ status: "archived" })
    );
    expect(mockDeleteDoc).toHaveBeenCalledWith("campaigns/camp-1/customItems/item-1");
    expect(mockDeleteDoc).toHaveBeenCalledWith("campaigns/camp-1");
  });

  it("skips the recovery index entry for a character with no recorded recovery code", async () => {
    mockGetDocs.mockImplementation(async (path: string) => {
      if (path === "campaigns/camp-2/characters") {
        return snapshot([{ id: "char-1", ref: "campaigns/camp-2/characters/char-1", data: {} }]);
      }
      return emptySnapshot;
    });

    await deleteCampaign("camp-2");

    expect(mockDeleteCharacter).toHaveBeenCalledWith("camp-2", "char-1", undefined);
  });

  it("propagates failures from a character cleanup step", async () => {
    mockGetDocs.mockImplementation(async (path: string) =>
      path === "campaigns/camp-3/characters"
        ? snapshot([{ id: "char-3", ref: "character-ref", data: { recoveryCode: "CODE" } }])
        : emptySnapshot
    );
    const error = new Error("delete failed");
    mockDeleteCharacter.mockRejectedValueOnce(error);

    await expect(deleteCampaign("camp-3")).rejects.toBe(error);
  });
});
