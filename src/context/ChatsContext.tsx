// src/context/ChatsContext.tsx
//
// One real-time listener on the signed-in account's own chats, most recent first.
// It feeds the inbox list and the unread total on the header Messages button.

import { useMemo } from "react";
import { limit, orderBy, query } from "firebase/firestore";
import { FIRESTORE_QUERY_LIMITS } from "../constants/firestoreLimits";
import { chatsCollectionRef } from "../firebase/converters";
import { useQuerySubscription } from "../hooks/useFirestoreSubscription";
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

  const unreadTotal = useMemo(
    () => chats.reduce((total, chat) => total + chat.unreadCount, 0),
    [chats]
  );

  return (
    <ChatsContext.Provider value={{ chats, loading, error, unreadTotal }}>
      {children}
    </ChatsContext.Provider>
  );
}
