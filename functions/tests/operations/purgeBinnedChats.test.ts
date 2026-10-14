// functions/tests/operations/purgeBinnedChats.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { purgeAccountChats, purgeBinnedChats } from "../../src/operations/purgeBinnedChats";

const { FakeTimestamp, DELETE_FIELD } = vi.hoisted(() => {
  class FakeTimestamp {
    ms: number;
    constructor(ms: number) {
      this.ms = ms;
    }
    static fromMillis(ms: number) {
      return new FakeTimestamp(ms);
    }
    toMillis() {
      return this.ms;
    }
    isEqual(other: unknown) {
      return other instanceof FakeTimestamp && other.ms === this.ms;
    }
  }
  return { FakeTimestamp, DELETE_FIELD: Symbol("delete-field") };
});

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: FakeTimestamp,
  FieldValue: { delete: () => DELETE_FIELD },
}));

type Doc = Record<string, unknown>;
type FakeStamp = InstanceType<typeof FakeTimestamp>;

interface Snapshot {
  exists: boolean;
  id: string;
  ref: Ref;
  get: (field: string) => unknown;
}
interface Ref {
  path: string;
  id: string;
  get: () => Promise<Snapshot>;
  collection: (name: string) => Query;
}
interface QueryResult {
  docs: Snapshot[];
  size: number;
  empty: boolean;
}
interface Query {
  where: (field: string, op: "<=", value: FakeStamp) => Query;
  orderBy: (field: string) => Query;
  limit: (count: number) => Query;
  get: () => Promise<QueryResult>;
}
interface QuerySpec {
  scope: "collection" | "group";
  path: string;
  filters: { field: string; value: FakeStamp }[];
  orderField: string | null;
  limitCount: number | null;
}

const documents = new Map<string, Doc>();
const hooks: { afterGroupQuery?: () => void } = {};

function makeSnapshot(path: string): Snapshot {
  const data = documents.get(path);
  return {
    exists: data !== undefined,
    id: path.split("/").pop() as string,
    ref: makeRef(path),
    get: (field) => data?.[field],
  };
}

function makeRef(path: string): Ref {
  return {
    path,
    id: path.split("/").pop() as string,
    get: async () => makeSnapshot(path),
    collection: (name) =>
      makeQuery({
        scope: "collection",
        path: `${path}/${name}`,
        filters: [],
        orderField: null,
        limitCount: null,
      }),
  };
}

function millisOf(path: string, field: string): number {
  return (documents.get(path)?.[field] as FakeStamp).toMillis();
}

function runQuery(spec: QuerySpec): QueryResult {
  let paths = [...documents.keys()].filter((path) =>
    spec.scope === "collection"
      ? path.startsWith(`${spec.path}/`) && !path.slice(spec.path.length + 1).includes("/")
      : path.split("/").at(-2) === spec.path
  );
  paths = paths.filter((path) =>
    spec.filters.every((filter) => {
      const value = documents.get(path)?.[filter.field];
      return value instanceof FakeTimestamp && value.toMillis() <= filter.value.toMillis();
    })
  );
  const orderField = spec.orderField;
  if (orderField) paths.sort((a, b) => millisOf(a, orderField) - millisOf(b, orderField));
  if (spec.limitCount !== null) paths = paths.slice(0, spec.limitCount);
  const docs = paths.map(makeSnapshot);
  if (spec.scope === "group") hooks.afterGroupQuery?.();
  return { docs, size: docs.length, empty: docs.length === 0 };
}

function makeQuery(spec: QuerySpec): Query {
  return {
    where: (field, _op, value) =>
      makeQuery({ ...spec, filters: [...spec.filters, { field, value }] }),
    orderBy: (field) => makeQuery({ ...spec, orderField: field }),
    limit: (count) => makeQuery({ ...spec, limitCount: count }),
    get: async () => runQuery(spec),
  };
}

function applyUpdate(path: string, data: Doc) {
  const next = { ...documents.get(path) };
  for (const [key, value] of Object.entries(data)) {
    if (value === DELETE_FIELD) delete next[key];
    else next[key] = value;
  }
  documents.set(path, next);
}

const mockDb = {
  collectionGroup: (name: string) =>
    makeQuery({ scope: "group", path: name, filters: [], orderField: null, limitCount: null }),
  runTransaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
    callback({
      get: async (target: Ref | Query) => ("path" in target ? target.get() : target.get()),
      delete: (ref: Ref) => {
        documents.delete(ref.path);
      },
      update: (ref: Ref, data: Doc) => applyUpdate(ref.path, data),
    })
  ),
};

const db = mockDb as unknown as Parameters<typeof purgeBinnedChats>[0];

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(Date.UTC(2026, 9, 20, 12, 0));
const at = (daysAgo: number) => FakeTimestamp.fromMillis(NOW.getTime() - daysAgo * DAY);

function chatPath(accountId: string, chatId: string) {
  return `users/${accountId}/chats/${chatId}`;
}

function seedChat(accountId: string, chatId: string, clearedDaysAgo: number | null) {
  documents.set(chatPath(accountId, chatId), {
    characterName: "Kael",
    unreadCount: 0,
    ...(clearedDaysAgo === null ? {} : { clearedAt: at(clearedDaysAgo) }),
  });
}

function seedMessage(accountId: string, chatId: string, id: string, daysAgo: number) {
  documents.set(`${chatPath(accountId, chatId)}/messages/${id}`, {
    text: id,
    timestamp: at(daysAgo),
  });
}

const has = (path: string) => documents.has(path);

beforeEach(() => {
  vi.clearAllMocks();
  documents.clear();
  hooks.afterGroupQuery = undefined;
});

describe("purgeBinnedChats", () => {
  it("does nothing when nothing is due", async () => {
    seedChat("acc-1", "chat-1", 3);
    seedChat("acc-1", "chat-2", null);

    await expect(purgeBinnedChats(db, NOW)).resolves.toEqual({
      chatsProcessed: 0,
      messagesDeleted: 0,
      entriesDeleted: 0,
      entriesReset: 0,
      chatsSkipped: 0,
      moreToDo: false,
    });
  });

  it("deletes the old messages and the entry of a chat deleted more than 7 days ago", async () => {
    seedChat("acc-1", "chat-1", 8);
    seedMessage("acc-1", "chat-1", "m1", 10);
    seedMessage("acc-1", "chat-1", "m2", 9);
    seedMessage("acc-1", "chat-1", "m3", 8.5);

    const result = await purgeBinnedChats(db, NOW);

    expect(result).toMatchObject({ chatsProcessed: 1, messagesDeleted: 3, entriesDeleted: 1 });
    expect(has(chatPath("acc-1", "chat-1"))).toBe(false);
    expect(has(`${chatPath("acc-1", "chat-1")}/messages/m1`)).toBe(false);
    expect(has(`${chatPath("acc-1", "chat-1")}/messages/m3`)).toBe(false);
  });

  it("treats a chat deleted exactly 7 days ago as due", async () => {
    seedChat("acc-1", "chat-1", 7);
    seedMessage("acc-1", "chat-1", "m1", 8);

    const result = await purgeBinnedChats(db, NOW);

    expect(result.entriesDeleted).toBe(1);
  });

  it("keeps a chat that has newer messages and removes its bin mark", async () => {
    seedChat("acc-1", "chat-1", 8);
    seedMessage("acc-1", "chat-1", "old", 9);
    seedMessage("acc-1", "chat-1", "new", 2);

    const result = await purgeBinnedChats(db, NOW);

    expect(result).toMatchObject({ messagesDeleted: 1, entriesDeleted: 0, entriesReset: 1 });
    expect(has(`${chatPath("acc-1", "chat-1")}/messages/old`)).toBe(false);
    expect(has(`${chatPath("acc-1", "chat-1")}/messages/new`)).toBe(true);
    const entry = documents.get(chatPath("acc-1", "chat-1")) as Doc;
    expect("clearedAt" in entry).toBe(false);
  });

  it("leaves chats deleted less than 7 days ago and chats never deleted untouched", async () => {
    seedChat("acc-1", "recent", 3);
    seedMessage("acc-1", "recent", "m1", 4);
    seedChat("acc-1", "never", null);
    seedMessage("acc-1", "never", "m1", 30);

    await purgeBinnedChats(db, NOW);

    expect(has(chatPath("acc-1", "recent"))).toBe(true);
    expect(has(`${chatPath("acc-1", "recent")}/messages/m1`)).toBe(true);
    expect(has(chatPath("acc-1", "never"))).toBe(true);
    expect(has(`${chatPath("acc-1", "never")}/messages/m1`)).toBe(true);
  });

  it("purges one person's copy without touching the other person's copy", async () => {
    seedChat("dm-1", "chat-1", 8);
    seedMessage("dm-1", "chat-1", "m1", 9);
    seedChat("player-1", "chat-1", null);
    seedMessage("player-1", "chat-1", "m1", 9);

    await purgeBinnedChats(db, NOW);

    expect(has(chatPath("dm-1", "chat-1"))).toBe(false);
    expect(has(chatPath("player-1", "chat-1"))).toBe(true);
    expect(has(`${chatPath("player-1", "chat-1")}/messages/m1`)).toBe(true);
  });

  it("works through many messages one page at a time", async () => {
    seedChat("acc-1", "chat-1", 8);
    for (let index = 1; index <= 5; index += 1) {
      seedMessage("acc-1", "chat-1", `m${index}`, 9 + index);
    }

    const result = await purgeBinnedChats(db, NOW, { pageSize: 2 });

    expect(result).toMatchObject({ messagesDeleted: 5, entriesDeleted: 1 });
    expect(mockDb.runTransaction.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it("skips a chat that was restored while the job was running", async () => {
    seedChat("acc-1", "chat-1", 8);
    seedMessage("acc-1", "chat-1", "m1", 9);
    hooks.afterGroupQuery = () =>
      applyUpdate(chatPath("acc-1", "chat-1"), { clearedAt: DELETE_FIELD });

    const result = await purgeBinnedChats(db, NOW);

    expect(result).toMatchObject({ chatsProcessed: 1, chatsSkipped: 1, messagesDeleted: 0 });
    expect(has(chatPath("acc-1", "chat-1"))).toBe(true);
    expect(has(`${chatPath("acc-1", "chat-1")}/messages/m1`)).toBe(true);
  });

  it("stops at the message budget and finishes on later runs", async () => {
    seedChat("acc-1", "chat-1", 8);
    for (let index = 1; index <= 5; index += 1) {
      seedMessage("acc-1", "chat-1", `m${index}`, 9 + index);
    }

    const first = await purgeBinnedChats(db, NOW, { messagesPerRun: 2, pageSize: 2 });
    expect(first).toMatchObject({ messagesDeleted: 2, entriesDeleted: 0, moreToDo: true });
    expect(has(chatPath("acc-1", "chat-1"))).toBe(true);

    let runs = 0;
    let latest = first;
    while (latest.moreToDo && runs < 5) {
      latest = await purgeBinnedChats(db, NOW, { messagesPerRun: 2, pageSize: 2 });
      runs += 1;
    }
    expect(latest.moreToDo).toBe(false);
    expect(has(chatPath("acc-1", "chat-1"))).toBe(false);
    expect([...documents.keys()].some((path) => path.includes("/messages/"))).toBe(false);
  });

  it("handles the oldest deletions first and reports more to do at the chat limit", async () => {
    seedChat("acc-1", "later", 8);
    seedChat("acc-1", "earlier", 10);

    const result = await purgeBinnedChats(db, NOW, { chatsPerRun: 1 });

    expect(result).toMatchObject({ chatsProcessed: 1, entriesDeleted: 1, moreToDo: true });
    expect(has(chatPath("acc-1", "earlier"))).toBe(false);
    expect(has(chatPath("acc-1", "later"))).toBe(true);
  });
});

describe("purgeAccountChats", () => {
  const refsFor = (accountId: string, chatIds: string[]) =>
    chatIds.map((chatId) => makeRef(chatPath(accountId, chatId)));

  it("deletes the messages and entry of each given chat", async () => {
    seedChat("acc-1", "chat-1", 0);
    seedMessage("acc-1", "chat-1", "m1", 3);
    seedChat("acc-1", "chat-2", 0);
    seedMessage("acc-1", "chat-2", "m1", 2);

    const result = await purgeAccountChats(db, refsFor("acc-1", ["chat-1", "chat-2"]) as never);

    expect(result).toEqual({ deleted: 2, left: 0 });
    expect([...documents.keys()]).toEqual([]);
  });

  it("does not touch the other person's copy", async () => {
    seedChat("acc-1", "chat-1", 0);
    seedMessage("acc-1", "chat-1", "m1", 3);
    seedChat("dm-1", "chat-1", null);
    seedMessage("dm-1", "chat-1", "m1", 3);

    await purgeAccountChats(db, refsFor("acc-1", ["chat-1"]) as never);

    expect(has(chatPath("dm-1", "chat-1"))).toBe(true);
    expect(has(`${chatPath("dm-1", "chat-1")}/messages/m1`)).toBe(true);
  });

  it("stops at the deadline and leaves the rest for the daily purge", async () => {
    seedChat("acc-1", "chat-1", 0);
    seedChat("acc-1", "chat-2", 0);

    const result = await purgeAccountChats(db, refsFor("acc-1", ["chat-1", "chat-2"]) as never, {
      deadline: Date.now() - 1,
    });

    expect(result).toEqual({ deleted: 0, left: 2 });
    expect(has(chatPath("acc-1", "chat-1"))).toBe(true);
  });

  it("stops at the message budget and leaves the unfinished chat in the bin", async () => {
    seedChat("acc-1", "chat-1", 0);
    for (let index = 1; index <= 5; index += 1) {
      seedMessage("acc-1", "chat-1", `m${index}`, 9 + index);
    }
    seedChat("acc-1", "chat-2", 0);

    const result = await purgeAccountChats(db, refsFor("acc-1", ["chat-1", "chat-2"]) as never, {
      limits: { messagesPerRun: 2, pageSize: 2 },
    });

    expect(result).toEqual({ deleted: 0, left: 2 });
    expect(has(chatPath("acc-1", "chat-1"))).toBe(true);
    expect(has(chatPath("acc-1", "chat-2"))).toBe(true);
  });

  it("leaves a chat that is no longer in the bin", async () => {
    seedChat("acc-1", "chat-1", null);
    seedMessage("acc-1", "chat-1", "m1", 3);

    const result = await purgeAccountChats(db, refsFor("acc-1", ["chat-1"]) as never);

    expect(result).toEqual({ deleted: 0, left: 1 });
    expect(has(`${chatPath("acc-1", "chat-1")}/messages/m1`)).toBe(true);
  });

  it("counts an entry that is already gone as done", async () => {
    const result = await purgeAccountChats(db, refsFor("acc-1", ["missing"]) as never);

    expect(result).toEqual({ deleted: 1, left: 0 });
  });
});
