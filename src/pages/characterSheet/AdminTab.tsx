// src/pages/characterSheet/AdminTab.tsx

import { useState, useCallback } from "react";
import { doc, increment, updateDoc, writeBatch } from "firebase/firestore";
import type { Character } from "../../types/Character";
import type { ClaimLog } from "../../types/ClaimLog";
import {
  editableInputClass,
  sectionContainerClass,
  readOnlyBadgeClass,
} from "../../ui/editableStyles";
import { db } from "../../firebase";
import { useXpProposals } from "../../hooks/useXpProposals";

interface AdminTabProps {
  character: Character;
  claimLog: ClaimLog[];
  onDMForceRelease: () => void;
  onDMForceAssign: (uid: string) => void;
  onDMToggleEdit: () => void;
  isDmForceReleasing?: boolean;
  isDmForceAssigning?: boolean;
  isDmTogglingEdit?: boolean;
  campaignId: string;
  characterId: string;
}

export function AdminTab({
  character,
  claimLog,
  onDMForceRelease,
  onDMForceAssign,
  onDMToggleEdit,
  isDmForceReleasing = false,
  isDmForceAssigning = false,
  isDmTogglingEdit = false,
  campaignId,
  characterId,
}: AdminTabProps) {
  const [assignUID, setAssignUID] = useState("");
  const { proposals } = useXpProposals(campaignId, characterId);
  const pendingProposals = proposals.filter((p) => p.status === "pending");

  const handleApprove = useCallback(async (proposalId: string, xpCost: number) => {
    const batch = writeBatch(db);
    batch.update(
      doc(db, "campaigns", campaignId, "characters", characterId, "xpProposals", proposalId),
      { status: "approved" }
    );
    batch.update(
      doc(db, "campaigns", campaignId, "characters", characterId),
      { "experience.spent": increment(xpCost) }
    );
    await batch.commit();
  }, [campaignId, characterId]);

  const handleReject = useCallback(async (proposalId: string) => {
    await updateDoc(
      doc(db, "campaigns", campaignId, "characters", characterId, "xpProposals", proposalId),
      { status: "rejected" }
    );
  }, [campaignId, characterId]);

  const handleAssignUIDChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAssignUID(e.target.value);
  }, []);

  const handleForceAssign = useCallback(() => {
    const clean = assignUID.trim();
    if (clean) {
      onDMForceAssign(clean);
    }
  }, [assignUID, onDMForceAssign]);

  const latest = claimLog.length > 0 ? claimLog[0] : null;

  return (
    <div className="space-y-6 text-slate-300">
      <h2 className="text-xl font-semibold">Admin</h2>

      {/* CONTEXT NOTE */}
      <p className="text-xs text-slate-400">
        DM-only controls. Changes here immediately affect player access.
      </p>

      {/* LATEST EVENT */}
      {latest && (
        <p className="text-xs text-slate-400">
          Last ownership event:{" "}
          <span className="font-mono text-slate-300">
            {latest.action} by {latest.actorUid}
          </span>
        </p>
      )}

      {/* OWNERSHIP */}
      <section className={sectionContainerClass(true)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-red-300">Ownership</h3>
          <span className={readOnlyBadgeClass()}>
            DM authority
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <div>
            Current owner UID:{" "}
            <span className="font-mono text-slate-200 break-all">
              {character.userId ?? "None (unclaimed)"}
            </span>
          </div>

          <div>
            Player editable:{" "}
            <span className="font-mono text-slate-200">
              {character.isEditableByPlayer ? "true" : "false"}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={onDMForceRelease}
            disabled={isDmForceReleasing}
            className={`px-3 py-1 text-sm rounded border transition ${
              isDmForceReleasing
                ? "bg-red-900 border-red-800 text-red-300 cursor-wait"
                : "bg-red-700 border-red-500 text-white hover:bg-red-600"
            }`}
          >
            {isDmForceReleasing ? "Releasing..." : "Force Release Ownership"}
          </button>

          <button
            onClick={onDMToggleEdit}
            disabled={isDmTogglingEdit}
            className={`px-3 py-1 text-sm rounded border transition ${
              isDmTogglingEdit
                ? "bg-yellow-800 border-yellow-700 text-yellow-900 cursor-wait"
                : "bg-yellow-600 border-yellow-500 text-black hover:bg-yellow-500"
            }`}
          >
            {isDmTogglingEdit ? "Updating..." : "Toggle Player Edit Permission"}
          </button>
        </div>

        {/* FORCE ASSIGN */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <input
            value={assignUID}
            onChange={handleAssignUIDChange}
            placeholder="Enter player UID"
            disabled={isDmForceAssigning}
            className={editableInputClass(!isDmForceAssigning) + " font-mono text-xs max-w-xs"}
          />

          <button
            onClick={handleForceAssign}
            disabled={isDmForceAssigning}
            className={`px-3 py-1 text-sm rounded border transition ${
              isDmForceAssigning
                ? "bg-blue-800 border-blue-700 text-blue-300 cursor-wait"
                : "bg-blue-600 border-blue-500 text-white hover:bg-blue-500"
            }`}
          >
            {isDmForceAssigning ? "Assigning..." : "Assign to Player"}
          </button>
        </div>
      </section>

      {/* PENDING XP PROPOSALS */}
      <section className={sectionContainerClass(false)}>
        <h3 className="font-semibold mb-2">Pending XP Proposals</h3>

        {pendingProposals.length === 0 ? (
          <p className="text-sm text-slate-400">No pending proposals.</p>
        ) : (
          <ul className="space-y-2">
            {pendingProposals.map((p) => (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border border-slate-700 rounded px-3 py-2 text-sm"
              >
                <div>
                  <span className="text-slate-200">{p.description}</span>
                  <span className="text-slate-400 ml-2">— {p.xpCost} XP</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(p.id, p.xpCost)}
                    className="px-2 py-1 text-xs rounded bg-green-700 text-white hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="px-2 py-1 text-xs rounded bg-red-800 text-red-200 hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CLAIM HISTORY */}
      <section className={sectionContainerClass(false)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Claim History</h3>
          <span className={readOnlyBadgeClass()}>
            Immutable
          </span>
        </div>

        {claimLog.length === 0 && (
          <p className="text-sm text-slate-400">
            No claim events recorded yet.
          </p>
        )}

        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {claimLog.map((entry) => {
            const when =
              typeof entry.timestamp === "number"
                ? new Date(entry.timestamp).toLocaleString()
                : "Unknown time";

            return (
              <li
                key={entry.id ?? crypto.randomUUID()}
                className="rounded border border-slate-700
                           bg-slate-900/60 p-2 text-xs"
              >
                <div className="font-mono text-slate-200">
                  {entry.action} @ {when}
                </div>

                <div className="text-slate-400">
                  Actor:{" "}
                  <span className="font-mono break-all">
                    {entry.actorUid}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}