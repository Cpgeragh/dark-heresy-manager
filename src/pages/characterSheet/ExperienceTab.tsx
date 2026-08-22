import { useState } from "react";
import type {
  Character,
  CharacterHeader,
  ExperienceBlock,
  XpTransaction,
} from "../../types/Character";
import {
  buildRankCards,
  type RankCardEntry,
  type RankCardEntryKind,
} from "../../features/experience/rankCards";
import {
  getCareerRankProgression,
  type CareerRankProgression,
} from "../../features/experience/careerRankProgression";
import {
  applyCareerRankUp,
  applyXpTransaction,
} from "../../features/experience/xpTransactions";
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
import { Button } from "../../ui/Button";
import { ModalShell } from "../../ui/ModalShell";
import { ModalHeader } from "../../ui/ModalHeader";

interface ExperienceTabProps {
  character: Character;
  isDM: boolean;
  onUpdate: (next: ExperienceBlock) => void;
  onUpdateHeader: (next: CharacterHeader) => void;
}

const ENTRY_KIND_LABELS: Record<RankCardEntryKind, string> = {
  characteristic: "Characteristic",
  skill: "Skill",
  talent: "Talent",
  trait: "Trait",
  "weapon-training": "Weapon Training",
  "xp-spend": "XP Spend",
};

const ENTRY_KIND_CLASSES: Record<RankCardEntryKind, string> = {
  characteristic: "border-sky-700/60 bg-sky-950/30 text-sky-300",
  skill: "border-blue-700/60 bg-blue-950/30 text-blue-300",
  talent: "border-amber-700/60 bg-amber-950/30 text-amber-300",
  trait: "border-violet-700/60 bg-violet-950/30 text-violet-300",
  "weapon-training": "border-emerald-700/60 bg-emerald-950/30 text-emerald-300",
  "xp-spend": "border-red-700/60 bg-red-950/30 text-red-300",
};

type XpAction = XpTransaction["type"];

function XpTransactionModal({
  action,
  experience,
  rankId,
  onApply,
  onClose,
}: {
  action: XpAction;
  experience: ExperienceBlock;
  rankId: string;
  onApply: (next: ExperienceBlock) => void;
  onClose: () => void;
}) {
  const [amountDraft, setAmountDraft] = useState("");
  const [reason, setReason] = useState("");
  const amount = Number(amountDraft);
  const remaining = experience.total - experience.spent;
  const isSpend = action === "spend";
  const validAmount =
    /^\d+$/.test(amountDraft) &&
    Number.isInteger(amount) &&
    amount > 0 &&
    (!isSpend || amount <= remaining);

  const title = isSpend ? "Spend XP" : "Add XP";

  const submit = () => {
    if (!validAmount) return;
    onApply(
      applyXpTransaction(experience, {
        id: crypto.randomUUID(),
        type: action,
        amount,
        reason,
        rankId,
      })
    );
    onClose();
  };

  return (
    <ModalShell ariaLabel={title} onClose={onClose} className="max-w-md overflow-y-auto">
      <ModalHeader title={title} onClose={onClose} />
      <div className="space-y-4 p-4 lg:p-5">
        <p className="text-sm text-slate-300 lg:text-base">
          {isSpend
            ? "Charge XP outside the normal purchase controls. It will appear under Rank Up XP Spent for the current rank."
            : "Award XP to the character. This increases Total XP without changing Spent XP."}
        </p>

        <label className="block space-y-1">
          <span className={uiFormLabel}>Amount</span>
          <input
            type="text"
            inputMode="numeric"
            name={`${action}-xp-amount`}
            value={amountDraft}
            onChange={(event) => {
              if (/^\d*$/.test(event.target.value)) setAmountDraft(event.target.value);
            }}
            className={editableInputClass(true)}
            aria-label={`${title} amount`}
          />
        </label>

        <label className="block space-y-1">
          <span className={uiFormLabel}>Reason (optional)</span>
          <input
            type="text"
            name={`${action}-xp-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={isSpend ? "e.g. Elite advance" : "e.g. Session award"}
            className={editableInputClass(true)}
            aria-label={`${title} reason`}
          />
        </label>

        {isSpend && amountDraft !== "" && amount > remaining && (
          <p className="text-sm text-red-400 lg:text-base" role="alert">
            Only {remaining} XP remains available.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!validAmount}>
            Confirm {title}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

function RankUpModal({
  character,
  progression,
  onUpdate,
  onConfirm,
  onClose,
}: {
  character: Character;
  progression: CareerRankProgression;
  onUpdate: (next: ExperienceBlock) => void;
  onConfirm: (next: CharacterHeader) => void;
  onClose: () => void;
}) {
  const [selectedRankId, setSelectedRankId] = useState(
    progression.nextRanks.length === 1 ? progression.nextRanks[0].id : ""
  );
  const [xpAction, setXpAction] = useState<XpAction | null>(null);
  const selectedRank = progression.nextRanks.find((rank) => rank.id === selectedRankId);
  const remaining = character.experience.total - character.experience.spent;

  const confirm = () => {
    if (!selectedRank) return;
    onConfirm(
      applyCareerRankUp(character.header, character.experience.spent, selectedRank.id)
    );
    onClose();
  };

  return (
    <>
      <ModalShell
        ariaLabel="Confirm Rank Up"
        onClose={onClose}
        className="max-w-lg overflow-y-auto"
        suspended={xpAction !== null}
      >
        <ModalHeader title="Confirm Rank Up" onClose={onClose} />
        <div className="space-y-4 p-4 lg:p-5">
          <div className={`${uiSectionShell} grid grid-cols-3 gap-2 p-3 text-center`}>
            <div>
              <div className="text-xs text-slate-500 lg:text-sm">Total</div>
              <div className="font-code text-lg text-slate-100 lg:text-xl">
                {character.experience.total}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 lg:text-sm">Spent</div>
              <div className="font-code text-lg text-slate-100 lg:text-xl">
                {character.experience.spent}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 lg:text-sm">Remaining</div>
              <div className="font-code text-lg text-slate-100 lg:text-xl">{remaining}</div>
            </div>
          </div>

          <div>
            <div className={uiFormLabel}>Current Rank</div>
            <div className="mt-1 text-lg text-slate-100 lg:text-xl">
              {progression.currentRank.name}
            </div>
          </div>

          <div className="space-y-2">
            <div className={uiFormLabel}>
              {progression.requiresBranchChoice ? "Choose the next Career path" : "Next Rank"}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {progression.nextRanks.map((rank) => (
                <Button
                  key={rank.id}
                  variant={selectedRankId === rank.id ? "primary" : "ghost"}
                  onClick={() => setSelectedRankId(rank.id)}
                  aria-pressed={selectedRankId === rank.id}
                >
                  {rank.name}
                </Button>
              ))}
            </div>
          </div>

          <section className={`${uiSectionShell} space-y-3 p-3`}>
            <div>
              <div className="text-sm font-semibold text-red-500 lg:text-base">
                Final XP adjustments
              </div>
              <p className="mt-1 text-sm text-slate-400 lg:text-base">
                The DM may award or spend XP before confirming this rank.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setXpAction("add")}>Add XP</Button>
              <Button
                variant="ghost"
                onClick={() => setXpAction("spend")}
                disabled={remaining <= 0}
              >
                Spend XP
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={confirm} disabled={!selectedRank}>
              Confirm Rank Up
            </Button>
          </div>
        </div>
      </ModalShell>

      {xpAction && (
        <XpTransactionModal
          action={xpAction}
          experience={character.experience}
          rankId={progression.currentRank.id}
          onApply={onUpdate}
          onClose={() => setXpAction(null)}
        />
      )}
    </>
  );
}

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

export function ExperienceTab({
  character,
  isDM,
  onUpdate,
  onUpdateHeader,
}: ExperienceTabProps) {
  const { experience } = character;
  const remaining = experience.total - experience.spent;
  const rankCards = buildRankCards(character);
  const progression = getCareerRankProgression(
    character.header.career,
    character.header.rank,
    experience.spent,
    character.header.careerPath
  );
  const [xpAction, setXpAction] = useState<XpAction | null>(null);
  const [rankUpOpen, setRankUpOpen] = useState(false);

  return (
    <div className="space-y-6">
      {!isDM && <span className={readOnlyBadgeClass}>Read-only</span>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${uiSection} text-center`}>
          <div className="mb-1 text-xs text-slate-400 lg:text-sm">Total XP</div>
          <div className="font-code text-2xl font-semibold text-slate-100 lg:text-3xl">
            {experience.total}
          </div>
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

      {progression && (
        <section className="space-y-3">
          <SectionHeader>Rank Progression</SectionHeader>
          <div className={`${uiSection} space-y-4`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 lg:text-sm">
                  Current Rank
                </div>
                <div className="mt-1 text-lg text-slate-100 lg:text-xl">
                  {progression.currentRank.name}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs uppercase tracking-wide text-slate-500 lg:text-sm">
                  {progression.nextBand ? "Next Rank unlocks at" : "Career Progression"}
                </div>
                <div className="mt-1 font-code text-lg text-slate-100 lg:text-xl">
                  {progression.nextBand
                    ? `${progression.nextBand.min} Spent XP`
                    : "Final Rank reached"}
                </div>
              </div>
            </div>

            {progression.nextBand && (
              <p className="text-sm text-slate-400 lg:text-base">
                {progression.canRankUp
                  ? "The required Spent XP has been reached. The DM can now confirm one Rank Up."
                  : `${progression.nextBand.min - experience.spent} more Spent XP is required.`}
              </p>
            )}

            {isDM && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-4 sm:grid-cols-3">
                <Button variant="ghost" onClick={() => setXpAction("add")}>Add XP</Button>
                <Button
                  variant="ghost"
                  onClick={() => setXpAction("spend")}
                  disabled={remaining <= 0}
                >
                  Spend XP
                </Button>
                {progression.nextBand && (
                  <Button
                    className="col-span-2 sm:col-span-1"
                    onClick={() => setRankUpOpen(true)}
                    disabled={!progression.canRankUp}
                  >
                    Rank Up
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

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

      {xpAction && progression && (
        <XpTransactionModal
          action={xpAction}
          experience={experience}
          rankId={progression.currentRank.id}
          onApply={onUpdate}
          onClose={() => setXpAction(null)}
        />
      )}

      {rankUpOpen && progression && (
        <RankUpModal
          character={character}
          progression={progression}
          onUpdate={onUpdate}
          onConfirm={onUpdateHeader}
          onClose={() => setRankUpOpen(false)}
        />
      )}
    </div>
  );
}
