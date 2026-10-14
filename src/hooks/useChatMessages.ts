// src/hooks/useChatMessages.ts
// A live recent page of one chat copy plus explicit one-shot loading for older messages.

import { useCallback, useMemo, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type Timestamp,
} from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { db } from "../firebase";
import type { ChatMessage } from "../types/Firestore";
import { useQuerySubscription } from "./useFirestoreSubscription";

function afterConstraints(after: Timestamp | null) {
  return after ? [where("timestamp", ">", after)] : [];
}

export function useChatMessages(
  accountId: string | null,
  chatId: string | null,
  after: Timestamp | null = null
) {
  const afterKey = after ? after.toMillis() : "all";
  const source = accountId && chatId ? `${accountId}:${chatId}:${afterKey}` : null;
  const {
    data: latestMessages,
    loading,
    error,
  } = useQuerySubscription(
    accountId && chatId
      ? query(
          collection(db, "users", accountId, "chats", chatId, "messages"),
          ...afterConstraints(after),
          orderBy("timestamp", "desc"),
          orderBy(documentId(), "desc"),
          limit(FIRESTORE_QUERY_LIMITS.chatMessagesPerPage)
        )
      : null,
    accountId && chatId ? `chat-messages:${accountId}:${chatId}:${afterKey}` : null,
    (snapshot) =>
      snapshot.docs
        .map(
          (messageDocument) =>
            ({ id: messageDocument.id, ...messageDocument.data() }) as ChatMessage
        )
        .reverse()
  );

  type OlderMessagesState = {
    source: string | null;
    messages: ChatMessage[];
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
    const byId = new Map<string, ChatMessage>();
    for (const message of [...olderState.messages, ...latestMessages]) {
      byId.set(message.id, message);
    }
    return [...byId.values()];
  }, [latestMessages, olderState.messages]);

  const hasOlderMessages =
    source !== null &&
    !loading &&
    (olderState.hasMore ?? latestMessages.length === FIRESTORE_QUERY_LIMITS.chatMessagesPerPage);

  const loadOlder = useCallback(async () => {
    const oldestMessage = messages[0];
    if (
      !source ||
      !accountId ||
      !chatId ||
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
          collection(db, "users", accountId, "chats", chatId, "messages"),
          ...afterConstraints(after),
          orderBy("timestamp", "desc"),
          orderBy(documentId(), "desc"),
          startAfter(oldestMessage.timestamp, oldestMessage.id),
          limit(FIRESTORE_QUERY_LIMITS.chatMessagesPerPage)
        )
      );
      const page = snapshot.docs
        .map(
          (messageDocument) =>
            ({ id: messageDocument.id, ...messageDocument.data() }) as ChatMessage
        )
        .reverse();

      setOlderState((current) => {
        if (current.source !== source) return current;
        const byId = new Map<string, ChatMessage>();
        for (const message of [...page, ...current.messages]) byId.set(message.id, message);
        return {
          ...current,
          messages: [...byId.values()],
          hasMore: page.length === FIRESTORE_QUERY_LIMITS.chatMessagesPerPage,
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
  }, [accountId, chatId, after, hasOlderMessages, messages, olderState.loading, source]);

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
