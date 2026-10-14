// src/components/chat/ChatBinList.tsx

import { CHAT_LIMITS } from "shared-rules";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { uiStackList, uiTextMeta, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { ChatBinRow } from "./ChatBinRow";

interface ChatBinListProps {
  chats: ChatSummaryWithId[];
  onRestore: (chat: ChatSummaryWithId) => Promise<void> | void;
}

export function ChatBinList({ chats, onRestore }: ChatBinListProps) {
  const newestFirst = [...chats].sort(
    (a, b) => (b.clearedAt?.toMillis() ?? 0) - (a.clearedAt?.toMillis() ?? 0)
  );

  return (
    <div className={uiStackList}>
      <p className={uiTextMeta}>
        Deleted chats stay here for {CHAT_LIMITS.binRetentionDays} days, then they are removed for
        good.
      </p>
      {newestFirst.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder} text-center py-10 px-6`}>
          Nothing has been deleted.
        </p>
      ) : (
        newestFirst.map((chat) => (
          <ChatBinRow key={chat.id} chat={chat} onRestore={() => onRestore(chat)} />
        ))
      )}
    </div>
  );
}
