// functions/tests/operations/exportChat.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportChat } from "../../src/operations/exportChat";

const { mockResolvePrimaryUid } = vi.hoisted(() => ({
  mockResolvePrimaryUid: vi.fn(async (_db: unknown, uid: string): Promise<string> => uid),
}));
vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: mockResolvePrimaryUid,
}));

const { FakeTimestamp } = vi.hoisted(() => {
  class FakeTimestamp {
    ms: number;
    constructor(ms: number) {
      this.ms = ms;
    }
    toMillis() {
      return this.ms;
    }
    toDate() {
      return new Date(this.ms);
    }
  }
  return { FakeTimestamp };
});

type Doc = Record<string, unknown>;
type FakeStamp = InstanceType<typeof FakeTimestamp>;

interface Snapshot {
  exists: boolean;
  id: string;
  ref: { path: string };
  data: () => Doc | undefined;
}
interface QueryResult {
  docs: Snapshot[];
  size: number;
}
interface QuerySpec {
  path: string;
  filters: { field: string; value: FakeStamp }[];
  startAfterPath: string | null;
  limitCount: number | null;
}
interface Query {
  orderBy: (field: unknown) => Query;
  where: (field: string, op: ">", value: FakeStamp) => Query;
  startAfter: (snapshot: Snapshot) => Query;
  limit: (count: number) => Query;
  get: () => Promise<QueryResult>;
  doc: (id: string) => Ref;
}
interface Ref {
  path: string;
  id: string;
  get: () => Promise<Snapshot>;
  set: (data: Doc) => Promise<void>;
  collection: (name: string) => Query;
}

const documents = new Map<string, Doc>();
const writes: { path: string; data: Doc }[] = [];

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => mockDb,
  FieldPath: { documentId: () => "__name__" },
  FieldValue: { serverTimestamp: () => "server-timestamp" },
}));

function makeSnapshot(path: string): Snapshot {
  return {
    exists: documents.has(path),
    id: path.split("/").pop() as string,
    ref: { path },
    data: () => documents.get(path),
  };
}

function millisOf(path: string): number {
  return (documents.get(path)?.timestamp as FakeStamp | undefined)?.toMillis() ?? 0;
}

function listPaths(spec: QuerySpec): string[] {
  let paths = [...documents.keys()].filter(
    (path) => path.startsWith(`${spec.path}/`) && !path.slice(spec.path.length + 1).includes("/")
  );
  paths = paths.filter((path) =>
    spec.filters.every((filter) => {
      const value = documents.get(path)?.[filter.field] as FakeStamp | undefined;
      return value !== undefined && value.toMillis() > filter.value.toMillis();
    })
  );
  paths.sort((a, b) => millisOf(a) - millisOf(b) || a.localeCompare(b));
  if (spec.startAfterPath) paths = paths.slice(paths.indexOf(spec.startAfterPath) + 1);
  if (spec.limitCount !== null) paths = paths.slice(0, spec.limitCount);
  return paths;
}

function makeRef(path: string): Ref {
  return {
    path,
    id: path.split("/").pop() as string,
    get: async () => makeSnapshot(path),
    set: async (data) => {
      documents.set(path, data);
      writes.push({ path, data });
    },
    collection: (name) =>
      makeQuery({ path: `${path}/${name}`, filters: [], startAfterPath: null, limitCount: null }),
  };
}

function makeQuery(spec: QuerySpec): Query {
  return {
    orderBy: () => makeQuery(spec),
    where: (field, _op, value) =>
      makeQuery({ ...spec, filters: [...spec.filters, { field, value }] }),
    startAfter: (snapshot) => makeQuery({ ...spec, startAfterPath: snapshot.ref.path }),
    limit: (count) => makeQuery({ ...spec, limitCount: count }),
    get: async () => {
      const docs = listPaths(spec).map(makeSnapshot);
      return { docs, size: docs.length };
    },
    doc: (id) => makeRef(`${spec.path}/${id}`),
  };
}

const mockDb = {
  collection: (name: string) =>
    makeQuery({ path: name, filters: [], startAfterPath: null, limitCount: null }),
};

const CHAT_ID = "c1__char-1__player-1";
const BASE = Date.UTC(2026, 9, 14, 22, 30);
const at = (minutes: number) => new FakeTimestamp(BASE + minutes * 60_000);

function chatPath(accountId: string) {
  return `users/${accountId}/chats/${CHAT_ID}`;
}

function seedChat(accountId: string, over: Doc = {}) {
  documents.set(chatPath(accountId), {
    role: "dm",
    otherAccountId: "player-1",
    otherName: "Anna",
    characterName: "Brother Kael",
    campaignName: "Calixis",
    ...over,
  });
}

function seedMessage(accountId: string, id: string, minutes: number, from: string, text: string) {
  documents.set(`${chatPath(accountId)}/messages/${id}`, {
    fromAccountId: from,
    text,
    timestamp: at(minutes),
  });
}

const receipts = () => writes.filter((write) => write.path.includes("/exportReceipts/"));

beforeEach(() => {
  vi.clearAllMocks();
  mockResolvePrimaryUid.mockImplementation(async (_db, uid) => uid);
  documents.clear();
  writes.length = 0;
  documents.set("userProfiles/dm-1", { firstName: "Marcus" });
  documents.set("userProfiles/player-1", { firstName: "Anna" });
});

describe("exportChat", () => {
  it("rejects an invalid chat id or time zone before touching the database", async () => {
    await expect(exportChat({ chatId: "a/b", timeZone: "UTC" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    await expect(exportChat({ chatId: CHAT_ID, timeZone: "Not/AZone" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    expect(mockResolvePrimaryUid).not.toHaveBeenCalled();
  });

  it("refuses a chat that is not in the caller's own account, even if another account has it", async () => {
    seedChat("player-1", { role: "player", otherAccountId: "dm-1", otherName: "Marcus" });

    await expect(exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "not-found" })
    );
    expect(receipts()).toHaveLength(0);
  });

  it("exports the DM's copy with names, local times and a receipt that holds no message text", async () => {
    seedChat("dm-1");
    seedMessage("dm-1", "m1", 0, "dm-1", "Hello Anna");
    seedMessage("dm-1", "m2", 1, "player-1", "Hi Marcus\nSecond line");

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1");

    expect(result.messageCount).toBe(2);
    expect(result.fileName).toMatch(/^brother-kael-chat-\d{4}-\d{2}-\d{2}\.txt$/);
    expect(result.text).toContain("Participants: Marcus (DM) and Anna (Player)");
    expect(result.text).toContain("Character: Brother Kael");
    expect(result.text).toContain("Campaign: Calixis");
    expect(result.text).toContain("[14 October 2026, 22:30] Marcus (DM): Hello Anna\n");
    expect(result.text).toContain(
      "[14 October 2026, 22:31] Anna (Player): Hi Marcus\n    Second line\n"
    );

    expect(receipts()).toHaveLength(1);
    const receipt = receipts()[0];
    expect(receipt.path).toBe(`users/dm-1/exportReceipts/${result.exportId}`);
    expect(receipt.data).toMatchObject({
      exportId: result.exportId,
      chatId: CHAT_ID,
      fingerprint: result.fingerprint,
      messageCount: 2,
      timeZone: "UTC",
      createdAt: "server-timestamp",
    });
    expect(JSON.stringify(receipt.data)).not.toContain("Hello Anna");
  });

  it("exports the player's copy with the labels the other way round", async () => {
    seedChat("player-1", { role: "player", otherAccountId: "dm-1", otherName: "Marcus" });
    seedMessage("player-1", "m1", 0, "dm-1", "Hello Anna");

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "player-1");

    expect(result.text).toContain("Participants: Anna (Player) and Marcus (DM)");
    expect(result.text).toContain("Marcus (DM): Hello Anna");
  });

  it("exports the account's copy when the caller is a linked device", async () => {
    mockResolvePrimaryUid.mockImplementation(async (_db, uid) =>
      uid === "device-1" ? "dm-1" : uid
    );
    seedChat("dm-1");
    seedMessage("dm-1", "m1", 0, "dm-1", "Hello Anna");

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "device-1");

    expect(result.text).toContain("Marcus (DM): Hello Anna");
    expect(receipts()[0].path).toContain("users/dm-1/exportReceipts/");
  });

  it("exports only the messages after the time the chat was moved to the bin", async () => {
    seedChat("dm-1", { clearedAt: at(10) });
    seedMessage("dm-1", "old", 5, "dm-1", "Before the bin");
    seedMessage("dm-1", "new1", 15, "player-1", "After one");
    seedMessage("dm-1", "new2", 20, "dm-1", "After two");

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1");

    expect(result.messageCount).toBe(2);
    expect(result.text).not.toContain("Before the bin");
    expect(result.text).toContain("After one");
    expect(result.text).toContain("After two");
  });

  it("reads every page of a long chat in order", async () => {
    seedChat("dm-1");
    for (let index = 0; index < 1200; index += 1) {
      seedMessage("dm-1", `m${String(index).padStart(4, "0")}`, index, "dm-1", `Message ${index}`);
    }

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1");

    expect(result.messageCount).toBe(1200);
    expect(result.text.indexOf("Message 0\n")).toBeLessThan(result.text.indexOf("Message 1199\n"));
    expect(result.text).toContain("Messages: 1200");
  });

  it("refuses a chat that is too large and writes no receipt", async () => {
    seedChat("dm-1");
    for (let index = 0; index < 1100; index += 1) {
      seedMessage("dm-1", `m${String(index).padStart(4, "0")}`, index, "dm-1", "a".repeat(2000));
    }

    await expect(exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1")).rejects.toThrow(
      expect.objectContaining({ code: "resource-exhausted" })
    );
    expect(receipts()).toHaveLength(0);
  });

  it("labels a sender who is neither person as Unknown", async () => {
    seedChat("dm-1");
    seedMessage("dm-1", "m1", 0, "stranger", "Who am I");

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1");

    expect(result.text).toContain("Unknown: Who am I");
  });

  it("falls back to Me when the caller's profile has no first name", async () => {
    documents.delete("userProfiles/dm-1");
    seedChat("dm-1");
    seedMessage("dm-1", "m1", 0, "dm-1", "Hello");

    const result = await exportChat({ chatId: CHAT_ID, timeZone: "UTC" }, "dm-1");

    expect(result.text).toContain("Participants: Me (DM) and Anna (Player)");
  });
});
