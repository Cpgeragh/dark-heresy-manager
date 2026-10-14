import { beforeEach, expect, it, vi } from "vitest";
import { deleteAccount } from "../../src/operations/deleteAccount";

const state = vi.hoisted(() => ({
  owned: false,
  chats: [] as { id: string; other?: string }[],
  copies: new Set<string>(),
  events: [] as string[],
}));
const purgeAccountChats = vi.hoisted(() => vi.fn());
const logError = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const set = vi.hoisted(() => vi.fn());
const remove = vi.hoisted(() => vi.fn());
const deleteUsers = vi.hoisted(() => vi.fn());
const ownedQuery = { kind: "owned" };
const characterQuery = { kind: "characters" };
const linkQuery = { kind: "links" };
const chatsQuery = { kind: "chats" };
const secretRef = { path: "identitySecret/account-1" };
const linkRef = { path: "userLinks/device-1", id: "device-1" };
const makeRef = (path: string): Record<string, unknown> => ({
  path,
  id: path.split("/").at(-1),
  collection: (sub: string) => ({
    limit: () => chatsQuery,
    doc: (id: string) => makeRef(`${path}/${sub}/${id}`),
  }),
});
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
        state.events.push("read");
        if (reference === chatsQuery)
          return {
            size: state.chats.length,
            docs: state.chats.map((chat) => ({
              id: chat.id,
              ref: makeRef(`users/account-1/chats/${chat.id}`),
              get: (field: string) => (field === "otherAccountId" ? chat.other : undefined),
            })),
          };
        if (reference === ownedQuery)
          return { empty: !state.owned, size: state.owned ? 1 : 0, docs: state.owned ? [{}] : [] };
        if (reference === characterQuery) return { empty: true, size: 0, docs: [] };
        if (reference === linkQuery) return { empty: false, size: 1, docs: [{ ref: linkRef }] };
        if (reference === secretRef)
          return { exists: true, data: () => ({ code: "DH-AAAA-BBBB" }) };
        return { exists: false, data: () => ({}) };
      },
      getAll: async (...refs: { path: string }[]) => {
        state.events.push("read");
        return refs.map((ref) => ({ exists: state.copies.has(ref.path), ref }));
      },
      update: (...args: unknown[]) => {
        state.events.push("write");
        return update(...args);
      },
      set: (...args: unknown[]) => {
        state.events.push("write");
        return set(...args);
      },
      delete: (...args: unknown[]) => {
        state.events.push("write");
        return remove(...args);
      },
    })
  )
);

vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: vi.fn(async () => "account-1"),
}));
vi.mock("../../src/operations/purgeBinnedChats", () => ({ purgeAccountChats }));
vi.mock("firebase-functions/v2", () => ({ logger: { error: logError } }));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection,
    collectionGroup: () => ({ where: () => characterQuery }),
    runTransaction,
  }),
  FieldValue: {
    arrayRemove: (value: unknown) => ({ remove: value }),
    serverTimestamp: () => "SERVER_TIMESTAMP",
  },
}));
vi.mock("firebase-admin/auth", () => ({ getAuth: () => ({ deleteUsers }) }));

beforeEach(() => {
  vi.clearAllMocks();
  state.owned = false;
  state.chats = [];
  state.copies = new Set();
  state.events = [];
  purgeAccountChats.mockResolvedValue({ deleted: 0, left: 0 });
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

it("moves the account's own chats to the bin and closes the other person's copy", async () => {
  state.chats = [
    { id: "chat-1", other: "dm-1" },
    { id: "chat-2", other: "dm-2" },
  ];
  state.copies = new Set(["users/dm-1/chats/chat-1"]);

  await deleteAccount("device-1", "secret");

  for (const id of ["chat-1", "chat-2"]) {
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ path: `users/account-1/chats/${id}` }),
      { clearedAt: "SERVER_TIMESTAMP", unreadCount: 0 }
    );
  }
  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({ path: "users/dm-1/chats/chat-1" }),
    { closed: true }
  );
  expect(update).not.toHaveBeenCalledWith(
    expect.objectContaining({ path: "users/dm-2/chats/chat-2" }),
    expect.anything()
  );
});

it("reads every chat document before the first write", async () => {
  state.chats = [{ id: "chat-1", other: "dm-1" }];
  state.copies = new Set(["users/dm-1/chats/chat-1"]);

  await deleteAccount("device-1", "secret");

  expect(state.events.lastIndexOf("read")).toBeLessThan(state.events.indexOf("write"));
});

it("cleans up the account's chats straight away, and only when it has some", async () => {
  await deleteAccount("device-1", "secret");
  expect(purgeAccountChats).not.toHaveBeenCalled();

  state.chats = [{ id: "chat-1", other: "dm-1" }];
  await deleteAccount("device-1", "secret");

  expect(purgeAccountChats).toHaveBeenCalledOnce();
  const refs = purgeAccountChats.mock.calls[0][1] as { path: string }[];
  expect(refs.map((ref) => ref.path)).toEqual(["users/account-1/chats/chat-1"]);
});

it("still deletes the account when the chat cleanup fails", async () => {
  state.chats = [{ id: "chat-1", other: "dm-1" }];
  purgeAccountChats.mockRejectedValue(Object.assign(new Error("boom"), { code: "unavailable" }));

  await expect(deleteAccount("device-1", "secret")).resolves.toMatchObject({
    removedLinkedDevices: 1,
  });

  expect(logError).toHaveBeenCalledWith(expect.any(String), { code: "unavailable" });
  expect(deleteUsers).toHaveBeenCalledWith(["device-1"]);
});

it("refuses an account with too many chats and writes nothing", async () => {
  state.chats = Array.from({ length: 221 }, (_, index) => ({ id: `chat-${index}`, other: "dm-1" }));

  await expect(deleteAccount("device-1", "secret")).rejects.toMatchObject({
    code: "resource-exhausted",
  });

  expect(state.events).not.toContain("write");
  expect(deleteUsers).not.toHaveBeenCalled();
});
