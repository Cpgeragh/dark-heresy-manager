import { beforeEach, expect, it, vi } from "vitest";
import { disconnectDevice } from "../../src/operations/disconnectDevice";

const state = vi.hoisted(() => ({ count: 2 }));
const remove = vi.hoisted(() => vi.fn());
const set = vi.hoisted(() => vi.fn());
const linkRef = { path: "userLinks/device-1" };
const userRef = { path: "users/device-1" };
const queryRef = { kind: "links-query" };
const collection = vi.hoisted(() =>
  vi.fn((name: string) => {
    if (name === "userLinks")
      return {
        doc: () => linkRef,
        where: () => ({ limit: () => queryRef }),
      };
    return { doc: () => userRef };
  })
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: async (reference: unknown) =>
        reference === linkRef
          ? { exists: true, data: () => ({ primaryUid: "account-1" }) }
          : { size: state.count },
      delete: remove,
      set,
    })
  )
);
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  state.count = 2;
});

it("disconnects one device while preserving the account", async () => {
  await expect(disconnectDevice({}, "device-1")).resolves.toEqual({ wasLastDevice: false });
  expect(remove).toHaveBeenCalledWith(linkRef);
  expect(set).toHaveBeenCalledWith(
    userRef,
    { onboarded: false, recoveryBackedUp: false },
    { merge: true }
  );
});

it("requires an explicit second confirmation for the last device", async () => {
  state.count = 1;
  await expect(disconnectDevice({}, "device-1")).rejects.toMatchObject({
    details: { reason: "last-device" },
  });
  expect(remove).not.toHaveBeenCalled();
  await expect(disconnectDevice({ confirmLastDevice: true }, "device-1")).resolves.toEqual({
    wasLastDevice: true,
  });
});
