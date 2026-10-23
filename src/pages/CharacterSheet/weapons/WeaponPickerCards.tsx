// src/pages/CharacterSheet/weapons/WeaponPickerCards.tsx
// The cards a weapon picker lists: a tap chooses the weapon and the chevron opens the full weapon card.

import { useEffect, useRef, useState } from "react";
import type { MeleeWeapon, RangedWeapon } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { uiChipRow, uiTextDescription } from "../../../ui/styles/editableStyles";
import { AccordionCard } from "../../../ui/AccordionCard";
import { Chip } from "../../../ui/chips/Chip";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { InfoModal } from "../../../components/InfoModal";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { RangedCard } from "./RangedCard";
import { MeleeCard } from "./MeleeCard";
import { weaponClassChip, weaponTypeChip } from "./weaponHelpers";

export function RangedPickerCard({
  weapon,
  libraryItem,
  integrated = false,
  editable,
  onSelect,
}: {
  weapon: RangedWeapon;
  libraryItem?: CampaignCustomItem<"weapon">;
  integrated?: boolean;
  editable: boolean;
  onSelect: () => void;
}) {
  recordComponentRender("RangedWeaponPickerRow");
  const [expanded, setExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    const expectedLabel = `${expanded ? "Collapse" : "Expand"} ${weapon.name} details`;
    const nextControl = Array.from(
      rowRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
    ).find((button) => button.getAttribute("aria-label") === expectedLabel);
    nextControl?.focus();
  }, [expanded, weapon.name]);

  function setDetailsExpanded(nextExpanded: boolean) {
    restoreFocusRef.current = true;
    setExpanded(nextExpanded);
  }

  if (!expanded) {
    const classChip = weaponClassChip(weapon.class);
    const typeChip = weaponTypeChip(weapon.type);
    return (
      <div ref={rowRef}>
        <AccordionCard
          name={weapon.name}
          label={weapon.name}
          expanded={false}
          onToggle={() => setDetailsExpanded(true)}
          onSelect={editable ? onSelect : undefined}
          badge={
            <>
              {libraryItem && <StatusBadge status={libraryItem.status} />}
              {integrated && <Chip colour="violet">Integrated</Chip>}
            </>
          }
          info={
            <InfoModal
              title={weapon.name}
              content={
                weapon.description ? (
                  <p className={uiTextDescription}>{weapon.description}</p>
                ) : undefined
              }
            />
          }
          metadata={
            classChip || typeChip ? (
              <div className={`${uiChipRow} items-center`}>
                {classChip && <Chip colour={classChip.colour}>{classChip.label}</Chip>}
                {typeChip && <Chip colour={typeChip.colour}>{typeChip.label}</Chip>}
              </div>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div ref={rowRef}>
      <RangedCard
        weapon={weapon}
        editable={false}
        expanded
        onExpandedChange={setDetailsExpanded}
        onSelect={editable ? onSelect : undefined}
        libraryItem={libraryItem}
        integrated={integrated}
        onRemove={() => {}}
        onAddUpgrade={() => {}}
        onRemoveUpgrade={() => {}}
        onUpdateAmmoEntries={() => {}}
        onUpdateQuantity={() => {}}
        allowUpgrades={false}
      />
    </div>
  );
}

export function MeleePickerCard({
  weapon,
  libraryItem,
  integrated = false,
  strengthBonus,
  editable,
  onSelect,
}: {
  weapon: MeleeWeapon;
  libraryItem?: CampaignCustomItem<"weapon">;
  integrated?: boolean;
  strengthBonus: number;
  editable: boolean;
  onSelect: () => void;
}) {
  return (
    <MeleeCard
      weapon={weapon}
      editable={false}
      strengthBonus={strengthBonus}
      libraryItem={libraryItem}
      integrated={integrated}
      onSelect={editable ? onSelect : undefined}
      onRemove={() => {}}
      onAddUpgrade={() => {}}
      onRemoveUpgrade={() => {}}
      onUpdateQuantity={() => {}}
      allowUpgrades={false}
    />
  );
}
