import { useState } from "react";
import { recordComponentRender } from "../../performance/performanceMetrics";
import type { Character, ExperienceBlock, XpTransaction } from "../../types/Character";
import {
  buildRankCards,
  type RankCard,
  type RankCardEntry,
  type RankCardEntryKind,
} from "../../mechanics/experience/rankCards";
import {
  ALTERNATE_RANKS,
  getAlternateRankTitles,
  getCareerRankProgression,
  getRankDisplayName,
  type CareerRankProgression,
} from "shared-rules";
import {
  applyCareerRankUp,
  clearRankUpXpCost,
  setRankUpXpCost,
} from "../../mechanics/experience/xpTransactions";
import {
  editableInputClass,
  readOnlyBadgeClass,
  uiInfoModalWrapper,
  uiItemName,
  uiNoticeBox,
  uiSection,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextError,
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
import { AccordionCard } from "../../ui/AccordionCard";
import { ExpandChevron } from "../../ui/icons/ExpandChevron";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowName } from "../../ui/pickers/PickerRowParts";
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
  colourEmeraldPlain,
  colourNoticeRed,
  colourSkyPlain,
  colourTextPrimary,
  type ChipColour,
} from "../../ui/styles/colourTokens";
import {
  applyAlternateRankEliteAdvanceGrants,
  applyAlternateRankGearGrants,
  applyAlternateRankMeleeWeaponGrant,
} from "../../mechanics/experience/alternateRankGrants";
import { MELEE_WEAPON_REFERENCE } from "../../data/reference/weaponReference";
import { useXpHistory } from "../../hooks/useXpHistory";
import { xpHistoryDate } from "../../utils/xpHistory";

interface ExperienceTabProps {
  campaignId: string;
  character: Character;
  isDM: boolean;
  editable: boolean;
  onUpdate: (next: ExperienceBlock) => Promise<boolean>;
  onAdjustXp: (amountXp: number, reason: string) => Promise<boolean>;
  onUpdateCharacter: (partial: Record<string, unknown>) => Promise<boolean>;
}

const ENTRY_KIND_LABELS: Record<RankCardEntryKind, string> = {
  characteristic: "Characteristic",
  skill: "Skill",
  talent: "Talent",
  trait: "Trait",
  "elite-advance": "Elite Advance",
  "weapon-training": "Weapon Training",
  "xp-spend": "XP Spend",
};

const ENTRY_KIND_COLOURS: Record<RankCardEntryKind, ChipColour> = {
  characteristic: "sky",
  skill: "blue",
  talent: "amber",
  trait: "violet",
  "elite-advance": "fuchsia",
  "weapon-training": "emerald",
  "xp-spend": "red",
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
const ACTIVE_RANK_CHOICE_CLASS = `inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold lg:text-base ${colourCareerPathOutline}`;
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
  onAdjustXp,
  onClose,
}: {
  action: XpAction;
  experience: ExperienceBlock;
  rankId: string;
  onApply: (next: ExperienceBlock) => void | Promise<boolean>;
  onAdjustXp?: (amountXp: number, reason: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
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
    action === "spend" && existingRankUpCostAmount > 0 ? String(existingRankUpCostAmount) : ""
  );
  const [reason, setReason] = useState(action === "spend" ? existingRankUpCostReason : "");
  const amount = Number(amountDraft);
  const remaining = experience.total - experience.spent;
  const isSpend = action === "spend";
  const isRemove = action === "remove";
  const isChangingRankUpCost = isSpend && existingRankUpCostAmount > 0;
  const availableForAction = isSpend ? remaining + existingRankUpCostAmount : remaining;
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
  ) : (
    title
  );

  const submit = async () => {
    if (!validAmount || (!isSpend && !onAdjustXp)) return;
    const transaction = {
      id: crypto.randomUUID(),
      amount,
      reason,
      rankId,
    };
    setSaving(true);
    const saved = isSpend
      ? await onApply(setRankUpXpCost(experience, transaction))
      : await onAdjustXp!(isRemove ? -amount : amount, reason);
    setSaving(false);
    if (saved !== false) onClose();
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
          <p className={`text-sm ${uiTextBody} lg:text-base`}>
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
            autoComplete="off"
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
            autoComplete="off"
          />
        </div>

        {(isSpend || isRemove) && amountDraft !== "" && amount > availableForAction && (
          <p className={`text-sm ${uiTextError} lg:text-base`} role="alert">
            {isRemove
              ? `Only ${remaining} unspent XP can be removed.`
              : `Only ${availableForAction} XP is available for this cost.`}
          </p>
        )}

        <div className="space-y-2 border-t border-slate-700 pt-4">
          <RequiredFieldsNote />
          <div className="grid grid-cols-2 gap-3">
            <Button variant="neutral" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant={isSpend ? "primary" : isRemove ? "warningOutline" : "successOutline"}
              onClick={submit}
              disabled={!validAmount}
              loading={saving}
              loadingLabel="Saving"
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

function RankTitleChoice({
  careerName,
  options,
  value,
  onChange,
}: {
  careerName?: string;
  options: readonly string[];
  value: string;
  onChange: (title: string) => void | Promise<unknown>;
}) {
  const choices = [
    ...(careerName === undefined ? [] : [{ title: "", label: careerName }]),
    ...options.map((title) => ({ title, label: title })),
  ];
  return (
    <div className="space-y-2">
      <div className={uiTextLabel}>Rank title</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map(({ title, label }) => (
          <Button
            key={title || "career-name"}
            variant={value === title ? "careerPath" : "careerPathMuted"}
            onClick={() => onChange(title)}
            aria-pressed={value === title}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
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
  onUpdate: (next: ExperienceBlock) => Promise<boolean>;
  onConfirm: (partial: Record<string, unknown>) => Promise<boolean>;
  onClose: () => void;
}) {
  const initialRank = progression.nextRanks.length === 1 ? progression.nextRanks[0] : undefined;
  const getAvailableAlternateRanks = (
    rank: CareerRankProgression["nextRanks"][number] | undefined
  ) =>
    ALTERNATE_RANKS.filter(
      (alternateRank) =>
        !alternateRank.availableAtCharacterCreation &&
        alternateRank.requiredCareerIds.includes(progression.career.id) &&
        rank !== undefined &&
        rank.tier >= alternateRank.minimumRank &&
        (!alternateRank.requiredCareerPaths?.length ||
          alternateRank.requiredCareerPaths.some((path) => rank.paths?.includes(path))) &&
        !(character.experience.alternateRanks ?? []).some(
          (selection) => selection.alternateRankId === alternateRank.id
        )
    ).sort((left, right) => left.name.localeCompare(right.name));
  const [selectedRankId, setSelectedRankId] = useState(initialRank?.id ?? "");
  const [selectedAlternateRankId, setSelectedAlternateRankId] = useState("");
  const [selectedMeleeWeaponReferenceId, setSelectedMeleeWeaponReferenceId] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [rankTypePickerOpen, setRankTypePickerOpen] = useState(
    () => getAvailableAlternateRanks(initialRank).length >= 2
  );
  const [xpAction, setXpAction] = useState<XpAction | null>(null);
  const [rankUpExperience, setRankUpExperience] = useState(character.experience);
  const [saving, setSaving] = useState(false);
  const selectedRank = progression.nextRanks.find((rank) => rank.id === selectedRankId);
  const availableAlternateRanks = getAvailableAlternateRanks(selectedRank);
  const selectedAlternateRank = availableAlternateRanks.find(
    (alternateRank) => alternateRank.id === selectedAlternateRankId
  );
  const selectedMeleeWeaponChoice = selectedAlternateRank?.grantedMeleeWeaponChoice;
  const selectedRankTypeName = selectedAlternateRank?.name ?? selectedRank?.name;
  const titleChoice = (() => {
    if (!selectedRank) return undefined;
    if (selectedAlternateRank) {
      const options = getAlternateRankTitles(selectedAlternateRank.id, selectedRank.tier);
      return options.length > 1
        ? { alternateRankId: selectedAlternateRank.id, options, includesCareerName: false }
        : undefined;
    }
    for (const selection of character.experience.alternateRanks ?? []) {
      if (selection.takenAtTier >= selectedRank.tier) continue;
      const options = getAlternateRankTitles(selection.alternateRankId, selectedRank.tier);
      if (options.length > 0) {
        return { alternateRankId: selection.alternateRankId, options, includesCareerName: true };
      }
    }
    return undefined;
  })();
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

  const selectAlternateRank = (alternateRankId: string) => {
    setSelectedAlternateRankId(alternateRankId);
    setSelectedMeleeWeaponReferenceId("");
    setSelectedTitle("");
  };

  const confirm = async () => {
    if (!selectedRank) return;
    const grantSelections =
      selectedMeleeWeaponChoice && selectedMeleeWeaponReferenceId
        ? { [selectedMeleeWeaponChoice.id]: selectedMeleeWeaponReferenceId }
        : undefined;
    const nextExperience = selectedAlternateRankId
      ? {
          ...rankUpExperience,
          alternateRanks: [
            ...(rankUpExperience.alternateRanks ?? []),
            {
              alternateRankId: selectedAlternateRankId,
              replacedRankId: selectedRank.id,
              takenAtTier: selectedRank.tier,
              ...(grantSelections ? { grantSelections } : {}),
            },
          ],
        }
      : rankUpExperience;
    const titledExperience =
      selectedTitle && titleChoice
        ? {
            ...nextExperience,
            alternateRanks: (nextExperience.alternateRanks ?? []).map((selection) =>
              selection.alternateRankId === titleChoice.alternateRankId
                ? {
                    ...selection,
                    titleChoices: {
                      ...selection.titleChoices,
                      [String(selectedRank.tier)]: selectedTitle,
                    },
                  }
                : selection
            ),
          }
        : nextExperience;
    const nextGear = selectedAlternateRankId
      ? applyAlternateRankGearGrants(character.gear ?? [], selectedAlternateRankId)
      : character.gear;
    const nextTalentsAndTraits = selectedAlternateRankId
      ? applyAlternateRankEliteAdvanceGrants(character.talentsAndTraits, selectedAlternateRankId)
      : character.talentsAndTraits;
    const nextMeleeWeapons =
      selectedAlternateRankId && selectedMeleeWeaponChoice && selectedMeleeWeaponReferenceId
        ? applyAlternateRankMeleeWeaponGrant(
            character.meleeWeapons,
            selectedAlternateRankId,
            selectedMeleeWeaponChoice.id,
            selectedMeleeWeaponReferenceId
          )
        : character.meleeWeapons;
    setSaving(true);
    const saved = await onConfirm({
      experience: titledExperience,
      header: applyCareerRankUp(character.header, titledExperience.spent, selectedRank.id),
      ...(nextGear !== character.gear ? { gear: nextGear } : {}),
      ...(nextTalentsAndTraits !== character.talentsAndTraits
        ? { talentsAndTraits: nextTalentsAndTraits }
        : {}),
      ...(nextMeleeWeapons !== character.meleeWeapons ? { meleeWeapons: nextMeleeWeapons } : {}),
    });
    setSaving(false);
    if (saved !== false) onClose();
  };

  const cancel = async () => {
    const clearedExperience = clearRankUpXpCost(character.experience, progression.currentRank.id);
    if (clearedExperience !== character.experience) {
      setSaving(true);
      const saved = await onUpdate(clearedExperience);
      setSaving(false);
      if (saved === false) return;
    }
    onClose();
  };

  return (
    <>
      <ModalShell
        ariaLabel="Confirm Rank Up"
        onClose={cancel}
        className="max-w-lg overflow-y-auto"
        suspended={xpAction !== null || rankTypePickerOpen || saving}
      >
        <ModalHeader title="Confirm Rank Up" onClose={cancel} />
        <div className="space-y-4 p-4 lg:p-5">
          <div>
            <div className={uiTextLabel}>Current Rank</div>
            <div className="mt-1 text-lg text-slate-100 lg:text-xl">
              {getRankDisplayName(
                character.experience.alternateRanks ?? [],
                progression.currentRank
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className={uiTextLabel}>
              {progression.requiresBranchChoice ? "Choose the next Career path" : "Next Rank"}
            </div>
            <div
              className={`grid grid-cols-1 gap-2 ${progression.nextRanks.length > 1 ? "sm:grid-cols-2" : ""}`}
            >
              {progression.nextRanks.length === 1 ? (
                <div className={ACTIVE_RANK_CHOICE_CLASS} data-testid="single-next-rank">
                  {progression.nextRanks[0].name}
                </div>
              ) : (
                progression.nextRanks.map((rank) => (
                  <Button
                    key={rank.id}
                    variant={selectedRankId === rank.id ? "careerBranch" : "careerBranchMuted"}
                    onClick={() => {
                      setSelectedRankId(rank.id);
                      selectAlternateRank("");
                      setRankTypePickerOpen(getAvailableAlternateRanks(rank).length >= 2);
                    }}
                    aria-pressed={selectedRankId === rank.id}
                  >
                    {rank.name}
                  </Button>
                ))
              )}
            </div>
          </div>

          {availableAlternateRanks.length === 1 && (
            <div className="space-y-2">
              <div className={uiTextLabel}>Rank type</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant={selectedAlternateRankId === "" ? "careerPath" : "careerPathMuted"}
                  onClick={() => selectAlternateRank("")}
                  aria-pressed={selectedAlternateRankId === ""}
                >
                  {selectedRank?.name ?? "Normal Career Rank"}
                </Button>
                {availableAlternateRanks.map((alternateRank) => (
                  <Button
                    key={alternateRank.id}
                    variant={
                      selectedAlternateRankId === alternateRank.id
                        ? "careerPath"
                        : "careerPathMuted"
                    }
                    onClick={() => selectAlternateRank(alternateRank.id)}
                    aria-pressed={selectedAlternateRankId === alternateRank.id}
                  >
                    {alternateRank.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {availableAlternateRanks.length >= 2 && selectedRankTypeName && (
            <div className="space-y-2">
              <div className={uiTextLabel}>Rank type</div>
              <Button
                className="w-full"
                variant="careerPath"
                onClick={() => setRankTypePickerOpen(true)}
                aria-haspopup="dialog"
              >
                {selectedRankTypeName}
              </Button>
            </div>
          )}

          {titleChoice && (
            <RankTitleChoice
              careerName={titleChoice.includesCareerName ? selectedRank?.name : undefined}
              options={titleChoice.options}
              value={
                selectedTitle || (titleChoice.includesCareerName ? "" : titleChoice.options[0])
              }
              onChange={setSelectedTitle}
            />
          )}

          {selectedMeleeWeaponChoice && (
            <div className="space-y-2">
              <div className={uiTextLabel}>Choose {selectedMeleeWeaponChoice.label}</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {selectedMeleeWeaponChoice.referenceIds.map((referenceId) => {
                  const weapon = MELEE_WEAPON_REFERENCE.find(
                    (reference) => reference.id === referenceId
                  );
                  if (!weapon) return null;
                  return (
                    <Button
                      key={referenceId}
                      variant={
                        selectedMeleeWeaponReferenceId === referenceId
                          ? "careerPath"
                          : "careerPathMuted"
                      }
                      onClick={() => setSelectedMeleeWeaponReferenceId(referenceId)}
                      aria-pressed={selectedMeleeWeaponReferenceId === referenceId}
                    >
                      {weapon.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

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
                  <span className={`font-code ${colourTextPrimary}`}>
                    {appliedRankUpCostAmount} XP
                  </span>
                  <span className={uiTextLabel}>Reason</span>
                  <span className={uiTextBody}>
                    {appliedRankUpCostReason || "No reason provided"}
                  </span>
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
            <Button variant="neutral" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={
                !selectedRank ||
                (selectedMeleeWeaponChoice !== undefined && !selectedMeleeWeaponReferenceId)
              }
              loading={saving}
              loadingLabel="Saving"
            >
              Confirm Rank Up
            </Button>
          </div>
        </div>
      </ModalShell>

      {rankTypePickerOpen && selectedRank && (
        <PickerModal
          title="Choose Rank Type"
          query=""
          onQueryChange={() => {}}
          onClose={() => setRankTypePickerOpen(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-lg"
        >
          <PickerList>
            <PickerRow
              selected={selectedAlternateRankId === ""}
              aria-pressed={selectedAlternateRankId === ""}
              onClick={() => {
                selectAlternateRank("");
                setRankTypePickerOpen(false);
              }}
            >
              <PickerRowName name={selectedRank.name} />
            </PickerRow>
            {availableAlternateRanks.map((alternateRank) => (
              <PickerRow
                key={alternateRank.id}
                selected={selectedAlternateRankId === alternateRank.id}
                aria-pressed={selectedAlternateRankId === alternateRank.id}
                onClick={() => {
                  selectAlternateRank(alternateRank.id);
                  setRankTypePickerOpen(false);
                }}
              >
                <PickerRowName name={alternateRank.name} />
              </PickerRow>
            ))}
          </PickerList>
        </PickerModal>
      )}

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
              <Chip size="sm" colour={ENTRY_KIND_COLOURS[entry.kind]}>
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
    <AccordionCard
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
      aria-label={`${expanded ? "Collapse" : "Expand"} ${label} purchases`}
      header={
        <span className={`block truncate text-sm font-semibold lg:text-base ${colourSkyPlain}`}>
          {label}
        </span>
      }
    >
      {expanded && (
        <div className="space-y-2 border-t border-slate-700 p-2">
          <RankEntryList entries={entries} emptyText="" showKind={false} boxed />
        </div>
      )}
    </AccordionCard>
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
        <span className="shrink-0 font-code text-sm text-slate-300">{total} XP</span>
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
  campaignId,
  character,
  isDM,
  editable,
  onUpdate,
  onAdjustXp,
  onUpdateCharacter,
}: ExperienceTabProps) {
  recordComponentRender("ExperienceTab");
  const { experience } = character;
  const { entries: xpHistory, error: xpHistoryError } = useXpHistory(campaignId, character.id);
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
  const currentRankCard = rankCards.find((card) => card.isCurrent);
  const currentRankCardId = currentRankCard?.rankId;
  const [rankExpansion, setRankExpansion] = useState(() => ({
    currentRankCardId,
    expandedRankIds: new Set(currentRankCardId ? [currentRankCardId] : []),
  }));
  const expandedRankIds =
    rankExpansion.currentRankCardId === currentRankCardId
      ? rankExpansion.expandedRankIds
      : new Set(currentRankCardId ? [currentRankCardId] : []);
  const canAddXp = editable;
  const canRemoveXp = editable;
  const canManageRank = isDM && editable;
  const canUseXpAction = xpAction === "spend" ? canManageRank : editable;
  const orderedRankCards = [...rankCards].sort(
    (left, right) => Number(right.isCurrent) - Number(left.isCurrent) || right.tier - left.tier
  );

  const changeRankTitle = (card: RankCard, title: string) => {
    const choice = card.titleChoice;
    if (!choice) return;
    return onUpdate({
      ...experience,
      alternateRanks: (experience.alternateRanks ?? []).map((selection) => {
        if (selection.alternateRankId !== choice.alternateRankId) return selection;
        const titleChoices = { ...selection.titleChoices };
        if (title) titleChoices[String(card.tier)] = title;
        else delete titleChoices[String(card.tier)];
        return { ...selection, titleChoices };
      }),
    });
  };

  const toggleRankCard = (rankId: string) => {
    setRankExpansion((current) => {
      const next = new Set(
        current.currentRankCardId === currentRankCardId
          ? current.expandedRankIds
          : currentRankCardId
            ? [currentRankCardId]
            : []
      );
      if (next.has(rankId)) next.delete(rankId);
      else next.add(rankId);
      return { currentRankCardId, expandedRankIds: next };
    });
  };

  return (
    <div className="space-y-6">
      {!editable && <span className={readOnlyBadgeClass}>Read-only</span>}

      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <div
          className={`${uiSectionShell} flex min-w-0 flex-col items-center justify-center p-2 text-center sm:p-3 lg:p-4`}
        >
          <div className={`mb-1 w-full text-center ${XP_SUMMARY_LABEL_CLASS}`}>Total XP</div>
          <div className="w-full text-center font-code text-xl font-semibold text-slate-100 sm:text-2xl lg:text-3xl">
            {experience.total}
          </div>
        </div>

        <div
          className={`${uiSectionShell} flex min-w-0 flex-col items-center justify-center p-2 text-center sm:p-3 lg:p-4`}
        >
          <div className={`mb-1 w-full text-center ${XP_SUMMARY_LABEL_CLASS}`}>Spent XP</div>
          <div className="w-full text-center font-code text-xl font-semibold text-slate-100 sm:text-2xl lg:text-3xl">
            {experience.spent}
          </div>
        </div>

        <div
          className={`${uiSectionShell} flex min-w-0 flex-col items-center justify-center p-2 text-center sm:p-3 lg:p-4`}
        >
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

      <section className="space-y-3">
        <SectionHeader>XP History</SectionHeader>
        <div className={`${uiSection} space-y-2`}>
          {xpHistoryError ? (
            <p className={`text-sm ${uiTextError} lg:text-base`}>XP history could not be loaded.</p>
          ) : xpHistory.length === 0 ? (
            <p className={uiTextPlaceholder}>No XP adjustments have been recorded yet.</p>
          ) : (
            xpHistory.map((entry) => {
              const date = xpHistoryDate(entry.createdAt);
              const actor = entry.actorName ?? (entry.actorRole === "dm" ? "DM" : "Player");
              return (
                <article
                  key={entry.id}
                  className={`${uiSection} grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center`}
                >
                  <div
                    className={`font-code text-lg font-semibold ${
                      entry.amountXp < 0 ? colourAmberPlain : colourEmeraldPlain
                    }`}
                  >
                    {entry.amountXp > 0 ? "+" : ""}
                    {entry.amountXp} XP
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-slate-100 lg:text-base">{entry.reason}</div>
                    <div className="mt-0.5 text-xs text-slate-400 lg:text-sm">
                      {actor}
                      {date ? ` · ${date.toLocaleString("en-IE")}` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 sm:text-right lg:text-sm">
                    Balance <span className="font-code text-slate-200">{entry.balanceXp} XP</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {progression && (
        <section className="space-y-3">
          <SectionHeader>Rank Progression</SectionHeader>
          <div className={`${uiSection} space-y-4`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className={uiTextLabel}>Current Rank</div>
                <div className="mt-1 text-lg text-slate-100 lg:text-xl">
                  {currentRankCard?.name ?? progression.currentRank.name}
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
              <div
                className={`grid gap-2 border-t border-slate-700 pt-4 ${
                  canManageRank ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
                }`}
              >
                <Button variant="successOutline" onClick={() => setXpAction("add")}>
                  Add XP
                </Button>
                {canRemoveXp && (
                  <Button
                    variant="warningOutline"
                    onClick={() => setXpAction("remove")}
                    disabled={remaining <= 0}
                  >
                    Remove XP
                  </Button>
                )}
                {canManageRank && progression.nextBand && (
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
                  className={card.isCurrent ? `${uiNoticeBox} ${colourNoticeRed}` : uiSectionShell}
                >
                  <AccordionCard
                    shellClassName="rounded-lg"
                    showChevron={false}
                    expanded={expanded}
                    onToggle={() => toggleRankCard(card.rankId)}
                    aria-controls={detailsId}
                    aria-label={`${expanded ? "Collapse" : "Expand"} ${card.name} Rank Card`}
                    header={
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className={`${uiItemName} text-lg text-red-500 lg:text-xl`}>
                            {card.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Chip colour="fuchsia" className="font-code">
                              Rank {card.tier}
                            </Chip>
                            <Chip colour="amber" className="font-code">
                              {card.xpLevel} XP
                            </Chip>
                            {card.isCurrent && <Chip colour="emerald">Current</Chip>}
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
                      </div>
                    }
                  >
                    {expanded && (
                      <div id={detailsId} className="space-y-4 p-3 pt-0 lg:p-4 lg:pt-0">
                        {editable && card.titleChoice && (
                          <RankTitleChoice
                            careerName={
                              card.titleChoice.includesCareerName ? card.careerRankName : undefined
                            }
                            options={card.titleChoice.options}
                            value={
                              card.titleChoice.options.includes(card.name)
                                ? card.name
                                : card.titleChoice.includesCareerName
                                  ? ""
                                  : card.titleChoice.options[0]
                            }
                            onChange={(title) => changeRankTitle(card, title)}
                          />
                        )}
                        <RankDetailsSwitcher card={card} />
                      </div>
                    )}
                  </AccordionCard>
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
          onAdjustXp={onAdjustXp}
          onClose={() => setXpAction(null)}
        />
      )}

      {canManageRank && rankUpOpen && progression && (
        <RankUpModal
          character={character}
          progression={progression}
          onUpdate={onUpdate}
          onConfirm={onUpdateCharacter}
          onClose={() => setRankUpOpen(false)}
        />
      )}
    </div>
  );
}
