// src/pages/CharacterSheet/weapons/MeleeCard.tsx
// MeleeCard: see MeleePicker.tsx and CustomMeleeForm.tsx for the weapon picker and custom-weapon form.

import { useState, useEffect } from "react";
import type { PatchOptions } from "../../../hooks/useOptimisticOverlay";
import type { MeleeWeapon, WeaponAmmoEntry } from "../../../types/Character";
import { resolveMeleeWeaponReference } from "../../../data/reference/weaponReference";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { WEAPON_UPGRADE_REFERENCE } from "../../../data/reference/weaponUpgradeReference";
import {
  AMMO_REFERENCE,
  isSoldAsFullClip,
  usesUnitAmmoTracking,
} from "../../../data/reference/ammoReference";
import {
  uiNoticeBox,
  uiSectionShell,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiInfoModalWrapper,
  uiCardTitleHover,
  uiRuleName,
  uiTextDescription,
} from "../../../ui/styles/editableStyles";
import { CardOverlayButton } from "../../../ui/buttons/CardOverlayButton";
import { ExpandButton } from "../../../ui/buttons/ExpandButton";
import { uiCardTapHeader, uiExpandButton } from "../../../ui/styles/buttonStyles";
import {
  colourNoticePink,
  colourToggleSelectedSky,
  colourTextPrimary,
  colourDivider,
} from "../../../ui/styles/colourTokens";
import { Button } from "../../../ui/buttons/Button";
import { ToggleButton } from "../../../ui/buttons/ToggleButton";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
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
import { computeMeleeTotalDamage, getKnownSpecialRuleNames } from "./weaponDamageFormatting";
import {
  addSpecialRule,
  ammoFamilyChip,
  calcEntryWeight,
  effectiveMeleeStats,
  getCompatibleUpgrades,
  meleeClassChips,
  meleeCraftsmanshipDescription,
  meleeDamageForCraftsmanship,
  removeSpecialRule,
  weaponTypeChip,
} from "./weaponHelpers";
import { CONCEALED_WEAPON_BIONIC_RULES } from "./concealedWeaponBionicRules";
import { AmmoEntryRow } from "./AmmoEntryRow";
import { AmmoPicker } from "./AmmoPicker";
import { recordComponentRender } from "../../../performance/performanceMetrics";

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
  onSelect,
  onRemove,
  onAddUpgrade,
  onRemoveUpgrade,
  onUpdateQuantity,
  onUpdateAlternateRangedAmmoEntries,
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
  onRemove: () => void;
  onAddUpgrade: (upgradeId: string) => void;
  onRemoveUpgrade: (upgradeId: string) => void;
  onUpdateQuantity: (qty: number) => void;
  onUpdateAlternateRangedAmmoEntries?: (
    entries: WeaponAmmoEntry[],
    loadedAmmoId?: string,
    options?: PatchOptions
  ) => void;
  allowUpgrades?: boolean;
  isEquipped?: boolean;
  onToggleEquip?: () => void;
  onSelect?: () => void;
  slotsDisabled?: boolean;
  forceExpanded?: boolean;
  integrated?: boolean;
} & CustomItemLibraryActionProps<"weapon">) {
  recordComponentRender("MeleeCard");
  const [expanded, setExpanded] = useState(isEquipped);
  useEffect(() => {
    setExpanded(isEquipped);
  }, [isEquipped]);

  const [showUpgradePicker, setShowUpgradePicker] = useState(false);
  const [activeProfile, setActiveProfile] = useState("Melee");
  const [showPistolAmmoPicker, setShowPistolAmmoPicker] = useState(false);

  const upgradeIds = weapon.upgrades ?? [];
  const upgradeRefs = WEAPON_UPGRADE_REFERENCE.filter((upgrade) => upgradeIds.includes(upgrade.id));
  const weaponRef = weapon.referenceId
    ? resolveMeleeWeaponReference(weapon.referenceId)
    : undefined;
  const concealedBionicQuality = weapon.concealedBionic?.craftsmanship;
  // Prefer reference specialRules as source of truth; avoids stale stored character data
  let baseSpecialRules = weaponRef?.specialRules ?? weapon.specialRules ?? "—";
  if (concealedBionicQuality === "Poor") {
    baseSpecialRules = addSpecialRule(baseSpecialRules, "Unreliable");
  } else if (concealedBionicQuality === "Common" || concealedBionicQuality === "Good") {
    baseSpecialRules = removeSpecialRule(baseSpecialRules, "Unreliable");
  }
  const baseWeapon = { ...weapon, specialRules: baseSpecialRules };
  const effective = effectiveMeleeStats(baseWeapon, upgradeRefs);
  const effectiveDamage =
    concealedBionicQuality === "Good"
      ? meleeDamageForCraftsmanship(weapon.damage ?? "", "Best")
      : (weapon.damage ?? "");
  const pistolProfile = weaponRef?.alternateRangedProfile;
  const alternateMeleeProfiles = weaponRef?.alternateMeleeProfiles ?? [];
  const activeMeleeProfile = alternateMeleeProfiles.find(
    (profile) => profile.label === activeProfile
  );
  const isPistolProfile = activeProfile === "Pistol" && !!pistolProfile;
  const displayedMeleeDamage = activeMeleeProfile?.damage ?? effectiveDamage;
  const displayedMeleePen = activeMeleeProfile?.pen ?? effective.pen;
  const displayedMeleeRules = activeMeleeProfile?.specialRules;
  const pistolAmmoEntries =
    weapon.alternateRangedAmmoEntries ??
    (weapon.alternateRangedAmmoReferenceId
      ? [
          {
            id: "legacy-alternate-ammo",
            referenceId: weapon.alternateRangedAmmoReferenceId,
            name:
              AMMO_REFERENCE.find((ammo) => ammo.id === weapon.alternateRangedAmmoReferenceId)
                ?.name ?? "Ammo",
            clips: 1,
            rounds: 0,
            loaded: true,
          },
        ]
      : []);
  const loadedPistolAmmoEntry =
    pistolAmmoEntries.find((entry) => entry.id === weapon.loadedAlternateRangedAmmoId) ??
    pistolAmmoEntries.find((entry) => entry.loaded);
  const pistolAmmoRef = loadedPistolAmmoEntry?.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === loadedPistolAmmoEntry.referenceId)
    : undefined;
  const pistolAmmoFamily = ammoFamilyChip(pistolProfile?.ammoType);
  let pistolRules = pistolProfile?.specialRules ?? "—";
  if (pistolAmmoRef && pistolAmmoRef.id !== "ih-irontalon-fragmenting-ammunition") {
    pistolRules = removeSpecialRule(removeSpecialRule(pistolRules, "Primitive"), "Tearing");
  }
  const hasMultipleProfiles = hasMultipleMeleeProfiles(displayedMeleeDamage);
  const thrownRange = weaponRef?.thrownRange;
  const craftsmanship = concealedBionicQuality ?? weapon.craftsmanship ?? "Common";
  const strengthBonusMultiplier = weapon.strengthBonusMultiplier ?? 1;
  const effectiveStrengthBonus = strengthBonus * strengthBonusMultiplier;
  const addableCompatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    true,
    upgradeIds,
    undefined,
    undefined,
    baseSpecialRules,
    craftsmanship
  );
  const viewableCompatible = getCompatibleUpgrades(
    weapon.class ?? "",
    weapon.name,
    true,
    [],
    undefined,
    undefined,
    baseSpecialRules,
    craftsmanship
  );
  const visibleCompatible = allowUpgrades
    ? editable
      ? addableCompatible
      : viewableCompatible
    : [];
  const baseRulesText = effective.specialRules?.trim() ?? "";
  const rulesText = isPistolProfile
    ? pistolRules
    : displayedMeleeRules
      ? displayedMeleeRules
      : weaponRef?.twoHanded
        ? [baseRulesText, "Two-Handed"]
            .filter((part) => part && part !== "—" && part !== "-")
            .join(", ")
        : baseRulesText;
  const ruleNamesInLookup = getKnownSpecialRuleNames(rulesText);
  const hasQualities = Boolean(rulesText && rulesText !== "—" && rulesText !== "-");
  const rulesDescription = weaponRef?.description ?? weapon.description;
  const hasQualityModal = ruleNamesInLookup.length > 0;
  const hasItemRules = !!weapon.concealedBionic;
  const concealedBionicEffect =
    concealedBionicQuality === "Poor"
      ? "Adds the Unreliable Quality."
      : concealedBionicQuality === "Good"
        ? "It gains +10 to attack Tests and +1 Damage."
        : concealedBionicQuality === "Common"
          ? "No additional weapon effect."
          : undefined;
  const classChips = meleeClassChips(weapon.class);
  const activeWeaponType = weaponTypeChip(weaponRef?.type ?? weapon.type);
  const isThrown =
    weapon.class?.toLowerCase().includes("thrown") ||
    weaponRef?.class.toLowerCase().includes("thrown");

  function updatePistolAmmo(
    entries: WeaponAmmoEntry[],
    loadedAmmoId?: string,
    options?: PatchOptions
  ) {
    onUpdateAlternateRangedAmmoEntries?.(entries, loadedAmmoId, options);
  }

  function handleAddPistolAmmo(name: string, referenceId?: string) {
    const ammoRef = referenceId
      ? AMMO_REFERENCE.find((ammo) => ammo.id === referenceId)
      : undefined;
    const entry: WeaponAmmoEntry = {
      id: crypto.randomUUID(),
      referenceId,
      name,
      clips: usesUnitAmmoTracking(ammoRef) ? 1 : 0,
      rounds: isSoldAsFullClip(ammoRef) ? Number(pistolProfile?.clip ?? 1) : 0,
      loaded: pistolAmmoEntries.length === 0,
    };
    updatePistolAmmo(
      [...pistolAmmoEntries, entry],
      entry.loaded ? entry.id : weapon.loadedAlternateRangedAmmoId,
      { optimistic: true }
    );
  }

  function handleSetLoadedPistolAmmo(entryId: string) {
    updatePistolAmmo(
      pistolAmmoEntries.map((entry) => ({ ...entry, loaded: entry.id === entryId })),
      entryId,
      { optimistic: true }
    );
  }

  function handleRemovePistolAmmo(entryId: string) {
    const next = pistolAmmoEntries.filter((entry) => entry.id !== entryId);
    const nextLoaded = next.find((entry) => entry.loaded) ?? next[0];
    updatePistolAmmo(
      next.map((entry) => ({ ...entry, loaded: entry.id === nextLoaded?.id })),
      nextLoaded?.id,
      { optimistic: true }
    );
  }

  function handleUpdatePistolAmmo(entryId: string, patch: Partial<WeaponAmmoEntry>) {
    updatePistolAmmo(
      pistolAmmoEntries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
      loadedPistolAmmoEntry?.id,
      { optimistic: true }
    );
  }

  return (
    <div
      className={`${weapon.concealedBionic ? `${uiNoticeBox} ${colourNoticePink}` : uiSectionShell} overflow-hidden`}
    >
      {/* Header: always visible */}
      <div
        className={`${forceExpanded ? "" : uiCardTapHeader} relative w-full flex items-stretch justify-between gap-2 p-3 lg:p-4`}
      >
        {!forceExpanded && (
          <CardOverlayButton
            label={
              onSelect
                ? `Select ${weapon.name}`
                : `${expanded ? "Collapse" : "Expand"} ${weapon.name} details`
            }
            expanded={onSelect ? undefined : expanded}
            onClick={onSelect ?? (() => setExpanded((e) => !e))}
          />
        )}
        <div className={`${uiExpandButton} relative pointer-events-none`}>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={uiCardTitleHover}>{weapon.name}</p>
            {rulesDescription && (
              <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                <InfoModal
                  title={weapon.name}
                  content={<p className={uiTextDescription}>{rulesDescription}</p>}
                />
              </span>
            )}
            {libraryItem && <StatusBadge status={libraryItem.status} />}
            {integrated && (
              <Chip size="sm" colour="violet">
                Integrated
              </Chip>
            )}
          </div>
          {(classChips.length > 0 || activeWeaponType || weapon.concealedBionic) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {weapon.concealedBionic && (
                <Chip size="sm" colour="pink">
                  Concealed Bionic
                </Chip>
              )}
              {weapon.concealedBionic && (
                <Chip size="sm" colour="pink">
                  Cybernetic
                </Chip>
              )}
              {classChips.map((chip) => (
                <Chip key={chip.label} size="sm" colour={chip.colour}>
                  {chip.label}
                </Chip>
              ))}
              {activeWeaponType && (
                <Chip size="sm" colour={activeWeaponType.colour}>
                  {activeWeaponType.label}
                </Chip>
              )}
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
              <ExpandButton
                expanded={expanded}
                label={`${expanded ? "Collapse" : "Expand"} ${weapon.name} details`}
                onClick={() => setExpanded((e) => !e)}
              />
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

          {(pistolProfile || alternateMeleeProfiles.length > 0) && (
            <div className="flex gap-2">
              {[
                weaponRef?.primaryMeleeProfileLabel ?? "Melee",
                ...alternateMeleeProfiles.map((profile) => profile.label),
                ...(pistolProfile ? ["Pistol"] : []),
              ].map((profile) => (
                <ToggleButton
                  key={profile}
                  selected={
                    activeProfile ===
                    (profile === (weaponRef?.primaryMeleeProfileLabel ?? "Melee")
                      ? "Melee"
                      : profile)
                  }
                  selectedClassName={colourToggleSelectedSky}
                  className="px-2 py-1 text-xs lg:text-sm"
                  onClick={() =>
                    setActiveProfile(
                      profile === (weaponRef?.primaryMeleeProfileLabel ?? "Melee")
                        ? "Melee"
                        : profile
                    )
                  }
                >
                  {profile}
                </ToggleButton>
              ))}
            </div>
          )}

          {isPistolProfile && pistolProfile ? (
            <div className="flex flex-wrap gap-1.5">
              <StatChip label="Range" value={pistolProfile.range} />
              <StatChip label="RoF" value={pistolProfile.rof} />
              <StatChip
                label="Damage"
                value={pistolProfile.damage.replace(/\s*[IREX]$/i, "").trim()}
              />
              <DamageTypeChip damage={pistolProfile.damage} />
              <StatChip label="Pen" value={pistolProfile.pen} />
              <StatChip label="Clip" value={pistolProfile.clip} />
              <StatChip label="Reload" value={pistolProfile.reload} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {thrownRange && <StatChip label="Range" value={thrownRange} />}
              {displayedMeleeDamage && (
                <StatChip label="Damage" value={displayMeleeDamage(displayedMeleeDamage)} />
              )}
              {displayedMeleeDamage && !hasMultipleProfiles && (
                <DamageTypeChip damage={displayedMeleeDamage} />
              )}
              {displayedMeleePen && <StatChip label="Pen" value={displayedMeleePen} />}
              <StatChip label="SB" value={`+${effectiveStrengthBonus}`} />
              {displayedMeleeDamage && !hasMultipleProfiles && (
                <StatChip
                  label="Total"
                  value={computeMeleeTotalDamage(
                    displayedMeleeDamage,
                    strengthBonus,
                    strengthBonusMultiplier
                  )}
                />
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Qualities</span>
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>
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
                        <p className={uiRuleName}>Concealed Weapon Bionic</p>
                        {CONCEALED_WEAPON_BIONIC_RULES.map((rule) => (
                          <p key={rule} className={uiTextDescription}>
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
              <span className={`text-xs lg:text-sm ${uiTextBody}`}>{craftsmanship}</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title={`${craftsmanship} ${weapon.concealedBionic ? "Concealed Weapon" : "Weapon"}`}
                  content={
                    concealedBionicEffect ? (
                      <div className="space-y-3">
                        <div>
                          <p
                            className={`text-sm lg:text-base ${colourTextPrimary} leading-relaxed`}
                          >
                            {concealedBionicEffect}
                          </p>
                        </div>
                      </div>
                    ) : (
                      meleeCraftsmanshipDescription(craftsmanship)
                    )
                  }
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
            className={`flex flex-wrap gap-1.5 border-t ${colourDivider} pt-2 mt-1`}
          />

          {isPistolProfile && pistolProfile && (
            <div className={`border-t ${colourDivider} pt-2 space-y-2`}>
              <div className="flex items-center justify-between gap-2">
                <span className={uiTextLabel}>Ammo</span>
                {editable && (
                  <Button size="xs" onClick={() => setShowPistolAmmoPicker(true)}>
                    + Add
                  </Button>
                )}
              </div>
              {pistolAmmoFamily && (
                <Chip size="sm" colour={pistolAmmoFamily.colour}>
                  {pistolAmmoFamily.label}
                </Chip>
              )}
              {pistolAmmoEntries.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>No ammo tracked</p>
              ) : (
                <div className="space-y-1.5">
                  {pistolAmmoEntries.map((entry) => (
                    <AmmoEntryRow
                      key={entry.id}
                      entry={entry}
                      isLoaded={entry.id === loadedPistolAmmoEntry?.id}
                      editable={editable}
                      clipSize={String(pistolProfile.clip)}
                      ammoTracking="loose"
                      weightKg={calcEntryWeight(
                        effective.weight,
                        String(pistolProfile.clip),
                        entry,
                        "loose"
                      )}
                      onSetLoaded={() => handleSetLoadedPistolAmmo(entry.id)}
                      onRemove={() => handleRemovePistolAmmo(entry.id)}
                      onUpdateClips={(clips) => handleUpdatePistolAmmo(entry.id, { clips })}
                      onUpdateRounds={(rounds) => handleUpdatePistolAmmo(entry.id, { rounds })}
                      onSetLooseRounds={(rounds) =>
                        handleUpdatePistolAmmo(entry.id, { rounds, clips: 0 })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {isThrown && (
            <div
              className={`border-t ${colourDivider} pt-2 flex items-center justify-between gap-2`}
            >
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
            <div className={`border-t ${colourDivider} pt-2 space-y-1.5`}>
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
                    <ViewButton
                      label="View upgrades"
                      size="sm"
                      onClick={() => setShowUpgradePicker(true)}
                    />
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

          {showPistolAmmoPicker && pistolProfile && (
            <AmmoPicker
              compatibleIds={pistolProfile.compatibleAmmoIds}
              existingNames={new Set(pistolAmmoEntries.map((entry) => entry.name))}
              showCustom={false}
              title="Add Chimera Pistol Ammo"
              editable={editable}
              closeOnSelect={false}
              onSelect={(name, referenceId) => handleAddPistolAmmo(name, referenceId)}
              onClose={() => setShowPistolAmmoPicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
