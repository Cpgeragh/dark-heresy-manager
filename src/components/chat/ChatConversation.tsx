// src/components/chat/ChatConversation.tsx

import { useCallback, useEffect, useState } from "react";
import { useChatMessages } from "../../hooks/useChatMessages";
import { markChatRead, sendChatMessage } from "../../services/chatService";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { ErrorState } from "../../ui/ErrorState";
import { PendingOverlay } from "../../ui/PendingOverlay";
import { uiTextMeta, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { MessageInput } from "../MessageInput";
import { useToast } from "../Toast";
import { ChatMessageList } from "./ChatMessageList";
import { getChatId, type ChatTarget } from "./chatTarget";

function isRefusal(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return (
    typeof code === "string" &&
    (code.endsWith("/permission-denied") || code.endsWith("/failed-precondition"))
  );
}

interface ChatConversationProps {
  accountId: string;
  target: ChatTarget;
  chat: ChatSummaryWithId | null;
}

export function ChatConversation({ accountId, target, chat }: ChatConversationProps) {
  const chatId = getChatId(target);
  const { messages, loading, error, loadOlder, loadingOlder, olderError, hasOlderMessages } =
    useChatMessages(accountId, chatId);
  const toast = useToast();
  const [refusedChatId, setRefusedChatId] = useState<string | null>(null);
  const unreadCount = chat?.unreadCount ?? 0;

  useEffect(() => {
    if (!chatId || unreadCount === 0) return;
    markChatRead(accountId, chatId, unreadCount).catch((markError) => {
      console.error("Failed to mark chat as read:", markError);
    });
  }, [accountId, chatId, unreadCount]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await sendChatMessage(target.campaignId, target.characterId, text);
      } catch (sendError) {
        console.error("Failed to send chat message:", sendError);
        if (isRefusal(sendError)) {
          setRefusedChatId(chatId);
        } else {
          toast.error("Failed to send message. Please try again.");
        }
        throw sendError;
      }
    },
    [target.campaignId, target.characterId, chatId, toast]
  );

  if (!chatId) {
    return (
      <p className={`text-sm lg:text-base ${uiTextPlaceholder} text-center py-10 px-6`}>
        Nobody has claimed this character yet, so there is nobody to message.
      </p>
    );
  }

  const closed = chat?.closed === true || refusedChatId === chatId;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <PendingOverlay active={loading} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {error ? (
          <ErrorState className="py-10 text-center">Unable to load this conversation.</ErrorState>
        ) : loading ? null : (
          <ChatMessageList
            messages={messages}
            currentAccountId={accountId}
            onLoadOlder={() => void loadOlder()}
            loadingOlder={loadingOlder}
            olderError={olderError}
            hasOlderMessages={hasOlderMessages}
          />
        )}
      </div>
      {closed ? (
        <p className={`${uiTextMeta} px-4 py-3 text-center`}>
          This chat is closed because the character was released or deleted. You can still read it.
        </p>
      ) : (
        <div className="px-4 pb-4">
          <MessageInput
            onSend={handleSend}
            placeholder={chat ? `Message ${chat.otherName}…` : "Write a message…"}
          />
        </div>
      )}
    </div>
  );
}
