// src/hooks/useThreadMessages.ts
// A live recent page plus explicit one-shot loading for older messages.

import { useCallback, useMemo, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import type { ThreadMessage } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

export function useThreadMessages(campaignId: string | null, characterId: string | null) {
  const source = campaignId && characterId ? `${campaignId}:${characterId}` : null;
  const {
    data: latestMessages,
    loading,
    error,
  } = useQuerySubscription(
    campaignId && characterId
      ? query(
          collection(db, "campaigns", campaignId, "threads", characterId, "messages"),
          orderBy("timestamp", "desc"),
          orderBy(documentId(), "desc"),
          limit(FIRESTORE_QUERY_LIMITS.messagesPerThread)
        )
      : null,
    campaignId && characterId ? `thread-messages:${campaignId}:${characterId}` : null,
    (snapshot) =>
      snapshot.docs
        .map(
          (messageDocument) =>
            ({ id: messageDocument.id, ...messageDocument.data() }) as ThreadMessage
        )
        .reverse()
  );

  type OlderMessagesState = {
    source: string | null;
    messages: ThreadMessage[];
    hasMore: boolean | null;
    loading: boolean;
    error: Error | null;
  };

  const emptyOlderState = (): OlderMessagesState => ({
    source,
    messages: [],
    hasMore: null,
    loading: false,
    error: null,
  });
  const [storedOlderState, setOlderState] = useState<OlderMessagesState>(emptyOlderState);
  let olderState = storedOlderState;

  if (olderState.source !== source) {
    olderState = emptyOlderState();
    setOlderState(olderState);
  }

  const messages = useMemo(() => {
    const byId = new Map<string, ThreadMessage>();
    for (const message of [...olderState.messages, ...latestMessages]) {
      byId.set(message.id, message);
    }
    return [...byId.values()];
  }, [latestMessages, olderState.messages]);

  const hasOlderMessages =
    source !== null &&
    !loading &&
    (olderState.hasMore ?? latestMessages.length === FIRESTORE_QUERY_LIMITS.messagesPerThread);

  const loadOlder = useCallback(async () => {
    const oldestMessage = messages[0];
    if (
      !source ||
      !campaignId ||
      !characterId ||
      !oldestMessage?.timestamp ||
      olderState.loading ||
      !hasOlderMessages
    ) {
      return;
    }

    setOlderState((current) => ({ ...current, loading: true, error: null }));

    try {
      const snapshot = await getDocs(
        query(
          collection(db, "campaigns", campaignId, "threads", characterId, "messages"),
          orderBy("timestamp", "desc"),
          orderBy(documentId(), "desc"),
          startAfter(oldestMessage.timestamp, oldestMessage.id),
          limit(FIRESTORE_QUERY_LIMITS.messagesPerThread)
        )
      );
      const page = snapshot.docs
        .map(
          (messageDocument) =>
            ({ id: messageDocument.id, ...messageDocument.data() }) as ThreadMessage
        )
        .reverse();

      setOlderState((current) => {
        if (current.source !== source) return current;
        const byId = new Map<string, ThreadMessage>();
        for (const message of [...page, ...current.messages]) byId.set(message.id, message);
        return {
          ...current,
          messages: [...byId.values()],
          hasMore: page.length === FIRESTORE_QUERY_LIMITS.messagesPerThread,
          loading: false,
          error: null,
        };
      });
    } catch (loadError) {
      setOlderState((current) =>
        current.source === source
          ? {
              ...current,
              loading: false,
              error: loadError instanceof Error ? loadError : new Error(String(loadError)),
            }
          : current
      );
    }
  }, [campaignId, characterId, hasOlderMessages, messages, olderState.loading, source]);

  return {
    messages,
    loading,
    error,
    loadOlder,
    loadingOlder: olderState.loading,
    olderError: olderState.error,
    hasOlderMessages,
  };
}
