import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAccount } from "../../src/operations/deleteAccount";

const {
  mockCollection,
  mockCollectionGroup,
  mockRunTransaction,
  mockTransactionGet,
  mockTransactionUpdate,
  mockTransactionSet,
  mockTransactionDelete,
  mockDeleteUser,
  ownedCampaignsQuery,
  claimedCharactersQuery,
  inboundLinksQuery,
  ownLinkRef,
  secretRef,
  userRef,
  profileRef,
  identityIndexRef,
} = vi.hoisted(() => {
  const ownedCampaignsQuery = { kind: "owned-campaigns" };
  const claimedCharactersQuery = { kind: "claimed-characters" };
  const inboundLinksQuery = { kind: "inbound-links" };
  const ownLinkRef = { path: "userLinks/user-1" };
  const secretRef = { path: "identitySecret/user-1" };
  const userRef = { path: "users/user-1" };
  const profileRef = { path: "userProfiles/user-1" };
  const identityIndexRef = { path: "identityRecoveryIndex/hash" };

  const mockTransactionGet = vi.fn();
  const mockTransactionUpdate = vi.fn();
  const mockTransactionSet = vi.fn();
  const mockTransactionDelete = vi.fn();
  const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
    callback({
      get: mockTransactionGet,
      update: mockTransactionUpdate,
      set: mockTransactionSet,
      delete: mockTransactionDelete,
    })
  );
  const mockDeleteUser = vi.fn();

  const mockCollection = vi.fn((name: string) => {
    if (name === "campaigns") {
      return { where: vi.fn(() => ({ limit: vi.fn(() => ownedCampaignsQuery) })) };
    }
    if (name === "userLinks") {
      return {
        where: vi.fn(() => inboundLinksQuery),
        doc: vi.fn(() => ownLinkRef),
      };
    }
    if (name === "identitySecret") return { doc: vi.fn(() => secretRef) };
    if (name === "identityRecoveryIndex") return { doc: vi.fn(() => identityIndexRef) };
    if (name === "users") return { doc: vi.fn(() => userRef) };
    if (name === "userProfiles") return { doc: vi.fn(() => profileRef) };
    throw new Error(`Unexpected collection: ${name}`);
  });
  const mockCollectionGroup = vi.fn(() => ({ where: vi.fn(() => claimedCharactersQuery) }));

  return {
    mockCollection,
    mockCollectionGroup,
    mockRunTransaction,
    mockTransactionGet,
    mockTransactionUpdate,
    mockTransactionSet,
    mockTransactionDelete,
    mockDeleteUser,
    ownedCampaignsQuery,
    claimedCharactersQuery,
    inboundLinksQuery,
    ownLinkRef,
    secretRef,
    userRef,
    profileRef,
    identityIndexRef,
  };
});

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ deleteUser: mockDeleteUser }),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    collectionGroup: mockCollectionGroup,
    runTransaction: mockRunTransaction,
  }),
  FieldValue: {
    arrayRemove: (value: unknown) => ({ __arrayRemove: value }),
    serverTimestamp: () => "server-timestamp",
  },
}));

function makeCharacter(id: string, campaignRef: { path: string }) {
  const logRef = { path: `${campaignRef.path}/characters/${id}/claimLog/log` };
  const ref = {
    path: `${campaignRef.path}/characters/${id}`,
    parent: { parent: campaignRef },
    collection: vi.fn(() => ({ doc: vi.fn(() => logRef) })),
  };
  return { id, ref, logRef };
}

function setDefaultReads(
  options: {
    owned?: boolean;
    linked?: boolean;
    characters?: ReturnType<typeof makeCharacter>[];
    inboundLinks?: Array<{ ref: { path: string } }>;
    identityCode?: string;
  } = {}
) {
  const characters = options.characters ?? [];
  const inboundLinks = options.inboundLinks ?? [];
  mockTransactionGet.mockImplementation((ref: unknown) => {
    if (ref === ownedCampaignsQuery) {
      return Promise.resolve({ empty: !options.owned, docs: options.owned ? [{}] : [] });
    }
    if (ref === claimedCharactersQuery) {
      return Promise.resolve({ size: characters.length, docs: characters });
    }
    if (ref === inboundLinksQuery) return Promise.resolve({ docs: inboundLinks });
    if (ref === ownLinkRef) return Promise.resolve({ exists: options.linked ?? false });
    if (ref === secretRef) {
      return Promise.resolve({
        exists: options.identityCode !== undefined,
        data: () => ({ code: options.identityCode }),
      });
    }
    throw new Error("Unexpected transaction read");
  });
}

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteUser.mockResolvedValue(undefined);
  });

  it("blocks deletion while the caller owns a campaign", async () => {
    setDefaultReads({ owned: true });

    await expect(deleteAccount("user-1", "test-secret")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("blocks a linked secondary device even when a modified client calls the Function", async () => {
    setDefaultReads({ linked: true });

    await expect(deleteAccount("user-1", "test-secret")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );

    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("releases characters, removes memberships and links, revokes recovery, then deletes Auth", async () => {
    const campaignRef = { path: "campaigns/c1" };
    const characters = [makeCharacter("char-1", campaignRef), makeCharacter("char-2", campaignRef)];
    const inboundLink = { ref: { path: "userLinks/device-2" } };
    setDefaultReads({ characters, inboundLinks: [inboundLink], identityCode: "DH-AAAA-BBBB" });

    const result = await deleteAccount("user-1", "test-secret");

    for (const character of characters) {
      expect(mockTransactionUpdate).toHaveBeenCalledWith(character.ref, {
        userId: null,
        isEditableByPlayer: false,
      });
      expect(mockTransactionSet).toHaveBeenCalledWith(
        character.logRef,
        expect.objectContaining({ action: "release", actorUid: "user-1", newOwnerUid: null })
      );
    }
    expect(mockTransactionUpdate).toHaveBeenCalledWith(campaignRef, {
      memberIds: { __arrayRemove: "user-1" },
    });
    expect(mockTransactionDelete).toHaveBeenCalledWith(identityIndexRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(secretRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(userRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(profileRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(inboundLink.ref);
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({ releasedCharacters: 2, removedLinkedDevices: 1 });
  });

  it("refuses an oversized deletion before buffering any writes", async () => {
    const campaignRef = { path: "campaigns/c1" };
    const characters = Array.from({ length: 220 }, (_, index) =>
      makeCharacter(`char-${index}`, campaignRef)
    );
    setDefaultReads({ characters });

    await expect(deleteAccount("user-1", "test-secret")).rejects.toThrow(
      expect.objectContaining({ code: "resource-exhausted" })
    );

    expect(mockTransactionUpdate).not.toHaveBeenCalled();
    expect(mockTransactionSet).not.toHaveBeenCalled();
    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("treats an already-deleted Auth user as a successful retry", async () => {
    setDefaultReads();
    mockDeleteUser.mockRejectedValue({ code: "auth/user-not-found" });

    await expect(deleteAccount("user-1", "test-secret")).resolves.toEqual({
      releasedCharacters: 0,
      removedLinkedDevices: 0,
    });
  });
});
