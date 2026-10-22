import { useState } from "react";
import type { CompanionItem } from "../../types/Character";
import { COMPANION_REFERENCE, type CompanionRef } from "../../data/reference/companionReference";
import { Button } from "../../ui/buttons/Button";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { InfoModal } from "../../components/InfoModal";
import { ItemMetaChips } from "../../ui/chips/ItemMetaChips";
import { PickerList, PickerModal } from "../../ui/pickers/PickerModal";
import { RemoveEntryButton } from "../../ui/RemoveEntryButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { StatChip } from "../../ui/chips/StatChip";
import { AccordionCard } from "../../ui/AccordionCard";
import type { PatchOptions } from "../../hooks/useOptimisticOverlay";
import {
  uiChipRow,
  uiInfoModalWrapper,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiRuleName,
  uiStackSection,
  uiStackBody,
  uiStackList,
} from "../../ui/styles/editableStyles";
import { SKILL_DESCRIPTIONS } from "../../data/reference/skillDescriptions";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import { TALENT_LIST } from "shared-rules";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { GEAR_REFERENCE } from "../../data/reference/gearReference";
import { colourDivider } from "../../ui/styles/colourTokens";

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
  onSelect?: () => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((current) => !current);

  return (
    <AccordionCard
      name={companionReference.name}
      label={companionReference.name}
      expanded={expanded}
      onToggle={toggle}
      onSelect={onSelect}
      info={
        <InfoModal
          title={companionReference.name}
          content={companionReference.description}
          as="span"
        />
      }
    >
      <CompanionProfileDetails companionReference={companionReference} modalAs="span" />
    </AccordionCard>
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
  onSelect: (companionReference: CompanionRef) => void | Promise<void>;
  onClose: () => void;
}) {
  const available = COMPANION_REFERENCE.filter(
    (companionReference) => !currentIds.includes(companionReference.id)
  );

  return (
    <PickerModal
      title={editable ? "Add Companion" : "View Companions"}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={available.length === 0}
      emptyMessage="No companions available."
      hideSearch
      footer={
        <Button variant="secondary" fullWidth onClick={onClose}>
          Done
        </Button>
      }
    >
      <PickerList>
        {available.map((companionReference) => (
          <CompanionPickerCard
            key={companionReference.id}
            companionReference={companionReference}
            onSelect={editable ? () => onSelect(companionReference) : undefined}
          />
        ))}
      </PickerList>
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
  return modalText(talent ? (TALENT_DESCRIPTIONS[talent.id] ?? talent.description) : undefined);
}

function traitModalText(entry: string): string {
  const traitName = entry.replace(/\s*\(.+\)$/, "");
  const traitId =
    traitName === "Armour Plated" ? "armour-plating" : traitName.toLowerCase().replace(/\s+/g, "-");
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
  const hasAdditionalRules = descriptions.some(
    (description) => description !== NO_ADDITIONAL_RULES
  );

  return (
    <div className="flex items-center gap-1.5">
      <span className={`${uiTextLabel} shrink-0`}>{title}</span>
      <span className={`text-xs lg:text-sm ${uiTextBody}`}>{entries.join(", ")}</span>
      {hasAdditionalRules && (
        <span className={uiInfoModalWrapper}>
          <InfoModal
            title={`${companionName} ${title}`}
            content={
              <div className={uiStackBody}>
                {entries.map((entry, index) => (
                  <div key={entry}>
                    <p className={uiRuleName}>{entry}</p>
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
  modalAs,
}: {
  companionReference: CompanionRef;
  modalAs?: "button" | "span";
}) {
  return (
    <>
      <div className={`${uiChipRow} mt-2`}>
        {CHARACTERISTICS.map(({ key, label }) => (
          <StatChip key={key} label={label} value={companionReference.characteristics[key]} />
        ))}
        <StatChip label="Move" value={companionReference.movement} />
        <StatChip label="Wounds" value={companionReference.wounds} />
      </div>

      <div className={`${uiStackList} border-t ${colourDivider} pt-2 mt-2`}>
        <SectionHeader as="h3" className="mb-2">
          Abilities
        </SectionHeader>
        <ProfileEntries
          companionName={companionReference.name}
          title="Skills"
          entries={companionReference.skills}
          describe={skillModalText}
          modalAs={modalAs}
        />
        <ProfileEntries
          companionName={companionReference.name}
          title="Talents"
          entries={companionReference.talents}
          describe={talentModalText}
          modalAs={modalAs}
        />
        <ProfileEntries
          companionName={companionReference.name}
          title="Traits"
          entries={companionReference.traits}
          describe={traitModalText}
          modalAs={modalAs}
        />
      </div>

      <div className={`${uiStackList} border-t ${colourDivider} pt-2 mt-2`}>
        <SectionHeader as="h3" className="mb-2">
          Equipment
        </SectionHeader>
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

      <div className={`${uiChipRow} border-t ${colourDivider} pt-2 mt-2`}>
        <ItemMetaChips source={companionReference.source} bare />
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
  onRemove: () => void | Promise<boolean | void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const companionReference = COMPANION_REFERENCE.find(
    (entry) => entry.id === companion.referenceId
  );
  if (!companionReference) return null;

  return (
    <AccordionCard
      name={companionReference.name}
      label={companionReference.name}
      expanded={expanded}
      onToggle={() => setExpanded((current) => !current)}
      info={<InfoModal title={companionReference.name} content={companionReference.description} />}
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Companion" name={companionReference.name} onRemove={onRemove} />
        ) : undefined
      }
    >
      <CompanionProfileDetails companionReference={companionReference} modalAs="button" />
    </AccordionCard>
  );
}

export function CompanionsTab({
  companions,
  editable,
  onUpdate,
}: {
  companions: CompanionItem[];
  editable: boolean;
  onUpdate: (next: CompanionItem[], options?: PatchOptions) => void | Promise<boolean | void>;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className={uiStackSection}>
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
        <div className={uiStackList}>
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
            onUpdate(
              [
                ...companions,
                {
                  id: crypto.randomUUID(),
                  referenceId: companionReference.id,
                  name: companionReference.name,
                  source: companionReference.source,
                },
              ],
              { optimistic: true }
            );
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
