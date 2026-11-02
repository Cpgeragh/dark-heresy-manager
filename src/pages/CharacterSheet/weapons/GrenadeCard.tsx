// src/pages/CharacterSheet/weapons/GrenadeCard.tsx
// GrenadeCard: see GrenadePicker.tsx and CustomGrenadeForm.tsx for the picker and custom-item form.

import { useState } from "react";
import type { GrenadeItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { resolveGrenadeReference } from "../../../data/reference/weaponReference";
import {
  uiChipRow,
  uiSplitRow,
  uiSection,
  uiInactiveItem,
  uiTextLabel,
  uiStackField,
  uiItemNameTypography,
} from "../../../ui/styles/editableStyles";
import {
  colourAmberPlain,
  colourDivider,
  colourTextMuted,
  colourFillInset,
} from "../../../ui/styles/colourTokens";
import { AccordionCard } from "../../../ui/AccordionCard";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";
import { StatChip } from "../../../ui/chips/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { weaponClassChip } from "./weaponHelpers";
import { getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import { EntryLines } from "../../../ui/EntryLines";
import { EntryQuantityRow } from "../../../ui/EntryQuantityRow";
import { entryNotesLine } from "../../../ui/entryNotesLine";
import { InfoParagraph } from "../../../ui/InfoSection";
import { ExplosiveMishapsContent } from "./ExplosiveMishapsContent";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { uiCorner } from "../../../ui/styles/shapeStyles";

export function GrenadeCard({
  item,
  editable,
  strengthBonus,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
  onUpdateQty,
  isEquipped = false,
  onToggleEquip,
  canEquipMoreTypes = true,
  isStowedCard = false,
  onSelect,
}: {
  item: GrenadeItem;
  editable: boolean;
  strengthBonus: number;
  onRemove: () => unknown;
  onUpdateQty: (qty: number) => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  canEquipMoreTypes?: boolean;
  isStowedCard?: boolean;
  onSelect?: () => void;
} & CustomItemLibraryActionProps<"weapon">) {
  recordComponentRender("GrenadeCard");
  const [expanded, setExpanded] = useState(false);

  // Stowed overflow card: read-only, always collapsed
  if (isStowedCard) {
    return (
      <div className={`${uiSection} ${uiInactiveItem}`}>
        <div className={`${uiSplitRow}`}>
          <div className="min-w-0">
            <p className={`${uiItemNameTypography} ${colourTextMuted} truncate`}>{item.name}</p>
            <p className={`text-xs lg:text-sm ${colourAmberPlain}`}>
              Stowed · {item.quantity} remaining
            </p>
          </div>
          <Chip colour="slate" className="shrink-0">
            Stowed
          </Chip>
        </div>
      </div>
    );
  }

  // ── Regular card ──────────────────────────────────────────────────────────
  const ref = resolveGrenadeReference(item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const rulesDescription = ref?.description ?? item.description;
  const ruleNamesInLookup = expanded ? getKnownSpecialRuleNames(item.specialRules) : [];

  const equippedCount = isEquipped ? Math.min(item.quantity, 3) : item.quantity;
  const showMishaps = item.type !== "Mine" && item.type !== "Missile";
  const thrownRange = `${Math.max(0, strengthBonus) * 3}m`;

  return (
    <AccordionCard
      name={item.name}
      label={item.name}
      expanded={expanded}
      onToggle={() => setExpanded((e) => !e)}
      onSelect={onSelect}
      badge={libraryItem ? <StatusBadge status={libraryItem.status} /> : undefined}
      info={
        <InfoModal
          title={item.name}
          content={rulesDescription ? <InfoParagraph>{rulesDescription}</InfoParagraph> : undefined}
        />
      }
      metadata={
        <div className={`${uiChipRow} items-center`}>
          <Chip
            colour={item.type === "Mine" ? "violet" : item.type === "Missile" ? "orange" : "cyan"}
          >
            {item.type ?? "Grenade"}
          </Chip>
          {(() => {
            const c = weaponClassChip(item.class);
            return c ? <Chip colour={c.colour}>{c.label}</Chip> : null;
          })()}
          {isEquipped && <Chip colour="emerald">{equippedCount} ready</Chip>}
        </div>
      }
      removeAction={
        editable ? (
          <RemoveEntryButton kind="Grenade" name={item.name} onRemove={onRemove} />
        ) : undefined
      }
      actions={
        onToggleEquip ? (
          <EquipToggle
            equipped={isEquipped}
            disabled={!isEquipped && !canEquipMoreTypes}
            editable={editable}
            onChange={onToggleEquip}
          />
        ) : undefined
      }
    >
      {() => (
        <>
          {libraryItem && (
            <CustomItemActionButtons
              className="flex flex-wrap gap-2"
              libraryItem={libraryItem}
              isDM={isDM}
              canEditDefinition={canEditDefinition}
              busyAction={busyAction}
              onEditDefinition={onEditDefinition}
              onPublish={onPublish}
              onArchive={onArchive}
              onUpdateAllCopies={onUpdateAllCopies}
            />
          )}

          {/* Stat chips */}
          <div className={`${uiChipRow}`}>
            {item.type !== "Mine" && item.type !== "Missile" && (
              <StatChip label="Range" value={thrownRange} />
            )}
            {(!item.damage || item.damage === "—") && <StatChip label="Damage" value="—" />}
            {item.damage && item.damage !== "—" && item.damage !== "Special" && (
              <>
                <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
                <DamageTypeChip damage={item.damage} />
              </>
            )}
            {item.damage === "Special" && (
              <div
                className={`flex flex-col items-center ${colourFillInset} ${uiCorner} px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]`}
              >
                <span className={uiTextLabel}>Damage</span>
                <span className={`text-sm lg:text-base font-code ${colourAmberPlain} mt-0.5`}>
                  Special
                </span>
              </div>
            )}
            <StatChip label="Pen" value={item.pen && item.pen !== "—" ? item.pen : "—"} />
          </div>

          {/* Qualities / Rules */}
          <div className={uiStackField}>
            <EntryLines
              lines={{
                qualities: {
                  value: hasRules ? item.specialRules : undefined,
                  info:
                    ruleNamesInLookup.length > 0 ? (
                      <InfoModal
                        title={`${item.name} Qualities`}
                        content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
                      />
                    ) : undefined,
                },
                rules: {
                  info: item.rules?.trim() ? (
                    <InfoModal
                      title={`${item.name} Rules`}
                      content={<InfoParagraph>{item.rules.trim()}</InfoParagraph>}
                    />
                  ) : undefined,
                },
                mishaps: showMishaps
                  ? {
                      info: (
                        <InfoModal
                          title="Explosive Mishaps"
                          content={<ExplosiveMishapsContent />}
                        />
                      ),
                    }
                  : undefined,
                notes: onSelect
                  ? undefined
                  : entryNotesLine(item.name, item.itemNotes, {
                      collection: "grenades",
                      id: item.id,
                      notes: item.personalNotes,
                      editable,
                    }),
              }}
            />
          </div>

          {!onSelect && (
            <EntryQuantityRow
              quantity={item.quantity}
              editable={editable}
              onUpdate={onUpdateQty}
              note={
                isEquipped && item.quantity > 3 ? (
                  <span className={`text-[10px] lg:text-xs ${colourAmberPlain}`}>
                    3 ready, rest stowed
                  </span>
                ) : undefined
              }
            />
          )}

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
            className={`${uiChipRow} border-t ${colourDivider} pt-2 mt-1`}
          />
        </>
      )}
    </AccordionCard>
  );
}
