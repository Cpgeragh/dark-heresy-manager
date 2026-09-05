// src/pages/CharacterSheet/weapons/RangedCard.tsx
// RangedCard — see RangedPicker.tsx and CustomRangedForm.tsx for the weapon picker and custom-weapon form.

import { useState, useEffect } from "react";
import type {
  RangedWeapon,
  WeaponAmmoEntry,
  WeaponMagazineSlot,
  GrenadeItem,
  ArcheotechItem,
} from "../../../types/Character";
import {
  RANGED_WEAPON_REFERENCE,
  resolveRangedWeaponReference,
} from "../../../data/reference/weaponReference";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import {
  AMMO_REFERENCE,
  ammoCapacityForWeapon,
  formatAmmoName,
  isSoldAsFullClip,
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
} from "../../../ui/styles/editableStyles";
import { uiExpandButton, uiPickerPressFeedback } from "../../../ui/styles/buttonStyles";
import {
  colourArcheotech,
  colourButtonOutlineCyan,
  colourButtonOutlineOrange,
  colourPink,
  colourViolet,
} from "../../../ui/styles/colourTokens";
import { Button } from "../../../ui/buttons/Button";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { formatWeightForDisplay } from "../../../ui/format/weightFormat";
import { InfoModal } from "../../../components/InfoModal";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";
import { StatChip } from "../../../ui/chips/StatChip";
import {
  DamageTypeChip,
  SpecialRulesContent,
  UpgradePicker,
  UpgradeCard,
  EquipToggle,
} from "./weaponShared";
import {
  effectiveRangedStats,
  getCompatibleUpgrades,
  ammoFamilyChip,
  compatibleAmmoIdsWithIH,
  weaponClassChip,
  compatibleAmmoIdsForAmmoType,
  rangedCraftsmanshipDescription,
  type AmmoTrackingMode,
  addSpecialRule,
  rangedRulesForCraftsmanship,
  removeSpecialRule,
  calcEntryWeight,
} from "./weaponHelpers";
import { computeMeleeTotalDamage, getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import { CONCEALED_WEAPON_BIONIC_RULES } from "./concealedWeaponBionicRules";
import { AmmoEntryRow } from "./AmmoEntryRow";
import { AmmoPicker } from "./AmmoPicker";
import { formatAmmoWeight } from "./formatAmmoWeight";

// ─── Ranged Card ──────────────────────────────────────────────────────────────

export function RangedCard({
  weapon,
  editable,
  strengthBonus = 0,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onSelect,
  onRemove,
  onAddUpgrade,
  onRemoveUpgrade,
  onUpdateAmmoEntries,
  onUpdateLoadedAmmoByProfile,
  onUpdateMagazineSlots,
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
  pickerMode = false,
}: {
  weapon: RangedWeapon;
  editable: boolean;
  strengthBonus?: number;
  onRemove: () => void;
  onAddUpgrade: (upgradeId: string) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
  onUpdateAmmoEntries: (entries: WeaponAmmoEntry[]) => void;
  onUpdateLoadedAmmoByProfile?: (profile: string, entryId: string) => void;
  onUpdateMagazineSlots?: (slots: WeaponMagazineSlot[], activeSlotId?: string) => void;
  onUpdateQuantity: (qty: number) => void;
  grenades?: GrenadeItem[];
  onUpdateGrenades?: (next: GrenadeItem[]) => void;
  archeotechGrenades?: ArcheotechItem[];
  allowUpgrades?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  onSelect?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
  integrated?: boolean;
  pickerMode?: boolean;
} & CustomItemLibraryActionProps<"weapon">) {
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const [showUpgradePicker, setShowUpgradePicker] = useState(false);
  const [showAmmoPicker, setShowAmmoPicker] = useState(false);
  const [magazineSlotPickerId, setMagazineSlotPickerId] = useState<string | null>(null);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  const [activeMeleeProfileIndex, setActiveMeleeProfileIndex] = useState<number | null>(null);

  const upgradeIds = weapon.upgrades ?? [];
  const upgradeRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) => upgradeIds.includes(upgrade.id));
  // Resolve reference data first — source of truth for stats, avoids stale stored character data
  const weaponRef = weapon.referenceId
    ? resolveRangedWeaponReference(weapon.referenceId)
    : RANGED_WEAPON_REFERENCE.find(
        (r) => r.name === weapon.name && (!weapon.source || r.source === weapon.source)
      );
  const alternateProfiles = weaponRef?.alternateProfiles ?? [];
  const alternateMeleeProfiles = weaponRef?.alternateMeleeProfiles ?? [];
  const activeMeleeProfile =
    activeMeleeProfileIndex === null ? undefined : alternateMeleeProfiles[activeMeleeProfileIndex];
  const isMeleeProfile = !!activeMeleeProfile;
  const activeProfile =
    !isMeleeProfile && activeProfileIndex > 0
      ? alternateProfiles[activeProfileIndex - 1]
      : undefined;
  const activeProfileKey = isMeleeProfile
    ? activeMeleeProfile.label
    : (activeProfile?.label ?? "Primary");
  const concealedBionicQuality = weapon.concealedBionic?.craftsmanship;
  const craftsmanship = concealedBionicQuality ?? weapon.craftsmanship ?? "Common";
  const effectiveCraftsmanship = concealedBionicQuality === "Good" ? "Best" : craftsmanship;
  let baseSpecialRules = rangedRulesForCraftsmanship(
    weaponRef?.specialRules ?? weapon.specialRules ?? "—",
    effectiveCraftsmanship
  );
  if (concealedBionicQuality === "Poor") {
    baseSpecialRules = addSpecialRule(baseSpecialRules, "Unreliable");
  } else if (concealedBionicQuality === "Common" || concealedBionicQuality === "Good") {
    baseSpecialRules = removeSpecialRule(baseSpecialRules, "Unreliable");
  }
  const baseWeapon = activeProfile
    ? {
        ...weapon,
        range: activeProfile.range,
        rof: activeProfile.rof,
        damage: activeProfile.damage,
        pen: String(activeProfile.pen),
        clip: String(activeProfile.clip),
        rld: activeProfile.reload,
        specialRules: activeProfile.specialRules,
      }
    : { ...weapon, specialRules: baseSpecialRules };
  const magazineSlotCount = activeProfile ? 0 : (weaponRef?.magazineSlots ?? 0);
  const usesMagazineSlots = magazineSlotCount > 0;
  const magazineCapacity = Math.max(0, parseFloat(baseWeapon.clip ?? "0") || 0);
  const magazineSlots = usesMagazineSlots
    ? Array.from(
        { length: magazineSlotCount },
        (_, index) =>
          weapon.magazineSlots?.find((slot) => slot.id === `magazine-${index + 1}`) ?? {
            id: `magazine-${index + 1}`,
            rounds: 0,
          }
      )
    : [];
  const activeMagazineSlot =
    magazineSlots.find((slot) => slot.id === weapon.activeMagazineSlotId) ??
    magazineSlots.find((slot) => slot.referenceId);
  const ammoTracking: AmmoTrackingMode = weapon.ammoTracking ?? weaponRef?.ammoTracking ?? "clip";
  const resolvedAmmoType = activeProfile?.ammoType ?? weaponRef?.ammoType ?? weapon.ammoType;
  const profileCompatibleAmmoIds = compatibleAmmoIdsWithIH(
    activeProfile?.ammoType === "Shells"
      ? ["cr-shells", "cr-inferno-shells", "dh-cryptus-shotgun-shells"]
      : (weaponRef?.compatibleAmmoIds ?? compatibleAmmoIdsForAmmoType(weapon.ammoType)),
    resolvedAmmoType,
    weaponRef?.class ?? weapon.class
  );
  const isMultiProfileWeapon = alternateProfiles.length > 0;
  const ammoEntries = weapon.ammoEntries ?? [];
  const visibleAmmoEntries = ammoEntries.filter(
    (entry) =>
      (!isMultiProfileWeapon || (entry.profile ?? "Primary") === activeProfileKey) &&
      (!profileCompatibleAmmoIds ||
        (entry.referenceId != null && profileCompatibleAmmoIds.includes(entry.referenceId)))
  );
  const loadedAmmoEntry =
    visibleAmmoEntries.find(
      (entry) => entry.id === weapon.loadedAmmoByProfile?.[activeProfileKey]
    ) ?? visibleAmmoEntries.find((entry) => entry.loaded);
  const loadedAmmoReferenceId = usesMagazineSlots
    ? activeMagazineSlot?.referenceId
    : loadedAmmoEntry?.referenceId;
  const loadedAmmoRefCandidate = loadedAmmoReferenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === loadedAmmoReferenceId)
    : undefined;
  const loadedAmmoRef =
    loadedAmmoRefCandidate &&
    (!profileCompatibleAmmoIds || profileCompatibleAmmoIds.includes(loadedAmmoRefCandidate.id))
      ? loadedAmmoRefCandidate
      : undefined;
  const baseEffective = effectiveRangedStats(baseWeapon, upgradeRefs, loadedAmmoRef);
  const loadedAmmoCapacity = ammoCapacityForWeapon(
    loadedAmmoRef,
    weapon.referenceId,
    baseEffective.clip
  );
  const effective = {
    ...baseEffective,
    clip: loadedAmmoCapacity ?? baseEffective.clip,
  };
  const addableCompatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    false,
    upgradeIds,
    resolvedAmmoType,
    ammoTracking
  );
  const viewableCompatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    false,
    [],
    resolvedAmmoType,
    ammoTracking
  );
  const visibleCompatible = allowUpgrades
    ? editable
      ? addableCompatible
      : viewableCompatible
    : [];

  const rulesText = (activeMeleeProfile?.specialRules ?? effective.specialRules ?? "").trim();
  const ruleNamesInLookup = getKnownSpecialRuleNames(rulesText);
  const activeAmmoFamily = isMeleeProfile ? undefined : ammoFamilyChip(resolvedAmmoType);
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualities = Boolean(rulesText && rulesText !== "—" && rulesText !== "-");
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!weapon.concealedBionic;
  const concealedBionicEffect =
    concealedBionicQuality === "Poor"
      ? "Adds the Unreliable Quality."
      : concealedBionicQuality === "Good"
        ? "It never jams or overheats; a roll that would cause either is a miss instead."
        : concealedBionicQuality === "Common"
          ? "No additional weapon effect."
          : undefined;

  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");
  const isGrenadeLauncher =
    weapon.referenceId === "cr-grenade-launcher" || weapon.referenceId === "cr-rpg-launcher";
  const hasAmmo =
    !isMeleeProfile &&
    !isThrown &&
    !isGrenadeLauncher &&
    !!(weaponRef?.ammoType || weapon.ammoType || weapon.custom);

  const existingAmmoNames = new Set(visibleAmmoEntries.map((entry) => formatAmmoName(entry.name)));

  // ── Ammo helpers ────────────────────────────────────────────────────────────

  function handleAddAmmo(name: string, referenceId?: string) {
    const isFirst = visibleAmmoEntries.length === 0;
    const ammoRef = referenceId
      ? AMMO_REFERENCE.find((ammo) => ammo.id === referenceId)
      : undefined;
    const entryAmmoTracking: AmmoTrackingMode =
      isSoldAsFullClip(ammoRef) || ammoRef?.isBackpackFeed ? "clip" : ammoTracking;
    const usesUnitTracking = entryAmmoTracking === "clip" && usesUnitAmmoTracking(ammoRef);
    onUpdateAmmoEntries([
      ...ammoEntries,
      {
        id: crypto.randomUUID(),
        referenceId,
        name,
        profile: isMultiProfileWeapon ? activeProfileKey : undefined,
        clips: usesUnitTracking || isSoldAsFullClip(ammoRef) || ammoRef?.isBackpackFeed ? 1 : 0,
        rounds: 0,
        loaded: isFirst,
      },
    ]);
  }

  function handleRemoveAmmo(entryId: string) {
    const next = ammoEntries.filter((e) => e.id !== entryId);
    const removedWasLoaded =
      entryId === weapon.loadedAmmoByProfile?.[activeProfileKey] ||
      (!weapon.loadedAmmoByProfile?.[activeProfileKey] &&
        ammoEntries.find((entry) => entry.id === entryId)?.loaded);
    const replacement = next.find(
      (entry) =>
        (!isMultiProfileWeapon || (entry.profile ?? "Primary") === activeProfileKey) &&
        (!profileCompatibleAmmoIds ||
          (entry.referenceId != null && profileCompatibleAmmoIds.includes(entry.referenceId)))
    );
    if (removedWasLoaded && replacement) {
      const replacementIndex = next.findIndex((entry) => entry.id === replacement.id);
      next[replacementIndex] = { ...replacement, loaded: true };
    }
    onUpdateAmmoEntries(next);
  }

  function handleSetLoaded(entryId: string) {
    if (onUpdateLoadedAmmoByProfile) {
      onUpdateLoadedAmmoByProfile(activeProfileKey, entryId);
      return;
    }
    onUpdateAmmoEntries(ammoEntries.map((e) => ({ ...e, loaded: e.id === entryId })));
  }

  function handleUpdateEntry(entryId: string, patch: Partial<WeaponAmmoEntry>) {
    onUpdateAmmoEntries(ammoEntries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)));
  }

  function handleSelectMagazineAmmo(slotId: string, name: string, referenceId?: string) {
    const next = magazineSlots.map((slot) =>
      slot.id === slotId ? { ...slot, name, referenceId, rounds: magazineCapacity } : slot
    );
    onUpdateMagazineSlots?.(next, weapon.activeMagazineSlotId ?? slotId);
  }

  function handleSelectActiveMagazine(slotId: string) {
    onUpdateMagazineSlots?.(magazineSlots, slotId);
  }

  function handleUpdateMagazineRounds(slotId: string, rounds: number) {
    onUpdateMagazineSlots?.(
      magazineSlots.map((slot) =>
        slot.id === slotId
          ? { ...slot, rounds: Math.max(0, Math.min(magazineCapacity, rounds)) }
          : slot
      ),
      activeMagazineSlot?.id
    );
  }

  return (
    <div
      className={`${weapon.concealedBionic ? "border border-pink-500/60 bg-pink-900/10" : uiSectionShell} overflow-hidden`}
    >
      {/* Header — always visible */}
      <div className="relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4">
        {!forceExpanded && (
          <button
            type="button"
            onClick={onSelect ?? (() => setExpanded((e) => !e))}
            aria-expanded={onSelect ? undefined : expanded}
            aria-label={
              onSelect
                ? `Select ${weapon.name}`
                : `${expanded ? "Collapse" : "Expand"} ${weapon.name} details`
            }
            className={`absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${uiPickerPressFeedback(pickerMode && Boolean(onSelect))}`}
          />
        )}
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={uiCardTitle}>{weapon.name}</p>
            {rulesDescription && (
              <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                <InfoModal
                  title={weapon.name}
                  content={
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                      {rulesDescription}
                    </p>
                  }
                />
              </span>
            )}
            {libraryItem && <StatusBadge status={libraryItem.status} />}
            {integrated && (
              <Chip size="sm" className={colourViolet}>
                Integrated
              </Chip>
            )}
          </div>
          {(weapon.class || weapon.concealedBionic) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {weapon.concealedBionic && (
                <Chip size="sm" className={colourPink}>
                  Concealed Bionic
                </Chip>
              )}
              {weapon.concealedBionic && (
                <Chip size="sm" className={colourPink}>
                  Cybernetic
                </Chip>
              )}
              {(() => {
                const c = weaponClassChip(weapon.class);
                return c ? (
                  <Chip size="sm" className={c.active}>
                    {c.label}
                  </Chip>
                ) : null;
              })()}
            </div>
          )}
        </div>
        <div className="relative pointer-events-none flex items-center gap-2 shrink-0">
          {onToggleEquip && (
            <EquipToggle
              equipped={isEquipped}
              disabled={slotsDisabled}
              editable={editable}
              onChange={onToggleEquip}
            />
          )}
          {!forceExpanded &&
            (onSelect ? (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                aria-label={`${expanded ? "Collapse" : "Expand"} ${weapon.name} details`}
                className="relative z-10 pointer-events-auto p-1 -m-1"
              >
                <ExpandChevron expanded={expanded} />
              </button>
            ) : (
              <ExpandChevron expanded={expanded} />
            ))}
        </div>
      </div>

      {(expanded || forceExpanded) && (
        <div className="px-3 pb-3 lg:px-4 lg:pb-4 space-y-3">
          {editable && !integrated && (
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

          {(alternateProfiles.length > 0 || alternateMeleeProfiles.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveProfileIndex(0);
                  setActiveMeleeProfileIndex(null);
                }}
                className={`rounded border px-2 py-1 text-xs lg:text-sm ${!isMeleeProfile && activeProfileIndex === 0 ? "border-sky-400 bg-sky-950/60 text-sky-200" : "border-slate-600 text-slate-300"}`}
              >
                {alternateMeleeProfiles.length > 0 ? "Ranged" : "Primary"}
              </button>
              {alternateProfiles.map((profile, index) => (
                <button
                  key={profile.label}
                  type="button"
                  onClick={() => {
                    setActiveProfileIndex(index + 1);
                    setActiveMeleeProfileIndex(null);
                  }}
                  className={`rounded border px-2 py-1 text-xs lg:text-sm ${!isMeleeProfile && activeProfileIndex === index + 1 ? "border-sky-400 bg-sky-950/60 text-sky-200" : "border-slate-600 text-slate-300"}`}
                >
                  {profile.label}
                </button>
              ))}
              {alternateMeleeProfiles.map((profile, index) => (
                <button
                  key={profile.label}
                  type="button"
                  onClick={() => {
                    setActiveProfileIndex(0);
                    setActiveMeleeProfileIndex(index);
                  }}
                  className={`rounded border px-2 py-1 text-xs lg:text-sm ${activeMeleeProfileIndex === index ? "border-sky-400 bg-sky-950/60 text-sky-200" : "border-slate-600 text-slate-300"}`}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          )}

          {/* Stats grid */}
          {isMeleeProfile && activeMeleeProfile ? (
            <div className="flex flex-wrap gap-1.5">
              <StatChip
                label="Damage"
                value={activeMeleeProfile.damage.replace(/\s*[IREX]$/i, "").trim()}
              />
              <DamageTypeChip damage={activeMeleeProfile.damage} />
              <StatChip label="Pen" value={activeMeleeProfile.pen} />
              <StatChip label="SB" value={`+${strengthBonus}`} />
              <StatChip
                label="Total"
                value={computeMeleeTotalDamage(activeMeleeProfile.damage, strengthBonus)}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {effective.range && <StatChip label="Range" value={effective.range} />}
              {baseWeapon.rof && <StatChip label="RoF" value={baseWeapon.rof} />}
              {effective.damage && (
                <StatChip
                  label="Damage"
                  value={effective.damage.replace(/\s*[IREX]$/i, "").trim()}
                />
              )}
              {effective.damage && <DamageTypeChip damage={effective.damage} />}
              {effective.pen && <StatChip label="Pen" value={effective.pen} />}
              {effective.clip && <StatChip label="Clip" value={effective.clip} />}
              {baseWeapon.rld && <StatChip label="Reload" value={baseWeapon.rld} />}
            </div>
          )}

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
                    content={<SpecialRulesContent rules={rulesText} />}
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
                    content={
                      <div className="space-y-3">
                        <p className="text-sm lg:text-base font-semibold text-amber-300">
                          Concealed Weapon Bionic
                        </p>
                        {CONCEALED_WEAPON_BIONIC_RULES.map((rule) => (
                          <p
                            key={rule}
                            className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}
                          >
                            {rule}
                          </p>
                        ))}
                      </div>
                    }
                  />
                </span>
              ) : (
                <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Craftsmanship</span>
              <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={`${craftsmanship} ${weapon.concealedBionic ? "Concealed Weapon" : "Weapon"}`}
                  content={
                    concealedBionicEffect ? (
                      <div className="space-y-3">
                        <div>
                          <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                            {concealedBionicEffect}
                          </p>
                        </div>
                      </div>
                    ) : (
                      rangedCraftsmanshipDescription(craftsmanship)
                    )
                  }
                />
              </span>
            </div>
          </div>

          {/* Weight / Value / Availability / Source */}
          <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-2 mt-1">
            <ItemMetaChips
              weight={effective.weight}
              value={effective.value}
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

          {usesMagazineSlots && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <span className={uiTextLabel}>Magazines</span>
              {activeAmmoFamily && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip size="sm" className={activeAmmoFamily.className}>
                    {activeAmmoFamily.label}
                  </Chip>
                </div>
              )}
              <div className="space-y-1.5">
                {magazineSlots.map((slot, index) => {
                  const ammoRef = slot.referenceId
                    ? AMMO_REFERENCE.find((ammo) => ammo.id === slot.referenceId)
                    : undefined;
                  const isActive = slot.id === activeMagazineSlot?.id;
                  const displayName = ammoRef ? formatAmmoName(ammoRef.name) : slot.name;
                  const magazineWeight =
                    magazineCapacity > 0
                      ? (parseFloat(effective.weight ?? "0") || 0) *
                        0.1 *
                        (slot.rounds / magazineCapacity)
                      : 0;
                  return (
                    <div
                      key={slot.id}
                      className="rounded border border-slate-500 bg-slate-800/60 px-2 lg:px-3 py-2 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className={uiTextLabel}>Magazine {index + 1}</span>
                          {displayName ? (
                            <span className={uiItemName}>{displayName}</span>
                          ) : (
                            <span className={uiTextPlaceholder}>No ammunition selected</span>
                          )}
                          {ammoRef?.description && (
                            <span className={uiInfoModalWrapper}>
                              <InfoModal
                                title={displayName ?? `Magazine ${index + 1}`}
                                content={
                                  <p
                                    className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}
                                  >
                                    {ammoRef.description}
                                  </p>
                                }
                              />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isActive ? (
                            <span className="inline-flex items-center justify-center rounded-lg border border-green-500 px-2 py-0.5 text-xs font-semibold text-green-400 lg:text-sm shrink-0">
                              Loaded
                            </span>
                          ) : (
                            editable &&
                            slot.referenceId && (
                              <Button
                                size="xs"
                                variant="ghost"
                                className={colourButtonOutlineOrange}
                                onClick={() => handleSelectActiveMagazine(slot.id)}
                              >
                                Select
                              </Button>
                            )
                          )}
                          {editable && (
                            <Button
                              size="xs"
                              variant="ghost"
                              className={colourButtonOutlineCyan}
                              onClick={() => setMagazineSlotPickerId(slot.id)}
                            >
                              {displayName ? "Change" : "Select ammo"}
                            </Button>
                          )}
                        </div>
                      </div>
                      {(ammoRef || magazineCapacity > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] lg:text-xs">
                          {ammoRef && (
                            <ItemMetaChips
                              value={ammoRef.cost}
                              purchaseAmount={ammoRef.purchaseAmount}
                              availability={ammoRef.availability}
                              size="sm"
                              bare
                            />
                          )}
                          <Chip
                            size="sm"
                            className={`border-slate-700 bg-slate-900/40 ${uiTextMuted}`}
                          >
                            ⚖ {formatWeightForDisplay(formatAmmoWeight(magazineWeight))}
                          </Chip>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={uiTextLabel}>Rounds</span>
                        <QuantityControl
                          quantity={slot.rounds}
                          editable={editable && Boolean(slot.referenceId)}
                          size="xs"
                          onUpdate={(rounds) => handleUpdateMagazineRounds(slot.id, rounds)}
                        />
                        <span className={uiTextMuted}>/ {magazineCapacity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular weapon: ammo entries */}
          {hasAmmo && !usesMagazineSlots && (
            <div className="border-t border-slate-800 pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className={uiTextLabel}>Ammo</span>
                {editable ? (
                  <AddButton label="Add ammo" size="sm" onClick={() => setShowAmmoPicker(true)} />
                ) : (
                  <ViewButton label="View ammo" onClick={() => setShowAmmoPicker(true)} />
                )}
              </div>

              {activeAmmoFamily && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip size="sm" className={activeAmmoFamily.className}>
                    {activeAmmoFamily.label}
                  </Chip>
                </div>
              )}

              {visibleAmmoEntries.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No ammo tracked</p>
              ) : (
                <div className="space-y-1.5">
                  {visibleAmmoEntries.map((entry) => {
                    const entryAmmoRef = entry.referenceId
                      ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
                      : undefined;
                    const entryAmmoTracking: AmmoTrackingMode =
                      isSoldAsFullClip(entryAmmoRef) || entryAmmoRef?.isBackpackFeed
                        ? "clip"
                        : ammoTracking;
                    const entryCapacity = ammoCapacityForWeapon(
                      entryAmmoRef,
                      weapon.referenceId,
                      effective.clip
                    );
                    return (
                      <AmmoEntryRow
                        key={entry.id}
                        entry={entry}
                        isLoaded={
                          entry.id === weapon.loadedAmmoByProfile?.[activeProfileKey] ||
                          (!weapon.loadedAmmoByProfile?.[activeProfileKey] && entry.loaded)
                        }
                        editable={editable}
                        clipSize={entryCapacity}
                        ammoTracking={entryAmmoTracking}
                        weightKg={calcEntryWeight(
                          effective.weight,
                          effective.clip,
                          entry,
                          entryAmmoTracking,
                          entryCapacity
                        )}
                        onSetLoaded={() => handleSetLoaded(entry.id)}
                        onRemove={() => handleRemoveAmmo(entry.id)}
                        onUpdateClips={(qty) => handleUpdateEntry(entry.id, { clips: qty })}
                        onUpdateRounds={(qty) => handleUpdateEntry(entry.id, { rounds: qty })}
                        onSetLooseRounds={(qty) =>
                          handleUpdateEntry(entry.id, { clips: 0, rounds: qty })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Upgrades */}
          {(upgradeRefs.length > 0 || visibleCompatible.length > 0) && (
            <div className="border-t border-slate-800 pt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={uiTextLabel}>Upgrades</span>
                {(editable
                  ? visibleCompatible.length > 0
                  : upgradeRefs.length > 0 || visibleCompatible.length > 0) &&
                  (editable ? (
                    <AddButton
                      label="Add upgrade"
                      size="sm"
                      onClick={() => setShowUpgradePicker(true)}
                    />
                  ) : (
                    <ViewButton label="View upgrades" onClick={() => setShowUpgradePicker(true)} />
                  ))}
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
              }}
              onClose={() => setShowUpgradePicker(false)}
            />
          )}

          {showAmmoPicker && (
            <AmmoPicker
              compatibleIds={profileCompatibleAmmoIds}
              existingNames={existingAmmoNames}
              editable={editable}
              closeOnSelect={false}
              onSelect={handleAddAmmo}
              onClose={() => setShowAmmoPicker(false)}
            />
          )}

          {magazineSlotPickerId && (
            <AmmoPicker
              title="Select Magazine Ammo"
              compatibleIds={profileCompatibleAmmoIds}
              existingNames={new Set()}
              allowDuplicates
              editable={editable}
              onSelect={(name, referenceId) =>
                handleSelectMagazineAmmo(magazineSlotPickerId, name, referenceId)
              }
              onClose={() => setMagazineSlotPickerId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
