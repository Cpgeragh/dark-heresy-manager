// src/components/MessageDrawer.tsx

import { useCallback } from "react";
import type { User } from "firebase/auth";
import { useThreadMessages } from "../hooks/useThreadMessages";
import { sendMessage } from "../services/messageService";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";
import { useToast } from "./Toast";

// ── PlayerThread ──────────────────────────────────────────────────────────────

function PlayerThread({
  campaignId,
  characterId,
  playerUid,
}: {
  campaignId: string;
  characterId: string;
  playerUid: string;
}) {
  const { messages, loading } = useThreadMessages(campaignId, characterId);
  const toast = useToast();

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await sendMessage(campaignId, characterId, playerUid, text, true);
      } catch (err) {
        console.error("Failed to send message:", err);
        toast.error("Failed to send message. Please try again.");
      }
    },
    [campaignId, characterId, playerUid, toast]
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden px-4 pb-4">
      <div className="flex-1 overflow-y-auto">
        <MessageThread messages={messages} currentUid={playerUid} loading={loading} />
      </div>
      <MessageInput onSend={handleSend} placeholder="Message your DM…" />
    </div>
  );
}

// ── MessageDrawer ─────────────────────────────────────────────────────────────

export function MessageDrawer({
  user,
  isOpen,
  onClose,
  campaignId,
  characterId,
}: {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
  characterId: string | null;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 bg-slate-900 border-l border-slate-700 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
          <h2 className="font-semibold text-slate-100">Messages</h2>
          <button
            onClick={onClose}
            aria-label="Close messages"
            className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none transition"
          >
            ×
          </button>
        </div>

        {/* Panel content */}
        {campaignId && characterId ? (
          <PlayerThread
            campaignId={campaignId}
            characterId={characterId}
            playerUid={user.uid}
          />
        ) : (
          <p className="text-sm text-slate-500 text-center py-10 px-6">
            Open a character sheet to message your DM.
          </p>
        )}
      </div>
    </>
  );
}
