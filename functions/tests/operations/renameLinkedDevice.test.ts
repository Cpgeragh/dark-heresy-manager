import { beforeEach, expect, it, vi } from "vitest";
import { renameLinkedDevice } from "../../src/operations/renameLinkedDevice";

const update = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (transaction: unknown) => unknown) => callback({ get, update }))
);
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({ doc: (id: string) => ({ path: `${name}/${id}` }) }))
);

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection, runTransaction }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ exists: true, data: () => ({ primaryUid: "account-1" }) });
});

it("renames another device on the same account", async () => {
  await renameLinkedDevice({ targetDeviceUid: "device-2", name: "  Old laptop  " }, "device-1");
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ path: "userLinks/device-2" }), {
    name: "Old laptop",
  });
});

it("rejects a device belonging to another account", async () => {
  get
    .mockResolvedValueOnce({ exists: true, data: () => ({ primaryUid: "account-1" }) })
    .mockResolvedValueOnce({ exists: true, data: () => ({ primaryUid: "account-2" }) });
  await expect(
    renameLinkedDevice({ targetDeviceUid: "device-2", name: "Laptop" }, "device-1")
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(update).not.toHaveBeenCalled();
});
