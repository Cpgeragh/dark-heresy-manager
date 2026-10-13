// functions/tests/operations/forceReleaseCharacter.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { forceReleaseCharacter } from "../../src/operations/forceReleaseCharacter";

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
const mockRecoveryIndexDoc = vi.fn((id: string) => ({ kind: "recovery-index", id }));
const mockRecoveryIndexCollection = { doc: mockRecoveryIndexDoc };

const mockUsersCollection = {
  doc: (accountId: string) => ({
    collection: (name: string) => ({
      doc: (chatId: string) => ({ kind: "chat", path: `users/${accountId}/${name}/${chatId}` }),
    }),
  }),
};

const mockCollection = vi.fn((name: string) => {
  if (name === "campaigns") return mockCampaignsCollection;
  if (name === "users") return mockUsersCollection;
  if (name === "userLinks") return { doc: vi.fn(() => ({ get: mockUserLinkGet })) };
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

function setupTransactionGet(
  character: {
    exists: boolean;
    userId?: string | null;
    recoveryCode?: string;
    header?: Record<string, unknown>;
  },
  otherOwnedCharacterIds: string[] = [],
  existingChats: string[] = []
) {
  mockTransactionGet.mockImplementation((ref: unknown) => {
    if (ref === mockMembershipQuery) {
      return Promise.resolve({ docs: otherOwnedCharacterIds.map((id) => ({ id })) });
    }
    if ((ref as { kind?: string }).kind === "chat") {
      return Promise.resolve({ exists: existingChats.includes((ref as { path: string }).path) });
    }
    return Promise.resolve({
      exists: character.exists,
      data: () => ({
        userId: character.userId,
        recoveryCode: character.recoveryCode,
        header: character.header,
      }),
    });
  });
}

describe("forceReleaseCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLinkGet.mockResolvedValue({ exists: false });
  });

  it("rejects when the campaign does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: false });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("rejects when the caller is not the campaign DM", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
  });

  it("rejects when the character does not exist", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: false });

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("clears ownership, removes membership when this was their last character, and logs the force-release", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: true, userId: "player-1", recoveryCode: "DH-OLDC-ODE1" }, []);

    await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCharacterRef, {
      userId: null,
      isEditableByPlayer: false,
      recoveryCode: expect.stringMatching(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/),
    });
    expect(mockTransactionDelete).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" })
    );
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "recovery-index" }),
      { campaignId: "c1", characterId: "char-1" }
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(mockCampaignRef, {
      memberIds: { __arrayRemove: "player-1" },
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "force-release",
        actorUid: "dm-1",
        previousOwnerUid: "player-1",
        newOwnerUid: null,
      })
    );
  });

  it("clears ownership but keeps membership when the target still owns another character here", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: true, userId: "player-1" }, ["char-2"]);

    await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCampaignRef,
      expect.objectContaining({ memberIds: expect.anything() })
    );
  });

  it("tolerates force-releasing an already-unclaimed character", async () => {
    mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
    setupTransactionGet({ exists: true, userId: null }, []);

    await expect(
      forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
    ).resolves.toBeUndefined();
    expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
      mockCampaignRef,
      expect.objectContaining({ memberIds: expect.anything() })
    );
  });

  describe("chats", () => {
    const DM_COPY = "users/dm-1/chats/c1__char-1__player-1";
    const PLAYER_COPY = "users/player-1/chats/c1__char-1__player-1";

    it("closes both copies of the chat in the same transaction as the release", async () => {
      mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
      setupTransactionGet({ exists: true, userId: "player-1" }, [], [DM_COPY, PLAYER_COPY]);

      await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

      expect(mockTransactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ path: DM_COPY }),
        { closed: true }
      );
      expect(mockTransactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ path: PLAYER_COPY }),
        { closed: true }
      );
      expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    });

    it("reads every document before the first write", async () => {
      mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
      setupTransactionGet({ exists: true, userId: "player-1" }, [], [DM_COPY, PLAYER_COPY]);

      await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

      const lastRead = Math.max(...mockTransactionGet.mock.invocationCallOrder);
      const firstWrite = Math.min(
        ...[mockTransactionUpdate, mockTransactionSet, mockTransactionDelete].flatMap(
          (mock) => mock.mock.invocationCallOrder
        )
      );
      expect(lastRead).toBeLessThan(firstWrite);
    });

    it("closes only the copies that exist", async () => {
      mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
      setupTransactionGet({ exists: true, userId: "player-1" }, [], [DM_COPY]);

      await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

      expect(mockTransactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ path: DM_COPY }),
        { closed: true }
      );
      expect(mockTransactionUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ path: PLAYER_COPY }),
        expect.anything()
      );
    });

    it("reads no chats when the character was already unclaimed", async () => {
      mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "dm-1" }) });
      setupTransactionGet({ exists: true, userId: null }, [], [DM_COPY, PLAYER_COPY]);

      await forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret");

      const chatReads = mockTransactionGet.mock.calls.filter(
        ([ref]) => (ref as { kind?: string }).kind === "chat"
      );
      expect(chatReads).toHaveLength(0);
      expect(mockTransactionUpdate).not.toHaveBeenCalledWith(expect.anything(), {
        closed: true,
      });
    });

    it("closes nothing when the release is refused", async () => {
      mockCampaignGet.mockResolvedValue({ exists: true, data: () => ({ dmId: "other-dm" }) });
      setupTransactionGet({ exists: true, userId: "player-1" }, [], [DM_COPY, PLAYER_COPY]);

      await expect(
        forceReleaseCharacter({ campaignId: "c1", characterId: "char-1" }, "dm-1", "secret")
      ).rejects.toThrow(expect.objectContaining({ code: "permission-denied" }));
      expect(mockTransactionUpdate).not.toHaveBeenCalled();
    });
  });
});
