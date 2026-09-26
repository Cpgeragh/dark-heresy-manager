// functions/tests/operations/forceAssignCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { forceAssignCharacter } from "../../src/operations/forceAssignCharacter";

const mockCampaignGet = vi.fn();
const mockTransactionGet = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionSet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    update: mockTransactionUpdate,
    set: mockTransactionSet,
    delete: mockTransactionDelete,
  });
});

const mockClaimLogDoc = vi.fn(() => ({}));
const mockRecoveryCodeHistoryDoc = vi.fn(() => ({ kind: "recovery-code-history" }));
const mockCharacterRef = {
  id: "char-1",
  firestore: {} as unknown,
  collection: vi.fn((name: string) => ({
    doc: name === "recoveryCodeHistory" ? mockRecoveryCodeHistoryDoc : mockClaimLogDoc,
  })),
};
const mockMembershipQuery = { __membershipQuery: true };
const mockCharactersCollection = {
  doc: vi.fn(() => mockCharacterRef),
  where: vi.fn(() => mockMembershipQuery),
};
const mockSummaryRef = { kind: "character-summary" };
const mockCampaignRef = {
  id: "c1",
  get: mockCampaignGet,
  collection: vi.fn((name: string) =>
    name === "characterSummaries" ? { doc: vi.fn(() => mockSummaryRef) } : mockCharactersCollection
  ),
};
const mockCampaignsCollection = { doc: vi.fn(() => mockCampaignRef) };
const mockUserLinkGet = vi.fn();
const mockProfileRef = { kind: "user-profile" };
const mockRecoveryIndexDoc = vi.fn((id: string) => ({ kind: "recovery-index", id }));
const mockRecoveryIndexCollection = { doc: mockRecoveryIndexDoc };

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "userLinks") return { doc: vi.fn(() => ({ get: mockUserLinkGet })) };
  if (name === "userProfiles") return { doc: vi.fn(() => mockProfileRef) };
  if (name === "recoveryIndex") return mockRecoveryIndexCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

const mockFirestore = {
  collection: mockCollection,
  runTransaction: mockRunTransaction,
};
mockCharacterRef.firestore = mockFirestore;

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => mockFirestore,
  FieldValue: {
    arrayUnion: (v: unknown) => ({ __arrayUnion: v }),
    arrayRemove: (v: unknown) => ({ __arrayRemove: v }),
    delete: () => ({ __delete: true }),
    serverTimestamp: () => "server-timestamp",
  },
}));

function setupTransactionGet(options: {
  character: {
    exists: boolean;
    userId?: string | null;
    recoveryCode?: string;
    header?: Record<string, unknown>;
  };
  otherOwnedCharacterIds?: string[];
  campaignMemberIds?: string[];
}) {
  mockTransactionGet.mockImplementation((ref: unknown) => {
    if (ref === mockMembershipQuery) {
      return Promise.resolve({
        docs: (options.otherOwnedCharacterIds ?? []).map((id) => ({ id })),
      });
    }
    if (ref === mockCampaignRef) {
      return Promise.resolve({ data: () => ({ memberIds: options.campaignMemberIds ?? [] }) });
    }
    if (ref === mockProfileRef) {
      return Promise.resolve({ exists: true, data: () => ({ firstName: "Iris" }) });
    }
    return Promise.resolve({
      exists: options.character.exists,
      data: () => ({
        userId: options.character.userId,
        recoveryCode: options.character.recoveryCode,
        header: options.character.header,
      }),
    });
  });
}

describe("forceAssignCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
        "dm-1",
        "secret"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
        "dm-1",
        "secret"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: false },
      campaignMemberIds: ["player-1"],
    });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
        "dm-1",
        "secret"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the target is not an existing campaign member", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ character: { exists: true, userId: null }, campaignMemberIds: [] });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
        "dm-1",
        "secret"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
  });

  it("assigns an unclaimed character to an existing member and logs the force-assign", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: true, userId: null, recoveryCode: "DH-OLDC-ODE1" },
      campaignMemberIds: ["player-1"],
    });

    await forceAssignCharacter(
      { campaignId: "c1", characterId: "char-1", targetUid: "player-1" },
      "dm-1",
      "secret"
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: "player-1",
      isEditableByPlayer: true,
      "header.playerName": { __delete: true },
      recoveryCode: expect.stringMatching(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/),
    });
    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" })
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" }),
      { campaignId: "c1", characterId: "char-1" }
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "player-1", playerName: "Iris" }),
      { merge: true }
    );
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(mockCampaignRef, expect.anything());
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "force-assign",
        actorUid: "dm-1",
        previousOwnerUid: null,
        newOwnerUid: "player-1",
      })
    );
  });

  it("rejects assigning a character that already has an owner", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({
      character: { exists: true, userId: "old-player" },
      campaignMemberIds: ["old-player", "new-player"],
    });

    await expect(
      forceAssignCharacter(
        { campaignId: "c1", characterId: "char-1", targetUid: "new-player" },
        "dm-1",
        "secret"
      )
    ).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
  });
});
