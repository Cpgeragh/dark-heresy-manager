import { beforeEach, expect, it, vi } from "vitest";
import { linkDevice } from "../../src/operations/linkDevice";

const state = vi.hoisted(() => ({
  index: true,
  linked: false,
  onboarded: false,
  accountStatus: "active",
  profile: true,
  deviceCount: 1,
  primaryDeviceUid: "old-device",
}));
const transactionCreate = vi.hoisted(() => vi.fn());
const transactionSet = vi.hoisted(() => vi.fn());
const transactionDelete = vi.hoisted(() => vi.fn());
const makeRef = (path: string) => ({ path, id: path.split("/").at(-1) });
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({
    doc: (id: string) => makeRef(`${name}/${id}`),
    where: () => ({ path: `${name}/query` }),
  }))
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: async (reference: { path: string }) => {
        if (reference.path.startsWith("identityRecoveryIndex/"))
          return { exists: state.index, data: () => ({ uid: "account-1" }) };
        if (reference.path === "userLinks/device-1")
          return { exists: state.linked, data: () => ({}) };
        if (reference.path === "users/device-1")
          return { exists: true, data: () => ({ onboarded: state.onboarded }) };
        if (reference.path === "accounts/account-1")
          return {
            exists: true,
            data: () => ({
              status: state.accountStatus,
              deviceCount: state.deviceCount,
              primaryDeviceUid: state.primaryDeviceUid,
            }),
          };
        if (reference.path === "userProfiles/account-1")
          return { exists: state.profile, data: () => ({ firstName: "Iris" }) };
        if (reference.path === "userLinks/query")
          return {
            size: 2,
            docs: [
              {
                id: "old-device",
                ref: makeRef("userLinks/old-device"),
                data: () => ({ isPrimary: true }),
              },
              { id: "other-device", ref: makeRef("userLinks/other-device"), data: () => ({}) },
            ],
          };
        return { exists: false, data: () => ({}) };
      },
      create: transactionCreate,
      set: transactionSet,
      delete: transactionDelete,
    })
  )
);
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
  FieldValue: { serverTimestamp: () => "server-time" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state, {
    index: true,
    linked: false,
    onboarded: false,
    accountStatus: "active",
    profile: true,
    deviceCount: 1,
  });
});

it("rejects a new device when the account is at the server limit", async () => {
  state.deviceCount = 10;
  await expect(
    linkDevice({ code: "DH-AAAA-BBBB", deviceName: "Phone" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "resource-exhausted" });
  expect(transactionCreate).not.toHaveBeenCalled();
});

it("connects an unfinished device to an active account", async () => {
  await linkDevice({ code: "DH-AAAA-BBBB", deviceName: "Cormac's phone" }, "device-1", "secret");
  expect(transactionCreate).toHaveBeenCalledWith(
    expect.objectContaining({ path: "userLinks/device-1" }),
    { primaryUid: "account-1", name: "Cormac's phone", linkedAt: "server-time" }
  );
});

it("rejects unknown codes and existing device links", async () => {
  state.index = false;
  await expect(
    linkDevice({ code: "DH-AAAA-BBBB", deviceName: "Phone" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "not-found" });
  state.index = true;
  state.linked = true;
  await expect(
    linkDevice({ code: "DH-AAAA-BBBB", deviceName: "Phone" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "failed-precondition" });
});

it("does not expose an unfinished account to another device", async () => {
  state.accountStatus = "provisional";
  await expect(
    linkDevice({ code: "DH-AAAA-BBBB", deviceName: "Phone" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(transactionCreate).not.toHaveBeenCalled();
});

it("requires confirmation before replacing a primary device", async () => {
  await expect(
    linkDevice({ code: "DH-AAAA-BBBB", deviceName: "Phone", mode: "primary" }, "device-1", "secret")
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(transactionDelete).not.toHaveBeenCalled();
});

it("replaces only the primary device and preserves other connections", async () => {
  state.deviceCount = 2;
  await linkDevice(
    { code: "DH-AAAA-BBBB", deviceName: "Phone", mode: "primary", confirmed: true },
    "device-1",
    "secret"
  );
  expect(transactionDelete).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ path: "userLinks/old-device" })
  );
  expect(transactionSet).toHaveBeenCalledWith(
    expect.objectContaining({ path: "accounts/account-1" }),
    { primaryDeviceUid: "device-1" },
    { merge: true }
  );
  expect(transactionSet).toHaveBeenCalledWith(
    expect.objectContaining({ path: "accounts/account-1" }),
    { deviceCount: 2 },
    { merge: true }
  );
});

it("recovery disconnects all previous devices", async () => {
  state.deviceCount = 2;
  await linkDevice(
    { code: "DH-AAAA-BBBB", deviceName: "Phone", mode: "recover", confirmed: true },
    "device-1",
    "secret"
  );
  expect(transactionDelete).toHaveBeenCalledTimes(2);
  expect(transactionSet).toHaveBeenCalledWith(
    expect.objectContaining({ path: "accounts/account-1" }),
    { deviceCount: 1 },
    { merge: true }
  );
});
