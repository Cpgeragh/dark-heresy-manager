// src/components/MessageDrawer.tsx

import { useCallback } from "react";
import { useThreadMessages } from "../hooks/useThreadMessages";
import { sendMessage } from "../services/messageService";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";
import { useToast } from "./Toast";
import { CloseButton } from "../ui/buttons/CloseButton";
import { ErrorState } from "../ui/ErrorState";
import { PendingOverlay } from "../ui/PendingOverlay";
import { uiDrawerTitle, uiTextPlaceholder } from "../ui/styles/editableStyles";
import { recordComponentRender } from "../performance/performanceMetrics";
import { colourPopoverSurface, colourDivider } from "../ui/styles/colourTokens";
import { uiLayerForeground } from "../ui/styles/layerStyles";
import { DrawerBackdrop } from "../ui/DrawerBackdrop";

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
  const { messages, loading, error, loadOlder, loadingOlder, olderError, hasOlderMessages } =
    useThreadMessages(campaignId, characterId);
  const toast = useToast();

  const handleSend = useCallback(
    async (text: string) => {
      try {
        await sendMessage(campaignId, characterId, playerUid, text, true);
      } catch (err) {
        console.error("Failed to send message:", err);
        toast.error("Failed to send message. Please try again.");
        throw err;
      }
    },
    [campaignId, characterId, playerUid, toast]
  );

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden px-4 pb-4">
      <PendingOverlay active={loading} />
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <ErrorState className="text-center py-10">
            Unable to load messages. Please try again later.
          </ErrorState>
        ) : loading ? null : (
          <MessageThread
            messages={messages}
            currentUid={playerUid}
            onLoadOlder={() => void loadOlder()}
            loadingOlder={loadingOlder}
            olderError={olderError}
            hasOlderMessages={hasOlderMessages}
          />
        )}
      </div>
      <MessageInput onSend={handleSend} placeholder="Message your DM…" />
    </div>
  );
}

// ── MessageDrawer ─────────────────────────────────────────────────────────────

export function MessageDrawer({
  accountId,
  isOpen,
  onClose,
  campaignId,
  characterId,
}: {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
  campaignId: string | null;
  characterId: string | null;
}) {
  recordComponentRender("MessageDrawer");
  return (
    <>
      <DrawerBackdrop isOpen={isOpen} onClose={onClose} />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] ${uiLayerForeground} ${colourPopoverSurface} border-l flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-drawer-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Panel header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${colourDivider} shrink-0`}
        >
          <h2 id="message-drawer-title" className={uiDrawerTitle}>
            Messages
          </h2>
          <CloseButton onClick={onClose} ariaLabel="Close messages" />
        </div>

        {/* Panel content */}
        {isOpen && campaignId && characterId ? (
          <PlayerThread campaignId={campaignId} characterId={characterId} playerUid={accountId} />
        ) : (
          <p className={`text-sm ${uiTextPlaceholder} text-center py-10 px-6`}>
            Open a character sheet to message your DM.
          </p>
        )}
      </div>
    </>
  );
}
