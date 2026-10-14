// src/components/chat/useDeletionChatChoice.tsx
//
// After a character or campaign has been deleted, asks the DM whether to keep their own copies of
// the chats about it. The returned promise resolves once they have chosen, or at once when there
// is nothing to ask, so the page can wait for it before it navigates.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CHAT_LIMITS } from "shared-rules";
import { useChatsContext } from "../../context/useChatsContext";
import { clearChat } from "../../services/chatService";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { isChatBinned } from "../../utils/chatBin";
import { useToast } from "../Toast";
import { KeepOrDeleteChatModal } from "./KeepOrDeleteChatModal";

export interface DeletionScope {
  campaignId: string;
  characterId?: string;
}

interface UseDeletionChatChoiceOptions {
  accountId: string;
  about: "character" | "campaign";
}

export function useDeletionChatChoice({ accountId, about }: UseDeletionChatChoiceOptions): {
  ask: (scope: DeletionScope) => Promise<void>;
  modals: ReactNode;
} {
  const { chats } = useChatsContext();
  const toast = useToast();
  const latestChats = useRef(chats);
  const resolver = useRef<(() => void) | null>(null);
  const [pending, setPending] = useState<ChatSummaryWithId[]>([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    latestChats.current = chats;
  }, [chats]);

  const settle = () => {
    setPending([]);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.();
  };

  const ask = (scope: DeletionScope) =>
    new Promise<void>((resolve) => {
      const matching = latestChats.current.filter(
        (chat) =>
          chat.campaignId === scope.campaignId &&
          (!scope.characterId || chat.characterId === scope.characterId) &&
          !isChatBinned(chat)
      );
      if (matching.length === 0) {
        resolve();
        return;
      }
      resolver.current?.();
      resolver.current = resolve;
      setPending(matching);
    });

  const handleDelete = async () => {
    setDeleting(true);
    const results = await Promise.allSettled(pending.map((chat) => clearChat(accountId, chat.id)));
    setDeleting(false);

    const failed = pending.filter((_, index) => results[index].status === "rejected");
    if (failed.length > 0) {
      console.error("Failed to delete chats:", failed.length);
      setPending(failed);
      toast.error(
        failed.length > 1
          ? "Failed to delete some chats. Please try again."
          : "Failed to delete the chat. Please try again."
      );
      return;
    }

    const days = CHAT_LIMITS.binRetentionDays;
    toast.success(
      pending.length > 1
        ? `Chats moved to Recently deleted. You can restore them for ${days} days.`
        : `Chat moved to Recently deleted. You can restore it for ${days} days.`
    );
    settle();
  };

  const modals =
    pending.length > 0 ? (
      <KeepOrDeleteChatModal
        busy={deleting}
        count={pending.length}
        about={about}
        onKeep={settle}
        onDelete={handleDelete}
      />
    ) : null;

  return { ask, modals };
}
