// functions/tests/shared/chatClosure.test.ts
import { describe, it, expect, vi } from "vitest";
import { closeChatCopiesPage, closeChats, findChatsToClose } from "../../src/shared/chatClosure";

const CHAT_ID = "c1__char-1__player-1";
const DM_COPY = `users/dm-1/chats/${CHAT_ID}`;
const PLAYER_COPY = `users/player-1/chats/${CHAT_ID}`;

function makeDb() {
  return {
    collection: (name: string) => ({
      doc: (accountId: string) => ({
        collection: (sub: string) => ({
          doc: (chatId: string) => ({ path: `${name}/${accountId}/${sub}/${chatId}` }),
        }),
      }),
    }),
  };
}

function makeTransaction(existing: string[]) {
  return {
    get: vi.fn(async (ref: { path: string }) => ({ exists: existing.includes(ref.path) })),
    update: vi.fn(),
  };
}

function find(
  transaction: ReturnType<typeof makeTransaction>,
  dmAccountId: unknown,
  previousPlayerAccountId: string | null
) {
  return findChatsToClose(
    transaction as never,
    makeDb() as never,
    "c1",
    "char-1",
    dmAccountId,
    previousPlayerAccountId
  );
}

describe("findChatsToClose", () => {
  it("reads nothing when there is no previous player", async () => {
    const transaction = makeTransaction([DM_COPY, PLAYER_COPY]);

    await expect(find(transaction, "dm-1", null)).resolves.toEqual([]);
    expect(transaction.get).not.toHaveBeenCalled();
  });

  it("reads nothing when the campaign has no usable DM id", async () => {
    const transaction = makeTransaction([DM_COPY, PLAYER_COPY]);

    await expect(find(transaction, undefined, "player-1")).resolves.toEqual([]);
    await expect(find(transaction, "", "player-1")).resolves.toEqual([]);
    expect(transaction.get).not.toHaveBeenCalled();
  });

  it("returns both copies of the chat when both exist", async () => {
    const transaction = makeTransaction([DM_COPY, PLAYER_COPY]);

    const refs = await find(transaction, "dm-1", "player-1");

    expect(refs.map((ref) => (ref as unknown as { path: string }).path)).toEqual([
      DM_COPY,
      PLAYER_COPY,
    ]);
    expect(transaction.get).toHaveBeenCalledTimes(2);
  });

  it("returns only the copies that exist", async () => {
    const transaction = makeTransaction([PLAYER_COPY]);

    const refs = await find(transaction, "dm-1", "player-1");

    expect(refs.map((ref) => (ref as unknown as { path: string }).path)).toEqual([PLAYER_COPY]);
  });

  it("returns nothing when neither copy exists", async () => {
    const transaction = makeTransaction([]);

    await expect(find(transaction, "dm-1", "player-1")).resolves.toEqual([]);
  });
});

describe("closeChats", () => {
  it("marks each given chat closed", () => {
    const transaction = makeTransaction([]);
    const refs = [{ path: DM_COPY }, { path: PLAYER_COPY }];

    closeChats(transaction as never, refs as never);

    expect(transaction.update).toHaveBeenCalledTimes(2);
    expect(transaction.update).toHaveBeenCalledWith(refs[0], { closed: true });
    expect(transaction.update).toHaveBeenCalledWith(refs[1], { closed: true });
  });

  it("does nothing for an empty list", () => {
    const transaction = makeTransaction([]);

    closeChats(transaction as never, []);

    expect(transaction.update).not.toHaveBeenCalled();
  });
});

type Entry = { path: string; campaignId: string; characterId: string; closed: boolean };

function makeScopeDb(entries: Entry[], gone: Set<string> = new Set()) {
  const update = vi.fn();
  const transaction = {
    getAll: async (...refs: { path: string }[]) =>
      refs.map((ref) => {
        const entry = gone.has(ref.path) ? undefined : entries.find((e) => e.path === ref.path);
        return {
          exists: Boolean(entry),
          ref,
          get: (field: string) => (entry as Record<string, unknown> | undefined)?.[field],
        };
      }),
    update,
  };
  const query = (filters: Record<string, string>, after: string | null, max: number | null) => ({
    where: (field: string, _op: string, value: string) =>
      query({ ...filters, [field]: value }, after, max),
    orderBy: () => query(filters, after, max),
    limit: (count: number) => query(filters, after, count),
    startAfter: (ref: { path: string }) => query(filters, ref.path, max),
    get: async () => {
      const docs = entries
        .filter((e) =>
          Object.entries(filters).every(([k, v]) => (e as Record<string, unknown>)[k] === v)
        )
        .sort((a, b) => a.path.localeCompare(b.path))
        .filter((e) => after === null || e.path > after)
        .slice(0, max ?? undefined)
        .map((e) => ({ ref: { path: e.path } }));
      return { empty: docs.length === 0, size: docs.length, docs };
    },
  });
  const runTransaction = vi.fn(async (fn: (t: typeof transaction) => unknown) => fn(transaction));
  const db = {
    collectionGroup: (name: string) => {
      expect(name).toBe("chats");
      return query({}, null, null);
    },
    doc: (path: string) => ({ path }),
    runTransaction,
  };
  return { db, update, runTransaction };
}

const copy = (account: string, campaignId: string, characterId: string, closed = false): Entry => ({
  path: `users/${account}/chats/${campaignId}__${characterId}__p1`,
  campaignId,
  characterId,
  closed,
});

describe("closeChatCopiesPage", () => {
  const entries = [
    copy("dm-1", "c1", "char-1"),
    copy("player-1", "c1", "char-1"),
    copy("dm-1", "c1", "char-2"),
    copy("dm-1", "c2", "char-1"),
  ];

  it("closes every copy of one character's chats and nothing else", async () => {
    const { db, update } = makeScopeDb(entries);

    const result = await closeChatCopiesPage(
      db as never,
      { campaignId: "c1", characterId: "char-1" },
      null,
      400
    );

    expect(result).toEqual({ closed: 2, nextCursor: null });
    expect(update.mock.calls.map(([ref]) => ref.path).sort()).toEqual(
      [entries[0].path, entries[1].path].sort()
    );
    expect(update).toHaveBeenCalledWith(expect.anything(), { closed: true });
  });

  it("closes every copy in a campaign when no character is given", async () => {
    const { db, update } = makeScopeDb(entries);

    const result = await closeChatCopiesPage(db as never, { campaignId: "c1" }, null, 400);

    expect(result.closed).toBe(3);
    expect(update).toHaveBeenCalledTimes(3);
  });

  it("pages with a cursor and reports the last page with a null cursor", async () => {
    const { db } = makeScopeDb(entries);
    const scope = { campaignId: "c1" };

    const first = await closeChatCopiesPage(db as never, scope, null, 2);
    expect(first.nextCursor).not.toBeNull();
    const second = await closeChatCopiesPage(db as never, scope, first.nextCursor, 2);

    expect(second.nextCursor).toBeNull();
    expect(first.closed + second.closed).toBe(3);
  });

  it("does not write to a copy that is already closed", async () => {
    const { db, update } = makeScopeDb([copy("dm-1", "c1", "char-1", true)]);

    const result = await closeChatCopiesPage(db as never, { campaignId: "c1" }, null, 400);

    expect(result.closed).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });

  it("skips a copy that was deleted after the query, so it is not recreated", async () => {
    const { db, update } = makeScopeDb(entries, new Set([entries[0].path]));

    const result = await closeChatCopiesPage(
      db as never,
      { campaignId: "c1", characterId: "char-1" },
      null,
      400
    );

    expect(result.closed).toBe(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("opens no transaction when there is nothing to close", async () => {
    const { db, runTransaction } = makeScopeDb([]);

    const result = await closeChatCopiesPage(db as never, { campaignId: "c1" }, null, 400);

    expect(result).toEqual({ closed: 0, nextCursor: null });
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
