// functions/src/shared/chatClosure.ts
//
// Closing the chat between a DM and a player when that player loses a character.
// Both steps run inside the ownership transaction, so the release and the closing
// either both happen or neither does. findChatsToClose only reads, so it must run
// before the transaction's first write.

import {
  FieldPath,
  type DocumentReference,
  type Firestore,
  type Query,
  type Transaction,
} from "firebase-admin/firestore";
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

export interface ChatScope {
  campaignId: string;
  characterId?: string;
}

// Marks one page of every copy of the chats in a campaign, or about one character, as closed.
// The cursor is the full path of the last copy of the previous page. A copy that was deleted
// since the query is skipped, so it is never recreated. A null nextCursor means the last page.
export async function closeChatCopiesPage(
  db: Firestore,
  scope: ChatScope,
  cursor: string | null,
  pageSize: number
): Promise<{ closed: number; nextCursor: string | null }> {
  let query: Query = db.collectionGroup("chats").where("campaignId", "==", scope.campaignId);
  if (scope.characterId) query = query.where("characterId", "==", scope.characterId);
  query = query.orderBy(FieldPath.documentId()).limit(pageSize);
  if (cursor) query = query.startAfter(db.doc(cursor));

  const page = await query.get();
  if (page.empty) return { closed: 0, nextCursor: null };

  const closed = await db.runTransaction(async (transaction) => {
    const fresh = await transaction.getAll(...page.docs.map((snapshot) => snapshot.ref));
    let count = 0;
    for (const snapshot of fresh) {
      if (!snapshot.exists || snapshot.get("closed") === true) continue;
      transaction.update(snapshot.ref, { closed: true });
      count += 1;
    }
    return count;
  });

  return {
    closed,
    nextCursor: page.size === pageSize ? page.docs[page.size - 1].ref.path : null,
  };
}
