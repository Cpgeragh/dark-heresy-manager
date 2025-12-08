// src/pages/characterSheet/AdminTab.tsx
import { useState } from "react";
import type { Character, ClaimLogEntry } from "./types";

interface AdminTabProps {
  character: Character;
  claimLog: ClaimLogEntry[];
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

  return (
    <div className="space-y-4 text-slate-300">
      <h2 className="text-xl font-semibold mb-2">Admin</h2>

      <div className="p-3 rounded border border-red-600 bg-red-900/30">
        <h3 className="font-semibold text-red-300 mb-2">Ownership</h3>
        <p className="text-sm mb-1">
          Current owner UID:{" "}
          <span className="font-mono">
            {character.userId || "None (unclaimed)"}
          </span>
        </p>
        <p className="text-sm mb-3">
          Player editable:{" "}
          <span className="font-mono">
            {character.isEditableByPlayer ? "true" : "false"}
          </span>
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={onDMForceRelease}
            className="px-3 py-1 bg-red-700 text-white rounded border border-red-500 hover:bg-red-600"
          >
            Force Release Ownership
          </button>

          <button
            onClick={onDMToggleEdit}
            className="px-3 py-1 bg-yellow-600 text-black rounded border border-yellow-500 hover:bg-yellow-500"
          >
            Toggle Player Edit Permission
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={assignUID}
            onChange={(e) => setAssignUID(e.target.value)}
            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-slate-100 font-mono text-xs"
            placeholder="Enter player UID"
          />
          <button
            onClick={() => onDMForceAssign(assignUID)}
            className="px-3 py-1 bg-blue-600 text-white rounded border border-blue-500 hover:bg-blue-500 text-sm"
          >
            Assign to Player
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Claim History</h3>
        {claimLog.length === 0 && (
          <p className="text-sm text-slate-400">
            No claim events recorded yet.
          </p>
        )}

        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {claimLog.map((entry) => {
            const ts = entry.timestamp;
            let when = "Unknown time";
            if (ts && ts.toDate) {
              when = ts.toDate().toLocaleString();
            }
            return (
              <li
                key={entry.id}
                className="border border-slate-700 rounded p-2 bg-slate-900/60 text-xs"
              >
                <div className="font-mono text-slate-200">
                  {entry.action} @ {when}
                </div>
                <div className="text-slate-400">
                  Actor: <span className="font-mono">{entry.actorUid}</span>
                </div>
                <div className="text-slate-400">
                  From:{" "}
                  <span className="font-mono">
                    {entry.previousOwnerUid || "none"}
                  </span>{" "}
                  → To:{" "}
                  <span className="font-mono">
                    {entry.newOwnerUid || "none"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}