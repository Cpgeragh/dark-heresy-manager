// src/context/ChatsContext.tsx
//
// One real-time listener on the signed-in account's own chats, most recent first.
// It feeds the inbox list and the unread total on the header Messages button.

import { useMemo } from "react";
import { limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { chatsCollectionRef } from "../firebase/converters";
import { useQuerySubscription } from "../hooks/useFirestoreSubscription";
import type { ChatSummaryWithId } from "../types/Firestore";
import { isChatBinned } from "../utils/chatBin";
import { ChatsContext } from "./useChatsContext";

export function ChatsProvider({
  accountId,
  children,
}: {
  accountId: string;
  children: React.ReactNode;
}) {
  const {
    data: chats,
    loading,
    error,
  } = useQuerySubscription(
    accountId
      ? query(
          chatsCollectionRef(accountId),
          orderBy("lastTimestamp", "desc"),
          limit(FIRESTORE_QUERY_LIMITS.chatsPerAccount)
        )
      : null,
    accountId ? `chats:${accountId}` : null,
    (snapshot) => snapshot.docs.map((chatDocument) => chatDocument.data())
  );

  const { activeChats, clearedChats } = useMemo(() => {
    const active: ChatSummaryWithId[] = [];
    const cleared: ChatSummaryWithId[] = [];
    for (const chat of chats) {
      if (!isChatBinned(chat)) active.push(chat);
      if (chat.clearedAt) cleared.push(chat);
    }
    return { activeChats: active, clearedChats: cleared };
  }, [chats]);

  const unreadTotal = useMemo(
    () => activeChats.reduce((total, chat) => total + chat.unreadCount, 0),
    [activeChats]
  );

  return (
    <ChatsContext.Provider
      value={{ chats, activeChats, clearedChats, loading, error, unreadTotal }}
    >
      {children}
    </ChatsContext.Provider>
  );
}
