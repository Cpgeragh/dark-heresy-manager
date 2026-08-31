// src/pages/characterSheet/AdminTab.tsx

import { useState } from "react";
import type { Character } from "../../types/Character";
import { useClaimLogs } from "../../hooks/useClaimLogs";
import { Button } from "../../ui/Button";
import { ErrorState } from "../../ui/ErrorState";
import { LoadingState } from "../../ui/LoadingState";
import { uiSection, readOnlyBadgeClass } from "../../ui/editableStyles";
import { PlayerPicker } from "./PlayerPicker";

interface AdminTabProps {
  campaignId: string;
  character: Character;
  /** Current owner's first name, derived from their account profile. */
  ownerName: string | null;
  onDMForceRelease: () => void;
  onDMForceAssign: (targetUid: string) => void;
  onDMToggleEdit: () => void;
  isDmForceReleasing?: boolean;
  isDmForceAssigning?: boolean;
  isDmTogglingEdit?: boolean;
  memberIds: string[];
}

export function AdminTab({
  campaignId,
  character,
  ownerName,
  onDMForceRelease,
  onDMForceAssign,
  onDMToggleEdit,
  isDmForceReleasing = false,
  isDmForceAssigning = false,
  isDmTogglingEdit = false,
  memberIds,
}: AdminTabProps) {
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [showClaimHistory, setShowClaimHistory] = useState(false);
  const {
    logs: claimLog,
    loading: claimLogLoading,
    error: claimLogError,
  } = useClaimLogs(campaignId, character.id, showClaimHistory);

  const latest = claimLog.length > 0 ? claimLog[0] : null;
  const eligibleMemberIds = memberIds.filter((uid) => uid !== character.userId);
  const canAssign = character.userId === null && eligibleMemberIds.length > 0;
  // Show the current owner's real name when the character is claimed; fall back
  // to the actor UID for unclaimed characters or events with no resolvable name.
  const latestActorLabel = (character.userId && ownerName) || latest?.actorUid;

  return (
    <div className="space-y-6">
      {/* CONTEXT NOTE */}
      <p className="text-xs lg:text-sm text-slate-400">
        DM-only controls. Changes here immediately affect player access.
      </p>

      {/* LATEST EVENT — available only after the DM deliberately opens History. */}
      {showClaimHistory && latest && (
        <p className="text-xs lg:text-sm text-slate-400">
          Last ownership event:{" "}
          <span className="font-code text-slate-300">
            {latest.action} by {latestActorLabel}
          </span>
        </p>
      )}

      {/* OWNERSHIP */}
      <section className={uiSection}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-red-300">Ownership</h3>
          <span className={readOnlyBadgeClass}>DM authority</span>
        </div>

        <div className="space-y-1 text-sm lg:text-base">
          <div>
            Current owner:{" "}
            <span className="text-slate-200">
              {character.userId ? (ownerName ?? "Unknown player") : "None (unclaimed)"}
            </span>
          </div>

          {character.userId && (
            <div>
              Owner UID:{" "}
              <span className="font-code text-slate-200 break-all">{character.userId}</span>
            </div>
          )}

          <div>
            Player editable:{" "}
            <span className="font-code text-slate-200">
              {character.isEditableByPlayer ? "true" : "false"}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="danger" onClick={onDMForceRelease} disabled={isDmForceReleasing}>
            {isDmForceReleasing ? "Releasing…" : "Force Release Ownership"}
          </Button>

          <Button variant="warning" onClick={onDMToggleEdit} disabled={isDmTogglingEdit}>
            {isDmTogglingEdit ? "Updating…" : "Toggle Player Edit Permission"}
          </Button>

          <Button
            variant="warning"
            onClick={() => setShowPlayerPicker(true)}
            disabled={isDmForceAssigning || !canAssign}
          >
            {isDmForceAssigning ? "Assigning…" : "Force Assign To…"}
          </Button>
        </div>
      </section>

      {showPlayerPicker && canAssign && (
        <PlayerPicker
          memberIds={eligibleMemberIds}
          onSelect={(uid) => {
            onDMForceAssign(uid);
            setShowPlayerPicker(false);
          }}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}

      {/* CLAIM HISTORY */}
      <section className={uiSection}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Claim History</h3>
          <span className={readOnlyBadgeClass}>Immutable</span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          aria-expanded={showClaimHistory}
          onClick={() => setShowClaimHistory((visible) => !visible)}
        >
          {showClaimHistory ? "Close History" : "Open History"}
        </Button>

        {showClaimHistory && (
          <div className="mt-3">
            {claimLogError ? (
              <ErrorState>Unable to load claim history.</ErrorState>
            ) : claimLogLoading ? (
              <LoadingState>Loading claim history…</LoadingState>
            ) : claimLog.length === 0 ? (
              <p className="text-sm lg:text-base text-slate-400">No claim events recorded yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {claimLog.map((entry, index) => (
                  <li key={entry.id ?? index} className={uiSection + " text-xs lg:text-sm"}>
                    <div className="font-code text-slate-200">
                      {entry.action} @
                      {entry.timestamp && "toDate" in entry.timestamp
                        ? ` ${entry.timestamp.toDate().toLocaleString()}`
                        : " Unknown time"}
                    </div>

                    <div className="text-slate-400">
                      Actor: <span className="font-code break-all">{entry.actorUid}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
