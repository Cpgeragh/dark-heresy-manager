// Shared picker and card components used by TalentsTab and TraitsTab.

import { useEffect, useMemo, useRef, useState } from "react";
import type { TalentEntry } from "../../types/Character";
import type { TalentData } from "../../data/talentData";
import type { TraitData } from "../../data/traitData";
import { TALENT_LIST } from "../../data/talentData";
import { TRAIT_LIST } from "../../data/traitData";
import type { SkillSource } from "../../types/SkillSource";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSection,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/editableStyles";
import { RemoveButton } from "../../ui/RemoveButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { TRAIT_DESCRIPTIONS } from "../../data/traitDescriptions";
import { sourceColour } from "../../ui/sourceStyles";
import {
  colourAmberFaint,
  colourAmberPlain,
  colourRank,
  colourValue,
} from "../../ui/colourTokens";
import {
  getNextTalentCost,
  getNextTalentPurchase,
  getTalentRankChips,
  hasAnyUnlockedTalentOption,
} from "../../features/experience/talentAdvanceCosts";
import { makeCurrentRankPurchase } from "../../features/experience/purchaseAttribution";
import type { CampaignCustomItem } from "../../types/CustomItems";
import type { CustomItemLibraryActionProps } from "../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../ui/CustomItemActionButtons";
import { PickerBody, PickerCustomAction, PickerModal, PickerRow } from "../../ui/PickerModal";
import { OptionPickerScreen, type PickerOption } from "../../ui/OptionPickerScreen";
import { ArrowLeft, ArrowRight } from "../../ui/PickerArrows";
import { ExpandChevron } from "../../ui/ExpandChevron";
import { needsTalentAcquisition } from "./TalentAcquisitionModal";
import { sanitizeNonNegativeIntegerInput, sanitizePositiveIntegerInput } from "../../utils/formInput";
import {
  getAvailableTalentChoices,
  getTalentBehaviour,
  hasTalentChoice,
  isTalentAvailableInPicker,
  makeTalentEntry,
  normaliseSources,
} from "./talentUtils";

export type AnyListItem = TalentData | TraitData;

type DetailChoice = { detailLabel: string; displayPrefix?: string } | null;

export function TalentPickerModal({
  title,
  listData,
  entries,
  useTalentBehaviours = false,
  editable = true,
  isDM = false,
  onAdd,
  onClose,
  suspended = false,
  customItems = [],
  onSelectCustomItem,
  onCustomAction,
  customActionLabel = "Custom",
  career,
  rank,
}: {
  title: string;
  listData: readonly AnyListItem[];
  entries: readonly TalentEntry[];
  useTalentBehaviours?: boolean;
  editable?: boolean;
  isDM?: boolean;
  onAdd: (entry: TalentEntry) => void;
  onClose: () => void;
  suspended?: boolean;
  customItems?: readonly CampaignCustomItem<"trait">[];
  onSelectCustomItem?: (item: CampaignCustomItem<"trait">) => void;
  onCustomAction?: () => void;
  customActionLabel?: string;
  career?: string;
  rank?: string;
}) {
  const [query, setQuery] = useState("");
  const [showOverflow, setShowOverflow] = useState(false);
  const [picked, setPicked] = useState<AnyListItem | null>(null);
  const [specialisation, setSpecialisation] = useState("");
  const [showChoicePicker, setShowChoicePicker] = useState(false);
  const [detailChoice, setDetailChoice] = useState<DetailChoice>(null);
  const [pendingManualCost, setPendingManualCost] = useState<{
    talent: AnyListItem;
    specialisation?: string;
    returnToChoicePicker?: boolean;
  } | null>(null);
  const [manualCostInput, setManualCostInput] = useState("");
  const listScrollPositionRef = useRef(0);
  const detailScrollPositionRef = useRef(0);
  const overflowScrollPositionRef = useRef(0);
  const modalTitle = editable ? title : title.replace(/^Add\b/, "View");
  const canMakeManualPurchase = editable && isDM;

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...listData]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        const owned = entries.filter((entry) => entry.talentId === item.id);
        if (useTalentBehaviours) {
          if (!isTalentAvailableInPicker(item as TalentData, entries)) return false;
        } else if (
          (!item.repeatable && owned.length > 0) ||
          ("maxPurchases" in item && item.maxPurchases !== undefined && owned.length >= item.maxPurchases)
        ) {
          return false;
        }
        if (career && !hasAnyUnlockedTalentOption(career, rank, item.id, entries)) {
          return false;
        }
        return !normalizedQuery || item.name.toLocaleLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [career, entries, listData, query, rank, useTalentBehaviours]);

  const overflowFiltered = useMemo(() => {
    const seen = new Set<string>();
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...listData]
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        const owned = entries.filter((entry) => entry.talentId === item.id);
        if (useTalentBehaviours) {
          if (!isTalentAvailableInPicker(item as TalentData, entries)) return false;
        } else if (
          (!item.repeatable && owned.length > 0) ||
          ("maxPurchases" in item && item.maxPurchases !== undefined && owned.length >= item.maxPurchases)
        ) {
          return false;
        }
        return !normalizedQuery || item.name.toLocaleLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, listData, query, useTalentBehaviours]);

  const filteredCustom = useMemo(
    () =>
      customItems
        .filter((item) => item.status !== "archived")
        .filter((item) => !entries.some((entry) => entry.customLibraryId === item.id))
        .filter(
          (item) =>
            !query.trim() || item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customItems, entries, query]
  );

  const talentData = picked as TalentData | null;
  const traitData = !useTalentBehaviours ? picked as TraitData | null : null;
  const ownedForPicked = picked
    ? entries.filter((entry) => entry.talentId === picked.id)
    : [];
  const behaviour = talentData && useTalentBehaviours
    ? getTalentBehaviour(talentData)
    : null;
  const isNumeric = talentData?.specialisationMin !== undefined;
  const choiceOptions: readonly PickerOption[] = talentData
    ? useTalentBehaviours
      ? (() => {
          const values = getAvailableTalentChoices(talentData, ownedForPicked);
          if (!career) return values;
          return values
            .map((value) => {
              const hybridOption =
                behaviour?.kind === "hybrid"
                  ? behaviour.options.find((option) => option.label === value)
                  : undefined;
              const lookupValue =
                hybridOption && !("value" in hybridOption) ? hybridOption.displayPrefix : value;
              return {
                value,
                label: value,
                cost: getNextTalentCost(career, rank, talentData.id, lookupValue, entries),
                rankChips: getTalentRankChips(career, talentData.id, lookupValue),
              };
            })
            .filter((option) => showOverflow || option.cost !== undefined);
        })()
      : (() => {
          if (!traitData) return [];
          const atPurchaseLimit =
            (!traitData.repeatable && ownedForPicked.length > 0) ||
            (traitData.maxPurchases !== undefined && ownedForPicked.length >= traitData.maxPurchases);
          if (atPurchaseLimit) return [];
          const base = (traitData.specialisationOptions ?? [])
            .filter((option) => {
              if (traitData.repeatableSpecialisation) return true;
              const value = typeof option === "string" ? option : option.value;
              return !hasTalentChoice(ownedForPicked, value);
            })
            .map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            if (!traitData.repeatableSpecialisation) return option;
            const ownedCount = ownedForPicked.filter(
              (entry) => entry.specialisation?.trim().toLocaleLowerCase() === value.toLocaleLowerCase()
            ).length;
            return { value, label, ownedCount };
            });
          if (!career) return base;
          return base
            .map((option) => {
              const value = typeof option === "string" ? option : option.value;
              const label = typeof option === "string" ? option : option.label;
              const ownedCount = typeof option !== "string" && "ownedCount" in option ? option.ownedCount : undefined;
              return {
                value,
                label,
                ...(ownedCount !== undefined ? { ownedCount } : {}),
                cost: getNextTalentCost(career, rank, traitData!.id, value, entries),
                rankChips: getTalentRankChips(career, traitData!.id, value),
              };
            })
            .filter((option) => showOverflow || option.cost !== undefined);
        })()
    : [];
  const composedSpecialisation = detailChoice?.displayPrefix
    ? `${detailChoice.displayPrefix}: ${specialisation.trim()}`
    : specialisation.trim();
  const duplicateChoice =
    composedSpecialisation.length > 0 &&
    !traitData?.repeatableSpecialisation &&
    hasTalentChoice(ownedForPicked, composedSpecialisation);

  const numericValid = () => {
    if (!talentData) return false;
    const value = Number(specialisation.trim());
    if (!Number.isInteger(value)) return false;
    if (talentData.specialisationMin !== undefined && value < talentData.specialisationMin) return false;
    if (talentData.specialisationMax !== undefined && value > talentData.specialisationMax) return false;
    return true;
  };

  const canAdd =
    !!picked && !duplicateChoice && (isNumeric ? numericValid() : specialisation.trim().length > 0);

  const resetPicked = () => {
    setPicked(null);
    setSpecialisation("");
    setDetailChoice(null);
    setShowChoicePicker(false);
  };

  useEffect(() => {
    if (!showChoicePicker || !picked || choiceOptions.length > 0) return;
    resetPicked();
  }, [choiceOptions.length, picked, showChoicePicker]);

  const returnToChoicePicker = () => {
    setSpecialisation("");
    setDetailChoice(null);
    setShowChoicePicker(true);
  };

  const attemptOverflowAdd = (
    item: AnyListItem,
    itemSpecialisation?: string,
    shouldReturnToChoicePicker = false
  ) => {
    if (!canMakeManualPurchase) return;
    setPendingManualCost({
      talent: item,
      specialisation: itemSpecialisation,
      returnToChoicePicker: shouldReturnToChoicePicker,
    });
    setManualCostInput("");
  };

  const attemptRealAdd = (
    item: AnyListItem,
    itemSpecialisation?: string,
    shouldReturnToChoicePicker = false
  ) => {
    if (!career) {
      onAdd(makeTalentEntry(item as TalentData, itemSpecialisation));
      if (shouldReturnToChoicePicker) returnToChoicePicker();
      else resetPicked();
      return;
    }
    const purchase = getNextTalentPurchase(career, rank, item.id, itemSpecialisation, entries);
    if (!purchase) return;
    onAdd({
      ...makeTalentEntry(item as TalentData, itemSpecialisation),
      xpPurchase: purchase,
    });
    if (shouldReturnToChoicePicker) returnToChoicePicker();
    else resetPicked();
  };

  const handleSpecAdd = () => {
    if (!talentData || !canAdd) return;
    const shouldReturnToChoicePicker = behaviour?.kind === "hybrid" && detailChoice !== null;
    (showOverflow ? attemptOverflowAdd : attemptRealAdd)(
      talentData,
      composedSpecialisation,
      shouldReturnToChoicePicker
    );
  };

  const handleChoiceSelect = (value: string) => {
    if (!talentData) return;
    const add = showOverflow ? attemptOverflowAdd : attemptRealAdd;
    if (behaviour?.kind === "hybrid") {
      const option = behaviour.options.find((entry) => entry.label === value);
      if (!option) return;
      if ("value" in option) {
        add(talentData, option.value, true);
        return;
      }
      setDetailChoice({
        detailLabel: option.detailLabel,
        displayPrefix: option.displayPrefix,
      });
      setSpecialisation("");
      setShowChoicePicker(false);
      return;
    }
    add(talentData, value, true);
  };

  if (pendingManualCost && canMakeManualPurchase) {
    const cost = Number(manualCostInput);
    const canConfirm = manualCostInput.trim() !== "";
    return (
      <PickerModal
        title={`Buy ${pendingManualCost.talent.name}`}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        query=""
        onQueryChange={() => undefined}
        onClose={() => setPendingManualCost(null)}
        isEmpty={false}
        hideSearch
        footer={
          <Button
            className="w-full"
            disabled={!canConfirm}
            onClick={() => {
              const shouldReturnToChoicePicker = pendingManualCost.returnToChoicePicker === true;
              onAdd({
                ...makeTalentEntry(
                  pendingManualCost.talent as TalentData,
                  pendingManualCost.specialisation,
                  cost
                ),
                xpPurchase: makeCurrentRankPurchase(career, rank, cost),
              });
              setPendingManualCost(null);
              if (shouldReturnToChoicePicker) returnToChoicePicker();
              else resetPicked();
            }}
          >
            Buy {pendingManualCost.talent.name}
          </Button>
        }
      >
        <PickerBody>
          <label className={uiFormLabel}>XP Cost</label>
          <input
            type="text"
            inputMode="numeric"
            value={manualCostInput}
            onChange={(event) => setManualCostInput(sanitizeNonNegativeIntegerInput(event.target.value))}
            placeholder="0"
            className={editableInputClass(true) + " mt-0.5"}
          />
        </PickerBody>
      </PickerModal>
    );
  }

  if (showOverflow && !picked && !showChoicePicker) {
    return (
      <PickerModal
        title={modalTitle}
        placeholder="Search…"
        query={query}
        onQueryChange={setQuery}
        onClose={() => setShowOverflow(false)}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        suspended={suspended}
        scrollPositionRef={overflowScrollPositionRef}
        isEmpty={overflowFiltered.length === 0 && filteredCustom.length === 0}
        footer={
          onCustomAction && (
            <PickerCustomAction onClick={onCustomAction}>{customActionLabel}</PickerCustomAction>
          )
        }
      >
        <div className="space-y-3 p-3 lg:p-4">
          {filteredCustom.map((item) => (
            <PickerRow
              key={item.id}
              interactive={editable}
              onClick={() => {
                if (editable) onSelectCustomItem?.(item);
              }}
            >
              <span className={`${uiItemName} truncate block ${editable ? "group-hover:text-white" : ""}`}>
                {item.name}
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Chip className={colourAmberFaint}>{item.status === "draft" ? "Draft" : "Custom"}</Chip>
              </div>
            </PickerRow>
          ))}
          {overflowFiltered.map((item) => {
            const row = item as TalentData;
            const sources = normaliseSources(item.source as SkillSource | SkillSource[]);
            const itemBehaviour = useTalentBehaviours ? getTalentBehaviour(row) : null;
            const usesChoicePicker =
              itemBehaviour?.kind === "fixed-repeatable" ||
              itemBehaviour?.kind === "fixed-single" ||
              itemBehaviour?.kind === "hybrid" ||
              (!useTalentBehaviours && (row.specialisationOptions?.length ?? 0) > 0);
            const usesTextEntry = row.hasSpecialisation || itemBehaviour?.kind === "repeatable-free-text";
            const ownedCount = entries.filter((entry) => entry.talentId === item.id).length;
            const opensAcquisition = Boolean(!useTalentBehaviours && (row as TraitData).acquisition) || (
              useTalentBehaviours && needsTalentAcquisition(
                { uid: "picker-preview", talentId: row.id, name: row.name },
                { homeworld: "", talents: [...entries], traits: [] }
              )
            );
            return (
              <PickerRow
                key={item.id}
                card
                className={`${uiSectionShell} flex items-center gap-3 overflow-hidden`}
                interactive={canMakeManualPurchase}
                onClick={() => {
                  if (!canMakeManualPurchase) return;
                  if (usesChoicePicker) {
                    setPicked(item);
                    setShowChoicePicker(true);
                  } else if (usesTextEntry) {
                    setPicked(item);
                  } else {
                    attemptOverflowAdd(item);
                  }
                }}
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`${uiItemName} truncate ${canMakeManualPurchase ? "group-hover:text-white" : ""}`}>
                      {item.name}
                    </span>
                    {(TALENT_DESCRIPTIONS[item.id] ?? TRAIT_DESCRIPTIONS[item.id]) && (
                      <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
                        <InfoModal
                          title={item.name}
                          content={TALENT_DESCRIPTIONS[item.id] ?? TRAIT_DESCRIPTIONS[item.id]}
                          as="span"
                        />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sources.map((source) => (
                      <Chip key={source} className={`bg-slate-800/40 font-code ${sourceColour(source)}`}>
                        {source}
                      </Chip>
                    ))}
                    {ownedCount > 0 && (
                      <Chip className="border-amber-500/60 bg-amber-950/30 text-amber-300">
                        Owned: {ownedCount}
                      </Chip>
                    )}
                  </div>
                  {row.prerequisites && (
                    <div className="text-xs lg:text-sm">
                      <span className={uiTextLabel}>Prerequisites: </span>
                      <span className="text-slate-300 font-medium">{row.prerequisites}</span>
                    </div>
                  )}
                </div>
                {(usesChoicePicker || usesTextEntry || opensAcquisition) && <ArrowRight />}
              </PickerRow>
            );
          })}
        </div>
      </PickerModal>
    );
  }

  if (showChoicePicker && talentData) {
    return (
      <OptionPickerScreen
        title={talentData.specialisationLabel ?? "Choice"}
        options={choiceOptions}
        selected=""
        onSelect={handleChoiceSelect}
        onClose={resetPicked}
      />
    );
  }

  if (picked && talentData) {
    return (
      <PickerModal
        title={detailChoice?.detailLabel ?? talentData.specialisationLabel ?? "Specialisation"}
        closeLabel={<ArrowLeft />}
        closeAriaLabel="Back"
        query=""
        onQueryChange={() => undefined}
        onClose={resetPicked}
        suspended={suspended}
        isEmpty={false}
        hideSearch
        maxWidth="max-w-lg"
        scrollPositionRef={detailScrollPositionRef}
      >
        <PickerBody>
          <div className="space-y-2">
            {choiceOptions.length > 0 && !detailChoice ? (
              <button
                type="button"
                onClick={() => setShowChoicePicker(true)}
                className={editableInputClass(true) + " text-left flex items-center justify-between"}
              >
                <span className="text-slate-500">
                  {talentData.specialisationLabel ?? "Choice"}…
                </span>
                <ArrowRight />
              </button>
            ) : isNumeric ? (
              <>
                <input
                  type={traitData?.positiveIntegerInput ? "text" : "number"}
                  inputMode="numeric"
                  value={specialisation}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (traitData?.positiveIntegerInput) {
                      setSpecialisation(sanitizePositiveIntegerInput(next));
                    } else if (/^\d*$/.test(next)) {
                      setSpecialisation(next);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canAdd) handleSpecAdd();
                  }}
                  min={talentData.specialisationMin}
                  max={talentData.specialisationMax}
                  step={1}
                  placeholder={
                    traitData?.specialisationPlaceholder ?? talentData.specialisationLabel ?? "Value…"
                  }
                  className={editableInputClass(true)}
                />
                {!traitData?.hideSpecialisationHelp && (
                  <p className={`text-xs ${uiTextPlaceholder}`}>
                    {talentData.specialisationMax !== undefined
                      ? `Whole number ${talentData.specialisationMin}–${talentData.specialisationMax}.`
                      : `Whole number, ${talentData.specialisationMin} or higher.`}
                  </p>
                )}
              </>
            ) : (
              <input
                type="text"
                value={specialisation}
                onChange={(event) => setSpecialisation(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && canAdd) handleSpecAdd();
                }}
                placeholder={`Enter ${(
                  detailChoice?.detailLabel ?? talentData.specialisationLabel ?? "specialisation"
                ).toLocaleLowerCase()}…`}
                className={editableInputClass(true)}
              />
            )}
            {duplicateChoice && (
              <p className="text-xs lg:text-sm text-red-300">That choice is already owned.</p>
            )}
            <Button fullWidth onClick={handleSpecAdd} disabled={!canAdd}>
              Add {picked.name}
            </Button>
          </div>
        </PickerBody>
      </PickerModal>
    );
  }

  return (
    <PickerModal
      title={modalTitle}
      placeholder="Search…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      scrollPositionRef={listScrollPositionRef}
      isEmpty={filtered.length === 0}
      filterRow={
        career && (
          <button
            type="button"
            onClick={() => setShowOverflow(true)}
            className="w-full rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left"
          >
            Show all
          </button>
        )
      }
      footer={
        onCustomAction && (
          <PickerCustomAction onClick={onCustomAction}>{customActionLabel}</PickerCustomAction>
        )
      }
    >
      <div className="space-y-3 p-3 lg:p-4" data-testid="talent-picker-card-list">
      {filtered.map((item) => {
        const row = item as TalentData;
        const sources = normaliseSources(item.source as SkillSource | SkillSource[]);
        const ownedCount = entries.filter((entry) => entry.talentId === item.id).length;
        const itemBehaviour = useTalentBehaviours ? getTalentBehaviour(row) : null;
        const showsOwnedCount = ownedCount > 0 && (
          itemBehaviour?.kind === "ranked" ||
          itemBehaviour?.kind === "fixed-repeatable" ||
          itemBehaviour?.kind === "hybrid" ||
          itemBehaviour?.kind === "repeatable-free-text" ||
          itemBehaviour?.kind === "psychic-purchase" ||
          (!useTalentBehaviours && row.repeatable === true) ||
          (itemBehaviour?.kind === "ordinary" && row.repeatable === true)
        );
        const ownedLabel = showsOwnedCount
          ? itemBehaviour?.kind === "ranked" && itemBehaviour.maxPurchases !== undefined
            ? `Owned: ${ownedCount}/${itemBehaviour.maxPurchases}`
            : `Owned: ${ownedCount}`
          : null;
        const usesChoicePicker =
          itemBehaviour?.kind === "fixed-repeatable" ||
          itemBehaviour?.kind === "fixed-single" ||
          itemBehaviour?.kind === "hybrid" ||
          (!useTalentBehaviours && (row.specialisationOptions?.length ?? 0) > 0);
        const usesTextEntry =
          row.hasSpecialisation || itemBehaviour?.kind === "repeatable-free-text";
        const opensAcquisition = Boolean(!useTalentBehaviours && (row as TraitData).acquisition) || (
          useTalentBehaviours && needsTalentAcquisition(
            { uid: "picker-preview", talentId: row.id, name: row.name },
            { homeworld: "", talents: [...entries], traits: [] }
          )
        );
        const opensNextStep = usesChoicePicker || usesTextEntry || opensAcquisition;
        const cost =
          career && !usesChoicePicker && !usesTextEntry
            ? getNextTalentCost(career, rank, item.id, undefined, entries)
            : undefined;
        const rankChips =
          career && !usesChoicePicker && !usesTextEntry
            ? getTalentRankChips(career, item.id, undefined)
            : undefined;
        return (
          <PickerRow
            key={item.id}
            card
            className={`${uiSectionShell} flex items-center gap-3 overflow-hidden`}
            interactive={editable}
            onClick={() => {
              if (!editable) return;
              const itemTalent = item as TalentData;
              if (usesChoicePicker) {
                setPicked(item);
                setShowChoicePicker(true);
              } else if (usesTextEntry) {
                setPicked(item);
              } else {
                attemptRealAdd(itemTalent);
              }
            }}
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`${uiItemName} truncate ${editable ? "group-hover:text-white" : ""}`}>
                  {item.name}
                </span>
                {(TALENT_DESCRIPTIONS[item.id] ?? TRAIT_DESCRIPTIONS[item.id]) && (
                  <span className={uiInfoModalWrapper} onClick={(event) => event.stopPropagation()}>
                    <InfoModal
                      title={item.name}
                      content={TALENT_DESCRIPTIONS[item.id] ?? TRAIT_DESCRIPTIONS[item.id]}
                      as="span"
                    />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {sources.map((source) => (
                  <Chip key={source} className={`bg-slate-800/40 font-code ${sourceColour(source)}`}>
                    {source}
                  </Chip>
                ))}
                {ownedLabel && (
                  <Chip className="border-amber-500/60 bg-amber-950/30 text-amber-300">
                    {ownedLabel}
                  </Chip>
                )}
                {cost !== undefined && (
                  <Chip className={colourValue}>{cost} XP</Chip>
                )}
              </div>
              {rankChips && rankChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rankChips.map((rankName) => (
                    <Chip key={rankName} size="sm" className={`${colourRank} font-code`}>
                      {rankName}
                    </Chip>
                  ))}
                </div>
              )}
              {row.prerequisites && (
                <div className="text-xs lg:text-sm">
                  <span className={uiTextLabel}>Prerequisites: </span>
                  <span className="text-slate-300 font-medium">{row.prerequisites}</span>
                </div>
              )}
            </div>
            {opensNextStep && <ArrowRight />}
          </PickerRow>
        );
      })}
      </div>
    </PickerModal>
  );
}

interface EntryCardProps extends CustomItemLibraryActionProps<"trait"> {
  entry: TalentEntry;
  editable: boolean;
  onRemove: (uid: string) => void;
  confirmDeletion?: boolean;
  displayName?: string;
  secondaryText?: string;
  statusChip?: string;
  removable?: boolean;
  deletionBlockedMessage?: string;
  statusAfterSource?: boolean;
  deletionNoun?: "Talent" | "Trait";
}

export function EntryCard({
  entry,
  editable,
  onRemove,
  confirmDeletion = false,
  displayName,
  secondaryText,
  statusChip,
  removable = true,
  deletionBlockedMessage,
  statusAfterSource = false,
  deletionNoun = "Talent",
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
}: EntryCardProps) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const shownName = displayName ?? entry.name;
  const isGranted = Boolean(entry.grantedByTalentEntryUid);
  const description = TALENT_DESCRIPTIONS[entry.talentId] ?? TRAIT_DESCRIPTIONS[entry.talentId] ?? entry.description;
  const refData = (
    [...TALENT_LIST, ...TRAIT_LIST] as Array<{ id: string; source: SkillSource | SkillSource[] }>
  ).find((reference) => reference.id === entry.talentId);
  const refSources = refData ? normaliseSources(refData.source) : entry.source ? [entry.source] : [];

  return (
    <div className={uiSection + " flex items-start justify-between gap-2 text-sm lg:text-base"}>
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`${uiItemName} break-words`}>{shownName}</span>
          {(description || entry.notes) && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={shownName}
                content={
                  <div className="space-y-3">
                    {description && (
                      <p className={`text-sm ${uiTextBody} leading-relaxed`}>{description}</p>
                    )}
                    {entry.notes && (
                      <div>
                        <p className={`${uiTextLabel} font-semibold mb-1`}>Notes</p>
                        <div className="space-y-2">
                          {entry.notes.split("\n\n").map((group, index) => {
                            const breakAt = group.indexOf("\n");
                            const heading = breakAt === -1 ? group : group.slice(0, breakAt);
                            const body = breakAt === -1 ? "" : group.slice(breakAt + 1);
                            return (
                              <p key={index} className={`text-sm ${uiTextBody} leading-relaxed whitespace-pre-line`}>
                                <span className="font-semibold">{heading}</span>
                                {body && `\n${body}`}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
            </span>
          )}
        </div>
        {!statusAfterSource && secondaryText && <p className={`text-sm ${colourAmberPlain}`}>{secondaryText}</p>}
        {!statusAfterSource && isGranted && (
          <p className={`text-sm ${colourAmberPlain}`}>{entry.grantedByTalentName} ({entry.grantedByType}): Granted</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {refSources.map((source) => (
            <Chip key={source} className={`bg-slate-800/40 font-code ${sourceColour(source)}`}>
              {source}
            </Chip>
          ))}
          {statusChip && (
            <Chip className="border-amber-500/60 bg-amber-950/30 text-amber-300">
              {statusChip}
            </Chip>
          )}
        </div>
        {statusAfterSource && secondaryText && <p className={`text-sm ${colourAmberPlain}`}>{secondaryText}</p>}
        {statusAfterSource && isGranted && (
          <p className={`text-sm ${colourAmberPlain}`}>{entry.grantedByTalentName} ({entry.grantedByType}): Granted</p>
        )}
        {libraryItem && (
          <CustomItemActionButtons
            libraryItem={libraryItem}
            isDM={isDM}
            canEditDefinition={canEditDefinition}
            busyAction={busyAction}
            onEditDefinition={onEditDefinition}
            onPublish={onPublish}
            onArchive={onArchive}
            onUpdateAllCopies={onUpdateAllCopies}
            className="mt-1 flex flex-wrap gap-2"
          />
        )}
      </div>
      {editable && (removable || deletionBlockedMessage) && !isGranted && (
        <RemoveButton
          onClick={() => deletionBlockedMessage || confirmDeletion ? setDeleteArmed(true) : onRemove(entry.uid)}
          label={`${confirmDeletion ? "Delete" : "Remove"} ${shownName}`}
          className="mt-0.5"
        />
      )}

      {deleteArmed && (
        <PickerModal
          title={deletionBlockedMessage ? `Cannot Delete ${deletionNoun}` : `Delete ${deletionNoun}`}
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            deletionBlockedMessage ? (
              <Button fullWidth variant="ghost" onClick={() => setDeleteArmed(false)}>Close</Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={() => onRemove(entry.uid)}>Delete</Button>
                <Button variant="ghost" onClick={() => setDeleteArmed(false)}>Cancel</Button>
              </div>
            )
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              {deletionBlockedMessage ?? `Delete ${shownName} from this character?`}
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}

export function TalentGroupCard({
  name,
  entries,
  editable,
  onRemove,
  statusAfterSource = false,
}: {
  name: string;
  entries: readonly TalentEntry[];
  editable: boolean;
  onRemove: (uid: string) => void;
  statusAfterSource?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${name}`}
        className="w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition"
      >
        <span className="flex-1 min-w-0 text-sm lg:text-base font-semibold text-slate-100 truncate">
          {name}
        </span>
        <ExpandChevron expanded={expanded} />
      </button>
      {expanded && (
        <div className="border-t border-slate-700 space-y-2 p-2">
          {[...entries]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <EntryCard
                key={entry.uid}
                entry={entry}
                editable={editable}
                onRemove={onRemove}
                confirmDeletion
                removable={!entry.grantedByTalentEntryUid}
                statusAfterSource={statusAfterSource}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface EntrySectionProps {
  title: string;
  singular: string;
  entries: TalentEntry[];
  listData: readonly AnyListItem[];
  editable: boolean;
  columns?: 1 | 2;
  onAdd: (entry: TalentEntry) => void;
  onRemove: (uid: string) => void;
}

export function EntrySection({
  title,
  singular,
  entries,
  listData,
  editable,
  columns = 1,
  onAdd,
  onRemove,
}: EntrySectionProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader>{title}</SectionHeader>
        <Button size="sm" onClick={() => setShowPicker(true)}>
          {editable ? `+ Add ${singular}` : `View ${singular}s`}
        </Button>
      </div>
      <section className={uiSection + " space-y-2"}>
        {entries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>None added yet.</p>
        )}
        <div className={`grid gap-2 ${columns === 2 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {[...entries]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => (
              <EntryCard key={entry.uid} entry={entry} editable={editable} onRemove={onRemove} />
            ))}
        </div>
        {showPicker && (
          <TalentPickerModal
            title={editable ? `Add ${singular}` : `View ${singular}s`}
            listData={listData}
            entries={entries}
            editable={editable}
            onAdd={onAdd}
            onClose={() => setShowPicker(false)}
          />
        )}
      </section>
    </div>
  );
}
