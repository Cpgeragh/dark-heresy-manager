import { expect, it, vi } from "vitest";
import type { DocumentSnapshot, Firestore, Transaction } from "firebase-admin/firestore";
import { readDeviceCount, writeDeviceCount } from "../../src/shared/deviceCount";

it("counts legacy links in the transaction before storing the first count", async () => {
  const query = { kind: "legacy-links" };
  const where = vi.fn(() => query);
  const accountRef = { path: "accounts/account-1" };
  const get = vi.fn(async () => ({ size: 12 }));
  const set = vi.fn();
  const db = { collection: () => ({ where }) } as unknown as Firestore;
  const transaction = { get, set } as unknown as Transaction;
  const accountSnapshot = {
    exists: true,
    data: () => ({ status: "active" }),
  } as unknown as DocumentSnapshot;

  const count = await readDeviceCount(db, transaction, "account-1", accountSnapshot);
  expect(count).toBe(12);
  expect(where).toHaveBeenCalledWith("primaryUid", "==", "account-1");
  expect(get).toHaveBeenCalledWith(query);
  writeDeviceCount(transaction, accountRef as never, accountSnapshot, count - 1);
  expect(set).toHaveBeenCalledWith(accountRef, { deviceCount: 11 }, { merge: true });
});
