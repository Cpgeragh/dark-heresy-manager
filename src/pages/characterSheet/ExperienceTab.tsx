import { useState, useCallback, useMemo } from "react";
import type { ExperienceBlock } from "../../types/Character";
import {
  sectionContainerClass,
  readOnlyBadgeClass,
} from "../../ui/editableStyles";
import { useXpProposals } from "../../hooks/useXpProposals";
import { proposeXpSpend } from "../../services/xpService";
import { useToast } from "../../components/Toast/ToastContext";

interface ExperienceTabProps {
  experience: ExperienceBlock;
  campaignId: string;
  characterId: string;
  isOwnedByCurrentPlayer: boolean;
}

export function ExperienceTab({
  experience,
  campaignId,
  characterId,
  isOwnedByCurrentPlayer,
}: ExperienceTabProps) {
  const { error: toastError, success: toastSuccess } = useToast();
  const remaining = experience.total - experience.spent;
  const { proposals } = useXpProposals(campaignId, characterId);
  const [description, setDescription] = useState("");
  const [xpCost, setXpCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const pendingProposals = useMemo(() => proposals.filter((p) => p.status === "pending"), [proposals]);
  const resolvedProposals = useMemo(() => proposals.filter((p) => p.status !== "pending"), [proposals]);

  const handlePropose = useCallback(async () => {
    if (!description.trim() || xpCost <= 0) return;

    setSubmitting(true);
    try {
      await proposeXpSpend(campaignId, characterId, description.trim(), xpCost);
      setDescription("");
      setXpCost(0);
      toastSuccess("Proposal submitted.");
    } catch (err) {
      console.error("XP proposal error:", err);
      toastError("Failed to submit proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [campaignId, characterId, description, xpCost]);

  return (
    <div className="space-y-6 text-slate-300">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Experience</h2>
        <span className={readOnlyBadgeClass()}>Read-only</span>
      </div>

      {/* SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={sectionContainerClass(false) + " text-center"}>
          <div className="text-xs text-slate-400 mb-1">Total XP</div>
          <div className="text-2xl font-semibold font-mono text-slate-100">
            {experience.total}
          </div>
        </div>

        <div className={sectionContainerClass(false) + " text-center"}>
          <div className="text-xs text-slate-400 mb-1">Spent XP</div>
          <div className="text-2xl font-semibold font-mono text-slate-100">
            {experience.spent}
          </div>
        </div>

        <div className={sectionContainerClass(false) + " text-center"}>
          <div className="text-xs text-slate-400 mb-1">Remaining XP</div>
          <div
            className={`text-2xl font-semibold font-mono ${
              remaining < 0 ? "text-red-400" : "text-slate-100"
            }`}
          >
            {remaining}
          </div>
        </div>
      </section>

      {/* PURCHASED ADVANCES */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-200">
          Purchased Advances
        </h3>

        {experience.ranks.length === 0 && (
          <p className="text-sm text-slate-400">
            No advances purchased yet.
          </p>
        )}

        <div className="space-y-4">
          {experience.ranks.map((rankBlock) => (
            <div
              key={rankBlock.rank}
              className={sectionContainerClass(false)}
            >
              <h4 className="text-sm font-semibold text-slate-300 mb-2">
                Rank {rankBlock.rank}
              </h4>

              {rankBlock.advances.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No advances at this rank.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rankBlock.advances.map((adv) => (
                    <li
                      key={adv.id}
                      className="rounded border border-slate-700 bg-slate-900/60 p-3"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="font-mono text-sm text-slate-100">
                          {adv.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {adv.cost} XP
                        </div>
                      </div>

                      {adv.notes && (
                        <div className="mt-1 text-xs text-slate-400">
                          {adv.notes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* XP PROPOSALS — player only */}
      {isOwnedByCurrentPlayer && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-200">Propose XP Spend</h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              placeholder="What are you buying?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Cost"
                value={xpCost}
                onChange={(e) => setXpCost(Math.max(0, Number(e.target.value)))}
                className="w-24 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm"
              />
              <button
                onClick={handlePropose}
                disabled={submitting || !description.trim() || xpCost <= 0}
                className="px-3 py-1 bg-amber-500 text-slate-900 font-semibold rounded text-sm disabled:opacity-50"
              >
                {submitting ? "…" : "Propose"}
              </button>
            </div>
          </div>

          {pendingProposals.length === 0 && resolvedProposals.length === 0 && (
            <p className="text-sm text-slate-400">No proposals yet.</p>
          )}

          {pendingProposals.length > 0 && (
            <div className="space-y-2">
              {pendingProposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-slate-700 rounded px-3 py-2 text-sm"
                >
                  <span>{p.description} — {p.xpCost} XP</span>
                  <span className="text-slate-400">pending</span>
                </div>
              ))}
            </div>
          )}

          {resolvedProposals.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {showHistory ? "Hide" : "Show"} history ({resolvedProposals.length})
              </button>

              {showHistory && (
                <div className="space-y-2">
                  {resolvedProposals.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border border-slate-700/50 rounded px-3 py-2 text-sm opacity-60"
                    >
                      <span>{p.description} — {p.xpCost} XP</span>
                      <span className={p.status === "approved" ? "text-green-400" : "text-red-400"}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}