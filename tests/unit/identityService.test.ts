// tests/unit/identityService.test.ts
//
// Tests for registerIdentityRecovery and clearIdentityRecovery.
// Firebase and generateRecoveryCode are fully mocked — no emulator needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatchUpdate = vi.fn();

const mockBatch = {
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
  update: mockBatchUpdate,
};

const {
  mockWriteBatch,
  mockDoc,
  mockGenerateRecoveryCode,
  mockGetDoc,
  mockGetDocs,
  mockQuery,
  mockCollection,
  mockWhere,
  mockSetDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockLimit,
} = vi.hoisted(() => ({
  mockWriteBatch: vi.fn(),
  mockDoc: vi.fn((...args: unknown[]) => `${args[1]}/${args[2]}`),
  mockGenerateRecoveryCode: vi.fn(() => "DH-GENE-CODE"),
  mockGetDoc: vi.fn(),
  mockGetDocs: vi.fn(),
  mockQuery: vi.fn((...args: unknown[]) => args),
  mockCollection: vi.fn((...args: unknown[]) => args.slice(1).join("/")),
  mockWhere: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockLimit: vi.fn((value: number) => ({ limit: value })),
}));

vi.mock("firebase/firestore", () => ({
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}));

vi.mock("../../src/firebase", () => ({
  db: "mock-db",
}));

vi.mock("../../src/utils/recoveryCode", () => ({
  generateRecoveryCode: () => mockGenerateRecoveryCode(),
}));

import {
  registerIdentityRecovery,
  clearIdentityRecovery,
  reclaimIdentity,
  getRecoveryCode,
  rotateRecoveryCode,
} from "../../src/services/identityService";

// ── Setup ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteBatch.mockReturnValue(mockBatch);
  mockSetDoc.mockResolvedValue(undefined);
  mockUpdateDoc.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
});

// ── registerIdentityRecovery ───────────────────────────────────────────────

describe("registerIdentityRecovery", () => {
  it("writes identityRecovery entry with uid and role", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchSet).toHaveBeenCalledWith("identityRecovery/DH-GENE-CODE", {
      uid: "uid-1",
      role: "dm",
    });
  });

  it("writes identitySecret entry with the generated code", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchSet).toHaveBeenCalledWith("identitySecret/uid-1", {
      code: "DH-GENE-CODE",
    });
  });

  it("returns the generated code", async () => {
    const result = await registerIdentityRecovery("uid-1", "player");

    expect(result).toBe("DH-GENE-CODE");
  });

  it("deletes the old identityRecovery entry when existingCode is provided", async () => {
    await registerIdentityRecovery("uid-1", "dm", "DH-0OLD-C0DE");

    expect(mockBatchDelete).toHaveBeenCalledWith("identityRecovery/DH-0OLD-C0DE");
  });

  it("does not call delete when existingCode is not provided", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchDelete).not.toHaveBeenCalled();
  });

  it("commits the batch exactly once", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });
});

// ── clearIdentityRecovery ─────────────────────────────────────────────────

describe("clearIdentityRecovery", () => {
  it("deletes the identityRecovery entry by code", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-CLER");

    expect(mockBatchDelete).toHaveBeenCalledWith("identityRecovery/DH-CODE-CLER");
  });

  it("deletes the identitySecret entry by uid", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-CLER");

    expect(mockBatchDelete).toHaveBeenCalledWith("identitySecret/uid-1");
  });

  it("commits the batch exactly once", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-CLER");

    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });
});

// ── reclaimIdentity ───────────────────────────────────────────────────────

// Helper factories for mocked Firestore snapshots
function makeRecoverySnap(uid: string, role: string) {
  return { exists: () => true, data: () => ({ uid, role }) };
}
function makeEmptySnap() {
  return { exists: () => false, data: () => null };
}
function makeQuerySnap(refs: string[], getData?: (ref: string) => Record<string, unknown>) {
  return {
    empty: refs.length === 0,
    docs: refs.map((ref) => ({
      ref,
      id: ref.split("/").pop(),
      data: getData ? () => getData(ref) : () => ({}),
    })),
  };
}

describe("reclaimIdentity", () => {
  it("throws when recovery code is not found", async () => {
    mockGetDoc.mockResolvedValue(makeEmptySnap());

    await expect(reclaimIdentity("uid-new", "DH-BADD-C0DE")).rejects.toThrow(
      "Recovery code not found."
    );
  });

  it("throws when the code already belongs to the current user", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-same", "dm"));

    await expect(reclaimIdentity("uid-same", "DH-C0DE-0001")).rejects.toThrow(
      "already registered to your account"
    );
  });

  it("returns the reclaimed role", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    const role = await reclaimIdentity("uid-new", "DH-C0DE-0001");

    expect(role).toBe("dm");
  });

  it("writes the reclaim proof document with oldUid and code", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-C0DE-0001");

    expect(mockSetDoc).toHaveBeenCalledWith("identityReclaims/uid-new", {
      oldUid: "uid-old",
      code: "DH-C0DE-0001",
    });
  });

  it("queries campaigns by dmId and batch-updates each dmId for DM reclaim", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs
      // First call: campaigns owned by uid-old as DM
      .mockResolvedValueOnce(makeQuerySnap(["campaigns/camp-1", "campaigns/camp-2"]))
      // Second call: campaigns where uid-old is a member (none for a DM-only account)
      .mockResolvedValueOnce(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-C0DE-0001");

    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-1", { dmId: "uid-new" });
    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-2", { dmId: "uid-new" });
    expect(mockBatchCommit).toHaveBeenCalledOnce();
    expect(mockLimit).toHaveBeenCalledWith(51);
  });

  it("queries member campaigns then swaps memberIds and character userId for player reclaim", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "player"));
    mockGetDocs
      // First call: campaigns owned by uid-old as DM (none for a player-only account)
      .mockResolvedValueOnce(makeQuerySnap([]))
      // Second call: campaigns where memberIds contains uid-old
      .mockResolvedValueOnce(
        makeQuerySnap(["campaigns/camp-1"], () => ({
          memberIds: ["uid-old", "player-other"],
        }))
      )
      // Third call: characters in that campaign owned by uid-old
      .mockResolvedValueOnce(makeQuerySnap(["campaigns/camp-1/characters/char-1"]));

    await reclaimIdentity("uid-new", "DH-C0DE-0001");

    // memberIds: uid-old replaced with uid-new, other members preserved
    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-1", {
      memberIds: ["player-other", "uid-new"],
    });
    // character userId transferred
    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-1/characters/char-1", {
      userId: "uid-new",
    });
  });

  it("combines DM and member migration when the DM owns a character in their campaign", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnap(["campaigns/camp-1"]))
      .mockResolvedValueOnce(
        makeQuerySnap(["campaigns/camp-1"], () => ({ memberIds: ["uid-old"] }))
      )
      .mockResolvedValueOnce(makeQuerySnap(["campaigns/camp-1/characters/char-1"]));

    await reclaimIdentity("uid-new", "DH-C0DE-0001");

    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-1", {
      dmId: "uid-new",
      memberIds: ["uid-new"],
    });
    expect(
      mockBatchUpdate.mock.calls.filter(([reference]) => reference === "campaigns/camp-1")
    ).toHaveLength(1);
  });

  it("updates identityRecovery uid and writes identitySecret for new uid", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-C0DE-0001");

    expect(mockUpdateDoc).toHaveBeenCalledWith("identityRecovery/DH-C0DE-0001", { uid: "uid-new" });
    expect(mockSetDoc).toHaveBeenCalledWith("identitySecret/uid-new", { code: "DH-C0DE-0001" });
  });

  it("deletes the reclaim proof document after completion", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-C0DE-0001");

    expect(mockDeleteDoc).toHaveBeenCalledWith("identityReclaims/uid-new");
  });

  it("stops before ownership writes when the campaign safety ceiling is exceeded", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs
      .mockResolvedValueOnce(
        makeQuerySnap(Array.from({ length: 51 }, (_, index) => `campaigns/camp-${index + 1}`))
      )
      .mockResolvedValueOnce(makeQuerySnap([]));

    await expect(reclaimIdentity("uid-new", "DH-C0DE-0001")).rejects.toThrow(
      "protected recovery process"
    );

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockDeleteDoc).toHaveBeenCalledWith("identityReclaims/uid-new");
  });

  it("stops before ownership writes when a campaign exceeds the character ceiling", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "player"));
    mockGetDocs
      .mockResolvedValueOnce(makeQuerySnap([]))
      .mockResolvedValueOnce(
        makeQuerySnap(["campaigns/camp-1"], () => ({ memberIds: ["uid-old"] }))
      )
      .mockResolvedValueOnce(
        makeQuerySnap(
          Array.from({ length: 21 }, (_, index) => `campaigns/camp-1/characters/char-${index + 1}`)
        )
      );

    await expect(reclaimIdentity("uid-new", "DH-C0DE-0001")).rejects.toThrow(
      "protected recovery process"
    );

    expect(mockWriteBatch).not.toHaveBeenCalled();
    expect(mockBatchUpdate).not.toHaveBeenCalled();
  });
});

// ── getRecoveryCode ───────────────────────────────────────────────────────

describe("getRecoveryCode", () => {
  it("returns the code when identitySecret document exists", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ code: "DH-MY00-CODE" }),
    });

    const result = await getRecoveryCode("uid-1");

    expect(result).toBe("DH-MY00-CODE");
    expect(mockDoc).toHaveBeenCalledWith("mock-db", "identitySecret", "uid-1");
  });

  it("returns null when no identitySecret document exists", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });

    const result = await getRecoveryCode("uid-1");

    expect(result).toBeNull();
  });
});

// ── rotateRecoveryCode ────────────────────────────────────────────────────

describe("rotateRecoveryCode", () => {
  it("fetches the current code and passes it as existingCode to registerIdentityRecovery", async () => {
    // getRecoveryCode returns the current code
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ code: "DH-0OLD-C0DE" }),
    });

    await rotateRecoveryCode("uid-1", "dm");

    // The batch delete should remove the OLD identityRecovery entry
    expect(mockBatchDelete).toHaveBeenCalledWith("identityRecovery/DH-0OLD-C0DE");
  });

  it("returns the newly generated code", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ code: "DH-0OLD-C0DE" }),
    });

    const result = await rotateRecoveryCode("uid-1", "player");

    expect(result).toBe("DH-GENE-CODE");
  });

  it("handles no existing code gracefully (first-time rotate)", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });

    // Should not throw; registerIdentityRecovery called without existingCode
    await expect(rotateRecoveryCode("uid-1", "dm")).resolves.toBe("DH-GENE-CODE");
    expect(mockBatchDelete).not.toHaveBeenCalled();
  });
});
