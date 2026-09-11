import { beforeEach, describe, expect, it, vi } from "vitest";
import { discardOnboardingSetup } from "../../src/operations/discardOnboardingSetup";

const {
  mockRunTransaction,
  mockTransactionGet,
  mockTransactionDelete,
  mockCollection,
  mockIndexDoc,
  userRef,
  secretRef,
  profileRef,
  indexRef,
} = vi.hoisted(() => {
  const userRef = { path: "users/user-1" };
  const secretRef = { path: "identitySecret/user-1" };
  const profileRef = { path: "userProfiles/user-1" };
  const indexRef = { path: "identityRecoveryIndex/hash" };
  const mockIndexDoc = vi.fn(() => indexRef);
  const mockTransactionGet = vi.fn();
  const mockTransactionDelete = vi.fn();
  const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) =>
    callback({ get: mockTransactionGet, delete: mockTransactionDelete })
  );
  const mockCollection = vi.fn((name: string) => {
    if (name === "users") return { doc: vi.fn(() => userRef) };
    if (name === "identitySecret") return { doc: vi.fn(() => secretRef) };
    if (name === "userProfiles") return { doc: vi.fn(() => profileRef) };
    if (name === "identityRecoveryIndex") return { doc: mockIndexDoc };
    throw new Error(`Unexpected collection: ${name}`);
  });
  return {
    mockRunTransaction,
    mockTransactionGet,
    mockTransactionDelete,
    mockCollection,
    mockIndexDoc,
    userRef,
    secretRef,
    profileRef,
    indexRef,
  };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection: mockCollection, runTransaction: mockRunTransaction }),
}));

describe("discardOnboardingSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("atomically removes the provisional profile, secret, and recovery lookup", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ onboarded: false }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ code: "DH-AAAA-BBBB" }) });

    await discardOnboardingSetup("user-1", "test-secret");

    expect(mockTransactionGet).toHaveBeenNthCalledWith(1, userRef);
    expect(mockTransactionGet).toHaveBeenNthCalledWith(2, secretRef);
    expect(mockIndexDoc).toHaveBeenCalledWith(expect.any(String));
    expect(mockTransactionDelete).toHaveBeenCalledWith(indexRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(secretRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(profileRef);
  });

  it("removes a partial profile even when code creation never completed", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ onboarded: false }) })
      .mockResolvedValueOnce({ exists: false });

    await discardOnboardingSetup("user-1", "test-secret");

    expect(mockIndexDoc).not.toHaveBeenCalled();
    expect(mockTransactionDelete).toHaveBeenCalledWith(secretRef);
    expect(mockTransactionDelete).toHaveBeenCalledWith(profileRef);
  });

  it("refuses to remove data after onboarding has completed", async () => {
    mockTransactionGet
      .mockResolvedValueOnce({ exists: true, data: () => ({ onboarded: true }) })
      .mockResolvedValueOnce({ exists: true, data: () => ({ code: "DH-AAAA-BBBB" }) });

    await expect(discardOnboardingSetup("user-1", "test-secret")).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect(mockTransactionDelete).not.toHaveBeenCalled();
  });
});
