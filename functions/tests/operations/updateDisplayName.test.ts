import { beforeEach, expect, it, vi } from "vitest";
import { updateDisplayName } from "../../src/operations/updateDisplayName";

const set = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
const queryRef = { path: "campaigns-query" };
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (transaction: unknown) => unknown) => callback({ get, set, update }))
);
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({
    doc: (id: string) => ({ path: `${name}/${id}` }),
    where: () => ({ limit: () => queryRef }),
  }))
);
const resolvePrimaryUid = vi.hoisted(() => vi.fn().mockResolvedValue("account-1"));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
}));
vi.mock("../../src/shared/linkedIdentity", () => ({ resolvePrimaryUid }));

beforeEach(() => {
  vi.clearAllMocks();
  resolvePrimaryUid.mockResolvedValue("account-1");
  get.mockResolvedValue({
    size: 2,
    docs: [{ ref: { path: "campaigns/one" } }, { ref: { path: "campaigns/two" } }],
  });
});

it("updates the profile and every campaign copy in one transaction", async () => {
  await updateDisplayName({ firstName: "  Cain  " }, "device-1");

  expect(resolvePrimaryUid).toHaveBeenCalledWith(expect.anything(), "device-1");
  expect(set).toHaveBeenCalledWith(expect.objectContaining({ path: "userProfiles/account-1" }), {
    firstName: "Cain",
  });
  expect(update).toHaveBeenNthCalledWith(1, expect.objectContaining({ path: "campaigns/one" }), {
    gmName: "Cain",
  });
  expect(update).toHaveBeenNthCalledWith(2, expect.objectContaining({ path: "campaigns/two" }), {
    gmName: "Cain",
  });
});

it("rejects invalid names before opening a transaction", async () => {
  await expect(updateDisplayName({ firstName: "   " }, "device-1")).rejects.toMatchObject({
    code: "invalid-argument",
  });
  expect(runTransaction).not.toHaveBeenCalled();
});

it("rejects an invalid over-limit account without writing a partial update", async () => {
  get.mockResolvedValue({
    size: 101,
    docs: Array.from({ length: 101 }, (_, index) => ({
      ref: { path: `campaigns/${index}` },
    })),
  });

  await expect(updateDisplayName({ firstName: "Cain" }, "device-1")).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(set).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

it("propagates transaction failures without reporting success", async () => {
  const error = new Error("transaction failed");
  runTransaction.mockRejectedValueOnce(error);

  await expect(updateDisplayName({ firstName: "Cain" }, "device-1")).rejects.toBe(error);
});
