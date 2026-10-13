// functions/tests/operations/sendChatMessage.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendChatMessage, type SendChatMessageInput } from "../../src/operations/sendChatMessage";

const mockResolvePrimaryUid = vi.hoisted(() =>
  vi.fn(async (_db: unknown, uid: string): Promise<string> => uid)
);
vi.mock("../../src/shared/linkedIdentity", () => ({
  resolvePrimaryUid: mockResolvePrimaryUid,
}));

interface FakeCollection {
  path: string;
  doc: (id?: string) => FakeRef;
}
interface FakeRef {
  path: string;
  id: string;
  collection: (name: string) => FakeCollection;
}

let autoId = 0;

function makeRef(path: string): FakeRef {
  return {
    path,
    id: path.split("/").pop() as string,
    collection: (name) => makeCollection(`${path}/${name}`),
  };
}

function makeCollection(path: string): FakeCollection {
  return { path, doc: (id) => makeRef(`${path}/${id ?? `auto-${++autoId}`}`) };
}

const documents = new Map<string, Record<string, unknown>>();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockTransaction = {
  get: vi.fn(async (ref: FakeRef) => {
    const data = documents.get(ref.path);
    return { exists: data !== undefined, data: () => data };
  }),
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
};
const mockDb = {
  collection: (name: string) => makeCollection(name),
  runTransaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
    callback(mockTransaction)
  ),
};

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => mockDb,
  FieldValue: {
    serverTimestamp: () => "server-timestamp",
    increment: (amount: number) => ({ __increment: amount }),
  },
}));

const CHAT_ID = "c1__char-1__player-1";

function seed() {
  documents.clear();
  documents.set("campaigns/c1", { dmId: "dm-1", name: "Blood Ravens", gmName: "Stored GM" });
  documents.set("campaigns/c1/characters/char-1", {
    userId: "player-1",
    header: { characterName: "Corvus", playerName: "Stored Player" },
  });
  documents.set("userProfiles/dm-1", { firstName: "Dana" });
  documents.set("userProfiles/player-1", { firstName: "Alex" });
}

function send(overrides: Partial<SendChatMessageInput> = {}, uid = "dm-1") {
  return sendChatMessage(
    { campaignId: "c1", characterId: "char-1", text: "Hello", ...overrides },
    uid
  );
}

function writesTo(path: string) {
  return mockSet.mock.calls.filter(([ref]) => (ref as FakeRef).path === path);
}

describe("sendChatMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvePrimaryUid.mockImplementation(async (_db, uid) => uid);
    autoId = 0;
    seed();
  });

  it("rejects an invalid campaign or character id", async () => {
    await expect(send({ campaignId: "c1/threads/x" })).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    await expect(send({ characterId: "" })).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects empty and whitespace-only text", async () => {
    await expect(send({ text: "" })).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    await expect(send({ text: "   \n " })).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
  });

  it("rejects text over the message limit and accepts text exactly at it", async () => {
    await expect(send({ text: "a".repeat(2001) })).rejects.toThrow(
      expect.objectContaining({ code: "invalid-argument" })
    );
    await expect(send({ text: "a".repeat(2000) })).resolves.toEqual(
      expect.objectContaining({ chatId: CHAT_ID })
    );
  });

  it("rejects a missing campaign or character", async () => {
    documents.delete("campaigns/c1");
    await expect(send()).rejects.toThrow(expect.objectContaining({ code: "not-found" }));

    seed();
    documents.delete("campaigns/c1/characters/char-1");
    await expect(send()).rejects.toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("refuses a stranger", async () => {
    await expect(send({}, "stranger")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("refuses the DM when no player has claimed the character, and still refuses a stranger", async () => {
    documents.set("campaigns/c1/characters/char-1", {
      userId: null,
      header: { characterName: "Corvus" },
    });

    await expect(send()).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));
    await expect(send({}, "stranger")).rejects.toThrow(
      expect.objectContaining({ code: "permission-denied" })
    );
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("refuses a DM who owns the character", async () => {
    documents.set("campaigns/c1/characters/char-1", {
      userId: "dm-1",
      header: { characterName: "Corvus" },
    });

    await expect(send()).rejects.toThrow(expect.objectContaining({ code: "failed-precondition" }));
  });

  it("writes a DM message to both copies and adds an unread for the player only", async () => {
    const result = await send({ text: "  Hello there  " });

    expect(result).toEqual({ chatId: CHAT_ID, messageId: "auto-1" });
    const dmMessage = writesTo(`users/dm-1/chats/${CHAT_ID}/messages/auto-1`);
    const playerMessage = writesTo(`users/player-1/chats/${CHAT_ID}/messages/auto-1`);
    expect(dmMessage).toHaveLength(1);
    expect(dmMessage[0][1]).toEqual({
      fromAccountId: "dm-1",
      text: "Hello there",
      timestamp: "server-timestamp",
    });
    expect(playerMessage[0][1]).toEqual(dmMessage[0][1]);

    const sharedFields = {
      campaignId: "c1",
      characterId: "char-1",
      playerAccountId: "player-1",
      campaignName: "Blood Ravens",
      characterName: "Corvus",
      lastMessage: "Hello there",
      lastTimestamp: "server-timestamp",
      closed: false,
    };
    const dmChat = writesTo(`users/dm-1/chats/${CHAT_ID}`)[0];
    expect(dmChat[1]).toEqual({
      ...sharedFields,
      role: "dm",
      otherAccountId: "player-1",
      otherName: "Alex",
      unreadCount: { __increment: 0 },
    });
    expect(dmChat[2]).toEqual({ merge: true });
    const playerChat = writesTo(`users/player-1/chats/${CHAT_ID}`)[0];
    expect(playerChat[1]).toEqual({
      ...sharedFields,
      role: "player",
      otherAccountId: "dm-1",
      otherName: "Dana",
      unreadCount: { __increment: 1 },
    });
    expect(playerChat[2]).toEqual({ merge: true });
  });

  it("writes exactly four documents inside one transaction and never updates or deletes", async () => {
    await send();

    expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(4);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("cuts the preview at 500 characters but keeps the full message text", async () => {
    await send({ text: "b".repeat(600) });

    const dmMessage = writesTo(`users/dm-1/chats/${CHAT_ID}/messages/auto-1`)[0][1] as {
      text: string;
    };
    const dmChat = writesTo(`users/dm-1/chats/${CHAT_ID}`)[0][1] as { lastMessage: string };
    const playerChat = writesTo(`users/player-1/chats/${CHAT_ID}`)[0][1] as {
      lastMessage: string;
    };
    expect(dmMessage.text).toHaveLength(600);
    expect(dmChat.lastMessage).toHaveLength(500);
    expect(playerChat.lastMessage).toHaveLength(500);
  });

  it("writes a player message to both copies and adds an unread for the DM only", async () => {
    await send({ text: "Reporting in" }, "player-1");

    const dmMessage = writesTo(`users/dm-1/chats/${CHAT_ID}/messages/auto-1`)[0][1];
    expect(dmMessage).toEqual({
      fromAccountId: "player-1",
      text: "Reporting in",
      timestamp: "server-timestamp",
    });
    expect(writesTo(`users/dm-1/chats/${CHAT_ID}`)[0][1]).toEqual(
      expect.objectContaining({ unreadCount: { __increment: 1 } })
    );
    expect(writesTo(`users/player-1/chats/${CHAT_ID}`)[0][1]).toEqual(
      expect.objectContaining({ unreadCount: { __increment: 0 } })
    );
  });

  it("treats a linked device as its account and stamps the account id", async () => {
    mockResolvePrimaryUid.mockImplementation(async (_db, uid) =>
      uid === "device-1" ? "player-1" : uid
    );

    await send({}, "device-1");

    const message = writesTo(`users/player-1/chats/${CHAT_ID}/messages/auto-1`)[0][1];
    expect(message).toEqual(expect.objectContaining({ fromAccountId: "player-1" }));
  });

  it("falls back to stored names, then to plain labels, when a profile is missing", async () => {
    documents.delete("userProfiles/dm-1");
    documents.delete("userProfiles/player-1");
    await send();

    expect(writesTo(`users/dm-1/chats/${CHAT_ID}`)[0][1]).toEqual(
      expect.objectContaining({ otherName: "Stored Player" })
    );
    expect(writesTo(`users/player-1/chats/${CHAT_ID}`)[0][1]).toEqual(
      expect.objectContaining({ otherName: "Stored GM" })
    );

    vi.clearAllMocks();
    documents.set("campaigns/c1", { dmId: "dm-1", name: "Blood Ravens" });
    documents.set("campaigns/c1/characters/char-1", {
      userId: "player-1",
      header: { characterName: "Corvus" },
    });
    await send();

    expect(writesTo(`users/dm-1/chats/${CHAT_ID}`)[0][1]).toEqual(
      expect.objectContaining({ otherName: "Player" })
    );
    expect(writesTo(`users/player-1/chats/${CHAT_ID}`)[0][1]).toEqual(
      expect.objectContaining({ otherName: "DM" })
    );
  });
});
