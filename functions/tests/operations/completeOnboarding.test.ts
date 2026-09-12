import { beforeEach, expect, it, vi } from "vitest";
import { completeOnboarding } from "../../src/operations/completeOnboarding";

const state = vi.hoisted(() => ({ status: "provisional", creator: "device-1", profile: true }));
const update = vi.hoisted(() => vi.fn());
const set = vi.hoisted(() => vi.fn());
const makeRef = (path: string) => ({ path });
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({ doc: (id: string) => makeRef(`${name}/${id}`) }))
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: async (reference: { path: string }) => {
        if (reference.path === "userLinks/device-1")
          return { exists: true, data: () => ({ primaryUid: "account-1" }) };
        if (reference.path === "accounts/account-1")
          return {
            exists: true,
            data: () => ({ status: state.status, createdByDeviceUid: state.creator }),
          };
        if (reference.path === "userProfiles/account-1")
          return { exists: state.profile, data: () => ({ firstName: "Iris" }) };
        return { exists: false, data: () => ({}) };
      },
      update,
      set,
    })
  )
);
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
  FieldValue: { serverTimestamp: () => "server-time" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(state, { status: "provisional", creator: "device-1", profile: true });
});

it("activates a provisional account and completes its creating device", async () => {
  await completeOnboarding("device-1");
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ path: "accounts/account-1" }), {
    status: "active",
    activatedAt: "server-time",
  });
  expect(set).toHaveBeenCalledWith(
    expect.objectContaining({ path: "users/device-1" }),
    { onboarded: true, recoveryBackedUp: true },
    { merge: true }
  );
});

it("completes a device connected to an already active account", async () => {
  state.status = "active";
  await completeOnboarding("device-1");
  expect(update).not.toHaveBeenCalled();
  expect(set).toHaveBeenCalledOnce();
});

it("rejects a missing profile", async () => {
  state.profile = false;
  await expect(completeOnboarding("device-1")).rejects.toMatchObject({
    code: "failed-precondition",
  });
});
