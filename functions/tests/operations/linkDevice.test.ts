import { beforeEach, expect, it, vi } from "vitest";
import { linkDevice } from "../../src/operations/linkDevice";

const state = vi.hoisted(() => ({
  index: true,
  linked: false,
  onboarded: false,
  accountStatus: "active",
  profile: true,
}));
const transactionCreate = vi.hoisted(() => vi.fn());
const makeRef = (path: string) => ({ path, id: path.split("/").at(-1) });
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({ doc: (id: string) => makeRef(`${name}/${id}`) }))
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
          return { exists: true, data: () => ({ status: state.accountStatus }) };
        if (reference.path === "userProfiles/account-1")
          return { exists: state.profile, data: () => ({ firstName: "Iris" }) };
        return { exists: false, data: () => ({}) };
      },
      create: transactionCreate,
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
  });
});

it("connects an unfinished device to an active account", async () => {
  await linkDevice({ code: "DH-AAAA-BBBB" }, "device-1", "secret");
  expect(transactionCreate).toHaveBeenCalledWith(
    expect.objectContaining({ path: "userLinks/device-1" }),
    { primaryUid: "account-1", linkedAt: "server-time" }
  );
});

it("rejects unknown codes and existing device links", async () => {
  state.index = false;
  await expect(linkDevice({ code: "DH-AAAA-BBBB" }, "device-1", "secret")).rejects.toMatchObject({
    code: "not-found",
  });
  state.index = true;
  state.linked = true;
  await expect(linkDevice({ code: "DH-AAAA-BBBB" }, "device-1", "secret")).rejects.toMatchObject({
    code: "failed-precondition",
  });
});

it("does not expose an unfinished account to another device", async () => {
  state.accountStatus = "provisional";
  await expect(linkDevice({ code: "DH-AAAA-BBBB" }, "device-1", "secret")).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(transactionCreate).not.toHaveBeenCalled();
});
