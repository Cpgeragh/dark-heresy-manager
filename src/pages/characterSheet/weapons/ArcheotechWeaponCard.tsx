// src/pages/characterSheet/weapons/ArcheotechWeaponCard.tsx
// Collapsible card for weapons, grenades and mines stored in the Archeotech tab.

import { useState, useEffect } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import {
  uiActionButtonCompact,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
} from "../../../ui/editableStyles";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { InfoModal } from "../../../components/InfoModal";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  computeMeleeTotalDamage,
  EquipToggle,
} from "./weaponShared";
import { EXPLOSIVE_MISHAPS_CONTENT } from "./GrenadeCard";

export function ArcheotechWeaponCard({
  item,
  strengthBonus,
  editable = false,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onRemove,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
}: {
  item: ArcheotechItem;
  strengthBonus?: number;
  editable?: boolean;
  libraryItem?: CampaignCustomItem<"archeotech">;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: "publish" | "archive" | "updateAll" | null;
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
  onRemove?: () => void;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId);
  const specialRules = item.specialRules ?? ref?.specialRules;
  const description  = item.description  ?? ref?.description;
  const weight       = item.weight       ?? ref?.weight;
  const value        = item.value        ?? ref?.value;
  const availability = item.availability ?? ref?.availability;
  const source       = item.source       ?? ref?.source;
  const weaponClass  = item.weaponClass  ?? ref?.weaponClass;
  const damage       = item.damage       ?? ref?.damage;
  const range        = item.range        ?? ref?.range;
  const rof          = item.rof          ?? ref?.rof;
  const pen          = item.pen          ?? ref?.pen;
  const clip         = item.clip         ?? ref?.clip;
  const rld          = item.rld          ?? ref?.rld;

  const hasRules = !!specialRules?.trim();
  const ruleNamesInLookup = (specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));

  const hasWeaponStats = !!(damage || weaponClass);
  const showMishaps = item.type === "Grenade";

  return (
    <div className="border border-amber-700/40 bg-amber-900/10 rounded-lg p-3 lg:p-4 space-y-3">
      {/* Header — always visible */}
      <div className="flex items-start justify-between gap-2">
        <button className="flex-1 min-w-0 text-left" onClick={() => setExpanded((e) => !e)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm lg:text-base font-semibold text-slate-200">{item.name}</p>
            <Chip size="sm" className="border-amber-700/50 bg-amber-500/10 text-amber-400 uppercase tracking-wide shrink-0">
              Archeotech
            </Chip>
          </div>
          {weaponClass && <p className={`text-xs lg:text-sm ${uiTextMuted}`}>{weaponClass}</p>}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          {editable && onRemove && (
            <button onClick={onRemove} className={`${uiActionButtonCompact} shrink-0`}>
              Remove
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-slate-400 hover:text-slate-200 transition"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Stat chips — only for items with structured weapon data */}
          {hasWeaponStats && (
            <div className="flex flex-wrap gap-1.5">
              {range && <StatChip label="Range" value={range} />}
              {rof && <StatChip label="RoF" value={rof} />}
              {damage && (
                <StatChip label="Damage" value={damage.replace(/\s*[IREX]$/i, "").trim()} />
              )}
              {damage && <DamageTypeChip damage={damage} />}
              {pen && <StatChip label="Pen" value={pen} />}
              {clip && <StatChip label="Clip" value={clip} />}
              {rld && <StatChip label="Reload" value={rld} />}
              {weaponClass === "Melee" && strengthBonus !== undefined && (
                <>
                  <StatChip label="SB" value={`+${strengthBonus}`} />
                  {damage && (
                    <StatChip
                      label="Total"
                      value={computeMeleeTotalDamage(damage, strengthBonus)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Qualities / Rules */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{hasRules ? specialRules : "-"}</span>
              {ruleNamesInLookup.length > 0 && (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Qualities`}
                    content={<SpecialRulesContent rules={specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {description ? (
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal
                    title={`${item.name} Rules`}
                    content={<p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{description}</p>}
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            {showMishaps && (
              <div className="flex items-center gap-1.5">
                <span className={uiTextLabel}>Mishaps</span>
                <span className="inline-flex items-center -translate-y-[1.4px]">
                  <InfoModal title="Explosive Mishaps" content={EXPLOSIVE_MISHAPS_CONTENT} />
                </span>
              </div>
            )}
          </div>

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
            />
          )}

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={weight}
            value={value}
            availability={availability}
            source={source}
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />
        </>
      )}
    </div>
  );
}
