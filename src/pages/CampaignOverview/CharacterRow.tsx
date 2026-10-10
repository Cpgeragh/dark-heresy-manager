// src/pages/CampaignOverview/CharacterRow.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Timestamp } from "firebase/firestore";
import { useClaimLogs } from "../../hooks/useClaimLogs";
import { useToast } from "../../components/Toast";
import {
  deleteCharacter,
  preflightCharacterDeletion,
  revealRecoveryCode,
} from "../../services/characterService";
import {
  uiSection,
  uiTextError,
  uiTextPlaceholder,
  uiTextMeta,
} from "../../ui/styles/editableStyles";
import {
  colourSuccessPlain,
  colourMetadataLabelText,
  colourTextPrimary,
} from "../../ui/styles/colourTokens";
import { Button } from "../../ui/buttons/Button";
import { RevealCodeButton } from "../../ui/buttons/RevealCodeButton";
import { PendingOverlay } from "../../ui/PendingOverlay";
import { ConfirmInline } from "../../ui/forms/ConfirmInline";
import { ModalHeader } from "../../ui/modals/ModalHeader";
import { ModalShell } from "../../ui/modals/ModalShell";
import type { ClaimLogAction } from "shared-rules";
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
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
  userId: string | null;
  portraitUrl?: string;
  isDM: boolean;
}) {
  recordComponentRender("CharacterRow");
  const [historyRequested, setHistoryRequested] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
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

  const handleDelete = useCallback(async () => {
    if (!deletePreflight.result) return;
    try {
      await deleteCharacter(deletePreflight.result.jobId);
    } catch (err) {
      console.error("Character deletion error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete character.");
    }
  }, [deletePreflight.result, toast]);

  const handleReveal = useCallback(async () => {
    setRevealing(true);
    try {
      const code = await revealRecoveryCode(campaignId, characterId);
      setRevealedCode(code);
    } catch (err) {
      console.error("Failed to reveal recovery code:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load recovery code.");
    } finally {
      setRevealing(false);
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
  }, [campaignId, characterId]);

  const deleteDetails = deletePreflight.error ? (
    <span className={`text-xs ${uiTextError}`}>{deletePreflight.error}</span>
  ) : deletePreflight.result ? (
    <span className={`text-xs ${colourMetadataLabelText}`}>
      {`This permanently deletes ${deletePreflight.result.totalCount} document${deletePreflight.result.totalCount === 1 ? "" : "s"}.`}
    </span>
  ) : null;

  return (
    <>
      <Link
        to={`/campaign/${campaignId}/character/${characterId}`}
        className={uiSection + " relative block hover:bg-slate-800 transition-colors"}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <PortraitUpload
              campaignId={campaignId}
              characterId={characterId}
              currentPortraitUrl={portraitUrl}
              canEdit={false}
            />
            <div>
              <span
                className={`font-semibold ${colourTextPrimary} text-sm lg:text-base leading-tight`}
              >
                {characterName}
              </span>
              <p className={`${uiTextMeta} font-code [font-feature-settings:'zero'] mt-0.5`}>
                Recovery:{" "}
                {revealedCode ?? <RevealCodeButton revealing={revealing} onReveal={handleReveal} />}
              </p>
              <p className="text-xs lg:text-sm mt-0.5">
                {userId ? (
                  <span className={colourSuccessPlain}>Claimed</span>
                ) : (
                  <span className={uiTextPlaceholder}>Unclaimed</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 justify-center sm:justify-start">
            {isDM && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setHistoryRequested(true);
                }}
              >
                History
              </Button>
            )}

            {isDM && (
              <>
                <ConfirmInline
                  triggerLabel="Delete"
                  question="Delete?"
                  size="sm"
                  onArm={loadDeletePreflight}
                  details={deleteDetails}
                  confirmDisabled={deletePreflight.loading || !deletePreflight.result}
                  onConfirm={handleDelete}
                  busyLabel="Deleting"
                />
              </>
            )}
          </div>
        </div>
        <PendingOverlay active={(historyRequested && logsLoading) || deletePreflight.loading} />
      </Link>

      {/* History modal */}
      {showHistory && (
        <ModalShell
          ariaLabel="Character history"
          onClose={() => setHistoryRequested(false)}
          className="max-w-xs lg:max-w-sm overflow-y-auto"
        >
          <ModalHeader title="History" onClose={() => setHistoryRequested(false)} />
          <div className="p-4 lg:p-5 space-y-1">
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
