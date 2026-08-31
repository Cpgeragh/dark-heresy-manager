import { beforeEach, describe, expect, it, vi } from "vitest";
import { revokeIdentityCode } from "../../src/operations/revokeIdentityCode";

const {
  mockRunTransaction,
  mockTransactionGet,
  mockTransactionDelete,
  mockCollection,
  mockIndexDoc,
  secretRef,
  indexRef,
} = vi.hoisted(() => {
  const secretRef = { path: "identitySecret/user-1" };
  const indexRef = { path: "identityRecoveryIndex/hash" };
  const mockIndexDoc = vi.fn(() => indexRef);
  const mockTransactionGet = vi.fn();
  const mockTransactionDelete = vi.fn();
  const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) =>
    callback({ get: mockTransactionGet, delete: mockTransactionDelete })
  );
  const mockCollection = vi.fn((name: string) => {
    if (name === "identitySecret") return { doc: vi.fn(() => secretRef) };
    if (name === "identityRecoveryIndex") return { doc: mockIndexDoc };
    throw new Error(`Unexpected collection: ${name}`);
  });
  return {
    mockRunTransaction,
    mockTransactionGet,
    mockTransactionDelete,
    mockCollection,
    mockIndexDoc,
    secretRef,
    indexRef,
  };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, runTransaction: mockRunTransaction }),
}));

describe("revokeIdentityCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the hashed lookup and plaintext secret in one transaction", async () => {
    mockTransactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ code: "DH-AAAA-BBBB" }),
    });

    await revokeIdentityCode("user-1", "test-secret");

    expect(mockIndexDoc).toHaveBeenCalledWith(expect.any(String));
    expect(mockTransactionDelete).toHaveBeenCalledWith(indexRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(secretRef);
  });

  it("is idempotent when no identity secret exists", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    await revokeIdentityCode("user-1", "test-secret");

    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockIndexDoc).not.toHaveBeenCalled();
  });
});
