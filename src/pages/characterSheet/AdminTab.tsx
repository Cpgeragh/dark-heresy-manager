// src/pages/characterSheet/AdminTab.tsx

import { useCallback, useState } from "react";
import type { Character } from "../../types/Character";
import type { ClaimLog } from "../../types/ClaimLog";
import { Button } from "../../ui/Button";
import { uiSection, readOnlyBadgeClass } from "../../ui/editableStyles";
import { useXpProposals } from "../../hooks/useXpProposals";
import { approveXpProposal, rejectXpProposal } from "../../services/xpService";
import { useToast } from "../../components/Toast";
import { ErrorState } from "../../ui/ErrorState";
import { LoadingState } from "../../ui/LoadingState";
import { PlayerPicker } from "./PlayerPicker";

interface AdminTabProps {
  character: Character;
  /** Current owner's first name, derived from their account profile. */
  ownerName: string | null;
  claimLog: ClaimLog[];
  onDMForceRelease: () => void;
  onDMForceAssign: (targetUid: string) => void;
  onDMToggleEdit: () => void;
  isDmForceReleasing?: boolean;
  isDmForceAssigning?: boolean;
  isDmTogglingEdit?: boolean;
  campaignId: string;
  characterId: string;
  memberIds: string[];
}

export function AdminTab({
  character,
  ownerName,
  claimLog,
  onDMForceRelease,
  onDMForceAssign,
  onDMToggleEdit,
  isDmForceReleasing = false,
  isDmForceAssigning = false,
  isDmTogglingEdit = false,
  campaignId,
  characterId,
  memberIds,
}: AdminTabProps) {
  const toast = useToast();
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const { proposals, loading: proposalsLoading, error: proposalsError } = useXpProposals(
    campaignId,
    characterId
  );
  const pendingProposals = proposals.filter((p) => p.status === "pending");

  const handleApprove = useCallback(
    async (proposalId: string, xpCost: number) => {
      try {
        await approveXpProposal(campaignId, characterId, proposalId, xpCost);
        toast.success("Proposal approved.");
      } catch (err) {
        console.error("Failed to approve XP proposal:", err);
        toast.error("Failed to approve proposal. Please try again.");
      }
    },
    [campaignId, characterId, toast]
  );

  const handleReject = useCallback(
    async (proposalId: string) => {
      try {
        await rejectXpProposal(campaignId, characterId, proposalId);
        toast.success("Proposal rejected.");
      } catch (err) {
        console.error("Failed to reject XP proposal:", err);
        toast.error("Failed to reject proposal. Please try again.");
      }
    },
    [campaignId, characterId, toast]
  );

  const latest = claimLog.length > 0 ? claimLog[0] : null;
  // Show the current owner's real name when the character is claimed; fall back
  // to the actor UID for unclaimed characters or events with no resolvable name.
  const latestActorLabel = (character.userId && ownerName) || latest?.actorUid;

  return (
    <div className="space-y-6">
      {/* CONTEXT NOTE */}
      <p className="text-xs lg:text-sm text-slate-400">
        DM-only controls. Changes here immediately affect player access.
      </p>

      {/* LATEST EVENT */}
      {latest && (
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
          <Button
            variant="danger"
            onClick={onDMForceRelease}
            disabled={isDmForceReleasing}
          >
            {isDmForceReleasing ? "Releasing…" : "Force Release Ownership"}
          </Button>

          <Button
            variant="warning"
            onClick={onDMToggleEdit}
            disabled={isDmTogglingEdit}
          >
            {isDmTogglingEdit ? "Updating…" : "Toggle Player Edit Permission"}
          </Button>

          <Button
            variant="warning"
            onClick={() => setShowPlayerPicker(true)}
            disabled={isDmForceAssigning || memberIds.length === 0}
          >
            {isDmForceAssigning ? "Assigning…" : "Force Assign To…"}
          </Button>
        </div>
      </section>

      {showPlayerPicker && (
        <PlayerPicker
          memberIds={memberIds}
          onSelect={(uid) => {
            onDMForceAssign(uid);
            setShowPlayerPicker(false);
          }}
          onClose={() => setShowPlayerPicker(false)}
        />
      )}

      {/* PENDING XP PROPOSALS */}
      <section className={uiSection}>
        <h3 className="font-semibold mb-2">Pending XP Proposals</h3>

        {proposalsError ? (
          <ErrorState>Unable to load XP proposals.</ErrorState>
        ) : proposalsLoading ? (
          <LoadingState>Loading XP proposals…</LoadingState>
        ) : pendingProposals.length === 0 ? (
          <p className="text-sm lg:text-base text-slate-400">No pending proposals.</p>
        ) : (
          <ul className="space-y-2">
            {pendingProposals.map((p) => (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border border-slate-500 rounded px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base"
              >
                <div>
                  <span className="text-slate-200">{p.description}</span>
                  <span className="text-slate-400 ml-2">— {p.xpCost} XP</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(p.id, p.xpCost)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(p.id)}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* CLAIM HISTORY */}
      <section className={uiSection}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Claim History</h3>
          <span className={readOnlyBadgeClass}>Immutable</span>
        </div>

        {claimLog.length === 0 && (
          <p className="text-sm lg:text-base text-slate-400">No claim events recorded yet.</p>
        )}

        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {claimLog.map((entry, i) => {
            const when =
              typeof entry.timestamp === "number"
                ? new Date(entry.timestamp).toLocaleString()
                : "Unknown time";

            return (
              <li
                key={entry.id ?? i}
                className={uiSection + " text-xs lg:text-sm"}
              >
                <div className="font-code text-slate-200">
                  {entry.action} @ {when}
                </div>

                <div className="text-slate-400">
                  Actor: <span className="font-code break-all">{entry.actorUid}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
