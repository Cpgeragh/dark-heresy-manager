// src/pages/CampaignOverview/DMInbox.tsx

import { useState, useCallback, useEffect } from "react";
import { useThreads } from "../../hooks/useThreads";
import { useThreadMessages } from "../../hooks/useThreadMessages";
import { sendMessage, markThreadRead, clearThread } from "../../services/messageService";
import { MessageThread } from "../../components/MessageThread";
import { MessageInput } from "../../components/MessageInput";
import { useToast } from "../../components/Toast";
import { ConfirmInline } from "../../ui/ConfirmInline";
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
}: {
  campaignId: string;
  characterId: string;
  dmUid: string;
  label: string;
}) {
  const { messages, loading } = useThreadMessages(campaignId, characterId);
  const toast = useToast();
  const [clearing, setClearing] = useState(false);

  // Mark thread as read when DM opens it
  useEffect(() => {
    void markThreadRead(campaignId, characterId);
  }, [campaignId, characterId]);

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
      <MessageThread messages={messages} currentUid={dmUid} loading={loading} />
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
  const { threads, loading } = useThreads(campaignId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleThread = useCallback((characterId: string) => {
    setExpandedId((prev) => (prev === characterId ? null : characterId));
  }, []);

  if (loading) return null;

  if (threads.length === 0) {
    return <p className="text-slate-400 text-sm">No messages yet.</p>;
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
              onClick={() => toggleThread(thread.characterId)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded border border-slate-700 bg-slate-900/40 hover:bg-slate-800 transition text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-100">{label}</span>
                  {hasUnread && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-500 text-slate-900 rounded-full font-semibold leading-none">
                      {thread.unreadForDM}
                    </span>
                  )}
                </div>
                {thread.lastMessage && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{thread.lastMessage}</p>
                )}
              </div>
              <span className="text-slate-500 text-xs shrink-0">
                {isExpanded ? "▾" : "▸"}
              </span>
            </button>

            {isExpanded && (
              <ThreadView
                campaignId={campaignId}
                characterId={thread.characterId}
                dmUid={dmUid}
                label={label}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
