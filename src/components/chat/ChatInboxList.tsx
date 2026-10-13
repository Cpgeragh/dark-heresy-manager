// src/components/chat/ChatInboxList.tsx

import type { ChatSummaryWithId } from "../../types/Firestore";
import { ErrorState } from "../../ui/ErrorState";
import { uiStackList, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { ChatInboxItem } from "./ChatInboxItem";

interface ChatInboxListProps {
  chats: ChatSummaryWithId[];
  loading: boolean;
  error: Error | null;
  scrollRoot?: Element | null;
  onOpenChat: (chat: ChatSummaryWithId) => void;
}

export function ChatInboxList({
  chats,
  loading,
  error,
  scrollRoot,
  onOpenChat,
}: ChatInboxListProps) {
  if (error) {
    return <ErrorState className="py-10 text-center">Unable to load your chats.</ErrorState>;
  }

  if (loading) return null;

  if (chats.length === 0) {
    return (
      <p className={`text-sm lg:text-base ${uiTextPlaceholder} text-center py-10 px-6`}>
        You have no chats yet.
      </p>
    );
  }

  return (
    <div className={uiStackList}>
      {chats.map((chat) => (
        <ChatInboxItem
          key={chat.id}
          chat={chat}
          scrollRoot={scrollRoot}
          onOpen={() => onOpenChat(chat)}
        />
      ))}
    </div>
  );
}
