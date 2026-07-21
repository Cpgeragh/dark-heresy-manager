// src/pages/characterSheet/weapons/RangedCard.tsx
// RangedCard, AmmoEntryRow, AmmoPicker — see RangedPicker.tsx and CustomRangedForm.tsx for the weapon picker and custom-weapon form.

import { useState, useEffect } from "react";
import type {
  RangedWeapon,
  WeaponAmmoEntry,
  GrenadeItem,
  ArcheotechItem,
} from "../../../types/Character";
import { RANGED_WEAPON_REFERENCE } from "../../../data/reference/weaponReference";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/StatusBadge";
import {
  AMMO_REFERENCE,
  RECHARGING_POWER_PACKS_TEXT,
  formatAmmoName,
  isChargePackAmmoName,
  usesUnitAmmoTracking,
} from "../../../data/reference/ammoReference";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import {
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
  uiTextPlaceholder,
  uiInfoModalWrapper,
  uiItemName,
  uiCardTitle,
} from "../../../ui/editableStyles";
import { uiExpandButton, uiIconRemoveButton } from "../../../ui/buttonStyles";
import { colourArcheotech, colourViolet } from "../../../ui/colourTokens";
import { Button } from "../../../ui/Button";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { PickerModal, PickerRow } from "../../../ui/PickerModal";
import { QuantityControl } from "../../../ui/QuantityControl";
import { formatWeightForDisplay } from "../../../ui/weightFormat";
import { InfoModal } from "../../../components/InfoModal";
import { TrashIcon } from "../../../ui/TrashIcon";
import { ExpandChevron } from "../../../ui/ExpandChevron";
import {
  StatChip,
  DamageTypeChip,
  SpecialRulesContent,
  UpgradePicker,
  UpgradeCard,
  EquipToggle,
} from "./weaponShared";
import { WEAPON_SPECIAL_RULES } from "../../../data/reference/weaponSpecialRules";
import {
  effectiveRangedStats,
  getCompatibleUpgrades,
  ammoFamilyChip,
  weaponClassChip,
  compatibleAmmoIdsForAmmoType,
  rangedCraftsmanshipDescription,
  type AmmoTrackingMode,
} from "./weaponHelpers";

// ─── Ammo Entry Row ───────────────────────────────────────────────────────────

function AmmoEntryRow({
  entry,
  editable,
  clipSize,
  ammoTracking,
  weightKg,
  onSetLoaded,
  onRemove,
  onUpdateClips,
  onUpdateRounds,
  onSetLooseRounds,
}: {
  entry: WeaponAmmoEntry;
  editable: boolean;
  clipSize?: string;
  ammoTracking: AmmoTrackingMode;
  weightKg?: number;
  onSetLoaded: () => void;
  onRemove: () => void;
  onUpdateClips: (qty: number) => void;
  onUpdateRounds: (qty: number) => void;
  onSetLooseRounds: (qty: number) => void;
}) {
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  const displayName = formatAmmoName(ammoRef?.name ?? entry.name);
  const isChargePack = isChargePackAmmoName(displayName);
  const hasAmmoInfo = !!ammoRef?.description || isChargePack;
  const clipSizeNumber = parseFloat(clipSize ?? "0") || 0;
  const looseRoundCount = entry.rounds + entry.clips * (clipSizeNumber || 1);
  const clipSizeLabel =
    clipSize && clipSize !== "0" && clipSize !== "—" && clipSize !== "N/A"
      ? `${clipSize}/clip`
      : undefined;
  const visibleClipSizeLabel = ammoTracking === "clip" ? clipSizeLabel : undefined;

  return (
    <div className="rounded border border-slate-500 bg-slate-800/60 px-2 lg:px-3 py-1.5 lg:py-2 space-y-1.5">
      {/* Name row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={editable ? onSetLoaded : undefined}
            title={entry.loaded ? "Loaded" : "Mark as loaded"}
            className={`w-2 h-2 rounded-full shrink-0 transition ${
              entry.loaded
                ? "bg-green-400"
                : editable
                  ? "bg-slate-600 hover:bg-green-500"
                  : "bg-slate-600"
            }`}
          />
          <span className={`${uiItemName} truncate`}>{displayName}</span>
          {entry.loaded && (
            <span className="text-[10px] lg:text-xs text-green-500 uppercase tracking-wide shrink-0">
              Loaded
            </span>
          )}
        </div>
        {editable && (
          <Button
            size="xs"
            onClick={onRemove}
            className="shrink-0"
          >
            Remove
          </Button>
        )}
      </div>

      {(ammoRef || visibleClipSizeLabel || weightKg !== undefined) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] lg:text-xs">
          {visibleClipSizeLabel && (
            <Chip size="sm" className={`border-slate-700 bg-slate-900/40 ${uiTextMuted}`}>
              {visibleClipSizeLabel}
            </Chip>
          )}
          {ammoRef && (
            <ItemMetaChips value={ammoRef.cost} purchaseAmount={ammoRef.purchaseAmount} availability={ammoRef.availability} size="sm" bare />
          )}
          <Chip size="sm" className={`border-slate-700 bg-slate-900/40 ${uiTextMuted}`}>
            ⚖ {formatWeightForDisplay(formatWeight(weightKg ?? 0))}
          </Chip>
        </div>
      )}

      {hasAmmoInfo && (
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Rules</span>
          <span className={uiInfoModalWrapper}>
            <InfoModal
              title={displayName}
              content={
                <div className="space-y-2">
                  {ammoRef?.description && (
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>{ammoRef.description}</p>
                  )}
                  {isChargePack && (
                    <div className="space-y-1">
                      <p className="text-sm lg:text-base font-semibold text-slate-100">Recharging Power Packs</p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                        {RECHARGING_POWER_PACKS_TEXT}
                      </p>
                    </div>
                  )}
                </div>
              }
            />
          </span>
        </div>
      )}

      {/* Count */}
      <div className="flex items-center gap-4">
        {ammoTracking === "loose" ? (
          <div className="flex items-center gap-1.5">
            <span className={uiTextLabel}>Rounds</span>
            <QuantityControl
              quantity={looseRoundCount}
              editable={editable}
              size="xs"
              onUpdate={onSetLooseRounds}
            />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Clips</span>
              <QuantityControl
                quantity={entry.clips}
                editable={editable}
                size="xs"
                onUpdate={onUpdateClips}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rounds</span>
              <QuantityControl
                quantity={entry.rounds}
                editable={editable}
                size="xs"
                onUpdate={onUpdateRounds}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ammo Picker ──────────────────────────────────────────────────────────────

function AmmoPicker({
  compatibleIds,
  existingNames,
  editable = true,
  onSelect,
  onClose,
}: {
  compatibleIds?: readonly string[];
  existingNames: Set<string>;
  editable?: boolean;
  onSelect: (name: string, referenceId?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");

  const pool = compatibleIds
    ? AMMO_REFERENCE.filter((a) => compatibleIds.includes(a.id))
    : AMMO_REFERENCE;

  const options = query.trim()
    ? pool.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
    : pool;

  return (
    <PickerModal
      title={editable ? "Add Ammo Type" : "View Ammo Types"}
      placeholder="Search ammo…"
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={options.length === 0}
      footer={
        editable ? (
          <div className="space-y-2">
            <p className={`text-xs lg:text-sm ${uiTextMuted}`}>Custom / unlisted ammo</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ammo name…"
                className="flex-1 text-sm lg:text-base bg-slate-800 border border-slate-600 rounded px-2 lg:px-3 py-1 lg:py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <Button
                onClick={() => {
                  if (customName.trim()) {
                    onSelect(customName.trim());
                    onClose();
                  }
                }}
                disabled={!customName.trim() || existingNames.has(customName.trim())}
              >
                Add
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      {options.map((ammo) => (
        <PickerRow
          key={ammo.id}
          interactive={editable}
          onClick={() => {
            onSelect(formatAmmoName(ammo.name), ammo.id);
            onClose();
          }}
          disabled={editable && existingNames.has(formatAmmoName(ammo.name))}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`${uiItemName} group-hover:text-white`}>
              {formatAmmoName(ammo.name)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <ItemMetaChips availability={ammo.availability} value={ammo.cost} purchaseAmount={ammo.purchaseAmount} bare />
            </div>
          </div>
          {ammo.description && (
            <p className={`text-xs lg:text-sm ${uiTextMuted} mt-0.5 line-clamp-2`}>{ammo.description}</p>
          )}
        </PickerRow>
      ))}
    </PickerModal>
  );
}

// ─── Ammo Weight ─────────────────────────────────────────────────────────────
// CR rule: a full clip weighs 10% of the weapon's weight.

function calcEntryWeight(
  weaponWeight: string | undefined,
  clip: string | undefined,
  entry: WeaponAmmoEntry,
  ammoTracking: AmmoTrackingMode
): number {
  const weaponKg = parseFloat(weaponWeight ?? "0");
  if (!weaponKg) return 0;
  const clipSize = parseFloat(clip ?? "1") || 1;
  const clipWeight = weaponKg * 0.1;
  if (ammoTracking === "loose") {
    return (entry.rounds + entry.clips * clipSize) * (clipWeight / clipSize);
  }
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  if (ammoRef?.id === "cr-hot-shot-charge") {
    return entry.clips * clipWeight;
  }
  if (usesUnitAmmoTracking(ammoRef)) {
    return entry.clips * (clipWeight / clipSize);
  }
  return entry.clips * clipWeight + (entry.rounds / clipSize) * clipWeight;
}

function formatWeight(kg: number): string {
  // Drop trailing zeros: 0.700 → "0.7", 0.500 → "0.5", 1.000 → "1"
  return parseFloat(kg.toFixed(2)).toString();
}

// ─── Ranged Card ──────────────────────────────────────────────────────────────

export function RangedCard({
  weapon,
  editable,
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
  onUpdateAmmoEntries,
  onUpdateQuantity,
  grenades,
  onUpdateGrenades,
  archeotechGrenades,
  allowUpgrades = true,
  isEquipped = false,
  onToggleEquip,
  slotsDisabled = false,
  forceExpanded = false,
  integrated = false,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  onRemove: () => void;
  onAddUpgrade: (upgradeId: string) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
  onUpdateAmmoEntries: (entries: WeaponAmmoEntry[]) => void;
  onUpdateQuantity: (qty: number) => void;
  grenades?: GrenadeItem[];
  onUpdateGrenades?: (next: GrenadeItem[]) => void;
  archeotechGrenades?: ArcheotechItem[];
  allowUpgrades?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
  integrated?: boolean;
} & CustomItemLibraryActionProps<"weapon">) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const [showUpgradePicker, setShowUpgradePicker] = useState(false);
  const [showAmmoPicker, setShowAmmoPicker] = useState(false);

  const upgradeIds = weapon.upgrades ?? [];
  const upgradeRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) =>
    upgradeIds.includes(upgrade.id)
  );
  // Resolve reference data first — source of truth for stats, avoids stale stored character data
  const weaponRef = weapon.referenceId
    ? RANGED_WEAPON_REFERENCE.find((r) => r.id === weapon.referenceId)
    : RANGED_WEAPON_REFERENCE.find(
        (r) => r.name === weapon.name && (!weapon.source || r.source === weapon.source)
      );
  const craftsmanship = weapon.craftsmanship ?? "Common";
  const baseSpecialRules =
    craftsmanship === "Common"
      ? (weaponRef?.specialRules ?? weapon.specialRules)
      : (weapon.specialRules ?? weaponRef?.specialRules);
  const baseWeapon = weaponRef ? { ...weapon, specialRules: baseSpecialRules } : weapon;
  const ammoTracking: AmmoTrackingMode = weapon.ammoTracking ?? weaponRef?.ammoTracking ?? "clip";
  const ammoEntries = weapon.ammoEntries ?? [];
  const loadedAmmoEntry = ammoEntries.find((entry) => entry.loaded);
  const loadedAmmoRef = loadedAmmoEntry?.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === loadedAmmoEntry.referenceId)
    : undefined;
  const effective = effectiveRangedStats(baseWeapon, upgradeRefs, loadedAmmoRef);
  const resolvedAmmoType = weaponRef?.ammoType ?? weapon.ammoType;
  const addableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, upgradeIds, resolvedAmmoType);
  const viewableCompatible = getCompatibleUpgrades(weapon.class ?? "", weapon.name, false, [], resolvedAmmoType);
  const visibleCompatible = allowUpgrades
    ? editable
      ? addableCompatible
      : viewableCompatible
    : [];

  const rulesText = effective.specialRules?.trim() ?? "";
  const ruleNamesInLookup = (effective.specialRules ?? "")
    .split(",")
    .map((r) => r.trim().replace(/\s*\(.*?\)/, ""))
    .filter((name) => Boolean(name) && Boolean(WEAPON_SPECIAL_RULES[name]));
  const ammoFamily = ammoFamilyChip(weaponRef?.ammoType ?? weapon.ammoType);
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualities = Boolean(
    rulesText && rulesText !== "—" && rulesText !== "-"
  );
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!rulesDescription;

  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");
  const isGrenadeLauncher =
    weapon.referenceId === "cr-grenade-launcher" || weapon.referenceId === "cr-rpg-launcher";
  const hasAmmo =
    !isThrown && !isGrenadeLauncher && !!(weaponRef?.ammoType || weapon.ammoType || weapon.custom);

  const existingAmmoNames = new Set(ammoEntries.map((e) => formatAmmoName(e.name)));

  // ── Ammo helpers ────────────────────────────────────────────────────────────

  function handleAddAmmo(name: string, referenceId?: string) {
    const isFirst = ammoEntries.length === 0;
    const ammoRef = referenceId
      ? AMMO_REFERENCE.find((ammo) => ammo.id === referenceId)
      : undefined;
    const usesUnitTracking = ammoTracking === "clip" && usesUnitAmmoTracking(ammoRef);
    onUpdateAmmoEntries([
      ...ammoEntries,
      {
        id: crypto.randomUUID(),
        referenceId,
        name,
        clips: usesUnitTracking ? 1 : 0,
        rounds: 0,
        loaded: isFirst,
      },
    ]);
  }

  function handleRemoveAmmo(entryId: string) {
    const next = ammoEntries.filter((e) => e.id !== entryId);
    // If we removed the loaded entry, mark the first remaining one as loaded
    const removedWasLoaded = ammoEntries.find((e) => e.id === entryId)?.loaded ?? false;
    if (removedWasLoaded && next.length > 0) {
      next[0] = { ...next[0], loaded: true };
    }
    onUpdateAmmoEntries(next);
  }

  function handleSetLoaded(entryId: string) {
    onUpdateAmmoEntries(ammoEntries.map((e) => ({ ...e, loaded: e.id === entryId })));
  }

  function handleUpdateEntry(entryId: string, patch: Partial<WeaponAmmoEntry>) {
    onUpdateAmmoEntries(ammoEntries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)));
  }

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
          {(weapon.class || ammoFamily) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {(() => { const c = weaponClassChip(weapon.class); return c ? (
                <Chip size="sm" className={c.active}>{c.label}</Chip>
              ) : null; })()}
              {ammoFamily && (
                <Chip size="sm" className={ammoFamily.className}>
                  {ammoFamily.label}
                </Chip>
              )}
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

          {/* Stats grid */}
          <div className="flex flex-wrap gap-1.5">
            {effective.range && <StatChip label="Range" value={effective.range} />}
            {weapon.rof && <StatChip label="RoF" value={weapon.rof} />}
            {effective.damage && (
              <StatChip label="Damage" value={effective.damage.replace(/\s*[IREX]$/i, "").trim()} />
            )}
            {effective.damage && <DamageTypeChip damage={effective.damage} />}
            {effective.pen && <StatChip label="Pen" value={effective.pen} />}
            {effective.clip && <StatChip label="Clip" value={effective.clip} />}
            {weapon.rld && <StatChip label="Reload" value={weapon.rld} />}
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
                  content={rangedCraftsmanshipDescription(craftsmanship)}
                />
              </span>
            </div>
          </div>

          {/* Weight / Value / Availability / Source */}
          <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
            <ItemMetaChips
              weight={effective.weight}
              value={weapon.value}
              availability={weapon.availability}
              source={weapon.source}
              bare
            />
          </div>

          {/* Thrown weapon: quantity counter */}
          {isThrown && (
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
              <span className={uiTextLabel}>{isThrown ? "Quantity" : "Rounds"}</span>
              <QuantityControl
                quantity={weapon.quantity ?? 0}
                editable={editable}
                size="sm"
                onUpdate={onUpdateQuantity}
              />
            </div>
          )}

          {/* Grenade launcher: ammo drawn from grenade inventory */}
          {isGrenadeLauncher && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <span className={uiTextLabel}>Grenades</span>
              {(grenades ?? []).filter((g) => g.type !== "Mine").length === 0 &&
              (archeotechGrenades ?? []).length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>
                  No grenades — add via the Grenades & Mines section below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {(grenades ?? [])
                    .filter((g) => g.type !== "Mine")
                    .map((g) => (
                      <div
                        key={g.id}
                        className="rounded bg-slate-800/60 px-2.5 lg:px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2"
                      >
                        <span className={`${uiItemName} truncate`}>{g.name}</span>
                        <QuantityControl
                          quantity={g.quantity}
                          editable={editable}
                          size="sm"
                          onUpdate={(qty) =>
                            onUpdateGrenades?.(
                              (grenades ?? []).map((x) =>
                                x.id === g.id ? { ...x, quantity: qty } : x
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  {(archeotechGrenades ?? []).map((g) => (
                    <div
                      key={g.id}
                      className="rounded bg-amber-900/20 border border-amber-700/30 px-2.5 lg:px-3 py-2 lg:py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className={`${uiItemName} truncate`}>{g.name}</span>
                      <Chip size="sm" className={colourArcheotech}>
                        Archeotech
                      </Chip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular weapon: ammo entries */}
          {hasAmmo && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className={uiTextLabel}>Ammo</span>
                <Button
                  size="xs"
                  onClick={() => setShowAmmoPicker(true)}
                >
                  {editable ? "+ Add" : "View"}
                </Button>
              </div>

              {ammoEntries.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No ammo tracked</p>
              ) : (
                <div className="space-y-1.5">
                  {ammoEntries.map((entry) => (
                    <AmmoEntryRow
                      key={entry.id}
                      entry={entry}
                      editable={editable}
                      clipSize={effective.clip}
                      ammoTracking={ammoTracking}
                      weightKg={calcEntryWeight(effective.weight, effective.clip, entry, ammoTracking)}
                      onSetLoaded={() => handleSetLoaded(entry.id)}
                      onRemove={() => handleRemoveAmmo(entry.id)}
                      onUpdateClips={(qty) => handleUpdateEntry(entry.id, { clips: qty })}
                      onUpdateRounds={(qty) => handleUpdateEntry(entry.id, { rounds: qty })}
                      onSetLooseRounds={(qty) => handleUpdateEntry(entry.id, { clips: 0, rounds: qty })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upgrades */}
          {(upgradeRefs.length > 0 || visibleCompatible.length > 0) && (
            <div className="border-t border-slate-800 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={uiTextLabel}>Upgrades</span>
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

          {showAmmoPicker && (
            <AmmoPicker
              compatibleIds={weaponRef?.compatibleAmmoIds ?? compatibleAmmoIdsForAmmoType(weapon.ammoType)}
              existingNames={existingAmmoNames}
              editable={editable}
              onSelect={handleAddAmmo}
              onClose={() => setShowAmmoPicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
