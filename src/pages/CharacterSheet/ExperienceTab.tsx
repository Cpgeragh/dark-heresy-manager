import { useEffect, useState } from "react";
import type {
  Character,
  CharacterHeader,
  ExperienceBlock,
  XpTransaction,
} from "../../types/Character";
import {
  buildRankCards,
  type RankCard,
  type RankCardEntry,
  type RankCardEntryKind,
} from "../../mechanics/experience/rankCards";
import {
  getCareerRankProgression,
  type CareerRankProgression,
} from "../../mechanics/experience/careerRankProgression";
import {
  applyCareerRankUp,
  applyXpTransaction,
  clearRankUpXpCost,
  setRankUpXpCost,
} from "../../mechanics/experience/xpTransactions";
import {
  editableInputClass,
  readOnlyBadgeClass,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { SectionHeader } from "../../ui/SectionHeader";
import { Chip } from "../../ui/chips/Chip";
import { Button } from "../../ui/buttons/Button";
import { ModalShell } from "../../ui/modals/ModalShell";
import { ModalHeader } from "../../ui/modals/ModalHeader";
import { RequiredFormLabel } from "../../ui/forms/RequiredFormLabel";
import { RequiredFieldsNote } from "../../ui/forms/CustomFormFooter";
import { InfoModal } from "../../components/InfoModal";
import { ExpandChevron } from "../../ui/icons/ExpandChevron";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeablePanelMinHeight,
  uiSwipeableTabPanel,
} from "../../ui/styles/segmentedTabStyles";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import {
  colourActiveRose,
  colourActiveSky,
  colourAmberPlain,
  colourCareerPathOutline,
  colourEmerald,
  colourRank,
  colourSkyPlain,
  colourTextPrimary,
  colourValue,
} from "../../ui/styles/colourTokens";

interface ExperienceTabProps {
  character: Character;
  isDM: boolean;
  editable: boolean;
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

type CareerPurchaseKind = Extract<
  RankCardEntryKind,
  "skill" | "talent" | "trait" | "weapon-training"
>;

const CAREER_PURCHASE_GROUPS: readonly {
  kind: CareerPurchaseKind;
  label: string;
}[] = [
  { kind: "skill", label: "Skills" },
  { kind: "talent", label: "Talents" },
  { kind: "trait", label: "Traits" },
  { kind: "weapon-training", label: "Weapon Training" },
];

type XpAction = XpTransaction["type"];

const XP_SUMMARY_LABEL_CLASS =
  "whitespace-nowrap text-[10px] uppercase tracking-wide text-sky-300/85 sm:text-sm lg:text-base";
const ACTIVE_RANK_CHOICE_CLASS =
  `inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold lg:text-base ${colourCareerPathOutline}`;
const RANK_DETAIL_KEYS = ["career", "additional"] as const;
type RankDetailKey = (typeof RANK_DETAIL_KEYS)[number];
const RANK_DETAIL_OPTIONS = [
  {
    value: "career",
    label: "Career Purchases",
    activeClassName: colourActiveSky,
  },
  {
    value: "additional",
    label: "Additional XP",
    activeClassName: colourActiveRose,
  },
] as const satisfies readonly SegmentedTabOption<RankDetailKey>[];

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
  const existingRankUpCosts = (experience.transactions ?? []).filter(
    (transaction) => transaction.type === "spend" && transaction.rankId === rankId
  );
  const existingRankUpCostAmount = existingRankUpCosts.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );
  const existingRankUpCostReason = existingRankUpCosts
    .map((transaction) => transaction.reason?.trim())
    .filter(Boolean)
    .join("; ");
  const [amountDraft, setAmountDraft] = useState(
    action === "spend" && existingRankUpCostAmount > 0
      ? String(existingRankUpCostAmount)
      : ""
  );
  const [reason, setReason] = useState(
    action === "spend" ? existingRankUpCostReason : ""
  );
  const amount = Number(amountDraft);
  const remaining = experience.total - experience.spent;
  const isSpend = action === "spend";
  const isRemove = action === "remove";
  const isChangingRankUpCost = isSpend && existingRankUpCostAmount > 0;
  const availableForAction = isSpend
    ? remaining + existingRankUpCostAmount
    : remaining;
  const validAmount =
    /^\d+$/.test(amountDraft) &&
    Number.isInteger(amount) &&
    amount > 0 &&
    reason.trim().length > 0 &&
    (!(isSpend || isRemove) || amount <= availableForAction);

  const title = isChangingRankUpCost
    ? "Change XP Cost"
    : isSpend
      ? "Spend XP"
      : isRemove
        ? "Remove XP"
        : "Add XP";
  const modalTitle = isSpend ? (
    <span className="inline-flex items-center justify-center gap-1.5">
      <span>{title}</span>
      <span className={uiInfoModalWrapper}>
        <InfoModal
          title="Rank Up XP Cost"
          content="Apply an XP cost to this Rank Up. It will appear under Additional XP Spent on the current Rank card."
        />
      </span>
    </span>
  ) : title;

  const submit = () => {
    if (!validAmount) return;
    const transaction = {
      id: crypto.randomUUID(),
      amount,
      reason,
      rankId,
    };
    onApply(
      isSpend
        ? setRankUpXpCost(experience, transaction)
        : applyXpTransaction(experience, { ...transaction, type: action })
    );
    onClose();
  };

  return (
    <ModalShell ariaLabel={title} onClose={onClose} className="max-w-md overflow-y-auto">
      <ModalHeader
        title={modalTitle}
        titleClassName={isSpend ? "text-red-500" : isRemove ? "text-amber-400" : "text-emerald-300"}
        onClose={onClose}
      />
      <div className="space-y-4 p-4 lg:p-5">
        {!isSpend && (
          <p className="text-sm text-slate-300 lg:text-base">
            {isRemove
              ? "Correct excess awarded XP. This decreases Total XP without changing Spent XP."
              : "Award XP to the character. This increases Total XP without changing Spent XP."}
          </p>
        )}

        <div className="block space-y-1">
          <RequiredFormLabel htmlFor={`${action}-xp-amount`} tone="blue">
            Amount
          </RequiredFormLabel>
          <input
            id={`${action}-xp-amount`}
            type="text"
            inputMode="numeric"
            name={`${action}-xp-amount`}
            value={amountDraft}
            onChange={(event) => {
              if (/^\d*$/.test(event.target.value)) setAmountDraft(event.target.value);
            }}
            className={editableInputClass(true)}
            aria-label={`${title} amount`}
            required
          />
        </div>

        <div className="block space-y-1">
          <RequiredFormLabel htmlFor={`${action}-xp-reason`} tone="blue">
            Reason
          </RequiredFormLabel>
          <input
            id={`${action}-xp-reason`}
            type="text"
            name={`${action}-xp-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={
              isSpend
                ? "e.g. Elite advance"
                : isRemove
                  ? "e.g. Accidental award"
                  : "e.g. Session award"
            }
            className={editableInputClass(true)}
            aria-label={`${title} reason`}
            required
          />
        </div>

        {(isSpend || isRemove) && amountDraft !== "" && amount > availableForAction && (
          <p className="text-sm text-red-400 lg:text-base" role="alert">
            {isRemove
              ? `Only ${remaining} unspent XP can be removed.`
              : `Only ${availableForAction} XP is available for this cost.`}
          </p>
        )}

        <div className="space-y-2 border-t border-slate-700 pt-4">
          <RequiredFieldsNote />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="neutral" onClick={onClose}>Cancel</Button>
            <Button
              variant={isSpend ? "primary" : isRemove ? "warningOutline" : "successOutline"}
              onClick={submit}
              disabled={!validAmount}
            >
              {isChangingRankUpCost
                ? "Confirm Change"
                : isSpend
                  ? "Confirm Spend"
                  : `Confirm ${title}`}
            </Button>
          </div>
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
  const [rankUpExperience, setRankUpExperience] = useState(character.experience);
  const selectedRank = progression.nextRanks.find((rank) => rank.id === selectedRankId);
  const remaining = rankUpExperience.total - rankUpExperience.spent;
  const appliedRankUpCosts = (rankUpExperience.transactions ?? []).filter(
    (transaction) =>
      transaction.type === "spend" && transaction.rankId === progression.currentRank.id
  );
  const appliedRankUpCostAmount = appliedRankUpCosts.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );
  const appliedRankUpCostReason = appliedRankUpCosts
    .map((transaction) => transaction.reason?.trim())
    .filter(Boolean)
    .join("; ");

  const confirm = () => {
    if (!selectedRank) return;
    if (rankUpExperience !== character.experience) {
      onUpdate(rankUpExperience);
    }
    onConfirm(
      applyCareerRankUp(character.header, rankUpExperience.spent, selectedRank.id)
    );
    onClose();
  };

  const cancel = () => {
    const clearedExperience = clearRankUpXpCost(
      character.experience,
      progression.currentRank.id
    );
    if (clearedExperience !== character.experience) {
      onUpdate(clearedExperience);
    }
    onClose();
  };

  return (
    <>
      <ModalShell
        ariaLabel="Confirm Rank Up"
        onClose={cancel}
        className="max-w-lg overflow-y-auto"
        suspended={xpAction !== null}
      >
        <ModalHeader title="Confirm Rank Up" onClose={cancel} />
        <div className="space-y-4 p-4 lg:p-5">
          <div>
            <div className={uiTextLabel}>Current Rank</div>
            <div className="mt-1 text-lg text-slate-100 lg:text-xl">
              {progression.currentRank.name}
            </div>
          </div>

          <div className="space-y-2">
            <div className={uiTextLabel}>
              {progression.requiresBranchChoice ? "Choose the next Career path" : "Next Rank"}
            </div>
            <div className={`grid grid-cols-1 gap-2 ${progression.nextRanks.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {progression.nextRanks.length === 1 ? (
                <div className={ACTIVE_RANK_CHOICE_CLASS} data-testid="single-next-rank">
                  {progression.nextRanks[0].name}
                </div>
              ) : (
                progression.nextRanks.map((rank) => (
                  <Button
                    key={rank.id}
                    variant={selectedRankId === rank.id ? "careerPath" : "careerPathMuted"}
                    onClick={() => setSelectedRankId(rank.id)}
                    aria-pressed={selectedRankId === rank.id}
                  >
                    {rank.name}
                  </Button>
                ))
              )}
            </div>
          </div>

          {appliedRankUpCosts.length === 0 ? (
            <section className={`${uiSectionShell} space-y-3 p-3`}>
              <div>
                <div className="text-sm font-semibold text-red-500 lg:text-base">
                  Final XP adjustments
                </div>
                <p className={`mt-1 text-sm lg:text-base ${uiTextBody}`}>
                  The DM may apply an XP cost to ranking up.
                </p>
              </div>
              <Button
                className="w-full"
                variant="warningOutline"
                onClick={() => setXpAction("spend")}
                disabled={remaining <= 0}
              >
                Spend XP
              </Button>
            </section>
          ) : (
            <section className={`${uiSectionShell} space-y-2 p-3`}>
              <div className={uiTextLabel}>Applied Rank Up XP Cost</div>
              <div className="flex flex-col gap-3 rounded-lg border border-slate-700 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between lg:text-base">
                <div className="grid min-w-0 grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
                  <span className={uiTextLabel}>Amount</span>
                  <span className={`font-code ${colourTextPrimary}`}>{appliedRankUpCostAmount} XP</span>
                  <span className={uiTextLabel}>Reason</span>
                  <span className={uiTextBody}>{appliedRankUpCostReason || "No reason provided"}</span>
                </div>
                <Button
                  className="self-start sm:shrink-0 sm:self-auto"
                  variant="warningOutline"
                  size="sm"
                  onClick={() => setXpAction("spend")}
                >
                  Change XP Cost
                </Button>
              </div>
            </section>
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
            <Button variant="neutral" onClick={cancel}>Cancel</Button>
            <Button onClick={confirm} disabled={!selectedRank}>
              Confirm Rank Up
            </Button>
          </div>
        </div>
      </ModalShell>

      {xpAction && (
        <XpTransactionModal
          action={xpAction}
          experience={rankUpExperience}
          rankId={progression.currentRank.id}
          onApply={(next) => {
            setRankUpExperience(next);
          }}
          onClose={() => setXpAction(null)}
        />
      )}
    </>
  );
}

function RankEntryList({
  entries,
  emptyText,
  showKind = true,
  boxed = false,
}: {
  entries: readonly RankCardEntry[];
  emptyText: string;
  showKind?: boolean;
  boxed?: boolean;
}) {
  if (entries.length === 0) {
    return <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className={
            boxed
              ? `${uiSection} flex items-start justify-between gap-3`
              : "flex items-start justify-between gap-3 border-b border-slate-700/60 pb-2 last:border-b-0 last:pb-0"
          }
        >
          <div className="min-w-0 space-y-1">
            <div className="text-sm text-slate-100 lg:text-base">{entry.name}</div>
            {showKind && (
              <Chip size="sm" className={ENTRY_KIND_CLASSES[entry.kind]}>
                {ENTRY_KIND_LABELS[entry.kind]}
              </Chip>
            )}
          </div>
          <span className="shrink-0 font-code text-sm text-slate-300 lg:text-base">
            {entry.cost} XP
          </span>
        </li>
      ))}
    </ul>
  );
}

function CareerPurchaseGroup({
  label,
  entries,
}: {
  label: string;
  entries: readonly RankCardEntry[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className={`${uiSectionShell} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${label} purchases`}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-700/40 lg:px-4 lg:py-3"
      >
        <span className={`min-w-0 flex-1 truncate text-sm font-semibold lg:text-base ${colourSkyPlain}`}>
          {label}
        </span>
        <ExpandChevron expanded={expanded} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-slate-700 p-2">
          <RankEntryList entries={entries} emptyText="" showKind={false} boxed />
        </div>
      )}
    </section>
  );
}

function CareerPurchaseList({
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
    <div className="space-y-2">
      {CAREER_PURCHASE_GROUPS.map(({ kind, label }) => {
        const groupedEntries = entries.filter((entry) => entry.kind === kind);
        return groupedEntries.length > 0 ? (
          <CareerPurchaseGroup key={kind} label={label} entries={groupedEntries} />
        ) : null;
      })}
    </div>
  );
}

function RankLedgerSection({
  title,
  total,
  entries,
  emptyText,
  className = "",
  groupCareerPurchases = false,
}: {
  title: string;
  total: number;
  entries: readonly RankCardEntry[];
  emptyText: string;
  className?: string;
  groupCareerPurchases?: boolean;
}) {
  return (
    <section className={`${uiSectionShell} space-y-3 p-3 lg:p-4 ${className}`.trim()}>
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-red-500 lg:text-base">
          {title}
        </h4>
        <span className="shrink-0 font-code text-sm text-slate-300">
          {total} XP
        </span>
      </div>
      {groupCareerPurchases ? (
        <CareerPurchaseList entries={entries} emptyText={emptyText} />
      ) : (
        <RankEntryList entries={entries} emptyText={emptyText} />
      )}
    </section>
  );
}

function RankDetailsSwitcher({ card }: { card: RankCard }) {
  const [activeSection, setActiveSection] = useState<RankDetailKey>("career");
  const tabGroupId = `rank-${card.rankId}-purchase-categories`;
  const {
    containerRef,
    transitionClass,
    switchTo: showSection,
  } = useSwipeableTabs(RANK_DETAIL_KEYS, activeSection, setActiveSection);

  const renderSection = (section: RankDetailKey, className = "") =>
    section === "career" ? (
      <RankLedgerSection
        className={`h-full ${uiSwipeablePanelMinHeight} ${className}`.trim()}
        title="Career Purchases from This Rank"
        total={card.careerPurchasesTotal}
        entries={card.careerPurchases}
        emptyText="No Career purchases recorded from this Rank."
        groupCareerPurchases
      />
    ) : (
      <RankLedgerSection
        className={`h-full ${uiSwipeablePanelMinHeight} ${className}`.trim()}
        title="Additional XP Spent"
        total={card.rankUpXpSpentTotal}
        entries={card.rankUpXpSpent}
        emptyText="No additional XP spent during this rank."
      />
    );

  return (
    <>
      <div ref={containerRef} className="space-y-3 lg:hidden">
        <SegmentedTabs
          id={tabGroupId}
          ariaLabel={`${card.name} Rank purchase categories`}
          options={RANK_DETAIL_OPTIONS}
          value={activeSection}
          onChange={showSection}
        />
        <section
          key={activeSection}
          id={segmentedTabPanelId(tabGroupId, activeSection)}
          aria-labelledby={segmentedTabId(tabGroupId, activeSection)}
          className={[uiSwipeableTabPanel, transitionClass].join(" ")}
          role="tabpanel"
        >
          {renderSection(activeSection)}
        </section>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        {renderSection("career")}
        {renderSection("additional")}
      </div>
    </>
  );
}

export function ExperienceTab({
  character,
  isDM,
  editable,
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
  const currentRankCardId = rankCards.find((card) => card.isCurrent)?.rankId;
  const [expandedRankIds, setExpandedRankIds] = useState<Set<string>>(
    () => new Set(currentRankCardId ? [currentRankCardId] : [])
  );
  const canAddXp = editable;
  const canManageXp = isDM && editable;
  const canUseXpAction = xpAction === "add" ? canAddXp : canManageXp;
  const orderedRankCards = [...rankCards].sort(
    (left, right) =>
      Number(right.isCurrent) - Number(left.isCurrent) || right.tier - left.tier
  );

  useEffect(() => {
    setExpandedRankIds(new Set(currentRankCardId ? [currentRankCardId] : []));
  }, [currentRankCardId]);

  const toggleRankCard = (rankId: string) => {
    setExpandedRankIds((current) => {
      const next = new Set(current);
      if (next.has(rankId)) next.delete(rankId);
      else next.add(rankId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {!editable && <span className={readOnlyBadgeClass}>Read-only</span>}

      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className={`${uiSectionShell} flex min-w-0 flex-col items-center justify-center p-2 text-center sm:p-3 lg:p-4`}>
          <div className={`mb-1 w-full text-center ${XP_SUMMARY_LABEL_CLASS}`}>Total XP</div>
          <div className="w-full text-center font-code text-xl font-semibold text-slate-100 sm:text-2xl lg:text-3xl">
            {experience.total}
          </div>
        </div>

        <div className={`${uiSectionShell} flex min-w-0 flex-col items-center justify-center p-2 text-center sm:p-3 lg:p-4`}>
          <div className={`mb-1 w-full text-center ${XP_SUMMARY_LABEL_CLASS}`}>Spent XP</div>
          <div className="w-full text-center font-code text-xl font-semibold text-slate-100 sm:text-2xl lg:text-3xl">
            {experience.spent}
          </div>
        </div>

        <div className={`${uiSectionShell} flex min-w-0 flex-col items-center justify-center p-2 text-center sm:p-3 lg:p-4`}>
          <div className={`mb-1 w-full text-center ${XP_SUMMARY_LABEL_CLASS}`}>Remaining XP</div>
          <div
            className={`w-full text-center font-code text-xl font-semibold sm:text-2xl lg:text-3xl ${
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
                <div className={uiTextLabel}>
                  Current Rank
                </div>
                <div className="mt-1 text-lg text-slate-100 lg:text-xl">
                  {progression.currentRank.name}
                </div>
              </div>
              <div className="sm:text-right">
                <div className={uiTextLabel}>
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
              <p
                className={`text-sm lg:text-base ${
                  progression.canRankUp ? colourAmberPlain : uiTextBody
                }`}
              >
                {progression.canRankUp
                  ? "The required Spent XP has been reached. The DM can now confirm one Rank Up."
                  : `${progression.nextBand.min - experience.spent} more Spent XP is required.`}
              </p>
            )}

            {canAddXp && (
              <div className={`grid gap-2 border-t border-slate-700 pt-4 ${
                canManageXp ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
              }`}>
                <Button variant="successOutline" onClick={() => setXpAction("add")}>Add XP</Button>
                {canManageXp && (
                  <Button
                    variant="warningOutline"
                    onClick={() => setXpAction("remove")}
                    disabled={remaining <= 0}
                  >
                    Remove XP
                  </Button>
                )}
                {canManageXp && progression.nextBand && (
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
            {orderedRankCards.map((card) => {
              const expanded = expandedRankIds.has(card.rankId);
              const detailsId = `rank-card-${card.rankId}-details`;
              return (
              <article
                key={card.rankId}
                aria-label={`${card.name} Rank Card`}
                className={`${uiSection} ${
                  card.isCurrent ? "border-red-500/70 bg-red-950/10" : ""
                }`}
              >
                <header>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    aria-label={`${expanded ? "Collapse" : "Expand"} ${card.name} Rank Card`}
                    onClick={() => toggleRankCard(card.rankId)}
                    className="flex w-full flex-col gap-2 text-left sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className={`${uiItemName} text-lg text-red-500 lg:text-xl`}>{card.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Chip className={`${colourRank} font-code`}>
                          Rank {card.tier}
                        </Chip>
                        <Chip className={`${colourValue} font-code`}>
                          {card.xpLevel} XP
                        </Chip>
                        {card.isCurrent && (
                          <Chip className={colourEmerald}>Current</Chip>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="sm:text-right">
                        <div className="text-xs uppercase tracking-wide text-slate-500 lg:text-sm">
                          Card Spent
                        </div>
                        <div className="font-code text-xl text-slate-100 lg:text-2xl">
                          {card.spentTotal} XP
                        </div>
                      </div>
                      <ExpandChevron expanded={expanded} />
                    </div>
                  </button>
                </header>

                {expanded && (
                <div id={detailsId} className="mt-4">
                  <RankDetailsSwitcher card={card} />
                </div>
                )}
              </article>
              );
            })}
          </div>
        )}
      </section>

      {canUseXpAction && xpAction && progression && (
        <XpTransactionModal
          action={xpAction}
          experience={experience}
          rankId={progression.currentRank.id}
          onApply={onUpdate}
          onClose={() => setXpAction(null)}
        />
      )}

      {canManageXp && rankUpOpen && progression && (
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
