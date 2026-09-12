import { beforeEach, expect, it, vi } from "vitest";
import { listLinkedDevices } from "../../src/operations/listLinkedDevices";

const getCaller = vi.hoisted(() => vi.fn());
const getLinks = vi.hoisted(() => vi.fn());
const doc = vi.hoisted(() => vi.fn(() => ({ get: getCaller })));
const where = vi.hoisted(() => vi.fn(() => ({ get: getLinks })));
const collection = vi.hoisted(() => vi.fn(() => ({ doc, where })));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({ collection }),
  Timestamp: class Timestamp {},
}));

beforeEach(() => {
  vi.clearAllMocks();
  getCaller.mockResolvedValue({
    exists: true,
    data: () => ({ primaryUid: "account-1" }),
  });
  getLinks.mockResolvedValue({
    docs: [
      { id: "other-device", data: () => ({ name: "Old laptop" }) },
      { id: "current-device", data: () => ({ name: "Phone" }) },
    ],
  });
});

it("returns every linked device and marks the caller", async () => {
  await expect(listLinkedDevices("current-device")).resolves.toEqual({
    devices: [
      { uid: "current-device", name: "Phone", linkedAt: null, isCurrentDevice: true },
      { uid: "other-device", name: "Old laptop", linkedAt: null, isCurrentDevice: false },
    ],
  });
  expect(where).toHaveBeenCalledWith("primaryUid", "==", "account-1");
});

it("rejects a caller without an account link", async () => {
  getCaller.mockResolvedValue({ exists: false, data: () => ({}) });
  await expect(listLinkedDevices("current-device")).rejects.toMatchObject({
    code: "failed-precondition",
  });
});
