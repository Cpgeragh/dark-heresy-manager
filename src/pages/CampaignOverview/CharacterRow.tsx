// src/pages/CampaignOverview/CharacterRow.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Timestamp } from "firebase/firestore";
import { useClaimLogs } from "../../hooks/useClaimLogs";
import { useToast } from "../../components/Toast";
import { cloneCharacter, deleteCharacter } from "../../services/characterService";
import { uiSection } from "../../ui/editableStyles";
import type { ClaimLogAction } from "../../utils/claimLog";

function formatAction(action: ClaimLogAction): string {
  switch (action) {
    case "claim": return "Claimed";
    case "release": return "Released";
    case "force-assign": return "Force assigned";
    case "force-release": return "Force released";
  }
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return "";
  if (ts && typeof (ts as Timestamp).toDate === "function") {
    return (ts as Timestamp).toDate().toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric",
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
  isDM,
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
  userId: string | null;
  recoveryCode?: string;
  isDM: boolean;
}) {
  const { logs } = useClaimLogs(campaignId, characterId);
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleClone = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const cloneName = await cloneCharacter(campaignId, characterId);
      toast.success(`Character cloned as "${cloneName}"`);
    } catch (err) {
      console.error("Character clone error:", err);
      toast.error("Failed to clone character.");
    }
  }, [campaignId, characterId, toast]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recoveryCode) return;
    try {
      await deleteCharacter(campaignId, characterId, recoveryCode);
      setConfirmDelete(false);
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
          <div>
            <span className="font-semibold text-slate-100 text-sm leading-tight">{characterName}</span>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Recovery: {recoveryCode ?? "—"}</p>
            <p className="text-xs mt-0.5">
              {userId
                ? <span className="text-green-400">Claimed</span>
                : <span className="text-slate-500">Unclaimed</span>
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 justify-center sm:justify-start">
            <button
              onClick={(e) => { e.preventDefault(); setShowHistory(true); }}
              className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
            >
              History
            </button>

            {isDM && (
              <>
                <button
                  onClick={handleClone}
                  className="text-xs px-2 py-1 bg-amber-900/40 text-amber-400 rounded hover:bg-amber-900/70"
                >
                  Clone
                </button>
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-red-400">Delete?</span>
                    <button
                      onClick={handleDelete}
                      className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setConfirmDelete(false); }}
                      className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); setConfirmDelete(true); }}
                    className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded hover:bg-red-900/70"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </Link>

      {/* History modal */}
      {showHistory && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 pointer-events-auto w-80 max-w-[90vw]">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-100 text-center flex-1">History</p>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none transition"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500">No history yet.</p>
                ) : (
                  logs.map((log) => (
                    <p key={log.id} className="text-xs text-slate-400">
                      <span className="text-slate-200">{formatAction(log.action)}</span>
                      {log.timestamp && (
                        <span className="text-slate-600"> · {formatTimestamp(log.timestamp)}</span>
                      )}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
