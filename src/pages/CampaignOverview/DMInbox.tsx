// src/pages/CampaignOverview/DMInbox.tsx

import { useState, useCallback, useEffect } from "react";
import { useThreads } from "../../hooks/useThreads";
import { useThreadMessages } from "../../hooks/useThreadMessages";
import { sendMessage, markThreadRead, clearThread } from "../../services/messageService";
import { MessageThread } from "../../components/MessageThread";
import { MessageInput } from "../../components/MessageInput";
import { useToast } from "../../components/Toast";
import type { CharacterListItem } from "../../types/Firestore";

// ── Helper ────────────────────────────────────────────────────────────────────

function getPlayerLabel(playerUid: string, characters: CharacterListItem[]): string {
  const owned = characters.filter((c) => c.userId === playerUid);
  if (owned.length > 0) {
    return owned.map((c) => c.header?.characterName ?? "Unnamed").join(", ");
  }
  return `${playerUid.slice(0, 8)}…`;
}

// ── ThreadView — only mounted when a thread is expanded ───────────────────────

function ThreadView({
  campaignId,
  playerUid,
  dmUid,
  label,
}: {
  campaignId: string;
  playerUid: string;
  dmUid: string;
  label: string;
}) {
  const { messages, loading } = useThreadMessages(campaignId, playerUid);
  const toast = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearText, setClearText] = useState("");
  const [clearing, setClearing] = useState(false);

  // Mark thread as read when DM opens it
  useEffect(() => {
    void markThreadRead(campaignId, playerUid);
  }, [campaignId, playerUid]);

  const handleSend = useCallback(
    async (text: string) => {
      await sendMessage(campaignId, playerUid, dmUid, text);
    },
    [campaignId, playerUid, dmUid]
  );

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await clearThread(campaignId, playerUid);
      setShowClearConfirm(false);
      setClearText("");
      toast.success("Chat cleared.");
    } catch (err) {
      console.error("Failed to clear thread:", err);
      toast.error("Failed to clear chat.");
    } finally {
      setClearing(false);
    }
  }, [campaignId, playerUid, toast]);

  return (
    <div className="mt-2 border border-slate-700 rounded-lg p-3 bg-slate-900/40">
      <MessageThread messages={messages} currentUid={dmUid} loading={loading} />
      <MessageInput onSend={handleSend} placeholder={`Reply to ${label}…`} />

      {/* Clear chat */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        {showClearConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-red-400">Type DELETE to clear all messages</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={clearText}
                onChange={(e) => setClearText(e.target.value)}
                placeholder="DELETE"
                autoFocus
                disabled={clearing}
                className="px-2 py-1 bg-slate-700 border border-slate-500 rounded text-xs text-slate-100 w-24 font-mono placeholder:text-slate-600 disabled:opacity-50"
              />
              <button
                onClick={handleClear}
                disabled={clearing || clearText !== "DELETE"}
                className="text-xs px-2 py-1 bg-red-700 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {clearing ? "…" : "Yes"}
              </button>
              <button
                onClick={() => { setShowClearConfirm(false); setClearText(""); }}
                disabled={clearing}
                className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
          >
            Clear chat
          </button>
        )}
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
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  const toggleThread = useCallback((playerUid: string) => {
    setExpandedUid((prev) => (prev === playerUid ? null : playerUid));
  }, []);

  if (loading) return null;

  if (threads.length === 0) {
    return <p className="text-slate-400 text-sm">No messages yet.</p>;
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => {
        const label = getPlayerLabel(thread.playerUid, characters);
        const isExpanded = expandedUid === thread.playerUid;
        const hasUnread = thread.unreadForDM > 0;

        return (
          <div key={thread.playerUid}>
            <button
              onClick={() => toggleThread(thread.playerUid)}
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
                playerUid={thread.playerUid}
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
