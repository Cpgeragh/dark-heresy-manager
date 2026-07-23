// src/pages/characterSheet/weapons/GrenadeCard.tsx
// GrenadeCard — see GrenadePicker.tsx and CustomGrenadeForm.tsx for the picker and custom-item form.

import { useState } from "react";
import type { GrenadeItem } from "../../../types/Character";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";
import { GRENADE_REFERENCE } from "../../../data/reference/weaponReference";
import {
  uiSection,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiTextSubtle,
  uiInfoModalWrapper,
  uiCardTitle,
} from "../../../ui/editableStyles";
import { uiExpandButton } from "../../../ui/buttonStyles";
import { colourEmerald, colourCyan, colourViolet, colourTealLight } from "../../../ui/colourTokens";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip } from "../../../ui/StatChip";
import { DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { weaponClassChip } from "./weaponHelpers";
import { RemoveButton } from "../../../ui/RemoveButton";
import { ExpandChevron } from "../../../ui/ExpandChevron";
import { ExplosiveMishapsContent } from "./ExplosiveMishapsContent";

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
}: {
  item: GrenadeItem;
  editable: boolean;
  strengthBonus: number;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  canEquipMoreTypes?: boolean;
  isStowedCard?: boolean;
} & CustomItemLibraryActionProps<"weapon">) {
  const expansionSource = !isStowedCard && isEquipped;
  const [previousExpansionSource, setPreviousExpansionSource] =
    useState(expansionSource);
  const [expanded, setExpanded] = useState(expansionSource);

  if (previousExpansionSource !== expansionSource) {
    setPreviousExpansionSource(expansionSource);
    setExpanded(expansionSource);
  }

  // ── Stowed overflow card — read-only, always collapsed ────────────────────
  if (isStowedCard) {
    return (
      <div className={uiSection + " opacity-60"}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm lg:text-base font-semibold text-slate-400 truncate">{item.name}</p>
            <p className={`text-xs lg:text-sm ${uiTextSubtle}`}>Stowed · {item.quantity} remaining</p>
          </div>
          <Chip size="sm" className="border-slate-600 bg-slate-800/40 text-slate-300 shrink-0">
            Stowed
          </Chip>
        </div>
      </div>
    );
  }

  // ── Regular card ──────────────────────────────────────────────────────────
  const ref = GRENADE_REFERENCE.find((r) => r.id === item.referenceId);
  const hasRules = !!(item.specialRules?.trim() && item.specialRules !== "—");
  const rulesDescription = ref?.description ?? item.description;
  const hasInfo = !!rulesDescription;
  const ruleNamesInLookup = (item.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const equippedCount = isEquipped ? Math.min(item.quantity, 3) : item.quantity;
  const showMishaps = item.type !== "Mine";
  const thrownRange = `${Math.max(0, strengthBonus) * 3}m`;

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      {/* Header — always visible */}
      <div className="relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.name} details`}
          className="absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        />
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`${uiCardTitle} truncate`}>{item.name}</p>
            {libraryItem && (
              <StatusBadge status={libraryItem.status} />
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <Chip size="sm" className={item.type === "Mine" ? colourViolet : colourCyan}>
              {item.type === "Mine" ? "Mine" : "Grenade"}
            </Chip>
            {(() => { const c = weaponClassChip(item.class); return c ? (
              <Chip size="sm" className={c.label === "Exotic" ? colourTealLight : c.active}>{c.label}</Chip>
            ) : null; })()}
            {isEquipped && (
              <Chip size="sm" className={colourEmerald}>
                {equippedCount} ready
              </Chip>
            )}
          </div>
        </div>
        <div className="relative pointer-events-none flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={!isEquipped && !canEquipMoreTypes}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          <ExpandChevron expanded={expanded} />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-2">
          {editable && (
            <div className="flex justify-end">
              <RemoveButton onClick={onRemove} label="Remove" />
            </div>
          )}

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
          <div className="flex flex-wrap gap-1.5">
            {item.type !== "Mine" && <StatChip label="Range" value={thrownRange} />}
            {(!item.damage || item.damage === "—") && (
              <StatChip label="Damage" value="—" />
            )}
            {item.damage && item.damage !== "—" && item.damage !== "Special" && (
              <>
                <StatChip label="Damage" value={item.damage.replace(/\s*[IREX]$/i, "").trim()} />
                <DamageTypeChip damage={item.damage} />
              </>
            )}
            {item.damage === "Special" && (
              <div className="flex flex-col items-center bg-slate-800/60 rounded px-2 lg:px-3 py-1 lg:py-1.5 min-w-[52px] lg:min-w-[64px]">
                <span className={uiTextLabel}>Damage</span>
                <span className="text-sm lg:text-base font-code text-amber-400 mt-0.5">Special</span>
              </div>
            )}
            <StatChip label="Pen" value={item.pen && item.pen !== "—" ? item.pen : "—"} />
          </div>

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                {hasRules ? item.specialRules : "-"}
              </span>
              {ruleNamesInLookup.length > 0 && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={item.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {hasInfo ? (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{rulesDescription}</p>
                    }
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            {showMishaps && (
              <div className="flex items-center gap-1.5">
                <span className={uiTextLabel}>Mishaps</span>
                <span className={uiInfoModalWrapper}>
                  <InfoModal title="Explosive Mishaps" content={<ExplosiveMishapsContent />} />
                </span>
              </div>
            )}
          </div>

          {/* Quantity row */}
          <div className="flex items-center gap-3 pt-1">
            <span className={`text-xs lg:text-sm ${uiTextMuted} uppercase tracking-wide`}>Qty</span>
            <QuantityControl
              quantity={item.quantity}
              editable={editable}
              size="lg"
              onUpdate={onUpdateQty}
            />
            {isEquipped && item.quantity > 3 && (
              <span className={`text-[10px] lg:text-xs ${uiTextMuted} italic ml-1`}>3 ready, rest stowed</span>
            )}
          </div>

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={item.weight}
            value={item.value}
            availability={item.availability}
            source={item.source}
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </div>
      )}
    </div>
  );
}
