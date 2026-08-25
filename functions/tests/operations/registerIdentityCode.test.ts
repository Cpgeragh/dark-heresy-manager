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

const mockSecretDoc = vi.fn(() => ({}));
const mockSecretCollection = { doc: mockSecretDoc };
const mockIndexDoc = vi.fn(() => ({}));
const mockIndexCollection = { doc: mockIndexDoc };

const mockCollection = vi.fn((name: string) => {
  if (name === "identitySecret") return mockSecretCollection;
  if (name === "identityRecoveryIndex") return mockIndexCollection;
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
  });

  it("generates a new code and writes the index entry when there was no previous code", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

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
    mockTransactionGet.mockResolvedValue({ exists: true, data: () => ({ code: "DH-OLDC-ODE1" }) });

    await registerIdentityCode({ role: "dm" }, "user-1", "secret");

    expect(mockTransactionDelete).toHaveBeenCalledOnce();
    expect(mockIndexDoc).toHaveBeenCalledTimes(2);
  });

  it("reads the secret document fresh inside the transaction", async () => {
    mockTransactionGet.mockResolvedValue({ exists: false });

    await registerIdentityCode({ role: "player" }, "user-1", "secret");

    expect(mockTransactionGet).toHaveBeenCalledWith(expect.anything());
    expect(mockSecretDoc).toHaveBeenCalledWith("user-1");
  });
});
