// src/components/chat/ChatConversation.tsx

import { useCallback, useEffect, useState } from "react";
import { CHAT_LIMITS } from "shared-rules";
import { useChatMessages } from "../../hooks/useChatMessages";
import { clearChat, exportChat, markChatRead, sendChatMessage } from "../../services/chatService";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { Button } from "../../ui/buttons/Button";
import { ConfirmInline } from "../../ui/forms/ConfirmInline";
import { ErrorState } from "../../ui/ErrorState";
import { PendingOverlay } from "../../ui/PendingOverlay";
import { uiTextMeta, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { pendingToMessage, type PendingChatMessage } from "../../utils/chatPending";
import { createLocalId } from "../../utils/createLocalId";
import { downloadTextFile } from "../../utils/downloadTextFile";
import { MessageInput } from "../MessageInput";
import { useToast } from "../Toast";
import { ChatMessageList } from "./ChatMessageList";
import { getChatId, type ChatTarget } from "./chatTarget";

// If the list never shows the confirmed message, the dimmed copy is dropped after this long.
const PENDING_FALLBACK_MS = 10_000;

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
  onCleared?: () => void;
}

export function ChatConversation({ accountId, target, chat, onCleared }: ChatConversationProps) {
  const chatId = getChatId(target);
  const { messages, loading, error, loadOlder, loadingOlder, olderError, hasOlderMessages } =
    useChatMessages(accountId, chatId, chat?.clearedAt ?? null);
  const toast = useToast();
  const [refusedChatId, setRefusedChatId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingChatMessage[]>([]);
  const unreadCount = chat?.unreadCount ?? 0;

  useEffect(() => {
    if (!chatId || unreadCount === 0) return;
    markChatRead(accountId, chatId, unreadCount).catch((markError) => {
      console.error("Failed to mark chat as read:", markError);
    });
  }, [accountId, chatId, unreadCount]);

  const handleSend = useCallback(
    async (text: string) => {
      const localId = createLocalId("pending-chat-message");
      const remove = () =>
        setPending((current) => current.filter((item) => item.localId !== localId));
      setPending((current) => [...current, { localId, text, sentAt: Date.now(), serverId: null }]);
      try {
        const result = await sendChatMessage(target.campaignId, target.characterId, text);
        setPending((current) =>
          current.map((item) =>
            item.localId === localId ? { ...item, serverId: result.messageId } : item
          )
        );
        window.setTimeout(remove, PENDING_FALLBACK_MS);
      } catch (sendError) {
        remove();
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

  // A pending message disappears as soon as the real one, with the server's id, is in the list.
  const arrivedIds = new Set(messages.map((message) => message.id));
  const stillPending = pending.filter((item) => !(item.serverId && arrivedIds.has(item.serverId)));
  const shownMessages =
    stillPending.length > 0
      ? [...messages, ...stillPending.map((item) => pendingToMessage(item, accountId))]
      : messages;

  const handleDelete = async () => {
    try {
      await clearChat(accountId, chatId);
      toast.success(
        `Chat moved to Recently deleted. You can restore it for ${CHAT_LIMITS.binRetentionDays} days.`
      );
      onCleared?.();
    } catch (deleteError) {
      console.error("Failed to delete chat:", deleteError);
      toast.error("Failed to delete the chat. Please try again.");
    }
  };

  const handleExport = async () => {
    try {
      const file = await exportChat(chatId);
      downloadTextFile(file.fileName, file.text);
      toast.success(`Chat exported with ${file.messageCount} messages.`);
    } catch (exportError) {
      console.error("Failed to export chat:", exportError);
      toast.error(
        exportError instanceof Error ? exportError.message : "Failed to export the chat."
      );
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <PendingOverlay active={loading} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {error ? (
          <ErrorState className="py-10 text-center">Unable to load this conversation.</ErrorState>
        ) : loading ? null : (
          <ChatMessageList
            messages={shownMessages}
            currentAccountId={accountId}
            onLoadOlder={() => void loadOlder()}
            loadingOlder={loadingOlder}
            olderError={olderError}
            hasOlderMessages={hasOlderMessages}
          />
        )}
      </div>
      {chat && (
        <div className="flex items-start justify-end gap-2 px-4 pt-2">
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Export chat
          </Button>
          <ConfirmInline
            triggerLabel="Delete chat"
            question="Move to Recently deleted?"
            variant="warning"
            size="sm"
            busyLabel="Deleting"
            onConfirm={handleDelete}
          />
        </div>
      )}
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
