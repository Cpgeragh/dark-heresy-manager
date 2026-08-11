// src/pages/characterSheet/PsychicTab.tsx

import { useState, useCallback } from "react";
import type { PsychicBlock, PsychicPower } from "../../types/Character";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import {
  PSYCHIC_POWER_REFERENCE,
  PSYCHIC_DISCIPLINES,
  type PsychicPowerRef,
  type PsychicDiscipline,
} from "../../data/reference/psychicReference";
import {
  editableInputClass,
  editableTextareaClass,
  uiSection,
  uiFormLabel,
} from "../../ui/editableStyles";
import { Button } from "../../ui/Button";
import { AddButton } from "../../ui/AddButton";
import { ViewButton } from "../../ui/ViewButton";
import { Chip } from "../../ui/Chip";
import { SectionHeader } from "../../ui/SectionHeader";
import { PowerCard } from "./components/PowerCard";
import { PickerBody, PickerCustomAction, PickerModal } from "../../ui/PickerModal";
import { ArrowLeft, ArrowRight } from "../../ui/PickerArrows";
import { OptionPickerScreen } from "../../ui/OptionPickerScreen";
import { InfoModal } from "../../components/InfoModal";
import { TALENT_DESCRIPTIONS } from "../../data/talentDescriptions";
import { sourceColour } from "../../ui/sourceStyles";
import { disciplineColours, disciplineInactiveColours, psyRatingGlow } from "./psychicStyles";
import { colourActiveSky, colourActiveRose } from "../../ui/colourTokens";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/segmentedTabStyles";
import { CUSTOM_ITEM_ORIGIN_OPTIONS, type CustomItemOrigin } from "../../constants/customItems";
import { useCampaignCustomItems } from "../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../hooks/useCustomItemLibraryActions";
import { createDraftCustomItem, saveDraftCustomItem } from "../../services/customItemService";
import { useToast } from "../../components/Toast";
import type { CampaignCustomItem, CustomPsychicPowerData } from "../../types/CustomItems";
import type { CustomItemLibraryAction } from "../../types/CustomItemActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PsychicTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  psychic: PsychicBlock;
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
type CustomRangeMode = "meters" | "km-radius" | "you" | "unlimited";
type EditingCustomPower = { target: PowerGroup; power: PsychicPower } | null;

function toCustomPowerData(power: PsychicPower): CustomPsychicPowerData {
  const {
    id: _id,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    known: _known,
    ...data
  } = power;
  return data;
}

function referencePowerPreview(ref: PsychicPowerRef): PsychicPower {
  return {
    id: ref.id,
    name: ref.name,
    discipline: ref.discipline,
    threshold: String(ref.threshold),
    focusTime: ref.focusTime,
    sustained: ref.sustained ? "Yes" : "No",
    range: ref.range,
    description: ref.description,
    source: ref.source,
    isMinor: ref.discipline === "Minor",
    known: true,
  };
}

function customPowerPreview(item: CampaignCustomItem<"power">): PsychicPower {
  return {
    ...item.data,
    id: item.id,
    name: item.name,
    known: true,
  };
}

// ─── Sub-component: Power Picker Modal ───────────────────────────────────────

function PowerPicker({
  excludeMinor = false,
  minorOnly = false,
  editable = true,
  existingNames,
  customItems,
  onSelect,
  onSelectCustomItem,
  onCustom,
  onClose,
  suspended = false,
}: {
  excludeMinor?: boolean;
  minorOnly?: boolean;
  editable?: boolean;
  existingNames: Set<string>;
  customItems: CampaignCustomItem<"power">[];
  onSelect: (ref: PsychicPowerRef) => void;
  onSelectCustomItem: (item: CampaignCustomItem<"power">) => void;
  onCustom: () => void;
  onClose: () => void;
  suspended?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [showDisciplineFilterPicker, setShowDisciplineFilterPicker] = useState(false);
  const [showSourceFilterPicker, setShowSourceFilterPicker] = useState(false);

  const scopedReference = PSYCHIC_POWER_REFERENCE.filter((r) => {
    const notMinor = !excludeMinor || r.discipline !== "Minor";
    const onlyMinor = !minorOnly || r.discipline === "Minor";
    return notMinor && onlyMinor;
  });

  const majorDisciplineOptions = PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor");
  const sourceOptions = Array.from(new Set(scopedReference.map((r) => r.source))).sort();

  const filtered = scopedReference
    .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    .filter((r) => !disciplineFilter || r.discipline === disciplineFilter)
    .filter((r) => !sourceFilter || r.source === sourceFilter)
    .filter((r) => !existingNames.has(r.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredCustom = customItems
    .filter((item) => item.status !== "archived")
    .filter((item) => (excludeMinor ? !item.data.isMinor : minorOnly ? item.data.isMinor : true))
    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => !disciplineFilter || item.data.discipline === disciplineFilter)
    .filter((item) => !sourceFilter || (item.data.source ?? item.data.origin) === sourceFilter)
    .filter((item) => !existingNames.has(item.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const pickerItems = [
    ...filteredCustom.map((item) => ({ kind: "custom" as const, name: item.name, item })),
    ...filtered.map((ref) => ({ kind: "reference" as const, name: ref.name, ref })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  if (showDisciplineFilterPicker) {
    return (
      <OptionPickerScreen
        title="Discipline"
        options={["All Disciplines", ...majorDisciplineOptions]}
        selected={disciplineFilter ?? "All Disciplines"}
        onSelect={(value) => {
          setDisciplineFilter(value === "All Disciplines" ? null : value);
          setShowDisciplineFilterPicker(false);
        }}
        onClose={() => setShowDisciplineFilterPicker(false)}
      />
    );
  }
  if (showSourceFilterPicker) {
    return (
      <OptionPickerScreen
        title="Source"
        options={["All Sources", ...sourceOptions, "Custom", "2nd Ed"]}
        selected={sourceFilter ?? "All Sources"}
        onSelect={(value) => {
          setSourceFilter(value === "All Sources" ? null : value);
          setShowSourceFilterPicker(false);
        }}
        onClose={() => setShowSourceFilterPicker(false)}
      />
    );
  }

  return (
    <PickerModal
      title={editable ? "Add Psychic Power" : "View Psychic Powers"}
      placeholder="Search powers…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      suspended={suspended}
      isEmpty={filtered.length === 0 && filteredCustom.length === 0}
      filterRow={
        <div className="flex gap-2 w-full">
          {!minorOnly && (
            <button
              type="button"
              onClick={() => setShowDisciplineFilterPicker(true)}
              className="flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between"
            >
              <span>{disciplineFilter ?? "All Disciplines"}</span>
              <ArrowRight />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSourceFilterPicker(true)}
            className="flex-1 rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs lg:text-sm text-slate-200 text-left flex items-center justify-between"
          >
            <span>{sourceFilter ?? "All Sources"}</span>
            <ArrowRight />
          </button>
        </div>
      }
      footer={
        editable ? (
          <PickerCustomAction onClick={onCustom}>
            {minorOnly ? "Custom Minor Power" : "Custom Major Power"}
          </PickerCustomAction>
        ) : undefined
      }
    >
      <div className="space-y-3 p-3 lg:p-4">
        {pickerItems.map((entry) =>
          entry.kind === "custom" ? (
            <PowerCard
              key={`custom-${entry.item.id}`}
              power={customPowerPreview(entry.item)}
              editable={false}
              onRemove={() => undefined}
              onSelect={editable ? () => onSelectCustomItem(entry.item) : undefined}
              selectLabel={`Select ${entry.item.name}`}
            />
          ) : (
            <PowerCard
              key={`reference-${entry.ref.id}`}
              power={referencePowerPreview(entry.ref)}
              editable={false}
              onRemove={() => undefined}
              onSelect={editable ? () => onSelect(entry.ref) : undefined}
              selectLabel={`Select ${entry.ref.name}`}
            />
          )
        )}
      </div>
    </PickerModal>
  );
}

function rangeToFormValue(range?: string): { mode: CustomRangeMode; value: string } {
  if (range === "You") return { mode: "you", value: "" };
  if (range === "Unlimited") return { mode: "unlimited", value: "" };

  const kmMatch = range?.match(/^([1-9]\d*(?:\.\d)?) km radius$/);
  if (kmMatch) return { mode: "km-radius", value: kmMatch[1] };

  const metresMatch = range?.match(/^([1-9]\d*)m$/);
  if (metresMatch) return { mode: "meters", value: metresMatch[1] };

  return { mode: "meters", value: "" };
}

function CustomPowerForm({
  target,
  existingNames,
  initialPower,
  onAdd,
  onBack,
  onCancel,
}: {
  target: PowerGroup;
  existingNames: Set<string>;
  initialPower?: PsychicPower;
  onAdd: (power: PsychicPower) => void | Promise<void>;
  onBack: () => void;
  onCancel: () => void;
}) {
  const majorDisciplines = PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor");
  const initialRange = rangeToFormValue(initialPower?.range);
  const [name, setName] = useState(initialPower?.name ?? "");
  const [description, setDescription] = useState(initialPower?.description ?? "");
  const [discipline, setDiscipline] = useState<PsychicDiscipline | "">(
    target === "minor"
      ? "Minor"
      : ((initialPower?.discipline as PsychicDiscipline | undefined) ?? "")
  );
  const [threshold, setThreshold] = useState(initialPower?.threshold ?? "");
  const [focusTime, setFocusTime] = useState<"" | "Half Action" | "Full Action">(
    initialPower?.focusTime === "Half Action" || initialPower?.focusTime === "Full Action"
      ? initialPower.focusTime
      : ""
  );
  const [rangeMode, setRangeMode] = useState<CustomRangeMode>(initialRange.mode);
  const [rangeValue, setRangeValue] = useState(initialRange.value);
  const [sustained, setSustained] = useState<"" | "Yes" | "No">(
    initialPower?.sustained === "Yes" || initialPower?.sustained === "No"
      ? initialPower.sustained
      : ""
  );
  const [origin, setOrigin] = useState<"" | CustomItemOrigin>(
    initialPower?.origin === "2nd Ed" ? "2nd Ed" : initialPower ? "Custom" : ""
  );
  const [saving, setSaving] = useState(false);

  const trimmedName = name.trim();
  const initialName = initialPower?.name.trim() ?? "";
  const nameExists = trimmedName !== initialName && existingNames.has(trimmedName);
  const thresholdIsValid = /^[1-9]\d*$/.test(threshold);
  const metresRangeIsValid = /^[1-9]\d*$/.test(rangeValue);
  const kmRangeIsValid = /^[1-9]\d*(?:\.\d)?$/.test(rangeValue);
  const rangeValueIsValid =
    rangeMode === "you" ||
    rangeMode === "unlimited" ||
    (rangeMode === "km-radius" ? kmRangeIsValid : metresRangeIsValid);
  const canAdd =
    !!trimmedName &&
    !nameExists &&
    !!discipline &&
    thresholdIsValid &&
    !!focusTime &&
    rangeValueIsValid &&
    !!sustained &&
    !!origin;

  function handlePositiveIntegerChange(value: string, setter: (next: string) => void) {
    if (value === "" || /^[1-9]\d*$/.test(value)) setter(value);
  }

  function handlePositiveKmChange(value: string) {
    if (value === "" || /^[1-9]\d*(?:\.\d?)?$/.test(value)) setRangeValue(value);
  }

  function formatRange() {
    if (rangeMode === "you") return "You";
    if (rangeMode === "unlimited") return "Unlimited";
    if (rangeMode === "km-radius") return `${rangeValue} km radius`;
    return `${rangeValue}m`;
  }

  async function handleAdd() {
    if (!canAdd || saving) return;
    setSaving(true);
    try {
      await onAdd({
        id: initialPower?.id ?? crypto.randomUUID(),
        name: trimmedName,
        discipline,
        threshold,
        focusTime,
        range: formatRange(),
        sustained,
        origin: origin as CustomItemOrigin,
        description: description.trim() || undefined,
        isMinor: target === "minor",
        custom: true,
        known: initialPower?.known ?? true,
        customLibraryId: initialPower?.customLibraryId,
        customLibraryVersionId: initialPower?.customLibraryVersionId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PickerModal
      title={`${initialPower ? "Edit" : "Custom"} ${target === "minor" ? "Minor" : "Major"} Power`}
      query=""
      onQueryChange={() => undefined}
      onClose={initialPower ? onCancel : onBack}
      closeLabel={initialPower ? undefined : <ArrowLeft />}
      closeAriaLabel={initialPower ? "Close" : "Back"}
      hideSearch
      isEmpty={false}
    >
      <PickerBody>
        <div className="space-y-1">
          <label className={uiFormLabel}>
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Power name..."
            className={editableInputClass(true)}
            autoFocus
          />
          {nameExists && (
            <p className="text-xs lg:text-sm text-red-300">
              That power is already on this character.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Discipline <span className="text-red-400">*</span>
          </label>
          {target === "minor" ? (
            <Chip className={`w-fit ${disciplineColours.Minor}`}>Minor</Chip>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {majorDisciplines.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d)}
                  className={[
                    "text-xs lg:text-sm px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    discipline === d
                      ? `${disciplineColours[d] ?? disciplineColours.default} font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={uiFormLabel}>
              PT <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={threshold}
              onChange={(e) => handlePositiveIntegerChange(e.target.value, setThreshold)}
              placeholder="e.g. 8"
              className={editableInputClass(true) + " font-code"}
            />
          </div>

          <div className="space-y-1">
            <label className={uiFormLabel}>
              Action <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Half Action", "Full Action"] as const).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setFocusTime(action)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    focusTime === action
                      ? "border-red-500 bg-red-500/20 text-red-400 font-semibold"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {action.replace(" Action", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Range <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              ["meters", "Metres"],
              ["km-radius", "km radius"],
              ["you", "You"],
              ["unlimited", "Unlimited"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRangeMode(mode as CustomRangeMode)}
                className={[
                  "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                  rangeMode === mode
                    ? "border-red-500 bg-red-500/20 text-red-400 font-semibold"
                    : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          {(rangeMode === "meters" || rangeMode === "km-radius") && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                inputMode={rangeMode === "km-radius" ? "decimal" : "numeric"}
                value={rangeValue}
                onChange={(e) =>
                  rangeMode === "km-radius"
                    ? handlePositiveKmChange(e.target.value)
                    : handlePositiveIntegerChange(e.target.value, setRangeValue)
                }
                placeholder={rangeMode === "km-radius" ? "e.g. 1.5" : "e.g. 10"}
                className={editableInputClass(true) + " w-28 font-code"}
              />
              <span className="text-xs lg:text-sm text-slate-400">
                {rangeMode === "km-radius" ? "km radius" : "metres"}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={uiFormLabel}>
              Sustained <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Yes", "No"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSustained(value)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    sustained === value
                      ? "border-red-500 bg-red-500/20 text-red-400 font-semibold"
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className={uiFormLabel}>
              Origin <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CUSTOM_ITEM_ORIGIN_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrigin(value)}
                  className={[
                    "text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-1.5 rounded border transition",
                    origin === value
                      ? `${sourceColour(value)} bg-slate-800/70 font-semibold`
                      : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-300",
                  ].join(" ")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className={uiFormLabel}>
            Description <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rules text, notes, overbleed..."
            rows={4}
            className={editableTextareaClass(true)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button className="flex-1" onClick={handleAdd} disabled={!canAdd || saving}>
            {saving ? "Saving..." : initialPower ? "Save Power" : "Add Power"}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </PickerBody>
    </PickerModal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PowerGrid({
  powers,
  editable,
  isDM,
  userId,
  campaignCustomPowersById,
  getBusyAction,
  onRemove,
  onEdit,
  onPublishPower,
  onArchivePower,
  onUpdateAllPowerCopies,
}: {
  powers: PsychicPower[];
  editable: boolean;
  isDM: boolean;
  userId: string | null;
  campaignCustomPowersById: Map<string, CampaignCustomItem<"power">>;
  getBusyAction: (itemId: string) => CustomItemLibraryAction | null;
  onRemove: (id: string) => void;
  onEdit: (power: PsychicPower) => void;
  onPublishPower: (item: CampaignCustomItem<"power">) => void;
  onArchivePower: (item: CampaignCustomItem<"power">) => void;
  onUpdateAllPowerCopies: (item: CampaignCustomItem<"power">) => void;
}) {
  const sortedPowers = [...powers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3">
      {sortedPowers.map((power) => {
        const libraryItem = power.customLibraryId
          ? campaignCustomPowersById.get(power.customLibraryId)
          : undefined;
        const canEditDefinition =
          !!libraryItem && editable && (isDM || (!!userId && libraryItem.creator.userId === userId));
        const busyAction = libraryItem ? getBusyAction(libraryItem.id) : null;

        return (
          <PowerCard
            key={power.id}
            power={power}
            editable={editable}
            onRemove={onRemove}
            libraryItem={libraryItem}
            isDM={isDM && editable}
            canEditDefinition={canEditDefinition}
            busyAction={busyAction}
            onEditDefinition={() => onEdit(power)}
            onPublish={() => libraryItem && onPublishPower(libraryItem)}
            onArchive={() => libraryItem && onArchivePower(libraryItem)}
            onUpdateAllCopies={() => libraryItem && onUpdateAllPowerCopies(libraryItem)}
          />
        );
      })}
    </div>
  );
}

export function PsychicTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  psychic,
  psyRating,
  editable,
  onUpdate,
}: PsychicTabProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
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

  // ── Field updates ────────────────────────────────────────────────────────

  const handleToggleDiscipline = useCallback(
    (d: string) => {
      if (!editable) return;
      const current = psychic.disciplines ?? [];
      const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
      onUpdate({ ...psychic, disciplines: next });
    },
    [editable, psychic, onUpdate]
  );

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
    (ref: PsychicPowerRef) => {
      if (!editable) return;
      const newPower: PsychicPower = {
        id: crypto.randomUUID(),
        name: ref.name,
        discipline: ref.discipline,
        threshold: String(ref.threshold),
        focusTime: ref.focusTime,
        sustained: ref.sustained ? "Yes" : "No",
        range: ref.range,
        description: ref.description,
        source: ref.source,
        isMinor: ref.discipline === "Minor",
        known: true,
      };
      const type = ref.discipline === "Minor" ? "minorPowers" : "majorPowers";
      onUpdate({
        ...psychic,
        [type]: [...psychic[type], newPower],
      });
    },
    [editable, psychic, onUpdate]
  );

  /** Add a power selected from the campaign's custom item library */
  const fromCustomLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"power">) => {
      if (!editable) return;
      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);
      if (!versionId) {
        toast.error("This custom power has no usable version.");
        return;
      }
      const type = libraryItem.data.isMinor ? "minorPowers" : "majorPowers";
      const newPower: PsychicPower = {
        id: crypto.randomUUID(),
        ...libraryItem.data,
        known: true,
        customLibraryId: libraryItem.id,
        customLibraryVersionId: versionId,
      };
      await onUpdate({
        ...psychic,
        [type]: [...psychic[type], newPower],
      });
    },
    [editable, psychic, onUpdate, toast]
  );

  const openPickerForMinor = useCallback(() => setPickerTarget("minor"), []);
  const openPickerForMajor = useCallback(() => setPickerTarget("major"), []);

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
            { ...power, customLibraryId: customItemId, customLibraryVersionId: versionId },
          ],
        });
        setCustomTarget(null);
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
    [editable, editingCustomPower, campaignId, characterId, characterName, userId, psychic, onUpdate, toast]
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
    ...psychic.minorPowers.map((p) => p.name),
    ...psychic.majorPowers.map((p) => p.name),
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
              className={[
                "w-[26px] h-[26px] flex items-center justify-center rounded border border-indigo-500/50 bg-indigo-950/40 transition-shadow",
                psyRatingGlow(psyRating),
              ].join(" ")}
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

        {/* Disciplines — toggle chips, one per major discipline */}
        <div>
          <p className={`${uiFormLabel} mb-1.5 text-center`}>Disciplines</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {PSYCHIC_DISCIPLINES.filter((d) => d !== "Minor").map((d) => {
              const active = (psychic.disciplines ?? []).includes(d);
              return (
                <button
                  type="button"
                  key={d}
                  disabled={!editable}
                  onClick={() => handleToggleDiscipline(d)}
                  aria-pressed={active}
                  className={[
                    "px-2.5 lg:px-3 py-1 lg:py-1.5 rounded border text-xs lg:text-sm transition",
                    active
                      ? `${disciplineColours[d] ?? disciplineColours.default} font-semibold`
                      : `${disciplineInactiveColours[d] ?? disciplineInactiveColours.default} ${editable ? "" : "cursor-default"}`,
                  ].join(" ")}
                >
                  {d}
                </button>
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
            <SectionHeader>{activeTitle}</SectionHeader>
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
            />
          )}
        </section>
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
        <section className={uiSection + " space-y-4"}>
          <div className="flex items-center justify-between">
            <SectionHeader>Minor Powers</SectionHeader>
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
            />
          )}
        </section>

        {/* MAJOR POWERS ────────────────────────────────────────────────────── */}
        <section className={uiSection + " space-y-4"}>
          <div className="flex items-center justify-between">
            <SectionHeader>Major Powers</SectionHeader>
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
            />
          )}
        </section>

        {/* POWER PICKER MODAL ──────────────────────────────────────────────── */}
      </div>

      {pickerTarget !== null && (
        <PowerPicker
          excludeMinor={pickerTarget === "major"}
          minorOnly={pickerTarget === "minor"}
          editable={editable}
          existingNames={existingPowerNames}
          customItems={campaignCustomPowers}
          onSelect={fromReference}
          onSelectCustomItem={fromCustomLibrary}
          onCustom={() => {
            if (pickerTarget === null) return;
            setCustomTarget(pickerTarget);
          }}
          onClose={() => setPickerTarget(null)}
          suspended={customTarget !== null}
        />
      )}

      {customTarget !== null && (
        <CustomPowerForm
          target={customTarget}
          existingNames={existingPowerNames}
          onAdd={addCustomPower}
          onBack={() => setCustomTarget(null)}
          onCancel={() => setCustomTarget(null)}
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
