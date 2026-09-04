import { useState } from "react";
import type { CompanionItem } from "../../types/Character";
import { COMPANION_REFERENCE, type CompanionRef } from "../../data/reference/companionReference";
import { Button } from "../../ui/buttons/Button";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { InfoModal } from "../../components/InfoModal";
import { ItemMetaChips } from "../../ui/chips/ItemMetaChips";
import { PickerModal } from "../../ui/pickers/PickerModal";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { StatChip } from "../../ui/chips/StatChip";
import { ExpandChevron } from "../../ui/icons/ExpandChevron";
import { uiExpandButton, uiPickerPressFeedback } from "../../ui/styles/buttonStyles";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../ui/styles/editableStyles";
import { SKILL_DESCRIPTIONS } from "../../data/reference/skillDescriptions";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import { TALENT_LIST } from "../../data/reference/talentData";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { GEAR_REFERENCE } from "../../data/reference/gearReference";

const CHARACTERISTICS: { key: keyof CompanionRef["characteristics"]; label: string }[] = [
  { key: "ws", label: "WS" },
  { key: "bs", label: "BS" },
  { key: "s", label: "S" },
  { key: "t", label: "T" },
  { key: "ag", label: "Ag" },
  { key: "int", label: "Int" },
  { key: "per", label: "Per" },
  { key: "wp", label: "WP" },
  { key: "fel", label: "Fel" },
];

const NO_ADDITIONAL_RULES = "No additional rules text is supplied for this entry.";

function CompanionPickerCard({
  companionReference,
  onSelect,
}: {
  companionReference: CompanionRef;
  onSelect?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((current) => !current);

  return (
    <div className={`${uiSectionShell} overflow-hidden`}>
      <div className="relative w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition group">
        <button
          type="button"
          onClick={onSelect ?? toggle}
          aria-expanded={onSelect ? undefined : expanded}
          aria-label={
            onSelect
              ? `Select ${companionReference.name}`
              : `${expanded ? "Collapse" : "Expand"} ${companionReference.name} details`
          }
          className={`absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${uiPickerPressFeedback(Boolean(onSelect))}`}
        />
        <div className={`${uiExpandButton} relative pointer-events-none flex items-center gap-2`}>
          <div className="flex items-center gap-1.5">
            <span className={`${uiItemName} group-hover:text-white`}>{companionReference.name}</span>
            <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
              <InfoModal title={companionReference.name} content={companionReference.description} as="span" />
            </span>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse companion details" : "Expand companion details"}
            onClick={toggle}
            className="relative z-10 pointer-events-auto p-1 -m-1 ml-auto"
          >
            <ExpandChevron expanded={expanded} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 lg:px-4 pb-3 lg:pb-4 pt-2 lg:pt-3 border-t border-slate-600 space-y-3">
          <CompanionProfileDetails companionReference={companionReference} statSize="sm" modalAs="span" />
        </div>
      )}
    </div>
  );
}

function CompanionPicker({
  editable,
  currentIds,
  onSelect,
  onClose,
}: {
  editable: boolean;
  currentIds: string[];
  onSelect: (companionReference: CompanionRef) => void;
  onClose: () => void;
}) {
  const available = COMPANION_REFERENCE.filter((companionReference) => !currentIds.includes(companionReference.id));

  return (
    <PickerModal
      title={editable ? "Add Companion" : "View Companions"}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={available.length === 0}
      emptyMessage="No companions available."
      hideSearch
      footer={<Button variant="secondary" fullWidth onClick={onClose}>Done</Button>}
    >
      {available.map((companionReference) => (
        <CompanionPickerCard
          key={companionReference.id}
          companionReference={companionReference}
          onSelect={editable ? () => onSelect(companionReference) : undefined}
        />
      ))}
    </PickerModal>
  );
}

function modalText(description: string | undefined): string {
  return description ?? NO_ADDITIONAL_RULES;
}

function skillModalText(entry: string): string {
  const skillName = entry.replace(/\s*\(.+\)$/, "");
  return modalText(SKILL_DESCRIPTIONS[skillName]);
}

function talentModalText(entry: string): string {
  const talent = TALENT_LIST.find((item) => item.name === entry);
  return modalText(talent ? TALENT_DESCRIPTIONS[talent.id] ?? talent.description : undefined);
}

function traitModalText(entry: string): string {
  const traitName = entry.replace(/\s*\(.+\)$/, "");
  const traitId =
    traitName === "Armour Plated"
      ? "armour-plating"
      : traitName.toLowerCase().replace(/\s+/g, "-");
  return modalText(TRAIT_DESCRIPTIONS[traitId]);
}

function gearModalText(entry: string): string {
  const referenceId = entry.toLowerCase().includes("ir vision")
    ? "cr-infra-red-goggles"
    : entry.toLowerCase().includes("filter plugs")
      ? "cr-filtration-plugs"
      : undefined;
  return modalText(GEAR_REFERENCE.find((item) => item.id === referenceId)?.description);
}

function ProfileEntries({
  companionName,
  title,
  entries,
  describe,
  modalAs = "button",
}: {
  companionName: string;
  title: string;
  entries: string[];
  describe: (entry: string) => string;
  modalAs?: "button" | "span";
}) {
  const descriptions = entries.map(describe);
  const hasAdditionalRules = descriptions.some((description) => description !== NO_ADDITIONAL_RULES);

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${uiTextLabel} shrink-0`}>{title}</span>
      <span className={`text-xs lg:text-sm ${uiTextBody}`}>{entries.join(", ")}</span>
      {hasAdditionalRules && (
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title={`${companionName} ${title}`}
            content={
              <div className="space-y-3">
                {entries.map((entry, index) => (
                <div key={entry}>
                  <p className="font-semibold text-amber-300">{entry}</p>
                    <p className={`mt-1 leading-relaxed ${uiTextBody}`}>{descriptions[index]}</p>
                </div>
                ))}
              </div>
            }
            as={modalAs}
          />
        </span>
      )}
    </div>
  );
}

function CompanionProfileDetails({
  companionReference,
  statSize,
  modalAs,
}: {
  companionReference: CompanionRef;
  statSize?: "sm" | "md";
  modalAs?: "button" | "span";
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {CHARACTERISTICS.map(({ key, label }) => (
          <StatChip key={key} size={statSize} label={label} value={companionReference.characteristics[key]} />
        ))}
        <StatChip size={statSize} label="Move" value={companionReference.movement} />
        <StatChip size={statSize} label="Wounds" value={companionReference.wounds} />
      </div>

      <div className="space-y-1 border-t border-slate-800 pt-2 mt-2">
        <SectionHeader as="h3" className="mb-2">Abilities</SectionHeader>
        <ProfileEntries companionName={companionReference.name} title="Skills" entries={companionReference.skills} describe={skillModalText} modalAs={modalAs} />
        <ProfileEntries companionName={companionReference.name} title="Talents" entries={companionReference.talents} describe={talentModalText} modalAs={modalAs} />
        <ProfileEntries companionName={companionReference.name} title="Traits" entries={companionReference.traits} describe={traitModalText} modalAs={modalAs} />
      </div>

      <div className="space-y-1 border-t border-slate-800 pt-2 mt-2">
        <SectionHeader as="h3" className="mb-2">Equipment</SectionHeader>
        <ProfileEntries
          companionName={companionReference.name}
          title="Armour"
          entries={companionReference.armour}
          describe={() => NO_ADDITIONAL_RULES}
          modalAs={modalAs}
        />
        <ProfileEntries
          companionName={companionReference.name}
          title="Gear"
          entries={companionReference.gear}
          describe={gearModalText}
          modalAs={modalAs}
        />
        <ProfileEntries
          companionName={companionReference.name}
          title="Weapons"
          entries={companionReference.weapons}
          describe={() => NO_ADDITIONAL_RULES}
          modalAs={modalAs}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-2">
        <ItemMetaChips source={companionReference.source} bare size="sm" />
      </div>
    </>
  );
}

function CompanionCard({
  companion,
  editable,
  onRemove,
}: {
  companion: CompanionItem;
  editable: boolean;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const companionReference = COMPANION_REFERENCE.find((entry) => entry.id === companion.referenceId);
  if (!companionReference) return null;

  return (
    <div className={`${uiSectionShell} overflow-hidden`}>
      <div className="relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${companionReference.name} details`}
          className="absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex items-center gap-1.5">
            <h3 className={uiItemName}>{companionReference.name}</h3>
            <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
              <InfoModal title={companionReference.name} content={companionReference.description} />
            </span>
          </div>
        </div>
        <div className="relative pointer-events-none flex items-center gap-2 shrink-0">
          <ExpandChevron expanded={expanded} />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-3">
          {editable && (
            <div className="flex justify-end">
              <RemoveButton onClick={onRemove} label={`Remove ${companionReference.name}`} />
            </div>
          )}
          <CompanionProfileDetails companionReference={companionReference} modalAs="button" />
        </div>
      )}
    </div>
  );
}

export function CompanionsTab({
  companions,
  editable,
  onUpdate,
}: {
  companions: CompanionItem[];
  editable: boolean;
  onUpdate: (next: CompanionItem[]) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionHeader>Companions</SectionHeader>
        {editable ? (
          <AddButton label="Add companion" onClick={() => setShowPicker(true)} />
        ) : (
          <ViewButton label="View companions" onClick={() => setShowPicker(true)} />
        )}
      </div>

      {companions.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No companions recorded.</p>
      ) : (
        <div className="space-y-3">
          {companions.map((companion) => (
            <CompanionCard
              key={companion.id}
              companion={companion}
              editable={editable}
              onRemove={() => onUpdate(companions.filter((entry) => entry.id !== companion.id))}
            />
          ))}
        </div>
      )}

      {showPicker && (
        <CompanionPicker
          editable={editable}
          currentIds={companions.map((companion) => companion.referenceId)}
          onSelect={(companionReference) => {
            onUpdate([
              ...companions,
              { id: crypto.randomUUID(), referenceId: companionReference.id, name: companionReference.name, source: companionReference.source },
            ]);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
