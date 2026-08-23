// src/pages/CampaignOverview/CharacterRow.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Timestamp } from "firebase/firestore";
import { useClaimLogs } from "../../hooks/useClaimLogs";
import { useToast } from "../../components/Toast";
import { deleteCharacter } from "../../services/characterService";
import { uiSection } from "../../ui/editableStyles";
import { Button } from "../../ui/Button";
import { ConfirmInline } from "../../ui/ConfirmInline";
import { ModalHeader } from "../../ui/ModalHeader";
import { ModalShell } from "../../ui/ModalShell";
import type { ClaimLogAction } from "../../utils/claimLog";
import { PortraitUpload } from "../../components/PortraitUpload";

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
  recoveryCode,
  portraitUrl,
  isDM,
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
  userId: string | null;
  recoveryCode?: string;
  portraitUrl?: string;
  isDM: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const {
    logs,
    loading: logsLoading,
    error: logsError,
  } = useClaimLogs(campaignId, characterId, showHistory && isDM);
  const toast = useToast();

  const handleDelete = useCallback(async () => {
    if (!recoveryCode) return;
    try {
      await deleteCharacter(campaignId, characterId, recoveryCode);
    } catch (err) {
      console.error("Character deletion error:", err);
      toast.error("Failed to delete character.");
    }
  }, [campaignId, characterId, recoveryCode, toast]);

  return (
    <>
      <Link
        to={`/campaign/${campaignId}/character/${characterId}`}
        className={uiSection + " block hover:bg-slate-800 transition-colors"}
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
              <span className="font-semibold text-slate-100 text-sm lg:text-base leading-tight">
                {characterName}
              </span>
              <p className="text-xs lg:text-sm text-slate-500 font-code [font-feature-settings:'zero'] mt-0.5">
                Recovery: {recoveryCode ?? "—"}
              </p>
              <p className="text-xs lg:text-sm mt-0.5">
                {userId ? (
                  <span className="text-green-400">Claimed</span>
                ) : (
                  <span className="text-slate-500">Unclaimed</span>
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
                  setShowHistory(true);
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
                  onConfirm={handleDelete}
                />
              </>
            )}
          </div>
        </div>
      </Link>

      {/* History modal */}
      {showHistory && (
        <ModalShell
          ariaLabel="Character history"
          onClose={() => setShowHistory(false)}
          className="max-w-xs lg:max-w-sm overflow-y-auto"
        >
          <ModalHeader title="History" onClose={() => setShowHistory(false)} />
          <div className="p-4 lg:p-5 space-y-1">
            {logsError ? (
              <p className="text-xs lg:text-sm text-red-400">Unable to load character history.</p>
            ) : logsLoading ? (
              <p className="text-xs lg:text-sm text-slate-500">Loading history…</p>
            ) : logs.length === 0 ? (
              <p className="text-xs lg:text-sm text-slate-500">No history yet.</p>
            ) : (
              logs.map((log) => (
                <p key={log.id} className="text-xs lg:text-sm text-slate-400">
                  <span className="text-slate-200">{formatAction(log.action)}</span>
                  {log.timestamp && (
                    <span className="text-slate-600"> · {formatTimestamp(log.timestamp)}</span>
                  )}
                </p>
              ))
            )}
          </div>
        </ModalShell>
      )}
    </>
  );
}
