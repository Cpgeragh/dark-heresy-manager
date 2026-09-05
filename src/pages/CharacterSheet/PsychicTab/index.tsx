// src/pages/CharacterSheet/PsychicTab/index.tsx

import { useState, useCallback, useRef } from "react";
import type { PsychicBlock, PsychicPower, TalentsAndTraitsBlock } from "../../../types/Character";
import { useSwipeableTabs } from "../../../hooks/useSwipeableTabs";
import {
  PSYCHIC_DISCIPLINES,
  getPsychicPowerDescription,
  type PsychicPowerRef,
} from "../../../data/reference/psychicReference";
import { uiSection, uiFormLabel, uiItemName } from "../../../ui/styles/editableStyles";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import { Chip } from "../../../ui/chips/Chip";
import { SectionHeader } from "../../../ui/SectionHeader";
import { PickerBody, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { ArrowRight } from "../../../ui/icons/PickerArrows";
import { InfoModal } from "../../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../../data/reference/talentDescriptions";
import {
  disciplineActiveColours,
  disciplineInactiveColours,
  psyRatingPulseVars,
  psychicSelectionSourceColours,
} from "./psychicStyles";
import { colourActiveSky, colourActiveRose } from "../../../ui/styles/colourTokens";
import { SegmentedTabs, type SegmentedTabOption } from "../../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../../ui/styles/segmentedTabStyles";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../../hooks/useCustomItemLibraryActions";
import { createDraftCustomItem, saveDraftCustomItem } from "../../../services/customItemService";
import { useToast } from "../../../components/Toast";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import {
  getAvailablePsychicTalentPurchases,
  getAvailablePsyRatingPowerGrants,
  linkPowerToPsyRatingGrant,
  linkPowerToTalentPurchase,
} from "../../../mechanics/talents/talentUtils";
import { CustomPowerForm } from "./CustomPowerForm";
import { PowerGrid } from "./PowerGrid";
import { PowerPicker } from "./PowerPicker";
import { normalisePowerName, toCustomPowerData } from "./psychicPowerHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PsychicTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  psychic: PsychicBlock;
  talents: TalentsAndTraitsBlock;
  psyRating: number;
  editable: boolean;
  onUpdate: (next: PsychicBlock) => void | Promise<void>;
}

type PickerTarget = "minor" | "major" | null;
type PowerGroup = "minor" | "major";
const POWER_GROUPS = ["minor", "major"] as const satisfies readonly PowerGroup[];
const PSYCHIC_POWER_TABS = [
  {
    value: "minor",
    label: "Minor",
    activeClassName: colourActiveSky,
  },
  {
    value: "major",
    label: "Major",
    activeClassName: colourActiveRose,
  },
] as const satisfies readonly SegmentedTabOption<PowerGroup>[];
const PSYCHIC_POWER_TABS_ID = "psychic-power-groups";
type EditingCustomPower = { target: PowerGroup; power: PsychicPower } | null;

function PowerSectionHeading({
  title,
  availableSelections,
}: {
  title: string;
  availableSelections: number;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      <SectionHeader>{title}</SectionHeader>
      {availableSelections > 0 && (
        <Chip className="border-amber-500/60 bg-amber-950/30 text-amber-300">
          Available: {availableSelections}
        </Chip>
      )}
    </div>
  );
}

function PowerRouteCard({
  title,
  status,
  statusClassName,
  onClick,
}: {
  title: string;
  status: string;
  statusClassName: string;
  onClick: () => void;
}) {
  return (
    <PickerRow
      card
      aria-label={title}
      className="rounded-lg border border-slate-500 bg-slate-900/60"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className={uiItemName}>{title}</p>
          <Chip className={statusClassName}>{status}</Chip>
        </div>
        <ArrowRight />
      </div>
    </PickerRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PsychicTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  psychic,
  talents,
  psyRating,
  editable,
  onUpdate,
}: PsychicTabProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [purchaseChoiceTarget, setPurchaseChoiceTarget] = useState<PickerTarget>(null);
  const [pendingTalentEntryUid, setPendingTalentEntryUid] = useState<string | undefined>();
  const [purchaseModeTarget, setPurchaseModeTarget] = useState<PickerTarget>(null);
  const [pendingPsyRatingTalentEntryUid, setPendingPsyRatingTalentEntryUid] = useState<
    string | undefined
  >();
  const [psyRatingModeTarget, setPsyRatingModeTarget] = useState<PickerTarget>(null);
  const [powerSelectionBusy, setPowerSelectionBusy] = useState(false);
  const powerSelectionBusyRef = useRef(false);
  const [customTarget, setCustomTarget] = useState<PickerTarget>(null);
  const [editingCustomPower, setEditingCustomPower] = useState<EditingCustomPower>(null);
  const [activePowerGroup, setActivePowerGroup] = useState<PowerGroup>(() =>
    psychic.minorPowers.length === 0 && psychic.majorPowers.length > 0 ? "major" : "minor"
  );
  const {
    containerRef,
    transitionClass,
    switchTo: switchPowerGroup,
  } = useSwipeableTabs(POWER_GROUPS, activePowerGroup, setActivePowerGroup);
  const toast = useToast();

  const { items: campaignCustomPowerItems } = useCampaignCustomItems({
    campaignId,
    category: "power",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomPowers = campaignCustomPowerItems as CampaignCustomItem<"power">[];
  const campaignCustomPowersById = new Map(campaignCustomPowers.map((item) => [item.id, item]));

  const { publishDefinition, archiveDefinition, updateAllCopies, getBusyAction } =
    useCustomItemLibraryActions<"power">({ campaignId, userId, itemLabel: "psychic power" });

  const availableMinorPurchases = getAvailablePsychicTalentPurchases(talents, psychic, "minor");
  const availableMajorPurchases = getAvailablePsychicTalentPurchases(talents, psychic, "major");
  const availableMinorPsyRatingGrants = getAvailablePsyRatingPowerGrants(talents, psychic, "minor");
  const availableMajorPsyRatingGrants = getAvailablePsyRatingPowerGrants(talents, psychic, "major");
  const availableMinorPsyRatingCount = availableMinorPsyRatingGrants.reduce(
    (total, grant) => total + grant.remaining,
    0
  );
  const availableMajorPsyRatingCount = availableMajorPsyRatingGrants.reduce(
    (total, grant) => total + grant.remaining,
    0
  );

  const advancePurchasedPowerMode = useCallback(
    (target: PowerGroup, usedPurchaseUid: string | undefined) => {
      if (!usedPurchaseUid || purchaseModeTarget !== target) {
        setPendingTalentEntryUid(undefined);
        return;
      }
      const available = target === "minor" ? availableMinorPurchases : availableMajorPurchases;
      const nextPurchase = available.find((entry) => entry.uid !== usedPurchaseUid);
      if (nextPurchase) {
        setPendingTalentEntryUid(nextPurchase.uid);
      } else {
        setPendingTalentEntryUid(undefined);
        setPurchaseModeTarget(null);
        setPickerTarget(null);
      }
    },
    [purchaseModeTarget, availableMinorPurchases, availableMajorPurchases]
  );

  const advancePsyRatingGrantMode = useCallback(
    (target: PowerGroup, usedTalentUid: string | undefined) => {
      if (!usedTalentUid || psyRatingModeTarget !== target) {
        setPendingPsyRatingTalentEntryUid(undefined);
        return;
      }
      const available =
        target === "minor" ? availableMinorPsyRatingGrants : availableMajorPsyRatingGrants;
      const usedGrant = available.find((grant) => grant.entry.uid === usedTalentUid);
      const nextGrant =
        usedGrant && usedGrant.remaining > 1
          ? usedGrant
          : available.find((grant) => grant.entry.uid !== usedTalentUid);
      if (nextGrant) {
        setPendingPsyRatingTalentEntryUid(nextGrant.entry.uid);
      } else {
        setPendingPsyRatingTalentEntryUid(undefined);
        setPsyRatingModeTarget(null);
        setPickerTarget(null);
      }
    },
    [psyRatingModeTarget, availableMinorPsyRatingGrants, availableMajorPsyRatingGrants]
  );

  // ── Field updates ────────────────────────────────────────────────────────

  // ── Power array operations ────────────────────────────────────────────────

  const removeMinorPower = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate({
        ...psychic,
        minorPowers: psychic.minorPowers.filter((p) => p.id !== id),
      });
    },
    [editable, psychic, onUpdate]
  );

  const removeMajorPower = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate({
        ...psychic,
        majorPowers: psychic.majorPowers.filter((p) => p.id !== id),
      });
    },
    [editable, psychic, onUpdate]
  );

  /** Add a power from the reference picker */
  const fromReference = useCallback(
    async (ref: PsychicPowerRef) => {
      if (!editable || powerSelectionBusyRef.current) return;
      powerSelectionBusyRef.current = true;
      setPowerSelectionBusy(true);
      const newPower: PsychicPower = {
        id: crypto.randomUUID(),
        name: ref.name,
        discipline: ref.discipline,
        threshold: String(ref.threshold),
        focusTime: ref.focusTime,
        sustained: ref.sustained ? "Yes" : "No",
        range: ref.range,
        description: getPsychicPowerDescription(ref),
        source: ref.source,
        isMinor: ref.discipline === "Minor",
        known: true,
        ...(pendingTalentEntryUid ? { talentEntryUid: pendingTalentEntryUid } : {}),
        ...(pendingPsyRatingTalentEntryUid
          ? { psyRatingTalentEntryUid: pendingPsyRatingTalentEntryUid }
          : {}),
      };
      const type = ref.discipline === "Minor" ? "minorPowers" : "majorPowers";
      try {
        await onUpdate({
          ...psychic,
          [type]: [...psychic[type], newPower],
        });
        advancePurchasedPowerMode(
          type === "minorPowers" ? "minor" : "major",
          pendingTalentEntryUid
        );
        advancePsyRatingGrantMode(
          type === "minorPowers" ? "minor" : "major",
          pendingPsyRatingTalentEntryUid
        );
      } finally {
        powerSelectionBusyRef.current = false;
        setPowerSelectionBusy(false);
      }
    },
    [
      editable,
      psychic,
      onUpdate,
      pendingTalentEntryUid,
      pendingPsyRatingTalentEntryUid,
      advancePurchasedPowerMode,
      advancePsyRatingGrantMode,
    ]
  );

  /** Add a power selected from the campaign's custom item library */
  const fromCustomLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"power">) => {
      if (!editable || powerSelectionBusyRef.current) return;
      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);
      if (!versionId) {
        toast.error("This custom power has no usable version.");
        return;
      }
      powerSelectionBusyRef.current = true;
      setPowerSelectionBusy(true);
      const type = libraryItem.data.isMinor ? "minorPowers" : "majorPowers";
      const newPower: PsychicPower = {
        id: crypto.randomUUID(),
        ...libraryItem.data,
        known: true,
        customLibraryId: libraryItem.id,
        customLibraryVersionId: versionId,
        ...(pendingTalentEntryUid ? { talentEntryUid: pendingTalentEntryUid } : {}),
        ...(pendingPsyRatingTalentEntryUid
          ? { psyRatingTalentEntryUid: pendingPsyRatingTalentEntryUid }
          : {}),
      };
      try {
        await onUpdate({
          ...psychic,
          [type]: [...psychic[type], newPower],
        });
        advancePurchasedPowerMode(
          type === "minorPowers" ? "minor" : "major",
          pendingTalentEntryUid
        );
        advancePsyRatingGrantMode(
          type === "minorPowers" ? "minor" : "major",
          pendingPsyRatingTalentEntryUid
        );
      } finally {
        powerSelectionBusyRef.current = false;
        setPowerSelectionBusy(false);
      }
    },
    [
      editable,
      psychic,
      onUpdate,
      toast,
      pendingTalentEntryUid,
      pendingPsyRatingTalentEntryUid,
      advancePurchasedPowerMode,
      advancePsyRatingGrantMode,
    ]
  );

  const beginAddPower = useCallback(
    (target: PowerGroup) => {
      if (!editable) {
        setPurchaseModeTarget(null);
        setPsyRatingModeTarget(null);
        setPendingTalentEntryUid(undefined);
        setPendingPsyRatingTalentEntryUid(undefined);
        setPurchaseChoiceTarget(null);
        setPickerTarget(target);
        return;
      }
      const available = target === "minor" ? availableMinorPurchases : availableMajorPurchases;
      const grants =
        target === "minor" ? availableMinorPsyRatingGrants : availableMajorPsyRatingGrants;
      if (available.length > 0 || grants.length > 0) {
        setPurchaseModeTarget(null);
        setPsyRatingModeTarget(null);
        setPurchaseChoiceTarget(target);
      } else {
        setPurchaseModeTarget(null);
        setPsyRatingModeTarget(null);
        setPendingTalentEntryUid(undefined);
        setPendingPsyRatingTalentEntryUid(undefined);
        setPickerTarget(target);
      }
    },
    [
      editable,
      availableMinorPurchases,
      availableMajorPurchases,
      availableMinorPsyRatingGrants,
      availableMajorPsyRatingGrants,
    ]
  );

  const openPickerForMinor = useCallback(() => beginAddPower("minor"), [beginAddPower]);
  const openPickerForMajor = useCallback(() => beginAddPower("major"), [beginAddPower]);

  const addCustomPower = useCallback(
    async (power: PsychicPower) => {
      if (!editable || customTarget === null) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom powers.");
        return;
      }
      const type = customTarget === "minor" ? "minorPowers" : "majorPowers";
      try {
        const data = toCustomPowerData(power);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "power",
          creator: { userId, characterId, characterName },
          data,
        });
        await onUpdate({
          ...psychic,
          [type]: [
            ...psychic[type],
            {
              ...power,
              customLibraryId: customItemId,
              customLibraryVersionId: versionId,
              ...(pendingTalentEntryUid ? { talentEntryUid: pendingTalentEntryUid } : {}),
              ...(pendingPsyRatingTalentEntryUid
                ? { psyRatingTalentEntryUid: pendingPsyRatingTalentEntryUid }
                : {}),
            },
          ],
        });
        setCustomTarget(null);
        advancePurchasedPowerMode(customTarget, pendingTalentEntryUid);
        advancePsyRatingGrantMode(customTarget, pendingPsyRatingTalentEntryUid);
        toast.success("Custom power saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom power:", err);
        toast.error("Failed to save custom power.");
      }
    },
    [
      editable,
      customTarget,
      campaignId,
      characterId,
      characterName,
      userId,
      psychic,
      onUpdate,
      toast,
      pendingTalentEntryUid,
      pendingPsyRatingTalentEntryUid,
      advancePurchasedPowerMode,
      advancePsyRatingGrantMode,
    ]
  );

  const updateCustomPower = useCallback(
    async (power: PsychicPower) => {
      if (!editable || editingCustomPower === null || !userId) return;
      const libraryItemId = power.customLibraryId;
      if (!libraryItemId) return;
      const type = editingCustomPower.target === "minor" ? "minorPowers" : "majorPowers";
      try {
        const data = toCustomPowerData(power);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: libraryItemId,
          category: "power",
          editor: { userId, characterId, characterName },
          data,
        });
        await onUpdate({
          ...psychic,
          [type]: psychic[type].map((existing) =>
            existing.id === power.id ? { ...power, customLibraryVersionId: versionId } : existing
          ),
        });
        setEditingCustomPower(null);
        toast.success("Custom power draft updated.");
      } catch (err) {
        console.error("Failed to update custom power definition:", err);
        toast.error("Failed to update custom power definition.");
      }
    },
    [
      editable,
      editingCustomPower,
      campaignId,
      characterId,
      characterName,
      userId,
      psychic,
      onUpdate,
      toast,
    ]
  );

  const handleLinkExistingPower = useCallback(
    (group: PowerGroup, power: PsychicPower) => {
      if (!editable || power.talentEntryUid) return;
      const available = group === "minor" ? availableMinorPurchases : availableMajorPurchases;
      const purchase = available[0];
      if (!purchase) return;
      const next = linkPowerToTalentPurchase(psychic, talents, power.id, purchase.uid);
      if (next !== psychic) onUpdate(next);
    },
    [editable, availableMinorPurchases, availableMajorPurchases, psychic, talents, onUpdate]
  );

  const handleLinkExistingPowerToPsyRating = useCallback(
    (group: PowerGroup, power: PsychicPower) => {
      if (!editable || power.talentEntryUid || power.psyRatingTalentEntryUid) return;
      const available =
        group === "minor" ? availableMinorPsyRatingGrants : availableMajorPsyRatingGrants;
      const grant = available.find(
        (candidate) =>
          group === "minor" ||
          !candidate.entry.acquisition?.psyRatingDiscipline ||
          candidate.entry.acquisition.psyRatingDiscipline === power.discipline
      );
      if (!grant) return;
      const next = linkPowerToPsyRatingGrant(psychic, talents, power.id, grant.entry.uid);
      if (next !== psychic) onUpdate(next);
    },
    [
      editable,
      availableMinorPsyRatingGrants,
      availableMajorPsyRatingGrants,
      psychic,
      talents,
      onUpdate,
    ]
  );
  // ── Render ────────────────────────────────────────────────────────────────

  const activePowers = activePowerGroup === "minor" ? psychic.minorPowers : psychic.majorPowers;
  const activeRemove = activePowerGroup === "minor" ? removeMinorPower : removeMajorPower;
  const activeOpenPicker = activePowerGroup === "minor" ? openPickerForMinor : openPickerForMajor;
  const activeEditPower = (power: PsychicPower) =>
    setEditingCustomPower({ target: activePowerGroup, power });
  const activeTitle = activePowerGroup === "minor" ? "Minor Powers" : "Major Powers";
  const activeEmptyText =
    activePowerGroup === "minor" ? "No minor powers recorded." : "No major powers recorded.";
  const existingPowerNames = new Set([
    ...psychic.minorPowers.map((p) => normalisePowerName(p.name)),
    ...psychic.majorPowers.map((p) => normalisePowerName(p.name)),
  ]);

  return (
    <div className="space-y-6">
      {/* PSY RATING & DISCIPLINES ────────────────────────────────────────── */}
      <div className={uiSection + " flex flex-col items-center space-y-3"}>
        {/* Psy Rating — derived from highest Psy Rating talent */}
        <div className="inline-flex flex-col items-center gap-2">
          <span className={uiFormLabel}>Psy Rating</span>
          <div className="relative inline-flex">
            <div
              className={`w-[26px] h-[26px] flex items-center justify-center rounded border border-indigo-500/50 bg-indigo-950/40 transition-shadow${
                psyRating > 0 ? " animate-psy-pulse" : ""
              }`}
              style={psyRatingPulseVars(psyRating)}
            >
              <span className="text-sm lg:text-base font-bold font-code text-indigo-300">
                {psyRating}
              </span>
            </div>
            {psyRating > 0 && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2">
                <InfoModal
                  title={`Psy Rating ${psyRating}`}
                  content={
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {TALENT_DESCRIPTIONS[`psy-rating-${psyRating}`]}
                    </p>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Disciplines — read-only status chips activated through Psy Rating Talents */}
        <div>
          <p className={`${uiFormLabel} mb-1.5 text-center`}>Disciplines</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor").map((d) => {
              const active = (psychic.disciplines ?? []).includes(d);
              return (
                <span
                  key={d}
                  aria-label={`${d}: ${active ? "known" : "not known"}`}
                  className={[
                    "px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm transition",
                    active
                      ? (disciplineActiveColours[d] ?? disciplineActiveColours.default)
                      : (disciplineInactiveColours[d] ?? disciplineInactiveColours.default),
                  ].join(" ")}
                >
                  {d}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* MINOR POWERS ────────────────────────────────────────────────────── */}
      <div ref={containerRef} className="lg:hidden space-y-4">
        <SegmentedTabs
          id={PSYCHIC_POWER_TABS_ID}
          ariaLabel="Psychic power groups"
          options={PSYCHIC_POWER_TABS}
          value={activePowerGroup}
          onChange={switchPowerGroup}
        />

        <section
          key={activePowerGroup}
          id={segmentedTabPanelId(PSYCHIC_POWER_TABS_ID, activePowerGroup)}
          aria-labelledby={segmentedTabId(PSYCHIC_POWER_TABS_ID, activePowerGroup)}
          className={["space-y-4", uiSwipeableTabPanel, transitionClass].join(" ")}
          role="tabpanel"
        >
          <div className="flex items-center justify-between">
            <PowerSectionHeading
              title={activeTitle}
              availableSelections={
                activePowerGroup === "minor"
                  ? availableMinorPurchases.length + availableMinorPsyRatingCount
                  : availableMajorPurchases.length + availableMajorPsyRatingCount
              }
            />
            {editable ? (
              <AddButton label={`Add ${activeTitle.slice(0, -1)}`} onClick={activeOpenPicker} />
            ) : (
              <ViewButton label={`View ${activeTitle}`} onClick={activeOpenPicker} />
            )}
          </div>
          {activePowers.length === 0 ? (
            <p className="text-sm lg:text-base text-slate-400">{activeEmptyText}</p>
          ) : (
            <PowerGrid
              powers={activePowers}
              talents={talents}
              editable={editable}
              isDM={isDM}
              userId={userId}
              campaignCustomPowersById={campaignCustomPowersById}
              getBusyAction={getBusyAction}
              onRemove={activeRemove}
              onEdit={activeEditPower}
              onPublishPower={publishDefinition}
              onArchivePower={archiveDefinition}
              onUpdateAllPowerCopies={updateAllCopies}
              canLinkPurchase={
                activePowerGroup === "minor"
                  ? availableMinorPurchases.length > 0
                  : availableMajorPurchases.length > 0
              }
              onLinkPurchase={(power) => handleLinkExistingPower(activePowerGroup, power)}
              canLinkPsyRatingGrant={(power) =>
                (activePowerGroup === "minor"
                  ? availableMinorPsyRatingGrants
                  : availableMajorPsyRatingGrants
                ).some(
                  (grant) =>
                    activePowerGroup === "minor" ||
                    !grant.entry.acquisition?.psyRatingDiscipline ||
                    grant.entry.acquisition.psyRatingDiscipline === power.discipline
                )
              }
              onLinkPsyRatingGrant={(power) =>
                handleLinkExistingPowerToPsyRating(activePowerGroup, power)
              }
            />
          )}
        </section>
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <section className={uiSection + " space-y-4"}>
          <div className="flex items-center justify-between">
            <PowerSectionHeading
              title="Minor Powers"
              availableSelections={availableMinorPurchases.length + availableMinorPsyRatingCount}
            />
            {editable ? (
              <AddButton label="Add Minor Power" onClick={openPickerForMinor} />
            ) : (
              <ViewButton label="View Minor Powers" onClick={openPickerForMinor} />
            )}
          </div>
          {psychic.minorPowers.length === 0 ? (
            <p className="text-sm lg:text-base text-slate-400">No minor powers recorded.</p>
          ) : (
            <PowerGrid
              powers={psychic.minorPowers}
              talents={talents}
              editable={editable}
              isDM={isDM}
              userId={userId}
              campaignCustomPowersById={campaignCustomPowersById}
              getBusyAction={getBusyAction}
              onRemove={removeMinorPower}
              onEdit={(power) => setEditingCustomPower({ target: "minor", power })}
              onPublishPower={publishDefinition}
              onArchivePower={archiveDefinition}
              onUpdateAllPowerCopies={updateAllCopies}
              canLinkPurchase={availableMinorPurchases.length > 0}
              onLinkPurchase={(power) => handleLinkExistingPower("minor", power)}
              canLinkPsyRatingGrant={() => availableMinorPsyRatingGrants.length > 0}
              onLinkPsyRatingGrant={(power) => handleLinkExistingPowerToPsyRating("minor", power)}
            />
          )}
        </section>

        {/* MAJOR POWERS ────────────────────────────────────────────────────── */}
        <section className={uiSection + " space-y-4"}>
          <div className="flex items-center justify-between">
            <PowerSectionHeading
              title="Major Powers"
              availableSelections={availableMajorPurchases.length + availableMajorPsyRatingCount}
            />
            {editable ? (
              <AddButton label="Add Major Power" onClick={openPickerForMajor} />
            ) : (
              <ViewButton label="View Major Powers" onClick={openPickerForMajor} />
            )}
          </div>
          {psychic.majorPowers.length === 0 ? (
            <p className="text-sm lg:text-base text-slate-400">No major powers recorded.</p>
          ) : (
            <PowerGrid
              powers={psychic.majorPowers}
              talents={talents}
              editable={editable}
              isDM={isDM}
              userId={userId}
              campaignCustomPowersById={campaignCustomPowersById}
              getBusyAction={getBusyAction}
              onRemove={removeMajorPower}
              onEdit={(power) => setEditingCustomPower({ target: "major", power })}
              onPublishPower={publishDefinition}
              onArchivePower={archiveDefinition}
              onUpdateAllPowerCopies={updateAllCopies}
              canLinkPurchase={availableMajorPurchases.length > 0}
              onLinkPurchase={(power) => handleLinkExistingPower("major", power)}
              canLinkPsyRatingGrant={(power) =>
                availableMajorPsyRatingGrants.some(
                  (grant) =>
                    !grant.entry.acquisition?.psyRatingDiscipline ||
                    grant.entry.acquisition.psyRatingDiscipline === power.discipline
                )
              }
              onLinkPsyRatingGrant={(power) => handleLinkExistingPowerToPsyRating("major", power)}
            />
          )}
        </section>

        {/* POWER PICKER MODAL ──────────────────────────────────────────────── */}
      </div>

      {purchaseChoiceTarget !== null && (
        <PickerModal
          title={`Add ${purchaseChoiceTarget === "minor" ? "Minor" : "Major"} Power`}
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPurchaseChoiceTarget(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          suspended={pickerTarget !== null}
        >
          <PickerBody>
            <div className="space-y-2">
              {(purchaseChoiceTarget === "minor"
                ? availableMinorPurchases
                : availableMajorPurchases
              ).length > 0 && (
                <PowerRouteCard
                  title={
                    purchaseChoiceTarget === "minor"
                      ? "Use Minor Psychic Power selection"
                      : "Use Psychic Power selection"
                  }
                  status={`Available: ${
                    purchaseChoiceTarget === "minor"
                      ? availableMinorPurchases.length
                      : availableMajorPurchases.length
                  }`}
                  statusClassName={psychicSelectionSourceColours.talent}
                  onClick={() => {
                    const available =
                      purchaseChoiceTarget === "minor"
                        ? availableMinorPurchases
                        : availableMajorPurchases;
                    setPurchaseModeTarget(purchaseChoiceTarget);
                    setPsyRatingModeTarget(null);
                    setPendingTalentEntryUid(available[0]?.uid);
                    setPendingPsyRatingTalentEntryUid(undefined);
                    setPickerTarget(purchaseChoiceTarget);
                  }}
                />
              )}
              {(purchaseChoiceTarget === "minor"
                ? availableMinorPsyRatingGrants
                : availableMajorPsyRatingGrants
              ).length > 0 && (
                <PowerRouteCard
                  title="Use Psy Rating selection"
                  status={`Available: ${
                    purchaseChoiceTarget === "minor"
                      ? availableMinorPsyRatingCount
                      : availableMajorPsyRatingCount
                  }`}
                  statusClassName={psychicSelectionSourceColours.psyRating}
                  onClick={() => {
                    const available =
                      purchaseChoiceTarget === "minor"
                        ? availableMinorPsyRatingGrants
                        : availableMajorPsyRatingGrants;
                    setPendingTalentEntryUid(undefined);
                    setPurchaseModeTarget(null);
                    setPsyRatingModeTarget(purchaseChoiceTarget);
                    setPendingPsyRatingTalentEntryUid(available[0]?.entry.uid);
                    setPickerTarget(purchaseChoiceTarget);
                  }}
                />
              )}
              <PowerRouteCard
                title={
                  purchaseChoiceTarget === "minor"
                    ? "Add independent Minor power"
                    : "Add independent Major power"
                }
                status="No selection used"
                statusClassName="border-slate-500 bg-slate-800/40 text-slate-300"
                onClick={() => {
                  setPendingTalentEntryUid(undefined);
                  setPurchaseModeTarget(null);
                  setPsyRatingModeTarget(null);
                  setPendingPsyRatingTalentEntryUid(undefined);
                  setPickerTarget(purchaseChoiceTarget);
                }}
              />
            </div>
          </PickerBody>
        </PickerModal>
      )}

      {pickerTarget !== null && (
        <PowerPicker
          excludeMinor={pickerTarget === "major"}
          minorOnly={pickerTarget === "minor"}
          editable={editable}
          existingNames={existingPowerNames}
          customItems={campaignCustomPowers}
          selectionLocked={
            (purchaseModeTarget === pickerTarget && !pendingTalentEntryUid) ||
            (psyRatingModeTarget === pickerTarget && !pendingPsyRatingTalentEntryUid)
          }
          selectionBusy={powerSelectionBusy}
          onSelect={fromReference}
          onSelectCustomItem={fromCustomLibrary}
          onCustom={() => {
            if (pickerTarget === null) return;
            setCustomTarget(pickerTarget);
          }}
          backToRoutes={purchaseChoiceTarget !== null}
          onClose={() => {
            setPickerTarget(null);
            setPendingTalentEntryUid(undefined);
            setPurchaseModeTarget(null);
            setPendingPsyRatingTalentEntryUid(undefined);
            setPsyRatingModeTarget(null);
          }}
          suspended={customTarget !== null}
          requiredDiscipline={
            pendingPsyRatingTalentEntryUid
              ? talents.talents.find((entry) => entry.uid === pendingPsyRatingTalentEntryUid)
                  ?.acquisition?.psyRatingDiscipline
              : undefined
          }
        />
      )}

      {customTarget !== null && (
        <CustomPowerForm
          target={customTarget}
          existingNames={existingPowerNames}
          onAdd={addCustomPower}
          onBack={() => setCustomTarget(null)}
          onCancel={() => setCustomTarget(null)}
          requiredDiscipline={
            pendingPsyRatingTalentEntryUid
              ? talents.talents.find((entry) => entry.uid === pendingPsyRatingTalentEntryUid)
                  ?.acquisition?.psyRatingDiscipline
              : undefined
          }
        />
      )}

      {editingCustomPower !== null && (
        <CustomPowerForm
          target={editingCustomPower.target}
          existingNames={existingPowerNames}
          initialPower={editingCustomPower.power}
          onAdd={updateCustomPower}
          onBack={() => setEditingCustomPower(null)}
          onCancel={() => setEditingCustomPower(null)}
        />
      )}
    </div>
  );
}
