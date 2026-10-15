// src/pages/CampaignOverview/CharacterRow.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Timestamp } from "firebase/firestore";
import { useClaimLogs } from "../../hooks/useClaimLogs";
import { useToast } from "../../components/Toast";
import {
  deleteCharacter,
  preflightCharacterDeletion,
  registerRecoveryCode,
  revealRecoveryCode,
} from "../../services/characterService";
import {
  uiInlineRow,
  uiSection,
  uiTextError,
  uiTextPlaceholder,
  uiTextMeta,
  uiStackField,
} from "../../ui/styles/editableStyles";
import { uiCardLinkFeedback } from "../../ui/styles/buttonStyles";
import { colourSuccessPlain, colourTextPrimary } from "../../ui/styles/colourTokens";
import { HistoryButton } from "../../ui/buttons/HistoryButton";
import { IconButton } from "../../ui/buttons/IconButton";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { GearIcon } from "../../ui/icons/GearIcon";
import { DeleteConfirmModal } from "../../ui/modals/DeleteConfirmModal";
import { ManageActionRow } from "../../ui/modals/ManageActionRow";
import { ManageModal } from "../../ui/modals/ManageModal";
import { ModalHeader } from "../../ui/modals/ModalHeader";
import { ModalShell } from "../../ui/modals/ModalShell";
import { RevealCodeModal } from "../../ui/modals/RevealCodeModal";
import type { ClaimLogAction } from "shared-rules";
import { ChatMessageButton } from "../../components/chat/ChatMessageButton";
import { PortraitUpload } from "../../components/PortraitUpload";
import { recordComponentRender } from "../../performance/performanceMetrics";

function formatAction(action: ClaimLogAction): string {
  switch (action) {
    case "claim":
      return "Claimed";
    case "release":
      return "Released";
    case "force-assign":
      return "Force assigned";
    case "force-release":
      return "Force released";
  }
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return "";
  if (ts && typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate().toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (ts instanceof Date) {
    return ts.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }
  return "";
}

export function CharacterRow({
  campaignId,
  characterId,
  characterName,
  userId,
  portraitUrl,
  isDM,
  onDeleted,
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
  userId: string | null;
  portraitUrl?: string;
  isDM: boolean;
  /** Called once the character has been deleted, so the page can ask about the DM's chats. */
  onDeleted?: (characterId: string) => void;
}) {
  recordComponentRender("CharacterRow");
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyRequested, setHistoryRequested] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [deletePreflight, setDeletePreflight] = useState<{
    loading: boolean;
    result?: { jobId: string; totalCount: number };
    error?: string;
  }>({ loading: false });
  const {
    logs,
    loading: logsLoading,
    error: logsError,
  } = useClaimLogs(campaignId, characterId, historyRequested && isDM);
  const showHistory = historyRequested && !logsLoading;
  const toast = useToast();

  const closeManage = useCallback(() => {
    setManageOpen(false);
    setRevealedCode(null);
    setDeleteConfirmOpen(false);
    setDeletePreflight({ loading: false });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletePreflight.result) return;
    setDeleting(true);
    try {
      await deleteCharacter(deletePreflight.result.jobId);
      onDeleted?.(characterId);
    } catch (err) {
      console.error("Character deletion error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete character.");
    } finally {
      setDeleting(false);
    }
  }, [deletePreflight.result, characterId, onDeleted, toast]);

  const handleReveal = useCallback(async () => {
    try {
      const code = await revealRecoveryCode(campaignId, characterId);
      setRevealedCode(code);
    } catch (err) {
      console.error("Failed to reveal recovery code:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load recovery code.");
    }
  }, [campaignId, characterId, toast]);

  const handleCopyCode = useCallback(async () => {
    if (!revealedCode) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(revealedCode);
      toast.success("Recovery code copied.");
    } catch (err) {
      console.error("Failed to copy recovery code:", err);
      toast.error("Failed to copy recovery code. Please copy it manually.");
    }
  }, [revealedCode, toast]);

  const handleRotate = useCallback(async (): Promise<boolean> => {
    setRotating(true);
    try {
      const newCode = await registerRecoveryCode(campaignId, characterId);
      setRevealedCode(newCode);
      toast.success("Recovery code rotated. Share the new code with the player.");
      return true;
    } catch (err) {
      console.error("Failed to rotate recovery code:", err);
      toast.error(err instanceof Error ? err.message : "Failed to rotate recovery code.");
      return false;
    } finally {
      setRotating(false);
    }
  }, [campaignId, characterId, toast]);

  const loadDeletePreflight = useCallback(async () => {
    setDeletePreflight({ loading: true });
    try {
      const result = await preflightCharacterDeletion(campaignId, characterId);
      setDeletePreflight({ loading: false, result });
    } catch (error) {
      setDeletePreflight({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to check this deletion.",
      });
    }
    setDeleteConfirmOpen(true);
  }, [campaignId, characterId]);

  return (
    <>
      <Link
        to={`/campaign/${campaignId}/character/${characterId}`}
        className={`${uiSection} relative block ${uiCardLinkFeedback}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <PortraitUpload
              campaignId={campaignId}
              characterId={characterId}
              currentPortraitUrl={portraitUrl}
              canEdit={false}
            />
            <div className="min-w-0">
              <span
                className={`font-semibold ${colourTextPrimary} text-sm lg:text-base leading-tight`}
              >
                {characterName}
              </span>
              <p className="text-xs lg:text-sm mt-0.5">
                {userId ? (
                  <span className={colourSuccessPlain}>Claimed</span>
                ) : (
                  <span className={uiTextPlaceholder}>Unclaimed</span>
                )}
              </p>
            </div>
          </div>

          {isDM && (
            <div className={`${uiInlineRow} shrink-0`}>
              <ChatMessageButton
                target={{ campaignId, characterId, playerAccountId: userId, characterName }}
              />
              <IconButton
                label={`Manage ${characterName}`}
                aria-haspopup="dialog"
                aria-expanded={manageOpen}
                onClick={(event) => {
                  event.preventDefault();
                  setManageOpen(true);
                }}
                icon={<GearIcon />}
              />
            </div>
          )}
        </div>
      </Link>

      {isDM && manageOpen && (
        <ManageModal
          title="Manage Character"
          ariaLabel={`Manage ${characterName}`}
          onClose={closeManage}
          suspended={showHistory || deleteConfirmOpen || revealedCode !== null}
          pending={(historyRequested && logsLoading) || deletePreflight.loading}
        >
          <ManageActionRow
            label="Recovery Code"
            info="Show this character's Recovery Code so its player can claim it."
          >
            <ViewButton label="Reveal recovery code" onClick={handleReveal} />
          </ManageActionRow>
          <ManageActionRow
            label="History"
            info="See when this character was claimed, released or reassigned."
          >
            <HistoryButton label="View history" onClick={() => setHistoryRequested(true)} />
          </ManageActionRow>
          <ManageActionRow
            label="Delete Character"
            info="Permanently delete this character and its data. This cannot be undone."
          >
            <RemoveButton label="Delete character" onClick={loadDeletePreflight} />
          </ManageActionRow>
        </ManageModal>
      )}

      {isDM && revealedCode && (
        <RevealCodeModal
          code={revealedCode}
          rotating={rotating}
          onCopy={handleCopyCode}
          onRotate={handleRotate}
          onClose={() => setRevealedCode(null)}
        />
      )}

      {isDM && deleteConfirmOpen && (
        <DeleteConfirmModal
          title="Delete Character"
          message={`This permanently deletes this character: ${characterName}. This cannot be undone.`}
          typedLabel="Type DELETE to permanently delete this character"
          error={deletePreflight.error}
          ready={Boolean(deletePreflight.result)}
          deleting={deleting}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* History modal */}
      {showHistory && (
        <ModalShell
          ariaLabel="Character history"
          onClose={() => setHistoryRequested(false)}
          className="max-w-xs lg:max-w-sm overflow-y-auto"
        >
          <ModalHeader title="History" onClose={() => setHistoryRequested(false)} />
          <div className={`p-4 lg:p-5 ${uiStackField}`}>
            {logsError ? (
              <p className={`text-xs lg:text-sm ${uiTextError}`}>
                Unable to load character history.
              </p>
            ) : logs.length === 0 ? (
              <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No history yet.</p>
            ) : (
              logs.map((log) => (
                <p key={log.id} className={uiTextMeta}>
                  <span className={colourTextPrimary}>{formatAction(log.action)}</span>
                  {log.timestamp && <span> · {formatTimestamp(log.timestamp)}</span>}
                </p>
              ))
            )}
          </div>
        </ModalShell>
      )}
    </>
  );
}
