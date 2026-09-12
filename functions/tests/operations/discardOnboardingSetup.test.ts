import { beforeEach, expect, it, vi } from "vitest";
import { discardOnboardingSetup } from "../../src/operations/discardOnboardingSetup";

const state = vi.hoisted(() => ({ onboarded: false, status: "provisional", creator: "device-1" }));
const transactionDelete = vi.hoisted(() => vi.fn());
const makeRef = (path: string) => ({ path, id: path.split("/").at(-1) });
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({ doc: (id: string) => makeRef(`${name}/${id}`) }))
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: async (reference: { path: string }) => {
        if (reference.path === "users/device-1")
          return { exists: true, data: () => ({ onboarded: state.onboarded }) };
        if (reference.path === "userLinks/device-1")
          return { exists: true, data: () => ({ primaryUid: "account-1" }) };
        if (reference.path === "accounts/account-1")
          return {
            exists: true,
            data: () => ({ status: state.status, createdByDeviceUid: state.creator }),
          };
        if (reference.path === "identitySecret/account-1")
          return { exists: true, data: () => ({ code: "DH-AAAA-BBBB" }) };
        return { exists: false, data: () => ({}) };
      },
      delete: transactionDelete,
    })
  )
);
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  state.onboarded = false;
  state.status = "provisional";
  state.creator = "device-1";
});

it("deletes only the provisional account created by this device", async () => {
  await discardOnboardingSetup("device-1", "secret");
  expect(transactionDelete).toHaveBeenCalledWith(
    expect.objectContaining({ path: "accounts/account-1" })
  );
  expect(transactionDelete).toHaveBeenCalledWith(
    expect.objectContaining({ path: "userLinks/device-1" })
  );
  expect(transactionDelete).toHaveBeenCalledWith(
    expect.objectContaining({ path: "identitySecret/account-1" })
  );
});

it("refuses to discard an established account linked during onboarding", async () => {
  state.status = "active";
  await expect(discardOnboardingSetup("device-1", "secret")).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(transactionDelete).not.toHaveBeenCalled();
});

it("refuses to discard after onboarding is complete", async () => {
  state.onboarded = true;
  await expect(discardOnboardingSetup("device-1", "secret")).rejects.toMatchObject({
    code: "failed-precondition",
  });
});
