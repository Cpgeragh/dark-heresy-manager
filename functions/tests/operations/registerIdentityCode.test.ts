import { beforeEach, expect, it, vi } from "vitest";
import { registerIdentityCode } from "../../src/operations/registerIdentityCode";

const transactionGet = vi.hoisted(() => vi.fn());
const transactionDelete = vi.hoisted(() => vi.fn());
const transactionSet = vi.hoisted(() => vi.fn());
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: transactionGet,
      delete: transactionDelete,
      set: transactionSet,
    })
  )
);
const doc = (collectionName: string, id: string) => ({ collectionName, id });
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({ doc: (id: string) => doc(name, id) }))
);
vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: vi.fn(async () => "account-1"),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  transactionGet.mockImplementation(async (reference: { collectionName: string }) =>
    reference.collectionName === "userProfiles"
      ? { exists: true, data: () => ({ firstName: "Iris" }) }
      : { exists: false, data: () => ({}) }
  );
});

it("rotates the recovery code only for the caller's resolved account", async () => {
  const result = await registerIdentityCode("device-1", "secret");
  expect(result.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  expect(transactionSet).toHaveBeenCalledWith(
    expect.objectContaining({ collectionName: "identityRecoveryIndex" }),
    { uid: "account-1" }
  );
  expect(transactionSet).toHaveBeenCalledWith(
    expect.objectContaining({ collectionName: "identitySecret", id: "account-1" }),
    { code: result.code }
  );
});

it("removes the previous lookup when rotating", async () => {
  transactionGet.mockImplementation(async (reference: { collectionName: string }) =>
    reference.collectionName === "userProfiles"
      ? { exists: true, data: () => ({ firstName: "Iris" }) }
      : { exists: true, data: () => ({ code: "DH-OLDC-ODE1" }) }
  );
  await registerIdentityCode("device-1", "secret");
  expect(transactionDelete).toHaveBeenCalledOnce();
});

it("requires a valid account profile", async () => {
  transactionGet.mockResolvedValue({ exists: false, data: () => ({}) });
  await expect(registerIdentityCode("device-1", "secret")).rejects.toMatchObject({
    code: "failed-precondition",
  });
});
