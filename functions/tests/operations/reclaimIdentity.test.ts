// functions/tests/operations/reclaimIdentity.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { reclaimIdentity } from "../../src/operations/reclaimIdentity";
import * as identityMigration from "../../src/shared/identityMigration";

const mockRecoveryGet = vi.fn();
const mockSecretGet = vi.fn();
const mockBatchUpdate = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockBatch = vi.fn(() => ({
  update: mockBatchUpdate,
  set: mockBatchSet,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
}));

const mockDoc = vi.fn((id: string) => ({ id }));
const mockCollection = vi.fn((name: string) => {
  if (name === "identityRecovery") return { doc: (id: string) => ({ id, get: mockRecoveryGet }) };
  if (name === "identitySecret") return { doc: (id: string) => ({ id, get: mockSecretGet }) };
  return { doc: mockDoc };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, batch: mockBatch }),
}));

vi.mock("../../src/shared/identityMigration", () => ({
  computeOwnershipMigrationPlan: vi.fn(),
  applyOwnershipMigrationPlan: vi.fn(),
}));

describe("reclaimIdentity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityMigration.computeOwnershipMigrationPlan).mockResolvedValue({
      campaignMigrations: [],
      writeCount: 0,
    });
  });

  it("rejects when the code does not resolve", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: false });

    await expect(reclaimIdentity({ code: "DH-NOPE-0000" }, "new-uid")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("rejects reclaiming your own already-registered code", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "new-uid" }) });

    await expect(reclaimIdentity({ code: "DH-SAME-0000" }, "new-uid")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );
  });

  it("rejects when the secret doesn't match the given code", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-DIFF-0000" }) });

    await expect(reclaimIdentity({ code: "DH-SAME-0000" }, "new-uid")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
  });

  it("migrates ownership and transfers the identity documents on success", async () => {
    mockRecoveryGet.mockResolvedValue({
      exists: true,
      data: () => ({ uid: "old-uid", role: "dm" }),
    });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-SAME-0000" }) });

    const result = await reclaimIdentity({ code: "DH-SAME-0000" }, "new-uid");

    expect(result).toEqual({ role: "dm" });
    expect(identityMigration.applyOwnershipMigrationPlan).toHaveBeenCalled();
    expect(mockBatchDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "old-uid" }));
    expect(mockBatchCommit).toHaveBeenCalledOnce();
  });

  it("defaults to the player role for codes registered before roles were tracked", async () => {
    mockRecoveryGet.mockResolvedValue({ exists: true, data: () => ({ uid: "old-uid" }) });
    mockSecretGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-SAME-0000" }) });

    const result = await reclaimIdentity({ code: "DH-SAME-0000" }, "new-uid");

    expect(result).toEqual({ role: "player" });
  });
});
