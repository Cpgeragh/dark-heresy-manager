// src/components/chat/ChatInboxModal.tsx

import { useState } from "react";
import { useChatInbox } from "../../context/useChatInbox";
import { useChatsContext } from "../../context/useChatsContext";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { CloseButton } from "../../ui/buttons/CloseButton";
import { TitleHeaderActionButton } from "../../ui/buttons/TitleHeaderActionButton";
import { CenteredTitleHeader } from "../../ui/CenteredTitleHeader";
import { ArrowLeft } from "../../ui/icons/PickerArrows";
import { ModalShell } from "../../ui/modals/ModalShell";
import { ChatConversation } from "./ChatConversation";
import { ChatInboxList } from "./ChatInboxList";
import { getChatId, type ChatTarget } from "./chatTarget";

function targetOf(chat: ChatSummaryWithId): ChatTarget {
  return {
    campaignId: chat.campaignId,
    characterId: chat.characterId,
    playerAccountId: chat.playerAccountId,
    characterName: chat.characterName,
  };
}

export function ChatInboxModal({ accountId }: { accountId: string }) {
  const { view, openInbox, openChat, close } = useChatInbox();
  const { chats, loading, error } = useChatsContext();
  const [scrollArea, setScrollArea] = useState<HTMLDivElement | null>(null);

  if (view.kind === "closed") return null;

  const target = view.kind === "chat" ? view.target : null;
  const chatId = target ? getChatId(target) : null;
  const chat = chatId ? (chats.find((entry) => entry.id === chatId) ?? null) : null;
  const title = target ? (chat?.characterName ?? target.characterName ?? "Chat") : "Messages";

  return (
    <ModalShell
      ariaLabel={title}
      onClose={close}
      viewportAware
      className="max-w-md lg:max-w-lg h-[80vh] max-h-[40rem] overflow-hidden open:flex flex-col"
    >
      <CenteredTitleHeader
        className="shrink-0"
        title={title}
        left={
          target ? (
            <TitleHeaderActionButton
              align="start"
              aria-label="Back to messages"
              onClick={openInbox}
            >
              <ArrowLeft />
            </TitleHeaderActionButton>
          ) : undefined
        }
        right={
          <CloseButton ariaLabel="Close messages" onClick={close} className="justify-self-end" />
        }
      />
      {target ? (
        <ChatConversation
          key={chatId ?? "unclaimed"}
          accountId={accountId}
          target={target}
          chat={chat}
        />
      ) : (
        <div ref={setScrollArea} className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">
          <ChatInboxList
            chats={chats}
            loading={loading}
            error={error}
            scrollRoot={scrollArea}
            onOpenChat={(entry) => openChat(targetOf(entry))}
          />
        </div>
      )}
    </ModalShell>
  );
}
