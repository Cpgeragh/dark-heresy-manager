// src/pages/characterSheet/weapons/MeleeCard.tsx
// MeleeCard — see MeleePicker.tsx and CustomMeleeForm.tsx for the weapon picker and custom-weapon form.

import { useState, useEffect } from "react";
import type { MeleeWeapon } from "../../../types/Character";
import { MELEE_WEAPON_REFERENCE } from "../../../data/reference/weaponReference";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import {
  uiSectionShell,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiInfoModalWrapper,
  uiCardTitle,
} from "../../../ui/editableStyles";
import { uiExpandButton, uiIconRemoveButton } from "../../../ui/buttonStyles";
import { colourViolet } from "../../../ui/colourTokens";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { InfoModal } from "../../../components/InfoModal";
import { TrashIcon } from "../../../ui/TrashIcon";
import { ExpandChevron } from "../../../ui/ExpandChevron";
import {
  StatChip,
  DamageTypeChip,
  computeMeleeTotalDamage,
  SpecialRulesContent,
  UpgradePicker,
  UpgradeCard,
  EquipToggle,
} from "./weaponShared";
import { effectiveMeleeStats, getCompatibleUpgrades, meleeClassChips, meleeCraftsmanshipDescription } from "./weaponHelpers";

function hasMultipleMeleeProfiles(damage?: string): boolean {
  return !!damage && /\bLow:\s|\bHigh:\s|;/.test(damage);
}

function displayMeleeDamage(damage: string): string {
  return hasMultipleMeleeProfiles(damage) ? damage : damage.replace(/\s*[IREX]$/i, "").trim();
}

// ─── Melee Card ───────────────────────────────────────────────────────────────

export function MeleeCard({
  weapon,
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
  onAddUpgrade,
  onRemoveUpgrade,
  onUpdateQuantity,
  allowUpgrades = true,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  forceExpanded = false,
  integrated = false,
}: {
  weapon: MeleeWeapon;
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
  onAddUpgrade: (upgradeId: string) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
  onUpdateQuantity: (qty: number) => void;
  allowUpgrades?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
  integrated?: boolean;
}) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const [showUpgradePicker, setShowUpgradePicker] = useState(false);

  const upgradeIds = weapon.upgrades ?? [];
  const upgradeRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    upgradeIds.includes(upgrade.id)
  );
  const weaponRef = weapon.referenceId
    ? MELEE_WEAPON_REFERENCE.find((r) => r.id === weapon.referenceId)
    : undefined;
  // Prefer reference specialRules as source of truth; avoids stale stored character data
  const baseWeapon = weaponRef ? { ...weapon, specialRules: weaponRef.specialRules } : weapon;
  const effective = effectiveMeleeStats(baseWeapon, upgradeRefs);
  const hasMultipleProfiles = hasMultipleMeleeProfiles(weapon.damage);
  const addableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, true, upgradeIds);
  const viewableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, true, []);
  const visibleCompatible = allowUpgrades
    ? editable
      ? addableCompatible
      : viewableCompatible
    : [];
  const baseRulesText = effective.specialRules?.trim() ?? "";
  const rulesText = weaponRef?.twoHanded
    ? [baseRulesText, "Two-Handed"].filter((part) => part && part !== "—" && part !== "-").join(", ")
    : baseRulesText;
  const ruleNamesInLookup = (effective.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-"
  );
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;
  const craftsmanship = weapon.craftsmanship ?? "Common";
  const classChips = meleeClassChips(weapon.class);
  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      {/* Header — always visible */}
      <button type="button"
        className="w-full flex items-stretch justify-between gap-2 p-3 lg:p-4"
        onClick={() => !forceExpanded && setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className={uiExpandButton}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={uiCardTitle}>{weapon.name}</p>
            {libraryItem && (
              <StatusBadge status={libraryItem.status} />
            )}
            {integrated && (
              <Chip size="sm" className={colourViolet}>
                Integrated
              </Chip>
            )}
          </div>
          {classChips.length > 0 && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {classChips.map((chip) => (
                <Chip key={chip.label} size="sm" className={chip.className}>
                  {chip.label}
                </Chip>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          {!forceExpanded && <ExpandChevron expanded={expanded} />}
        </div>
      </button>

      {(expanded || forceExpanded) && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-3">
          {editable && !integrated && (
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

          <div className="flex flex-wrap gap-1.5">
            {weapon.damage && <StatChip label="Damage" value={displayMeleeDamage(weapon.damage)} />}
            {weapon.damage && !hasMultipleProfiles && <DamageTypeChip damage={weapon.damage} />}
            {effective.pen && <StatChip label="Pen" value={effective.pen} />}
            <StatChip label="SB" value={`+${strengthBonus}`} />
            {weapon.damage && !hasMultipleProfiles && (
              <StatChip
                label="Total"
                value={computeMeleeTotalDamage(weapon.damage, strengthBonus)}
              />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
                {hasQualities ? rulesText : "-"}
              </span>
              {hasQualityModal && (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${weapon.name} Qualities`}
                    content={<SpecialRulesContent rules={effective.specialRules ?? ""} />}
                  />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rules</span>
              {hasItemRules ? (
                <span className={uiInfoModalWrapper}>
                  <InfoModal
                    title={`${weapon.name} Rules`}
                    content={<SpecialRulesContent rules="" description={rulesDescription} />}
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>
                Craftsmanship
              </span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={`${craftsmanship} Weapon`}
                  content={meleeCraftsmanshipDescription(craftsmanship)}
                />
              </span>
            </div>
          </div>

          {/* Weight / Value / Availability / Source */}
          <ItemMetaChips
            weight={effective.weight}
            value={weapon.value}
            availability={weapon.availability}
            source={weapon.source}
            className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1"
          />

          {isThrown && (
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
              <span className={uiTextLabel}>Quantity</span>
              <QuantityControl
                quantity={weapon.quantity ?? 1}
                editable={editable}
                size="sm"
                onUpdate={onUpdateQuantity}
              />
            </div>
          )}

          {/* Upgrades */}
          {(upgradeRefs.length > 0 || visibleCompatible.length > 0) && (
            <div className="border-t border-slate-800 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={uiTextLabel}>
                  Upgrades
                </span>
                {(editable ? visibleCompatible.length > 0 : upgradeRefs.length > 0 || visibleCompatible.length > 0) && (
                  <Button
                    size="xs"
                    onClick={() => setShowUpgradePicker(true)}
                  >
                    {editable ? "+ Add" : "View"}
                  </Button>
                )}
              </div>
              {upgradeRefs.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>None fitted</p>
              ) : (
                <div className="space-y-1.5">
                  {upgradeRefs.map((upgrade) => (
                    <UpgradeCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      editable={editable}
                      onRemove={onRemoveUpgrade}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {showUpgradePicker && (
            <UpgradePicker
              compatibleUpgrades={visibleCompatible}
              editable={editable}
              onSelect={(id) => {
                onAddUpgrade(id);
                setShowUpgradePicker(false);
              }}
              onClose={() => setShowUpgradePicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
