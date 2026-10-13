// functions/tests/shared/chatClosure.test.ts
import { describe, it, expect, vi } from "vitest";
import { closeChats, findChatsToClose } from "../../src/shared/chatClosure";

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
