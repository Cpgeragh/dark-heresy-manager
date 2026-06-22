// src/pages/characterSheet/ExperienceTab.tsx

import { useState, useCallback, useMemo } from "react";
import type { ExperienceBlock, RankAdvances } from "../../types/Character";
import {
  uiSection,
  readOnlyBadgeClass,
  uiTextMuted,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { Button } from "../../ui/Button";
import { SectionHeader } from "../../ui/SectionHeader";
import { useXpProposals } from "../../hooks/useXpProposals";
import { proposeXpSpend } from "../../services/xpService";
import { useToast } from "../../components/Toast/ToastContext";

// All valid rank values in display order.
const RANK_OPTIONS: RankAdvances["rank"][] = [1, 2, 3, 4, 5, 6, 7, 8, "elite"];

// Recalculate spent as the sum of every advance cost across all ranks.
function calcSpent(ranks: RankAdvances[]): number {
  return ranks.reduce((total, r) => total + r.advances.reduce((s, a) => s + a.cost, 0), 0);
}

interface ExperienceTabProps {
  experience: ExperienceBlock;
  campaignId: string;
  characterId: string;
  isOwnedByCurrentPlayer: boolean;
  isDM: boolean;
  onUpdate: (next: ExperienceBlock) => void;
}

export function ExperienceTab({
  experience,
  campaignId,
  characterId,
  isOwnedByCurrentPlayer,
  isDM,
  onUpdate,
}: ExperienceTabProps) {
  const toast = useToast();
  const remaining = experience.total - experience.spent;
  const { proposals } = useXpProposals(campaignId, characterId);

  // ── Player proposal state ──────────────────────────────────────────────────
  const [description, setDescription] = useState("");
  const [xpCost, setXpCost] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── DM add-advance form state ──────────────────────────────────────────────
  const [newRank, setNewRank] = useState<RankAdvances["rank"]>(1);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState(0);
  const [newNotes, setNewNotes] = useState("");

  const pendingProposals = useMemo(
    () => proposals.filter((p) => p.status === "pending"),
    [proposals]
  );
  const resolvedProposals = useMemo(
    () => proposals.filter((p) => p.status !== "pending"),
    [proposals]
  );

  // ── Player handlers ────────────────────────────────────────────────────────
  const handlePropose = useCallback(async () => {
    if (!description.trim() || xpCost <= 0) return;
    setSubmitting(true);
    try {
      await proposeXpSpend(campaignId, characterId, description.trim(), xpCost);
      setDescription("");
      setXpCost(0);
      toast.success("Proposal submitted.");
    } catch (err) {
      console.error("XP proposal error:", err);
      toast.error("Failed to submit proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [campaignId, characterId, description, xpCost, toast]);

  // ── DM handlers ───────────────────────────────────────────────────────────
  const handleTotalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ ...experience, total: Math.max(0, Number(e.target.value)) });
    },
    [experience, onUpdate]
  );

  const handleAddAdvance = useCallback(() => {
    if (!newName.trim() || newCost <= 0) return;

    const entry = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      cost: newCost,
      notes: newNotes.trim() || undefined,
    };

    const existing = experience.ranks.find((r) => r.rank === newRank);
    const updatedRanks: RankAdvances[] = existing
      ? experience.ranks.map((r) =>
          r.rank === newRank ? { ...r, advances: [...r.advances, entry] } : r
        )
      : [...experience.ranks, { rank: newRank, advances: [entry] }].sort(
          (a, b) => RANK_OPTIONS.indexOf(a.rank) - RANK_OPTIONS.indexOf(b.rank)
        );

    onUpdate({ ...experience, ranks: updatedRanks, spent: calcSpent(updatedRanks) });
    setNewName("");
    setNewCost(0);
    setNewNotes("");
  }, [experience, newRank, newName, newCost, newNotes, onUpdate]);

  const handleRemoveAdvance = useCallback(
    (rank: RankAdvances["rank"], advanceId: string) => {
      const updatedRanks = experience.ranks
        .map((r) =>
          r.rank === rank ? { ...r, advances: r.advances.filter((a) => a.id !== advanceId) } : r
        )
        .filter((r) => r.advances.length > 0);

      onUpdate({ ...experience, ranks: updatedRanks, spent: calcSpent(updatedRanks) });
    },
    [experience, onUpdate]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {!isDM && (
        <div>
          <span className={readOnlyBadgeClass()}>Read-only</span>
        </div>
      )}

      {/* SUMMARY */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total XP — editable by DM */}
        <div className={uiSection + " text-center"}>
          {isDM ? (
            <label className="flex flex-col gap-0.5">
              <span className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Total XP
              </span>
              <input
                type="number"
                min={0}
                value={experience.total}
                onChange={handleTotalChange}
                className="mt-2 w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-center text-xl lg:text-2xl font-semibold font-code text-slate-100 focus:border-red-500 focus:outline-none"
                aria-label="Total XP"
              />
            </label>
          ) : (
            <>
              <div className="text-xs lg:text-sm text-slate-400 mb-1">Total XP</div>
              <div className="text-2xl lg:text-3xl font-semibold font-code text-slate-100">
                {experience.total}
              </div>
            </>
          )}
        </div>

        <div className={uiSection + " text-center"}>
          <div className="text-xs lg:text-sm text-slate-400 mb-1">Spent XP</div>
          <div className="text-2xl lg:text-3xl font-semibold font-code text-slate-100">{experience.spent}</div>
        </div>

        <div className={uiSection + " text-center"}>
          <div className="text-xs lg:text-sm text-slate-400 mb-1">Remaining XP</div>
          <div
            className={`text-2xl lg:text-3xl font-semibold font-code ${remaining < 0 ? "text-red-400" : "text-slate-100"}`}
          >
            {remaining}
          </div>
        </div>
      </section>

      {/* PURCHASED ADVANCES */}
      <section className="space-y-3">
        <SectionHeader>Purchased Advances</SectionHeader>

        {experience.ranks.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No advances purchased yet.</p>
        )}

        <div className="space-y-4">
          {experience.ranks.map((rankBlock) => (
            <div key={rankBlock.rank} className={uiSection}>
              <h4 className="text-sm lg:text-base font-semibold text-slate-100 mb-2">Rank {rankBlock.rank}</h4>
              <ul className="space-y-2">
                {rankBlock.advances.map((adv) => (
                  <li key={adv.id} className="rounded border border-slate-500 bg-slate-900/60 p-3">
                    <div className="flex items-baseline justify-between gap-4">
                    <div className="font-code text-sm lg:text-base text-slate-100">{adv.name}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs lg:text-sm text-slate-400">{adv.cost} XP</span>
                        {isDM && (
                          <button
                            onClick={() => handleRemoveAdvance(rankBlock.rank, adv.id)}
                            className="text-xs lg:text-sm text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    {adv.notes && <div className={`mt-1 text-xs lg:text-sm ${uiTextMuted}`}>{adv.notes}</div>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ADD ADVANCE FORM — DM only */}
        {isDM && (
          <div className="border border-slate-500 rounded-lg p-4 space-y-3 bg-slate-800/60">
            <p className="text-xs lg:text-sm font-semibold text-red-500 uppercase tracking-wide">
              Add Advance
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                  Rank
                </label>
                <select
                  value={String(newRank)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewRank(v === "elite" ? "elite" : (Number(v) as RankAdvances["rank"]));
                  }}
                  className="mt-0.5 w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-sm lg:text-base text-slate-100 focus:border-red-500 focus:outline-none"
                >
                  {RANK_OPTIONS.map((r) => (
                    <option key={String(r)} value={String(r)}>
                      {r === "elite" ? "Elite" : `Rank ${r}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                  Advance Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. +10 Weapon Skill"
                  className="mt-0.5 w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-sm lg:text-base text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                  XP Cost
                </label>
                <input
                  type="number"
                  min={0}
                  value={newCost}
                  onChange={(e) => setNewCost(Math.max(0, Number(e.target.value)))}
                  className="mt-0.5 w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-sm lg:text-base text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs lg:text-sm font-medium uppercase tracking-wide text-slate-100">
                Notes (optional)
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Approved session 3"
                className="mt-0.5 w-full px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-sm lg:text-base text-slate-100 focus:border-red-500 focus:outline-none"
              />
            </div>

            <Button onClick={handleAddAdvance} disabled={!newName.trim() || newCost <= 0}>
              Add
            </Button>
          </div>
        )}
      </section>

      {/* XP PROPOSALS — player only */}
      {isOwnedByCurrentPlayer && (
        <section className="space-y-3">
          <SectionHeader>Propose XP Spend</SectionHeader>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              placeholder="What are you buying?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 min-w-0 px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-sm lg:text-base"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Cost"
                value={xpCost}
                onChange={(e) => setXpCost(Math.max(0, Number(e.target.value)))}
                className="w-24 lg:w-32 px-2 lg:px-3 py-1 lg:py-1.5 bg-slate-800 border border-slate-500 rounded text-sm lg:text-base"
              />
              <Button
                onClick={handlePropose}
                disabled={submitting || !description.trim() || xpCost <= 0}
              >
                {submitting ? "…" : "Propose"}
              </Button>
            </div>
          </div>

          {pendingProposals.length === 0 && resolvedProposals.length === 0 && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No proposals yet.</p>
          )}

          {pendingProposals.length > 0 && (
            <div className="space-y-2">
              {pendingProposals.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-slate-500 rounded px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base"
                >
                  <span>
                    {p.description} — {p.xpCost} XP
                  </span>
                  <span className="text-slate-400">pending</span>
                </div>
              ))}
            </div>
          )}

          {resolvedProposals.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="text-xs lg:text-sm text-slate-400 hover:text-slate-200"
              >
                {showHistory ? "Hide" : "Show"} history ({resolvedProposals.length})
              </button>

              {showHistory && (
                <div className="space-y-2">
                  {resolvedProposals.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border border-slate-500/50 rounded px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base opacity-60"
                    >
                      <span>
                        {p.description} — {p.xpCost} XP
                      </span>
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
