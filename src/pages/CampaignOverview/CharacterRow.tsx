// src/pages/CampaignOverview/CharacterRow.tsx

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useClaimLogs } from "../../hooks/useClaimLogs";
import { useToast } from "../../components/Toast";
import { cloneCharacter, deleteCharacter } from "../../services/characterService";

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

  const latest = logs.length > 0 ? logs[0] : null;

  const handleClone = useCallback(async () => {
    try {
      const cloneName = await cloneCharacter(campaignId, characterId);
      toast.success(`Character cloned as "${cloneName}"`);
    } catch (err) {
      console.error("Character clone error:", err);
      toast.error("Failed to clone character.");
    }
  }, [campaignId, characterId, toast]);

  const handleDelete = useCallback(async () => {
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
    <div className="border border-slate-700 p-4 rounded bg-slate-900/40">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{characterName}</h2>
          <p className="text-xs text-slate-400">
            Owner UID: <code>{userId ?? "Unclaimed"}</code>
          </p>
          {latest && (
            <p className="text-xs text-slate-300 mt-1">
              Last event: {latest.action} by {latest.actorUid}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/campaign/${campaignId}/character/${characterId}`}
            className="px-3 py-1 rounded bg-amber-500 text-black text-sm border border-amber-400 hover:bg-amber-400"
          >
            Open Sheet
          </Link>
          {isDM && (
            <>
              <button
                onClick={handleClone}
                className="px-3 py-1 text-xs rounded bg-slate-600 text-slate-200 hover:bg-slate-500"
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
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1 text-xs rounded bg-red-900/60 text-red-400 hover:bg-red-800/60"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
