// src/pages/characterSheet/weapons/GrenadeCard.tsx
// GrenadeCard — see GrenadePicker.tsx and CustomGrenadeForm.tsx for the picker and custom-item form.

import { useState, useEffect } from "react";
import type { GrenadeItem } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
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
import { uiExpandButton, uiIconRemoveButton } from "../../../ui/buttonStyles";
import { colourEmerald, colourCyan, colourViolet, colourTealLight } from "../../../ui/colourTokens";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { StatChip, DamageTypeChip, SpecialRulesContent, EquipToggle } from "./weaponShared";
import { weaponClassChip } from "./weaponHelpers";
import { TrashIcon } from "../../../ui/TrashIcon";
import { ExpandChevron } from "../../../ui/ExpandChevron";

export const EXPLOSIVE_MISHAPS_CONTENT = (
  <div className="space-y-3">
    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
      Whenever a jam results from throwing a grenade or firing a grenade, something unfortunate has
      happened. Roll on the table below to find out the results.
    </p>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm lg:text-base border-collapse">
        <thead>
          <tr className={`${uiTextLabel} border-b border-slate-700`}>
            <th className="py-1.5 pr-3 font-medium">Roll</th>
            <th className="py-1.5 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/60">
          <tr>
            <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>1-5</td>
            <td className={`py-2 ${uiTextBody}`}>
              <span className="font-semibold text-slate-100">Dud.</span> The explosive or round
              fails to explode and, in the case of grenade launchers, the weapon must be reloaded
              before it can fire.
            </td>
          </tr>
          <tr>
            <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>6-8</td>
            <td className={`py-2 ${uiTextBody}`}>
              <span className="font-semibold text-slate-100">"It might be ok…"</span> Nothing
              happens. Roll again on this table next round.
            </td>
          </tr>
          <tr>
            <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>9-0</td>
            <td className={`py-2 ${uiTextBody}`}>
              <span className="font-semibold text-slate-100">BOOM!</span> The round or explosive
              detonates immediately. Centre the effect on the character. If this was the result of
              firing a grenade launcher, the grenade detonates in the barrel, having its normal
              effect as well as destroying the weapon.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

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
  libraryItem?: CampaignCustomItem<"weapon">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  canEquipMoreTypes?: boolean;
  isStowedCard?: boolean;
}) {
  const [expanded, setExpanded] = useState(!isStowedCard && isEquipped);
  useEffect(() => {
    if (!isStowedCard) setExpanded(isEquipped);
  }, [isEquipped, isStowedCard]);

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
      <button type="button"
        className="w-full flex items-stretch justify-between gap-2 p-3 lg:p-4"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={uiExpandButton}>
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
        <div className="flex items-center gap-2 shrink-0">
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
      </button>

      {expanded && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-2">
          {editable && (
            <div className="flex justify-end">
              <button type="button" onClick={onRemove} aria-label="Remove" className={uiIconRemoveButton}>
                <TrashIcon className="w-4 h-4" />
              </button>
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
                  <InfoModal title="Explosive Mishaps" content={EXPLOSIVE_MISHAPS_CONTENT} />
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
