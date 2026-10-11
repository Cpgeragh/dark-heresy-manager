import { useState, type MouseEvent } from "react";
import type { CompanionItem } from "../../types/Character";
import { COMPANION_REFERENCE, type CompanionRef } from "../../data/reference/companionReference";
import { Button } from "../../ui/buttons/Button";
import { AddButton } from "../../ui/buttons/AddButton";
import { ViewButton } from "../../ui/buttons/ViewButton";
import { InfoModal } from "../../components/InfoModal";
import { ItemMetaChips } from "../../ui/chips/ItemMetaChips";
import { PickerList, PickerModal } from "../../ui/pickers/PickerModal";
import { RemoveButton } from "../../ui/buttons/RemoveButton";
import { SectionHeader } from "../../ui/SectionHeader";
import { StatChip } from "../../ui/chips/StatChip";
import { ExpandChevron } from "../../ui/icons/ExpandChevron";
import { usePendingClick } from "../../ui/usePendingClick";
import type { PatchOptions } from "../../hooks/useOptimisticOverlay";
import { CardOverlayButton } from "../../ui/buttons/CardOverlayButton";
import { ExpandButton } from "../../ui/buttons/ExpandButton";
import { uiCardTapHeader, uiExpandButton } from "../../ui/styles/buttonStyles";
import {
  uiChipRow,
  uiInlineRow,
  uiInfoModalWrapper,
  uiSectionShell,
  uiSpinner,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiItemNameHover,
  uiRuleName,
} from "../../ui/styles/editableStyles";
import { SKILL_DESCRIPTIONS } from "../../data/reference/skillDescriptions";
import { TALENT_DESCRIPTIONS } from "../../data/reference/talentDescriptions";
import { TALENT_LIST } from "shared-rules";
import { TRAIT_DESCRIPTIONS } from "../../data/reference/traitDescriptions";
import { GEAR_REFERENCE } from "../../data/reference/gearReference";
import { colourDivider } from "../../ui/styles/colourTokens";
import { uiLayerLocal } from "../../ui/styles/layerStyles";

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
  const { pending, handleClick: handleSelect } = usePendingClick(
    onSelect ? (_event: MouseEvent<HTMLButtonElement>) => onSelect() : undefined
  );

  return (
    <div className={`${uiSectionShell} overflow-hidden`}>
      <div className={`${uiCardTapHeader} relative w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left`}>
        <CardOverlayButton
          label={
            onSelect
              ? `Select ${companionReference.name}`
              : `${expanded ? "Collapse" : "Expand"} ${companionReference.name} details`
          }
          expanded={onSelect ? undefined : expanded}
          pending={pending}
          onClick={onSelect ? handleSelect : toggle}
        />
        <div className={`${uiExpandButton} relative pointer-events-none ${uiInlineRow}`}>
          <div className="flex items-center gap-1.5">
            <span className={uiItemNameHover}>{companionReference.name}</span>
            <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
              <InfoModal
                title={companionReference.name}
                content={companionReference.description}
                as="span"
              />
            </span>
          </div>
          {pending ? (
            <span
              className={`${uiSpinner} relative ${uiLayerLocal} h-4 w-4 ml-auto`}
              aria-hidden="true"
            />
          ) : (
            <ExpandButton
              expanded={expanded}
              label={expanded ? "Collapse companion details" : "Expand companion details"}
              onClick={toggle}
              className="ml-auto"
            />
          )}
        </div>
      </div>

      {expanded && (
        <div
          className={`px-3 lg:px-4 pb-3 lg:pb-4 pt-2 lg:pt-3 border-t ${colourDivider} space-y-3`}
        >
          <CompanionProfileDetails
            companionReference={companionReference}
            statSize="sm"
            modalAs="span"
          />
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
              <div className="space-y-3">
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
  statSize,
  modalAs,
}: {
  companionReference: CompanionRef;
  statSize?: "sm" | "md";
  modalAs?: "button" | "span";
}) {
  return (
    <>
      <div className={`${uiChipRow} mt-2`}>
        {CHARACTERISTICS.map(({ key, label }) => (
          <StatChip
            key={key}
            size={statSize}
            label={label}
            value={companionReference.characteristics[key]}
          />
        ))}
        <StatChip size={statSize} label="Move" value={companionReference.movement} />
        <StatChip size={statSize} label="Wounds" value={companionReference.wounds} />
      </div>

      <div className={`space-y-1 border-t ${colourDivider} pt-2 mt-2`}>
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

      <div className={`space-y-1 border-t ${colourDivider} pt-2 mt-2`}>
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
  onRemove: () => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const companionReference = COMPANION_REFERENCE.find(
    (entry) => entry.id === companion.referenceId
  );
  if (!companionReference) return null;

  return (
    <div className={`${uiSectionShell} overflow-hidden`}>
      <div
        className={`${uiCardTapHeader} relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4`}
      >
        <CardOverlayButton
          label={`${expanded ? "Collapse" : "Expand"} ${companionReference.name} details`}
          expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex items-center gap-1.5">
            <h3 className={uiItemNameHover}>{companionReference.name}</h3>
            <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
              <InfoModal title={companionReference.name} content={companionReference.description} />
            </span>
          </div>
        </div>
        <div className={`relative pointer-events-none ${uiInlineRow} shrink-0`}>
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
  onUpdate: (next: CompanionItem[], options?: PatchOptions) => void | Promise<void>;
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
              onRemove={() => {
                onUpdate(
                  companions.filter((entry) => entry.id !== companion.id),
                  { optimistic: true }
                );
              }}
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
