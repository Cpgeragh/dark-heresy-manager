// src/hooks/useThreadMessages.ts
// Real-time listener for messages in a single character-DM thread.

import { collection, limitToLast, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import type { ThreadMessage } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useThreadMessages(campaignId: string | null, characterId: string | null) {
  const {
    data: messages,
    loading,
    error,
  } = useQuerySubscription(
    campaignId && characterId
      ? query(
          collection(db, "campaigns", campaignId, "threads", characterId, "messages"),
          orderBy("timestamp", "asc"),
          limitToLast(FIRESTORE_QUERY_LIMITS.messagesPerThread)
        )
      : null,
    campaignId && characterId ? `thread-messages:${campaignId}:${characterId}` : null,
    (snapshot) =>
      snapshot.docs.map(
        (messageDocument) =>
          ({ id: messageDocument.id, ...messageDocument.data() }) as ThreadMessage
      )
  );

  return { messages, loading, error };
}
