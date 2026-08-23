// src/pages/CampaignOverview/DMInbox.tsx

import { useState, useCallback, useEffect } from "react";
import { useThreads } from "../../hooks/useThreads";
import { useThreadMessages } from "../../hooks/useThreadMessages";
import { sendMessage, markThreadRead, clearThread } from "../../services/messageService";
import { MessageThread } from "../../components/MessageThread";
import { MessageInput } from "../../components/MessageInput";
import { useToast } from "../../components/Toast";
import { ConfirmInline } from "../../ui/ConfirmInline";
import { ExpandChevron } from "../../ui/ExpandChevron";
import { ErrorState } from "../../ui/ErrorState";
import { LoadingState } from "../../ui/LoadingState";
import type { CharacterListItem } from "../../types/Firestore";

// ── Helper ────────────────────────────────────────────────────────────────────

function getCharacterLabel(characterId: string, characters: CharacterListItem[]): string {
  const char = characters.find((c) => c.id === characterId);
  return char?.header?.characterName ?? `${characterId.slice(0, 8)}…`;
}

// ── ThreadView — only mounted when a thread is expanded ───────────────────────

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
    <div className="mt-2 border border-slate-700 rounded-lg p-3 bg-slate-900/40">
      {error ? (
        <ErrorState>Unable to load this conversation.</ErrorState>
      ) : (
        <MessageThread
          messages={messages}
          currentUid={dmUid}
          loading={loading}
          onLoadOlder={() => void loadOlder()}
          loadingOlder={loadingOlder}
          olderError={olderError}
          hasOlderMessages={hasOlderMessages}
        />
      )}
      <MessageInput onSend={handleSend} placeholder={`Reply to ${label}…`} />

      {/* Clear chat */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <ConfirmInline
          triggerLabel="Clear chat"
          requireText="DELETE"
          requirePrompt="Type DELETE to clear all messages"
          size="sm"
          busy={clearing}
          onConfirm={handleClear}
        />
      </div>
    </div>
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
  const { threads, loading, error } = useThreads(campaignId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleThread = useCallback((characterId: string) => {
    setExpandedId((prev) => (prev === characterId ? null : characterId));
  }, []);

  if (error) {
    return <ErrorState>Unable to load messages. Please refresh the page.</ErrorState>;
  }

  if (loading) {
    return <LoadingState>Loading messages…</LoadingState>;
  }

  if (threads.length === 0) {
    return <p className="text-slate-400 text-sm lg:text-base">No messages yet.</p>;
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const label = getCharacterLabel(thread.characterId, characters);
        const isExpanded = expandedId === thread.characterId;
        const hasUnread = thread.unreadForDM > 0;

        return (
          <div key={thread.characterId}>
            <button
              type="button"
              onClick={() => toggleThread(thread.characterId)}
              aria-expanded={isExpanded}
              className="w-full flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-2.5 rounded border border-slate-700 bg-slate-900/40 hover:bg-slate-800 transition text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm lg:text-base font-medium text-slate-100">{label}</span>
                  {hasUnread && (
                    <span className="text-xs lg:text-sm px-1.5 lg:px-2 py-0.5 bg-amber-500 text-slate-900 rounded-full font-semibold leading-none">
                      {thread.unreadForDM}
                    </span>
                  )}
                </div>
                {thread.lastMessage && (
                  <p className="text-xs lg:text-sm text-slate-500 truncate mt-0.5">
                    {thread.lastMessage}
                  </p>
                )}
              </div>
              <ExpandChevron expanded={isExpanded} />
            </button>

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
