import { useCallback } from "react";
import type { Character, ExperienceBlock } from "../../types/Character";
import {
  buildRankCards,
  type RankCardEntry,
  type RankCardEntryKind,
} from "../../features/experience/rankCards";
import {
  editableInputClass,
  readOnlyBadgeClass,
  uiFormLabel,
  uiItemName,
  uiSection,
  uiSectionShell,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { Chip } from "../../ui/Chip";

interface ExperienceTabProps {
  character: Character;
  isDM: boolean;
  onUpdate: (next: ExperienceBlock) => void;
}

const ENTRY_KIND_LABELS: Record<RankCardEntryKind, string> = {
  characteristic: "Characteristic",
  skill: "Skill",
  talent: "Talent",
  trait: "Trait",
  "weapon-training": "Weapon Training",
};

const ENTRY_KIND_CLASSES: Record<RankCardEntryKind, string> = {
  characteristic: "border-sky-700/60 bg-sky-950/30 text-sky-300",
  skill: "border-blue-700/60 bg-blue-950/30 text-blue-300",
  talent: "border-amber-700/60 bg-amber-950/30 text-amber-300",
  trait: "border-violet-700/60 bg-violet-950/30 text-violet-300",
  "weapon-training": "border-emerald-700/60 bg-emerald-950/30 text-emerald-300",
};

function RankEntryList({
  entries,
  emptyText,
}: {
  entries: readonly RankCardEntry[];
  emptyText: string;
}) {
  if (entries.length === 0) {
    return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start justify-between gap-3 border-b border-slate-700/60 pb-2 last:border-b-0 last:pb-0"
        >
          <div className="min-w-0 space-y-1">
            <div className="text-sm text-slate-100 lg:text-base">{entry.name}</div>
            <Chip size="sm" className={ENTRY_KIND_CLASSES[entry.kind]}>
              {ENTRY_KIND_LABELS[entry.kind]}
            </Chip>
          </div>
          <span className="shrink-0 font-code text-sm text-slate-300 lg:text-base">
            {entry.cost} XP
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ExperienceTab({ character, isDM, onUpdate }: ExperienceTabProps) {
  const { experience } = character;
  const remaining = experience.total - experience.spent;
  const rankCards = buildRankCards(character);

  const handleTotalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ ...experience, total: Math.max(0, Number(event.target.value)) });
    },
    [experience, onUpdate]
  );

  return (
    <div className="space-y-6">
      {!isDM && <span className={readOnlyBadgeClass}>Read-only</span>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${uiSection} text-center`}>
          {isDM ? (
            <label className="flex flex-col gap-0.5">
              <span className={uiFormLabel}>Total XP</span>
              <input
                type="number"
                min={0}
                value={experience.total}
                onChange={handleTotalChange}
                className={`${editableInputClass(true)} mt-2 text-center font-code text-xl font-semibold lg:text-2xl`}
                aria-label="Total XP"
              />
            </label>
          ) : (
            <>
              <div className="mb-1 text-xs text-slate-400 lg:text-sm">Total XP</div>
              <div className="font-code text-2xl font-semibold text-slate-100 lg:text-3xl">
                {experience.total}
              </div>
            </>
          )}
        </div>

        <div className={`${uiSection} text-center`}>
          <div className="mb-1 text-xs text-slate-400 lg:text-sm">Spent XP</div>
          <div className="font-code text-2xl font-semibold text-slate-100 lg:text-3xl">
            {experience.spent}
          </div>
        </div>

        <div className={`${uiSection} text-center`}>
          <div className="mb-1 text-xs text-slate-400 lg:text-sm">Remaining XP</div>
          <div
            className={`font-code text-2xl font-semibold lg:text-3xl ${
              remaining < 0 ? "text-red-400" : "text-slate-100"
            }`}
          >
            {remaining}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader>Career Rank Ledger</SectionHeader>

        {rankCards.length === 0 ? (
          <div className={uiSection}>
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
              Select a Career and Rank to begin the Rank ledger.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rankCards.map((card) => (
              <article
                key={card.rankId}
                aria-label={`${card.name} Rank Card`}
                className={`${uiSection} space-y-4 ${
                  card.isCurrent ? "border-red-500/70 bg-red-950/10" : ""
                }`}
              >
                <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className={`${uiItemName} text-lg text-red-500 lg:text-xl`}>{card.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Chip className="border-slate-600 bg-slate-900/60 font-code text-slate-300">
                        Rank {card.tier}
                      </Chip>
                      <Chip className="border-slate-600 bg-slate-900/60 font-code text-slate-300">
                        {card.xpLevel} XP
                      </Chip>
                      {card.isCurrent && (
                        <Chip className="border-red-500/70 bg-red-950/40 text-red-300">Current</Chip>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xs uppercase tracking-wide text-slate-500 lg:text-sm">
                      Card Spent
                    </div>
                    <div className="font-code text-xl text-slate-100 lg:text-2xl">
                      {card.spentTotal} XP
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <section className={`${uiSectionShell} space-y-3 p-3 lg:p-4`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-red-500 lg:text-base">
                        Advances from this Rank
                      </h4>
                      <span className="shrink-0 font-code text-sm text-slate-300">
                        {card.careerPurchasesTotal} XP
                      </span>
                    </div>
                    <RankEntryList
                      entries={card.careerPurchases}
                      emptyText="No advances purchased from this rank."
                    />
                  </section>

                  <section className={`${uiSectionShell} space-y-3 p-3 lg:p-4`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-red-500 lg:text-base">
                        Rank Up XP Spent
                      </h4>
                      <span className="shrink-0 font-code text-sm text-slate-300">
                        {card.rankUpXpSpentTotal} XP
                      </span>
                    </div>
                    <RankEntryList
                      entries={card.rankUpXpSpent}
                      emptyText="No additional XP spent during this rank."
                    />
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
