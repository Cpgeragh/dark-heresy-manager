import { describe, expect, it, vi } from "vitest";
import type { DocumentSnapshot, Firestore, Transaction } from "firebase-admin/firestore";
import { persistRecountOnRejection, readDeviceCount, writeDeviceCount } from "../../src/shared/deviceCount";

describe("readDeviceCount", () => {
  it("returns the stored count without recounting when one already exists", async () => {
    const get = vi.fn();
    const db = {} as unknown as Firestore;
    const transaction = { get } as unknown as Transaction;
    const accountSnapshot = {
      exists: true,
      data: () => ({ status: "active", deviceCount: 4 }),
    } as unknown as DocumentSnapshot;

    const result = await readDeviceCount(db, transaction, "account-1", accountSnapshot);
    expect(result).toEqual({ count: 4, wasRecounted: false });
    expect(get).not.toHaveBeenCalled();
  });

  it("counts legacy links in the transaction before a stored count exists", async () => {
    const query = { kind: "legacy-links" };
    const where = vi.fn(() => query);
    const get = vi.fn(async () => ({ size: 12 }));
    const db = { collection: () => ({ where }) } as unknown as Firestore;
    const transaction = { get } as unknown as Transaction;
    const accountSnapshot = {
      exists: true,
      data: () => ({ status: "active" }),
    } as unknown as DocumentSnapshot;

    const result = await readDeviceCount(db, transaction, "account-1", accountSnapshot);
    expect(result).toEqual({ count: 12, wasRecounted: true });
    expect(where).toHaveBeenCalledWith("primaryUid", "==", "account-1");
    expect(get).toHaveBeenCalledWith(query);
  });
});

describe("writeDeviceCount", () => {
  it("writes only the count, with no other fields", () => {
    const set = vi.fn();
    const accountRef = { path: "accounts/account-1" };
    const transaction = { set } as unknown as Transaction;

    writeDeviceCount(transaction, accountRef as never, 11);
    expect(set).toHaveBeenCalledWith(accountRef, { deviceCount: 11 }, { merge: true });
  });
});

describe("persistRecountOnRejection", () => {
  it("saves the recounted value as its own independent write", async () => {
    const set = vi.fn(async () => undefined);
    const doc = vi.fn(() => ({ set }));
    const db = { collection: () => ({ doc }) } as unknown as Firestore;

    persistRecountOnRejection(db, "account-1", 15);
    await Promise.resolve();

    expect(doc).toHaveBeenCalledWith("account-1");
    expect(set).toHaveBeenCalledWith({ deviceCount: 15 }, { merge: true });
  });

  it("swallows a failed write rather than throwing", async () => {
    const set = vi.fn(async () => {
      throw new Error("write failed");
    });
    const doc = vi.fn(() => ({ set }));
    const db = { collection: () => ({ doc }) } as unknown as Firestore;

    expect(() => persistRecountOnRejection(db, "account-1", 15)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });
});
