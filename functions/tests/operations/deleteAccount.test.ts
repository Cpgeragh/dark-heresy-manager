import { beforeEach, expect, it, vi } from "vitest";
import { deleteAccount } from "../../src/operations/deleteAccount";

const state = vi.hoisted(() => ({ owned: false }));
const update = vi.hoisted(() => vi.fn());
const set = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());
const deleteUsers = vi.hoisted(() => vi.fn());
const ownedQuery = { kind: "owned" };
const characterQuery = { kind: "characters" };
const linkQuery = { kind: "links" };
const secretRef = { path: "identitySecret/account-1" };
const linkRef = { path: "userLinks/device-1", id: "device-1" };
const makeRef = (path: string) => ({ path, id: path.split("/").at(-1) });
const collection = vi.hoisted(() =>
  vi.fn((name: string) => {
    if (name === "campaigns") return { where: () => ({ limit: () => ownedQuery }) };
    if (name === "userLinks") return { where: () => linkQuery };
    if (name === "identitySecret") return { doc: () => secretRef };
    return { doc: (id: string) => makeRef(`${name}/${id}`) };
  })
);
const runTransaction = vi.hoisted(() =>
  vi.fn(async (callback: (tx: unknown) => unknown) =>
    callback({
      get: async (reference: unknown) => {
        if (reference === ownedQuery)
          return { empty: !state.owned, size: state.owned ? 1 : 0, docs: state.owned ? [{}] : [] };
        if (reference === characterQuery) return { empty: true, size: 0, docs: [] };
        if (reference === linkQuery) return { empty: false, size: 1, docs: [{ ref: linkRef }] };
        if (reference === secretRef)
          return { exists: true, data: () => ({ code: "DH-AAAA-BBBB" }) };
        return { exists: false, data: () => ({}) };
      },
      update,
      set,
      delete: remove,
    })
  )
);

vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: vi.fn(async () => "account-1"),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection,
    collectionGroup: () => ({ where: () => characterQuery }),
    runTransaction,
  }),
  FieldValue: { arrayRemove: (value: unknown) => ({ remove: value }) },
}));
vi.mock("firebase-admin/auth", () => ({ getAuth: () => ({ deleteUsers }) }));

beforeEach(() => {
  vi.clearAllMocks();
  state.owned = false;
  deleteUsers.mockResolvedValue({ successCount: 1, failureCount: 0, errors: [] });
});

it("blocks deletion while the account owns a campaign", async () => {
  state.owned = true;
  await expect(deleteAccount("device-1", "secret")).rejects.toMatchObject({
    code: "failed-precondition",
  });
});

it("deletes account-owned identity records and disconnects every device", async () => {
  await expect(deleteAccount("device-1", "secret")).resolves.toEqual({
    releasedCharacters: 0,
    removedLinkedDevices: 1,
  });
  expect(remove).toHaveBeenCalledWith(secretRef);
  expect(remove).toHaveBeenCalledWith(linkRef);
  expect(set).toHaveBeenCalledWith(
    expect.objectContaining({ path: "users/device-1" }),
    { onboarded: false, recoveryBackedUp: false },
    { merge: true }
  );
  expect(deleteUsers).toHaveBeenCalledWith(["device-1"]);
});
