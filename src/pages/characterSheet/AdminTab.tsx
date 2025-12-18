// src/pages/characterSheet/AdminTab.tsx

import { useState, useCallback } from "react";
import type { Character } from "../../types/Character";
import type { ClaimLog } from "../../types/ClaimLog";
import {
  editableInputClass,
  sectionContainerClass,
  readOnlyBadgeClass,
} from "../../ui/editableStyles";

interface AdminTabProps {
  character: Character;
  claimLog: ClaimLog[];
  onDMForceRelease: () => void;
  onDMForceAssign: (uid: string) => void;
  onDMToggleEdit: () => void;
}

export function AdminTab({
  character,
  claimLog,
  onDMForceRelease,
  onDMForceAssign,
  onDMToggleEdit,
}: AdminTabProps) {
  const [assignUID, setAssignUID] = useState("");

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
            <span className="font-mono text-slate-200">
              {character.userId ?? "None (unclaimed)"} {/* FIXED: Changed from || to ?? */}
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
            className="px-3 py-1 text-sm rounded border
                       bg-red-700 border-red-500 text-white
                       hover:bg-red-600"
          >
            Force Release Ownership
          </button>

          <button
            onClick={onDMToggleEdit}
            className="px-3 py-1 text-sm rounded border
                       bg-yellow-600 border-yellow-500 text-black
                       hover:bg-yellow-500"
          >
            Toggle Player Edit Permission
          </button>
        </div>

        {/* FORCE ASSIGN */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <input
            value={assignUID}
            onChange={handleAssignUIDChange}
            placeholder="Enter player UID"
            className={editableInputClass(true) + " font-mono text-xs max-w-xs"}
          />

          <button
            onClick={handleForceAssign}
            className="px-3 py-1 text-sm rounded border
                       bg-blue-600 border-blue-500 text-white
                       hover:bg-blue-500"
          >
            Assign to Player
          </button>
        </div>
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
                  <span className="font-mono">
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