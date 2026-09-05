// functions/tests/operations/registerIdentityCode.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerIdentityCode } from "../../src/operations/registerIdentityCode";

const mockTransactionGet = vi.fn();
const mockTransactionDelete = vi.fn();
const mockTransactionSet = vi.fn();
const mockRunTransaction = vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
  await callback({
    get: mockTransactionGet,
    delete: mockTransactionDelete,
    set: mockTransactionSet,
  });
});

const mockSecretDoc = vi.fn((id: string) => ({ id, collectionName: "identitySecret" }));
const mockSecretCollection = { doc: mockSecretDoc };
const mockIndexDoc = vi.fn(() => ({}));
const mockIndexCollection = { doc: mockIndexDoc };
const mockLinkGet = vi.fn();
const mockLinkDoc = vi.fn(() => ({ get: mockLinkGet }));
const mockLinkCollection = { doc: mockLinkDoc };
const mockProfileDoc = vi.fn((id: string) => ({ id, collectionName: "userProfiles" }));
const mockProfileCollection = { doc: mockProfileDoc };

const mockCollection = vi.fn((name: string) => {
  if (name === "identitySecret") return mockSecretCollection;
  if (name === "identityRecoveryIndex") return mockIndexCollection;
  if (name === "userLinks") return mockLinkCollection;
  if (name === "userProfiles") return mockProfileCollection;
  throw new Error(`Unexpected collection: ${name}`);
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
}));

describe("registerIdentityCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransactionGet.mockImplementation(async (reference: { collectionName?: string }) =>
      reference.collectionName === "userProfiles"
        ? { exists: true, data: () => ({ firstName: "ExistingUser" }) }
        : { exists: false }
    );
  });

  it("generates a new code and writes the index entry when there was no previous code", async () => {
    const result = await registerIdentityCode({ role: "player" }, "user-1", "secret");

    expect(result.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(mockTransactionDelete).not.toHaveBeenCalled();
    expect(mockTransactionSet).toHaveBeenCalledWith(expect.anything(), {
      uid: "user-1",
      role: "player",
    });
    expect(mockTransactionSet).toHaveBeenCalledWith(expect.anything(), { code: result.code });
  });

  it("deletes the previous index entry when rotating an existing code", async () => {
    mockTransactionGet.mockImplementation(async (reference: { collectionName?: string }) =>
      reference.collectionName === "userProfiles"
        ? { exists: true, data: () => ({ firstName: "ExistingUser" }) }
        : { exists: true, data: () => ({ code: "DH-OLDC-ODE1" }) }
    );

    await registerIdentityCode({ role: "dm" }, "user-1", "secret");

    expect(mockTransactionDelete).toHaveBeenCalledOnce();
    expect(mockIndexDoc).toHaveBeenCalledTimes(2);
  });

  it("reads the secret document fresh inside the transaction", async () => {
    await registerIdentityCode({ role: "player" }, "user-1", "secret");

    expect(mockTransactionGet).toHaveBeenCalledWith(expect.anything());
    expect(mockSecretDoc).toHaveBeenCalledWith("user-1");
  });

  it("registers for the caller's own uid when targetUid matches the caller, without checking userLinks", async () => {
    await registerIdentityCode({ role: "player", targetUid: "user-1" }, "user-1", "secret");

    expect(mockLinkGet).not.toHaveBeenCalled();
    expect(mockSecretDoc).toHaveBeenCalledWith("user-1");
  });

  it("registers for the target uid when the caller is a linked device of it", async () => {
    mockLinkGet.mockResolvedValue({ exists: true, data: () => ({ primaryUid: "primary-1" }) });
    const result = await registerIdentityCode(
      { role: "player", targetUid: "primary-1" },
      "device-1",
      "secret"
    );

    expect(mockLinkDoc).toHaveBeenCalledWith("device-1");
    expect(mockSecretDoc).toHaveBeenCalledWith("primary-1");
    expect(mockTransactionSet).toHaveBeenCalledWith(expect.anything(), {
      uid: "primary-1",
      role: "player",
    });
    expect(result.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  it("rejects when the caller has no userLinks entry at all", async () => {
    mockLinkGet.mockResolvedValue({ exists: false });

    await expect(
      registerIdentityCode({ role: "player", targetUid: "primary-1" }, "device-1", "secret")
    ).rejects.toThrow("This device is not linked to the requested account.");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("rejects when the caller is linked to a different account than the requested target", async () => {
    mockLinkGet.mockResolvedValue({ exists: true, data: () => ({ primaryUid: "someone-else" }) });

    await expect(
      registerIdentityCode({ role: "player", targetUid: "primary-1" }, "device-1", "secret")
    ).rejects.toThrow("This device is not linked to the requested account.");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("rejects issuing a recovery code when the account has no saved profile", async () => {
    mockTransactionGet.mockImplementation(async (reference: { collectionName?: string }) =>
      reference.collectionName === "userProfiles" ? { exists: false } : { exists: false }
    );

    await expect(registerIdentityCode({ role: "player" }, "user-1", "secret")).rejects.toThrow(
      expect.objectContaining({ code: "failed-precondition" })
    );

    expect(mockTransactionSet).not.toHaveBeenCalled();
  });
});
