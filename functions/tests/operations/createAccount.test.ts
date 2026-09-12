import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAccount } from "../../src/operations/createAccount";

const state = vi.hoisted(() => ({ linked: false, provisional: false, code: "DH-OLD0-CODE" }));
const transactionCreate = vi.hoisted(() => vi.fn());
const refs = vi.hoisted(() => new Map<string, { path: string; id: string }>());
const ref = (path: string, id: string) => {
  const value = { path, id };
  refs.set(path, value);
  return value;
};
const collection = vi.hoisted(() =>
  vi.fn((name: string) => ({
    doc: (id?: string) => ref(`${name}/${id ?? "new-account-id"}`, id ?? "new-account-id"),
  }))
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: async (reference: { path: string }) => {
        if (reference.path === "userLinks/device-1")
          return { exists: state.linked, data: () => ({ primaryUid: "existing" }) };
        if (reference.path === "users/device-1")
          return { exists: true, data: () => ({ onboarded: false }) };
        if (reference.path === "accounts/existing")
          return {
            exists: state.provisional,
            data: () => ({ status: "provisional", createdByDeviceUid: "device-1" }),
          };
        if (reference.path === "identitySecret/existing")
          return { exists: true, data: () => ({ code: state.code }) };
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
  state.linked = false;
  state.provisional = false;
});

describe("createAccount", () => {
  it("atomically creates a provisional account, first device link, and recovery code", async () => {
    const result = await createAccount("device-1", "secret");
    expect(result.accountId).toBe("new-account-id");
    expect(result.code).toMatch(/^DH-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(transactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ path: "accounts/new-account-id" }),
      expect.objectContaining({ status: "provisional", createdByDeviceUid: "device-1" })
    );
    expect(transactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ path: "userLinks/device-1" }),
      expect.objectContaining({ primaryUid: "new-account-id" })
    );
  });

  it("returns the same provisional account when account creation is retried", async () => {
    state.linked = true;
    state.provisional = true;
    await expect(createAccount("device-1", "secret")).resolves.toEqual({
      accountId: "existing",
      code: "DH-OLD0-CODE",
    });
    expect(transactionCreate).not.toHaveBeenCalled();
  });

  it("does not overwrite an established account link", async () => {
    state.linked = true;
    await expect(createAccount("device-1", "secret")).rejects.toMatchObject({
      code: "failed-precondition",
    });
  });
});
