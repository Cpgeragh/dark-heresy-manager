// tests/unit/identityService.test.ts
//
// Tests for registerIdentityRecovery and clearIdentityRecovery.
// Firebase and generateRecoveryCode are fully mocked — no emulator needed.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockBatchSet    = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatchUpdate = vi.fn();

const mockBatch = {
  set:    mockBatchSet,
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
} = vi.hoisted(() => ({
  mockWriteBatch:           vi.fn(),
  mockDoc:                  vi.fn((_: unknown, col: string, id: string) => `${col}/${id}`),
  mockGenerateRecoveryCode: vi.fn(() => "DH-GENERATED-CODE"),
  mockGetDoc:               vi.fn(),
  mockGetDocs:              vi.fn(),
  mockQuery:                vi.fn((...args: unknown[]) => args),
  mockCollection:           vi.fn((_: unknown, ...path: string[]) => path.join("/")),
  mockWhere:                vi.fn(),
  mockSetDoc:               vi.fn(),
  mockUpdateDoc:            vi.fn(),
  mockDeleteDoc:            vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  writeBatch:  (...args: unknown[]) => mockWriteBatch(...args),
  doc:         (...args: unknown[]) => mockDoc(...args),
  getDoc:      (...args: unknown[]) => mockGetDoc(...args),
  getDocs:     (...args: unknown[]) => mockGetDocs(...args),
  query:       (...args: unknown[]) => mockQuery(...args),
  collection:  (...args: unknown[]) => mockCollection(...args),
  where:       (...args: unknown[]) => mockWhere(...args),
  setDoc:      (...args: unknown[]) => mockSetDoc(...args),
  updateDoc:   (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc:   (...args: unknown[]) => mockDeleteDoc(...args),
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

    expect(mockBatchSet).toHaveBeenCalledWith(
      "identityRecovery/DH-GENERATED-CODE",
      { uid: "uid-1", role: "dm" }
    );
  });

  it("writes identitySecret entry with the generated code", async () => {
    await registerIdentityRecovery("uid-1", "dm");

    expect(mockBatchSet).toHaveBeenCalledWith(
      "identitySecret/uid-1",
      { code: "DH-GENERATED-CODE" }
    );
  });

  it("returns the generated code", async () => {
    const result = await registerIdentityRecovery("uid-1", "player");

    expect(result).toBe("DH-GENERATED-CODE");
  });

  it("deletes the old identityRecovery entry when existingCode is provided", async () => {
    await registerIdentityRecovery("uid-1", "dm", "DH-OLD-CODE");

    expect(mockBatchDelete).toHaveBeenCalledWith("identityRecovery/DH-OLD-CODE");
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
    await clearIdentityRecovery("uid-1", "DH-CODE-TO-CLEAR");

    expect(mockBatchDelete).toHaveBeenCalledWith(
      "identityRecovery/DH-CODE-TO-CLEAR"
    );
  });

  it("deletes the identitySecret entry by uid", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-TO-CLEAR");

    expect(mockBatchDelete).toHaveBeenCalledWith("identitySecret/uid-1");
  });

  it("commits the batch exactly once", async () => {
    await clearIdentityRecovery("uid-1", "DH-CODE-TO-CLEAR");

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
function makeQuerySnap(
  refs: string[],
  getData?: (ref: string) => Record<string, unknown>
) {
  return {
    empty: refs.length === 0,
    docs:  refs.map((ref) => ({
      ref,
      id:   ref.split("/").pop(),
      data: getData ? () => getData(ref) : () => ({}),
    })),
  };
}

describe("reclaimIdentity", () => {

  it("throws when recovery code is not found", async () => {
    mockGetDoc.mockResolvedValue(makeEmptySnap());

    await expect(reclaimIdentity("uid-new", "DH-BAD-CODE")).rejects.toThrow(
      "Recovery code not found."
    );
  });

  it("throws when the code already belongs to the current user", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-same", "dm"));

    await expect(reclaimIdentity("uid-same", "DH-CODE")).rejects.toThrow(
      "already registered to your account"
    );
  });

  it("returns the reclaimed role", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    const role = await reclaimIdentity("uid-new", "DH-CODE");

    expect(role).toBe("dm");
  });

  it("writes the reclaim proof document with oldUid and code", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-CODE");

    expect(mockSetDoc).toHaveBeenCalledWith(
      "identityReclaims/uid-new",
      { oldUid: "uid-old", code: "DH-CODE" }
    );
  });

  it("queries campaigns by dmId and batch-updates each dmId for DM reclaim", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap(["campaigns/camp-1", "campaigns/camp-2"]));

    await reclaimIdentity("uid-new", "DH-CODE");

    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-1", { dmId: "uid-new" });
    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-2", { dmId: "uid-new" });
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("queries member campaigns then swaps memberIds and character userId for player reclaim", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "player"));
    mockGetDocs
      // First call: campaigns where memberIds contains uid-old
      .mockResolvedValueOnce(
        makeQuerySnap(["campaigns/camp-1"], () => ({
          memberIds: ["uid-old", "player-other"],
        }))
      )
      // Second call: characters in that campaign owned by uid-old
      .mockResolvedValueOnce(
        makeQuerySnap(["campaigns/camp-1/characters/char-1"])
      );

    await reclaimIdentity("uid-new", "DH-CODE");

    // memberIds: uid-old replaced with uid-new, other members preserved
    expect(mockBatchUpdate).toHaveBeenCalledWith("campaigns/camp-1", {
      memberIds: ["player-other", "uid-new"],
    });
    // character userId transferred
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      "campaigns/camp-1/characters/char-1",
      { userId: "uid-new" }
    );
  });

  it("updates identityRecovery uid and writes identitySecret for new uid", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-CODE");

    expect(mockUpdateDoc).toHaveBeenCalledWith("identityRecovery/DH-CODE", { uid: "uid-new" });
    expect(mockSetDoc).toHaveBeenCalledWith("identitySecret/uid-new", { code: "DH-CODE" });
  });

  it("deletes the reclaim proof document after completion", async () => {
    mockGetDoc.mockResolvedValue(makeRecoverySnap("uid-old", "dm"));
    mockGetDocs.mockResolvedValue(makeQuerySnap([]));

    await reclaimIdentity("uid-new", "DH-CODE");

    expect(mockDeleteDoc).toHaveBeenCalledWith("identityReclaims/uid-new");
  });
});
