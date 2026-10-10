// src/pages/CampaignOverview/DMInbox.tsx

import { useState, useCallback, useEffect } from "react";
import { useThreads } from "../../hooks/useThreads";
import { useThreadMessages } from "../../hooks/useThreadMessages";
import { sendMessage, markThreadRead, clearThread } from "../../services/messageService";
import { MessageThread } from "../../components/MessageThread";
import { MessageInput } from "../../components/MessageInput";
import { useToast } from "../../components/Toast";
import { ConfirmInline } from "../../ui/forms/ConfirmInline";
import { CardOverlayButton } from "../../ui/buttons/CardOverlayButton";
import { ExpandChevron } from "../../ui/icons/ExpandChevron";
import { ErrorState } from "../../ui/ErrorState";
import { uiCardTapHeader } from "../../ui/styles/buttonStyles";
import {
  uiInlineRow,
  uiItemNameHover,
  uiSection,
  uiSectionShell,
  uiTextPlaceholder,
  uiTextMeta,
} from "../../ui/styles/editableStyles";
import { useRouteLoading } from "../../context/useRouteReady";
import { PendingOverlay } from "../../ui/PendingOverlay";
import type { CharacterListItem } from "../../types/Firestore";
import { recordComponentRender } from "../../performance/performanceMetrics";
import { colourDivider, colourAmberFill } from "../../ui/styles/colourTokens";

// ── Helper ────────────────────────────────────────────────────────────────────

function getCharacterLabel(characterId: string, characters: CharacterListItem[]): string {
  const char = characters.find((c) => c.id === characterId);
  return char?.header?.characterName ?? `${characterId.slice(0, 8)}…`;
}

// ThreadView: only mounted when a thread is expanded

function ThreadView({
  campaignId,
  characterId,
  dmUid,
  label,
  unreadForDM,
}: {
  campaignId: string;
  characterId: string;
  dmUid: string;
  label: string;
  unreadForDM: number;
}) {
  const { messages, loading, error, loadOlder, loadingOlder, olderError, hasOlderMessages } =
    useThreadMessages(campaignId, characterId);
  const toast = useToast();
  const [clearing, setClearing] = useState(false);

  // Mark thread as read when DM opens it
  useEffect(() => {
    if (unreadForDM > 0) void markThreadRead(campaignId, characterId, unreadForDM);
  }, [campaignId, characterId, unreadForDM]);

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await sendMessage(campaignId, characterId, dmUid, text, false);
      } catch (err) {
        console.error("Failed to send message:", err);
        toast.error("Failed to send message. Please try again.");
        throw err;
      }
    },
    [campaignId, characterId, dmUid, toast]
  );

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await clearThread(campaignId, characterId);
      toast.success("Chat cleared.");
    } catch (err) {
      console.error("Failed to clear thread:", err);
      toast.error("Failed to clear chat.");
    } finally {
      setClearing(false);
    }
  }, [campaignId, characterId, toast]);

  return (
    <>
      <div hidden={loading} className={`${uiSection} mt-2`}>
        {error ? (
          <ErrorState>Unable to load this conversation.</ErrorState>
        ) : (
          <MessageThread
            messages={messages}
            currentUid={dmUid}
            onLoadOlder={() => void loadOlder()}
            loadingOlder={loadingOlder}
            olderError={olderError}
            hasOlderMessages={hasOlderMessages}
          />
        )}
        <MessageInput onSend={handleSend} placeholder={`Reply to ${label}…`} />

        {/* Clear chat */}
        <div className={`mt-3 pt-3 border-t ${colourDivider}`}>
          <ConfirmInline
            triggerLabel="Clear chat"
            requireText="DELETE"
            requirePrompt="Type DELETE to clear all messages"
            size="sm"
            busy={clearing}
            busyLabel="Clearing"
            onConfirm={handleClear}
          />
        </div>
      </div>
      <PendingOverlay active={loading} />
    </>
  );
}

// ── DMInbox ───────────────────────────────────────────────────────────────────

export function DMInbox({
  campaignId,
  dmUid,
  characters,
}: {
  campaignId: string;
  dmUid: string;
  characters: CharacterListItem[];
}) {
  recordComponentRender("DMInbox");
  const { threads, loading, error } = useThreads(campaignId);
  useRouteLoading(loading);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleThread = useCallback((characterId: string) => {
    setExpandedId((prev) => (prev === characterId ? null : characterId));
  }, []);

  if (error) {
    return <ErrorState>Unable to load messages. Please refresh the page.</ErrorState>;
  }

  if (loading) return null;

  if (threads.length === 0) {
    return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No messages yet.</p>;
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const label = getCharacterLabel(thread.characterId, characters);
        const isExpanded = expandedId === thread.characterId;
        const hasUnread = thread.unreadForDM > 0;

        return (
          <div key={thread.characterId} className="relative">
            <div
              className={`${uiSectionShell} ${uiCardTapHeader} relative w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-2.5 text-left`}
            >
              <CardOverlayButton
                label={hasUnread ? `${label}, ${thread.unreadForDM} unread` : label}
                expanded={isExpanded}
                onClick={() => toggleThread(thread.characterId)}
              />
              <div className="pointer-events-none relative flex-1 min-w-0">
                <div className={`${uiInlineRow}`}>
                  <span className={uiItemNameHover}>{label}</span>
                  {hasUnread && (
                    <span
                      className={`text-xs lg:text-sm px-1.5 lg:px-2 py-0.5 ${colourAmberFill} rounded-full font-semibold leading-none`}
                    >
                      {thread.unreadForDM}
                    </span>
                  )}
                </div>
                {thread.lastMessage && (
                  <p className={`${uiTextMeta} truncate mt-0.5`}>{thread.lastMessage}</p>
                )}
              </div>
              <ExpandChevron expanded={isExpanded} />
            </div>

            {isExpanded && (
              <ThreadView
                campaignId={campaignId}
                characterId={thread.characterId}
                dmUid={dmUid}
                label={label}
                unreadForDM={thread.unreadForDM}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
