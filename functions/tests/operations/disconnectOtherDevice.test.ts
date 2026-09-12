import { beforeEach, expect, it, vi } from "vitest";
import { disconnectOtherDevice } from "../../src/operations/disconnectOtherDevice";

const remove = vi.hoisted(() => vi.fn());
const set = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
const queryRef = { path: "userLinks-query" };
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({
    doc: (id: string) => ({ path: `${name}/${id}` }),
    where: () => queryRef,
  }))
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (transaction: unknown) => unknown) =>
    callback({ get, delete: remove, set, create })
  )
);

vi.mock("../../src/shared/recoveryCode", () => ({
  generateRecoveryCode: () => "DH-NEW0-CODE",
  hashRecoveryCode: (code: string) => `hash-${code}`,
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  get.mockImplementation(async (reference: { path: string }) => {
    if (reference.path === "userLinks/device-1" || reference.path === "userLinks/device-2") {
      return { exists: true, data: () => ({ primaryUid: "account-1" }) };
    }
    if (reference.path === "identitySecret/account-1") {
      return { exists: true, data: () => ({ code: "DH-OLD0-CODE" }) };
    }
    if (reference.path === "identityRecoveryIndex/hash-DH-NEW0-CODE") {
      return { exists: false, data: () => ({}) };
    }
    if (reference.path === "userLinks-query") return { size: 2 };
    return { exists: false, data: () => ({}) };
  });
});

it("removes the target, resets it to Welcome, and rotates recovery atomically", async () => {
  await expect(
    disconnectOtherDevice({ targetDeviceUid: "device-2" }, "device-1", "secret")
  ).resolves.toEqual({ recoveryCode: "DH-NEW0-CODE", remainingDeviceCount: 1 });

  expect(remove).toHaveBeenCalledWith(expect.objectContaining({ path: "userLinks/device-2" }));
  expect(set).toHaveBeenCalledWith(
    expect.objectContaining({ path: "users/device-2" }),
    { onboarded: false, recoveryBackedUp: false },
    { merge: true }
  );
  expect(remove).toHaveBeenCalledWith(
    expect.objectContaining({ path: "identityRecoveryIndex/hash-DH-OLD0-CODE" })
  );
  expect(set).toHaveBeenCalledWith(expect.objectContaining({ path: "identitySecret/account-1" }), {
    code: "DH-NEW0-CODE",
  });
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ path: "identityRecoveryIndex/hash-DH-NEW0-CODE" }),
    { uid: "account-1" }
  );
});

it("cannot target the current device", async () => {
  await expect(
    disconnectOtherDevice({ targetDeviceUid: "device-1" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "invalid-argument" });
});

it("rejects a target belonging to another account", async () => {
  get
    .mockResolvedValueOnce({ exists: true, data: () => ({ primaryUid: "account-1" }) })
    .mockResolvedValueOnce({ exists: true, data: () => ({ primaryUid: "account-2" }) });
  await expect(
    disconnectOtherDevice({ targetDeviceUid: "device-2" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(remove).not.toHaveBeenCalled();
});
