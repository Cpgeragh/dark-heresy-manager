// functions/src/shared/chatClosure.ts
//
// Closing the chat between a DM and a player when that player loses a character.
// Both steps run inside the ownership transaction, so the release and the closing
// either both happen or neither does. findChatsToClose only reads, so it must run
// before the transaction's first write.

import type { DocumentReference, Firestore, Transaction } from "firebase-admin/firestore";
import { buildChatId } from "shared-rules";

export async function findChatsToClose(
  transaction: Transaction,
  db: Firestore,
  campaignId: string,
  characterId: string,
  dmAccountId: unknown,
  previousPlayerAccountId: string | null
): Promise<DocumentReference[]> {
  if (!previousPlayerAccountId || typeof dmAccountId !== "string" || dmAccountId.length === 0) {
    return [];
  }
  const chatId = buildChatId(campaignId, characterId, previousPlayerAccountId);
  const refs = [dmAccountId, previousPlayerAccountId].map((accountId) =>
    db.collection("users").doc(accountId).collection("chats").doc(chatId)
  );
  const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
  return refs.filter((_, index) => snapshots[index].exists);
}

export function closeChats(transaction: Transaction, refs: readonly DocumentReference[]): void {
  for (const ref of refs) transaction.update(ref, { closed: true });
}
