// src/components/chat/ChatInboxModal.tsx

import { useState } from "react";
import { useChatInbox } from "../../context/useChatInbox";
import { useChatsContext } from "../../context/useChatsContext";
import { restoreChat } from "../../services/chatService";
import type { ChatSummaryWithId } from "../../types/Firestore";
import { CloseButton } from "../../ui/buttons/CloseButton";
import { TitleHeaderActionButton } from "../../ui/buttons/TitleHeaderActionButton";
import { CenteredTitleHeader } from "../../ui/CenteredTitleHeader";
import { ArrowLeft } from "../../ui/icons/PickerArrows";
import { ModalShell } from "../../ui/modals/ModalShell";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import { colourActiveRose, colourActiveSky } from "../../ui/styles/colourTokens";
import { uiStackBody } from "../../ui/styles/editableStyles";
import { segmentedTabId, segmentedTabPanelId } from "../../ui/styles/segmentedTabStyles";
import { useToast } from "../Toast";
import { ChatBinList } from "./ChatBinList";
import { ChatConversation } from "./ChatConversation";
import { ChatInboxList } from "./ChatInboxList";
import { getChatId, type ChatTarget } from "./chatTarget";

type ListTab = "chats" | "bin";

const LIST_TABS_ID = "chat-inbox-tabs";

const LIST_TAB_OPTIONS: readonly SegmentedTabOption<ListTab>[] = [
  { value: "chats", label: "Chats", activeClassName: colourActiveSky },
  { value: "bin", label: "Recently deleted", activeClassName: colourActiveRose },
];

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
  const { chats, activeChats, clearedChats, loading, error } = useChatsContext();
  const toast = useToast();
  const [scrollArea, setScrollArea] = useState<HTMLDivElement | null>(null);
  const [listTab, setListTab] = useState<ListTab>("chats");

  if (view.kind === "closed") return null;

  const target = view.kind === "chat" ? view.target : null;
  const chatId = target ? getChatId(target) : null;
  const chat = chatId ? (chats.find((entry) => entry.id === chatId) ?? null) : null;
  const title = target ? (chat?.characterName ?? target.characterName ?? "Chat") : "Inbox";

  const handleRestore = async (restored: ChatSummaryWithId) => {
    try {
      await restoreChat(accountId, restored.id);
      toast.success("Chat restored.");
    } catch (restoreError) {
      console.error("Failed to restore chat:", restoreError);
      toast.error("Failed to restore the chat. Please try again.");
    }
  };

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
          onCleared={openInbox}
        />
      ) : (
        <div
          ref={setScrollArea}
          className={`min-h-0 flex-1 overflow-y-auto p-4 lg:p-5 ${uiStackBody}`}
        >
          <SegmentedTabs
            id={LIST_TABS_ID}
            ariaLabel="Messages view"
            options={LIST_TAB_OPTIONS}
            value={listTab}
            onChange={setListTab}
          />
          <div
            id={segmentedTabPanelId(LIST_TABS_ID, listTab)}
            role="tabpanel"
            aria-labelledby={segmentedTabId(LIST_TABS_ID, listTab)}
          >
            {listTab === "chats" ? (
              <ChatInboxList
                chats={activeChats}
                loading={loading}
                error={error}
                scrollRoot={scrollArea}
                onOpenChat={(entry) => openChat(targetOf(entry))}
              />
            ) : (
              <ChatBinList chats={clearedChats} onRestore={handleRestore} />
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
