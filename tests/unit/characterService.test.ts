import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockBatch,
  mockCallClaimCharacter,
  mockCallForceAssignCharacter,
  mockCallForceReleaseCharacter,
  mockCallRegisterRecoveryCode,
  mockCallReleaseCharacter,
  mockCallRevokeRecoveryCode,
  mockCallStartCharacterDeletionJob,
  mockCallProcessCharacterDeletionChunk,
  mockDoc,
  mockGetDoc,
  mockGetDocs,
  mockRunTransaction,
  mockTransaction,
} = vi.hoisted(() => {
  const mockTransaction = {
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };
  const mockBatch = {
    commit: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  };

  return {
    mockAuth: { currentUser: { uid: "actor-1" } } as {
      currentUser: { uid: string } | null;
    },
    mockBatch,
    mockCallClaimCharacter: vi.fn(),
    mockCallForceAssignCharacter: vi.fn(),
    mockCallForceReleaseCharacter: vi.fn(),
    mockCallRegisterRecoveryCode: vi.fn(),
    mockCallReleaseCharacter: vi.fn(),
    mockCallRevokeRecoveryCode: vi.fn(),
    mockCallStartCharacterDeletionJob: vi.fn(),
    mockCallProcessCharacterDeletionChunk: vi.fn(),
    // The auto-ID form used by doc(collectionRef) for a new character.
    mockDoc: vi.fn((...args: unknown[]) => {
      const ref = args[0];
      if (
        typeof ref === "string" &&
        (ref.startsWith("characters-collection:") || ref.endsWith("/characters"))
      ) {
        return { id: "new-char-id" };
      }
      return "claim-log-ref";
    }),
    mockGetDoc: vi.fn(),
    mockGetDocs: vi.fn(),
    mockRunTransaction: vi.fn(async (_db: unknown, operation: (transaction: unknown) => unknown) =>
      operation(mockTransaction)
    ),
    mockTransaction,
  };
});

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  arrayUnion: (value: string) => `array-union:${value}`,
  collection: (...args: unknown[]) => args.slice(1).join("/"),
  documentId: () => "__name__",
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (value: number) => ({ type: "limit", value }),
  orderBy: (...args: unknown[]) => ({ type: "orderBy", args }),
  query: (source: unknown) => source,
  runTransaction: mockRunTransaction,
  serverTimestamp: () => "server-timestamp",
  setDoc: vi.fn(),
  startAfter: (...args: unknown[]) => ({ type: "startAfter", args }),
  updateDoc: vi.fn(),
  writeBatch: () => mockBatch,
}));

vi.mock("firebase/functions", () => ({
  httpsCallable: vi.fn((_functions: unknown, name: string) => {
    if (name === "claimCharacter") return mockCallClaimCharacter;
    if (name === "registerRecoveryCode") return mockCallRegisterRecoveryCode;
    if (name === "releaseCharacter") return mockCallReleaseCharacter;
    if (name === "forceReleaseCharacter") return mockCallForceReleaseCharacter;
    if (name === "forceAssignCharacter") return mockCallForceAssignCharacter;
    if (name === "revokeRecoveryCode") return mockCallRevokeRecoveryCode;
    if (name === "startCharacterDeletionJob") return mockCallStartCharacterDeletionJob;
    if (name === "processCharacterDeletionChunk") return mockCallProcessCharacterDeletionChunk;
    throw new Error(`Unexpected callable: ${name}`);
  }),
}));

vi.mock("../../src/firebase", () => ({
  auth: mockAuth,
  db: "mock-db",
  functions: "mock-functions",
}));

vi.mock("../../src/firebase/converters", () => ({
  campaignDocRef: (campaignId: string) => `campaign:${campaignId}`,
  characterDocRef: (campaignId: string, characterId: string) =>
    `character:${campaignId}:${characterId}`,
  charactersCollectionRef: (campaignId: string) => `characters-collection:${campaignId}`,
}));

import {
  claimCharacter,
  createNewCharacter,
  deleteCharacter,
  forceAssignCharacter,
  forceReleaseCharacter,
  importCharacter,
  preflightCharacterDeletion,
  reconcileCharacterSpentXp,
  registerRecoveryCode,
  releaseCharacter,
  revokeRecoveryCode,
} from "../../src/services/characterService";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";
import type { Character } from "../../src/types/Character";

function snapshot(docs: { id: string; ref: string }[]) {
  return {
    docs: docs.map((d) => ({ id: d.id, ref: d.ref, data: () => ({}) })),
    empty: docs.length === 0,
  };
}

const emptySnapshot = snapshot([]);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.currentUser = { uid: "actor-1" };
  mockBatch.commit.mockResolvedValue(undefined);
  mockGetDoc.mockImplementation(async (reference: string) => ({
    ref: reference,
    exists: () => true,
    data: () => ({}),
  }));
  mockTransaction.get.mockResolvedValue({
    exists: () => true,
    data: () => ({ userId: null }),
  });
});

describe("character claiming operations", () => {
  it("starts only one Function call for a duplicate in-flight claim", async () => {
    let finish!: (value: { data: { campaignId: string; characterId: string } }) => void;
    const pending = new Promise<{ data: { campaignId: string; characterId: string } }>((resolve) => {
      finish = resolve;
    });
    mockCallClaimCharacter.mockReturnValueOnce(pending);

    const first = claimCharacter("DH-TEST-0001");
    const duplicate = claimCharacter("DH-TEST-0001");
    await Promise.resolve();

    expect(mockCallClaimCharacter).toHaveBeenCalledOnce();
    finish({ data: { campaignId: "camp-1", characterId: "char-1" } });
    await Promise.all([first, duplicate]);
  });

  it("rejects a non-text new-character name before creating a Firestore reference", async () => {
    await expect(createNewCharacter("camp-1", 42 as unknown as string)).rejects.toThrow(
      "Character name must be text"
    );
    expect(mockDoc).not.toHaveBeenCalled();
    expect(mockBatch.set).not.toHaveBeenCalled();
  });

  it("creates the character with no code yet, then registers one", async () => {
    mockCallRegisterRecoveryCode.mockResolvedValue({ data: { code: "DH-NEWC-0DE1" } });

    const code = await createNewCharacter("camp-1", "Brother Corvus");

    expect(mockCallRegisterRecoveryCode).toHaveBeenCalledOnce();
    expect(code).toBe("DH-NEWC-0DE1");
  });

  it("retries registering the code up to 3 times before giving up", async () => {
    mockCallRegisterRecoveryCode.mockRejectedValue(new Error("network blip"));

    await expect(createNewCharacter("camp-1", "Brother Corvus")).rejects.toThrow(
      "Character was created, but generating its Recovery Code failed."
    );
    expect(mockCallRegisterRecoveryCode).toHaveBeenCalledTimes(3);
  });

  it("succeeds if a retry recovers after an initial transient failure", async () => {
    mockCallRegisterRecoveryCode
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce({ data: { code: "DH-NEWC-0DE2" } });

    const code = await createNewCharacter("camp-1", "Brother Corvus");

    expect(mockCallRegisterRecoveryCode).toHaveBeenCalledTimes(2);
    expect(code).toBe("DH-NEWC-0DE2");
  });

  it("rejects invalid recovery codes before calling the Function", async () => {
    await expect(claimCharacter("not-a-code")).rejects.toThrow();
    expect(mockCallClaimCharacter).not.toHaveBeenCalled();
  });

  it("calls the claimCharacter Function with the trimmed code and returns its result", async () => {
    mockCallClaimCharacter.mockResolvedValue({
      data: { campaignId: "camp-1", characterId: "char-1" },
    });

    const result = await claimCharacter(" DH-TEST-0002 ");

    expect(mockCallClaimCharacter).toHaveBeenCalledWith({ code: "DH-TEST-0002" });
    expect(result).toEqual({ campaignId: "camp-1", characterId: "char-1" });
  });

  it("propagates the Function's rejection when the character is already claimed", async () => {
    mockCallClaimCharacter.mockRejectedValue(new Error("This character has already been claimed."));

    await expect(claimCharacter("DH-TEST-0003")).rejects.toThrow(
      "This character has already been claimed."
    );
  });

  it("does not call the Function when no user is signed in", async () => {
    mockAuth.currentUser = null;

    await expect(claimCharacter("DH-TEST-0004")).rejects.toThrow("Not signed in.");
    expect(mockCallClaimCharacter).not.toHaveBeenCalled();
  });

});

describe("releaseCharacter", () => {
  it("calls the Function with campaignId and characterId", async () => {
    mockCallReleaseCharacter.mockResolvedValue({ data: undefined });

    await releaseCharacter("camp-1", "char-1");

    expect(mockCallReleaseCharacter).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
    });
  });

  it("does not call the Function when no user is signed in", async () => {
    mockAuth.currentUser = null;

    await expect(releaseCharacter("camp-1", "char-1")).rejects.toThrow("Not signed in.");
    expect(mockCallReleaseCharacter).not.toHaveBeenCalled();
  });
});

describe("forceReleaseCharacter", () => {
  it("calls the Function with campaignId and characterId", async () => {
    mockCallForceReleaseCharacter.mockResolvedValue({ data: undefined });

    await forceReleaseCharacter("camp-1", "char-1");

    expect(mockCallForceReleaseCharacter).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
    });
  });

  it("does not call the Function when no user is signed in", async () => {
    mockAuth.currentUser = null;

    await expect(forceReleaseCharacter("camp-1", "char-1")).rejects.toThrow("Not signed in.");
    expect(mockCallForceReleaseCharacter).not.toHaveBeenCalled();
  });
});

describe("forceAssignCharacter", () => {
  it("calls the Function with campaignId, characterId, and targetUid", async () => {
    mockCallForceAssignCharacter.mockResolvedValue({ data: undefined });

    await forceAssignCharacter("camp-1", "char-1", "target-uid");

    expect(mockCallForceAssignCharacter).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
      targetUid: "target-uid",
    });
  });

  it("does not call the Function when no user is signed in", async () => {
    mockAuth.currentUser = null;

    await expect(forceAssignCharacter("camp-1", "char-1", "target-uid")).rejects.toThrow(
      "Not signed in."
    );
    expect(mockCallForceAssignCharacter).not.toHaveBeenCalled();
  });
});

function characterWithStoredSpent(spent: number): Character {
  return {
    ...createEmptyCharacterData({
      campaignId: "camp-1",
      recoveryCode: "DH-ABCD-1234",
    }),
    id: "char-1",
    experience: {
      ranks: [],
      total: 500,
      spent,
    },
  };
}

describe("XP-spent reconciliation", () => {
  it("corrects only the derived nested field from a fresh transaction snapshot", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => characterWithStoredSpent(100),
    });

    await expect(reconcileCharacterSpentXp("camp-1", "char-1")).resolves.toBe(true);

    expect(mockTransaction.update).toHaveBeenCalledOnce();
    expect(mockTransaction.update).toHaveBeenCalledWith("character:camp-1:char-1", {
      "experience.spent": 0,
    });
  });

  it("settles without a write when the stored total is already correct", async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => characterWithStoredSpent(0),
    });

    await expect(reconcileCharacterSpentXp("camp-1", "char-1")).resolves.toBe(false);
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  it("allows two tab reconciliations to settle after one committed correction", async () => {
    mockTransaction.get
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => characterWithStoredSpent(100),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => characterWithStoredSpent(0),
      });

    await expect(reconcileCharacterSpentXp("camp-1", "char-1")).resolves.toBe(true);
    await expect(reconcileCharacterSpentXp("camp-1", "char-1")).resolves.toBe(false);

    expect(mockRunTransaction).toHaveBeenCalledTimes(2);
    expect(mockTransaction.update).toHaveBeenCalledOnce();
  });

  it("does not write when the character disappeared before reconciliation", async () => {
    mockTransaction.get.mockResolvedValue({ exists: () => false });

    await expect(reconcileCharacterSpentXp("camp-1", "char-1")).resolves.toBe(false);
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});

describe("preflightCharacterDeletion", () => {
  it("calls the Function and returns the job id and total count", async () => {
    mockCallStartCharacterDeletionJob.mockResolvedValue({
      data: { jobId: "job-1", totalCount: 6 },
    });

    const result = await preflightCharacterDeletion("camp-1", "char-1");

    expect(mockCallStartCharacterDeletionJob).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
    });
    expect(result).toEqual({ jobId: "job-1", totalCount: 6 });
  });
});

describe("deleteCharacter", () => {
  beforeEach(() => {
    mockCallProcessCharacterDeletionChunk.mockResolvedValue({
      data: { done: true, processedCount: 6, totalCount: 6 },
    });
  });

  it("drives the job to completion", async () => {
    await deleteCharacter("job-1");

    expect(mockCallProcessCharacterDeletionChunk).toHaveBeenCalledWith({ jobId: "job-1" });
  });

  it("keeps calling process until the job reports done, reporting progress", async () => {
    mockCallProcessCharacterDeletionChunk
      .mockResolvedValueOnce({ data: { done: false, processedCount: 3, totalCount: 6 } })
      .mockResolvedValueOnce({ data: { done: true, processedCount: 6, totalCount: 6 } });
    const onProgress = vi.fn();

    await deleteCharacter("job-1", onProgress);

    expect(mockCallProcessCharacterDeletionChunk).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, { processedCount: 3, totalCount: 6 });
    expect(onProgress).toHaveBeenNthCalledWith(2, { processedCount: 6, totalCount: 6 });
  });

  it("propagates failures from the chunk Function", async () => {
    const error = new Error("delete failed");
    mockCallProcessCharacterDeletionChunk.mockRejectedValueOnce(error);

    await expect(deleteCharacter("job-1")).rejects.toBe(error);
  });

  it("reuses one in-flight drive for a duplicate call with the same jobId", async () => {
    let finish!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    mockCallProcessCharacterDeletionChunk.mockReturnValueOnce(pending);

    const first = deleteCharacter("job-1");
    const duplicate = deleteCharacter("job-1");
    await Promise.resolve();

    expect(mockCallProcessCharacterDeletionChunk).toHaveBeenCalledOnce();
    finish({ data: { done: true, processedCount: 6, totalCount: 6 } });
    await Promise.all([first, duplicate]);
  });
});

describe("registerRecoveryCode", () => {
  it("calls the Function and returns the new code", async () => {
    mockCallRegisterRecoveryCode.mockResolvedValue({ data: { code: "DH-NEWC-0DE1" } });

    const code = await registerRecoveryCode("camp-1", "char-1");

    expect(mockCallRegisterRecoveryCode).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
    });
    expect(code).toBe("DH-NEWC-0DE1");
  });
});

describe("importCharacter", () => {
  it("rejects an unsupported import structure before registering a code", async () => {
    await expect(
      importCharacter("camp-1", {
        recoveryCode: "DH-ABCD-1234",
        isEditableByPlayer: false,
        unexpected: true,
      })
    ).rejects.toThrow("unsupported field: unexpected");
    expect(mockCallRegisterRecoveryCode).not.toHaveBeenCalled();
  });

  it("imports the character with no code yet, then registers one", async () => {
    mockCallRegisterRecoveryCode.mockResolvedValue({ data: { code: "DH-IMPC-0DE1" } });
    const payload = createEmptyCharacterData({ campaignId: "camp-1", characterName: "Brother Corvus" });

    const name = await importCharacter("camp-1", payload);

    expect(mockCallRegisterRecoveryCode).toHaveBeenCalledOnce();
    expect(name).toBe("Brother Corvus");
  });
});

describe("revokeRecoveryCode", () => {
  it("calls the Function with campaignId and characterId", async () => {
    mockCallRevokeRecoveryCode.mockResolvedValue({ data: undefined });

    await revokeRecoveryCode("camp-1", "char-1");

    expect(mockCallRevokeRecoveryCode).toHaveBeenCalledWith({
      campaignId: "camp-1",
      characterId: "char-1",
    });
  });
});
