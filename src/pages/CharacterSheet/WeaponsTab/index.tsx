// src/pages/CharacterSheet/WeaponsTab/index.tsx
// Orchestration layer: state management and layout for all weapon categories.
// Card components, pickers and helpers live in ./weapons/.

import { useState, useCallback, Fragment, useMemo } from "react";
import type {
  RangedWeapon,
  MeleeWeapon,
  WeaponAmmoEntry,
  WeaponMagazineSlot,
  GrenadeItem,
  CyberneticItem,
  ShieldItem,
  ArcheotechItem,
  WeaponCraftsmanship,
} from "../../../types/Character";
import type { CampaignCustomItem } from "../../../types/CustomItems";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import {
  type RangedWeaponRef,
  type MeleeWeaponRef,
  type GrenadeRef,
  type ShieldRef,
} from "../../../data/reference/weaponReference";
import { RangedCard } from "../weapons/RangedCard";
import { RangedPicker } from "../weapons/RangedPicker";
import { CustomRangedForm } from "../weapons/CustomRangedForm";
import { MeleeCard } from "../weapons/MeleeCard";
import { MeleePicker } from "../weapons/MeleePicker";
import { CustomMeleeForm } from "../weapons/CustomMeleeForm";
import { GrenadeCard } from "../weapons/GrenadeCard";
import { GrenadePicker } from "../weapons/GrenadePicker";
import { CustomGrenadeForm } from "../weapons/CustomGrenadeForm";
import { ShieldCard } from "../weapons/ShieldCard";
import { ShieldPicker } from "../weapons/ShieldPicker";
import { CustomShieldForm } from "../weapons/CustomShieldForm";
import { ArcheotechShieldRow } from "../weapons/ArcheotechShieldRow";
import { CyberneticWeaponCard } from "../weapons/CyberneticWeaponCard";
import { ArcheotechWeaponCard } from "../weapons/ArcheotechWeaponCard";
import { IndependentCardGrid } from "../../../ui/layout/IndependentCardGrid";
import {
  NORMAL_RANGED_REFS,
  NORMAL_MELEE_REFS,
  rangedRulesForCraftsmanship,
  meleeDamageForCraftsmanship,
} from "../weapons/weaponHelpers";
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiTextPlaceholder } from "../../../ui/styles/editableStyles";
import {
  colourActiveEmerald,
  colourActiveOrange,
  colourActiveRose,
  colourActiveSky,
} from "../../../ui/styles/colourTokens";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import { ErrorState } from "../../../ui/ErrorState";
import { LoadingState } from "../../../ui/LoadingState";
import { useCustomItemLibraryActions } from "../../../hooks/useCustomItemLibraryActions";
import { useSwipeableTabs } from "../../../hooks/useSwipeableTabs";
import { SegmentedTabs, type SegmentedTabOption } from "../../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../../ui/styles/segmentedTabStyles";
import { createDraftCustomItem, saveDraftCustomItem } from "../../../services/customItemService";
import { useToast } from "../../../components/Toast";
import {
  toCustomRangedWeaponData,
  toCustomMeleeWeaponData,
  toCustomGrenadeData,
  toCustomShieldData,
  stripWeaponKind,
  stripArmourKind,
  buildRangedWeaponSnapshot,
  buildMeleeWeaponSnapshot,
  buildGrenadeSnapshot,
  buildShieldSnapshot,
  buildFallbackWeaponLibraryItem,
  buildFallbackGrenadeLibraryItem,
  buildFallbackShieldLibraryItem,
} from "../weapons/weaponSnapshotHelpers";
import {
  buildWeaponInventoryModel,
  getMeleeSlots,
  getRangedSlots,
  MAX_GRENADE_TYPES,
} from "./weaponInventoryModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeaponsTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  grenades: GrenadeItem[];
  editable: boolean;
  strengthBonus: number;
  onUpdateRanged: (next: RangedWeapon[]) => void;
  onUpdateMelee: (next: MeleeWeapon[]) => void;
  onUpdateGrenades: (next: GrenadeItem[]) => void;
  cybernetics?: CyberneticItem[];
  shields?: ShieldItem[];
  onUpdateShields?: (next: ShieldItem[]) => void;
  archeotech?: ArcheotechItem[];
  onUpdateArcheotech?: (next: ArcheotechItem[]) => void;
}

type EditingWeaponDefinition =
  | { kind: "ranged"; weapon: RangedWeapon; libraryItem: CampaignCustomItem<"weapon"> }
  | { kind: "melee"; weapon: MeleeWeapon; libraryItem: CampaignCustomItem<"weapon"> }
  | { kind: "grenade"; weapon: GrenadeItem; libraryItem: CampaignCustomItem<"weapon"> };

type EditingShieldDefinition = {
  shield: ShieldItem;
  libraryItem: CampaignCustomItem<"armour">;
};

type PickerTarget = "ranged" | "melee" | "grenades" | "shields" | null;
type WeaponMobileSection = NonNullable<PickerTarget>;

const MOBILE_WEAPON_SECTIONS = [
  {
    value: "ranged",
    label: "Ranged",
    ariaLabel: "Ranged weapons",
    activeClassName: colourActiveSky,
  },
  {
    value: "melee",
    label: "Melee",
    ariaLabel: "Melee weapons",
    activeClassName: colourActiveRose,
  },
  {
    value: "grenades",
    label: "Expl.",
    ariaLabel: "Explosives",
    activeClassName: colourActiveOrange,
  },
  {
    value: "shields",
    label: "Shields",
    ariaLabel: "Shields",
    activeClassName: colourActiveEmerald,
  },
] as const satisfies readonly SegmentedTabOption<WeaponMobileSection>[];
const MOBILE_WEAPON_SECTION_IDS = MOBILE_WEAPON_SECTIONS.map((section) => section.value);
const WEAPON_TABS_ID = "weapon-sections";

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeaponsTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  rangedWeapons,
  meleeWeapons,
  grenades,
  editable,
  strengthBonus,
  onUpdateRanged,
  onUpdateMelee,
  onUpdateGrenades,
  cybernetics,
  shields,
  onUpdateShields,
  archeotech,
  onUpdateArcheotech,
}: WeaponsTabProps) {
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [showCustomRanged, setShowCustomRanged] = useState(false);
  const [showCustomMelee, setShowCustomMelee] = useState(false);
  const [showCustomGrenade, setShowCustomGrenade] = useState(false);
  const [showCustomShield, setShowCustomShield] = useState(false);
  const [activeWeaponSection, setActiveWeaponSection] = useState<WeaponMobileSection>("ranged");
  const {
    containerRef,
    transitionClass: mobileSectionTransition,
    switchTo: showWeaponSection,
  } = useSwipeableTabs(MOBILE_WEAPON_SECTION_IDS, activeWeaponSection, setActiveWeaponSection);
  const [editingWeaponDefinition, setEditingWeaponDefinition] =
    useState<EditingWeaponDefinition | null>(null);
  const [editingShieldDefinition, setEditingShieldDefinition] =
    useState<EditingShieldDefinition | null>(null);
  const toast = useToast();
  const {
    publishDefinition: publishWeaponDefinition,
    archiveDefinition: archiveWeaponDefinition,
    updateAllCopies: updateAllWeaponCopies,
    getBusyAction: getWeaponBusyAction,
  } = useCustomItemLibraryActions<"weapon">({ campaignId, userId, itemLabel: "weapon" });
  const {
    publishDefinition: publishShieldDefinition,
    archiveDefinition: archiveShieldDefinition,
    updateAllCopies: updateAllShieldCopies,
    getBusyAction: getShieldBusyAction,
  } = useCustomItemLibraryActions<"armour">({ campaignId, userId, itemLabel: "shield" });

  const {
    items: campaignCustomItems,
    loading: customItemsLoading,
    error: customItemsError,
  } = useCampaignCustomItems({
    campaignId,
    categories: ["weapon", "armour"],
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomWeapons = useMemo(
    () =>
      campaignCustomItems.filter(
        (item) => item.category === "weapon"
      ) as CampaignCustomItem<"weapon">[],
    [campaignCustomItems]
  );
  const campaignCustomWeaponsById = useMemo(
    () => new Map(campaignCustomWeapons.map((item) => [item.id, item])),
    [campaignCustomWeapons]
  );
  const campaignCustomGrenades = useMemo(
    () => campaignCustomWeapons.filter((item) => item.data.weaponKind === "grenade"),
    [campaignCustomWeapons]
  );
  const campaignCustomArmour = useMemo(
    () =>
      campaignCustomItems.filter(
        (item) => item.category === "armour"
      ) as CampaignCustomItem<"armour">[],
    [campaignCustomItems]
  );
  const campaignCustomArmourById = useMemo(
    () => new Map(campaignCustomArmour.map((item) => [item.id, item])),
    [campaignCustomArmour]
  );
  const campaignCustomShields = useMemo(
    () => campaignCustomArmour.filter((item) => item.data.armourKind === "shield"),
    [campaignCustomArmour]
  );

  const {
    allRangedEntries,
    allMeleeEntries,
    allGrenadeEntries,
    sortedShields,
    archeotechShieldItems,
    archeotechGrenadeItems,
    slotsRemaining,
    equippedGrenadeTypes,
  } = buildWeaponInventoryModel({
    rangedWeapons,
    meleeWeapons,
    grenades,
    cybernetics,
    shields,
    archeotech,
  });

  // ── Grenade handlers ───────────────────────────────────────────────────────

  const addFromGrenadeRef = useCallback(
    (ref: GrenadeRef) => {
      if (!editable) return;
      onUpdateGrenades([
        ...grenades,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          type: ref.type,
          class: ref.class,
          damage: ref.damage,
          pen: ref.pen,
          specialRules: ref.specialRules,
          weight: ref.weight,
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
        },
      ]);
    },
    [editable, grenades, onUpdateGrenades]
  );

  const addCustomGrenade = useCallback(
    async (item: GrenadeItem) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom grenades.");
        return;
      }

      try {
        const data = toCustomGrenadeData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "weapon",
          creator: { userId, characterId, characterName },
          data,
        });

        onUpdateGrenades([
          ...grenades,
          buildGrenadeSnapshot(item.id, item, data, customItemId, versionId),
        ]);
        setShowCustomGrenade(false);
        setPicker("grenades");
        toast.success("Custom grenade saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom grenade:", err);
        toast.error("Failed to save custom grenade.");
      }
    },
    [campaignId, characterId, characterName, editable, grenades, onUpdateGrenades, toast, userId]
  );

  const removeGrenade = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateGrenades(grenades.filter((g) => g.id !== id));
    },
    [editable, grenades, onUpdateGrenades]
  );

  const updateGrenadeQty = useCallback(
    (id: string, quantity: number) => {
      if (!editable) return;
      onUpdateGrenades(grenades.map((g) => (g.id === id ? { ...g, quantity } : g)));
    },
    [editable, grenades, onUpdateGrenades]
  );

  // ── Ranged handlers ────────────────────────────────────────────────────────

  const addFromRangedRef = useCallback(
    (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship = "Common") => {
      if (!editable) return;
      const isThrown = ref.class.toLowerCase().includes("thrown");
      const specialRules = rangedRulesForCraftsmanship(ref.specialRules, craftsmanship);
      onUpdateRanged([
        ...rangedWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.class,
          range: ref.range,
          rof: ref.rof,
          damage: ref.damage,
          pen: String(ref.pen),
          clip: String(ref.clip),
          rld: ref.reload,
          specialRules,
          weight: ref.weight,
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
          craftsmanship,
          ammoTracking: ref.ammoTracking,
          quantity: isThrown ? 1 : undefined,
        },
      ]);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addCustomRanged = useCallback(
    async (weapon: RangedWeapon) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom weapons.");
        return;
      }

      try {
        const nextWeapon = { ...weapon, craftsmanship: weapon.craftsmanship ?? "Common" };
        const data = toCustomRangedWeaponData(nextWeapon);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "weapon",
          creator: { userId, characterId, characterName },
          data,
        });

        onUpdateRanged([
          ...rangedWeapons,
          buildRangedWeaponSnapshot(nextWeapon.id, nextWeapon, data, customItemId, versionId),
        ]);
        setShowCustomRanged(false);
        setPicker("ranged");
        toast.success("Custom ranged weapon saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom ranged weapon:", err);
        toast.error("Failed to save custom ranged weapon.");
      }
    },
    [campaignId, characterId, characterName, editable, onUpdateRanged, rangedWeapons, toast, userId]
  );

  const removeRanged = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...rangedWeapons];
      next.splice(index, 1);
      onUpdateRanged(next);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addUpgradeToRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, upgrades: [...(weapon.upgrades ?? []), upgradeId] }
            : weapon
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeUpgradeFromRanged = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((weapon) =>
          weapon.id === weaponId
            ? {
                ...weapon,
                upgrades: (weapon.upgrades ?? []).filter((id) => id !== upgradeId),
              }
            : weapon
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateRangedAmmoEntries = useCallback(
    (weaponId: string, entries: WeaponAmmoEntry[]) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((w) => (w.id === weaponId ? { ...w, ammoEntries: entries } : w))
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateRangedProfileLoadedAmmo = useCallback(
    (weaponId: string, profile: string, entryId: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((w) =>
          w.id === weaponId
            ? { ...w, loadedAmmoByProfile: { ...w.loadedAmmoByProfile, [profile]: entryId } }
            : w
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateRangedMagazineSlots = useCallback(
    (weaponId: string, magazineSlots: WeaponMagazineSlot[], activeMagazineSlotId?: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((weapon) =>
          weapon.id === weaponId ? { ...weapon, magazineSlots, activeMagazineSlotId } : weapon
        )
      );
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const updateRangedQuantity = useCallback(
    (weaponId: string, quantity: number) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.map((w) => (w.id === weaponId ? { ...w, quantity } : w)));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  // ── Melee handlers ─────────────────────────────────────────────────────────

  const addFromMeleeRef = useCallback(
    (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship = "Common") => {
      if (!editable) return;
      const isThrown = ref.class.toLowerCase().includes("thrown");
      const damage = meleeDamageForCraftsmanship(ref.damage, craftsmanship);
      onUpdateMelee([
        ...meleeWeapons,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          class: ref.twoHanded ? `${ref.class} (Two-Handed)` : ref.class,
          damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          strengthBonusMultiplier: ref.strengthBonusMultiplier,
          weight: ref.weight,
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
          craftsmanship,
          quantity: isThrown ? 1 : undefined,
        },
      ]);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addCustomMelee = useCallback(
    async (weapon: MeleeWeapon) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom weapons.");
        return;
      }

      try {
        const nextWeapon = { ...weapon, craftsmanship: weapon.craftsmanship ?? "Common" };
        const data = toCustomMeleeWeaponData(nextWeapon);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "weapon",
          creator: { userId, characterId, characterName },
          data,
        });

        onUpdateMelee([
          ...meleeWeapons,
          buildMeleeWeaponSnapshot(nextWeapon.id, nextWeapon, data, customItemId, versionId),
        ]);
        setShowCustomMelee(false);
        setPicker("melee");
        toast.success("Custom melee weapon saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom melee weapon:", err);
        toast.error("Failed to save custom melee weapon.");
      }
    },
    [campaignId, characterId, characterName, editable, meleeWeapons, onUpdateMelee, toast, userId]
  );

  const addWeaponFromLibrary = useCallback(
    (libraryItem: CampaignCustomItem<"weapon">) => {
      if (!editable) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);

      if (!versionId) {
        toast.error("This custom weapon has no usable version.");
        return;
      }

      if (libraryItem.data.weaponKind === "ranged") {
        onUpdateRanged([
          ...rangedWeapons,
          buildRangedWeaponSnapshot(
            crypto.randomUUID(),
            {},
            libraryItem.data,
            libraryItem.id,
            versionId
          ),
        ]);
        return;
      }

      if (libraryItem.data.weaponKind === "grenade") {
        onUpdateGrenades([
          ...grenades,
          buildGrenadeSnapshot(
            crypto.randomUUID(),
            {},
            libraryItem.data,
            libraryItem.id,
            versionId
          ),
        ]);
        return;
      }

      onUpdateMelee([
        ...meleeWeapons,
        buildMeleeWeaponSnapshot(
          crypto.randomUUID(),
          {},
          libraryItem.data,
          libraryItem.id,
          versionId
        ),
      ]);
    },
    [
      editable,
      grenades,
      meleeWeapons,
      onUpdateGrenades,
      onUpdateMelee,
      onUpdateRanged,
      rangedWeapons,
      toast,
    ]
  );

  const addShieldFromLibrary = useCallback(
    (libraryItem: CampaignCustomItem<"armour">) => {
      if (!editable || !onUpdateShields) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);

      if (!versionId) {
        toast.error("This custom shield has no usable version.");
        return;
      }

      if (libraryItem.data.armourKind !== "shield") return;

      onUpdateShields([
        ...(shields ?? []),
        buildShieldSnapshot(crypto.randomUUID(), {}, libraryItem.data, libraryItem.id, versionId),
      ]);
    },
    [editable, onUpdateShields, shields, toast]
  );

  const saveEditedWeaponDefinition = useCallback(
    async (weapon: RangedWeapon | MeleeWeapon | GrenadeItem) => {
      if (!editingWeaponDefinition || !userId) return;

      try {
        const data =
          editingWeaponDefinition.kind === "ranged"
            ? toCustomRangedWeaponData(weapon as RangedWeapon)
            : editingWeaponDefinition.kind === "melee"
              ? toCustomMeleeWeaponData(weapon as MeleeWeapon)
              : toCustomGrenadeData(weapon as GrenadeItem);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingWeaponDefinition.libraryItem.id,
          category: "weapon",
          editor: { userId, characterId, characterName },
          data,
        });

        if (editingWeaponDefinition.kind === "ranged" && data.weaponKind === "ranged") {
          onUpdateRanged(
            rangedWeapons.map((rangedWeapon) =>
              rangedWeapon.id === editingWeaponDefinition.weapon.id
                ? buildRangedWeaponSnapshot(
                    rangedWeapon.id,
                    rangedWeapon,
                    data,
                    editingWeaponDefinition.libraryItem.id,
                    versionId
                  )
                : rangedWeapon
            )
          );
        } else if (editingWeaponDefinition.kind === "melee" && data.weaponKind === "melee") {
          onUpdateMelee(
            meleeWeapons.map((meleeWeapon) =>
              meleeWeapon.id === editingWeaponDefinition.weapon.id
                ? buildMeleeWeaponSnapshot(
                    meleeWeapon.id,
                    meleeWeapon,
                    data,
                    editingWeaponDefinition.libraryItem.id,
                    versionId
                  )
                : meleeWeapon
            )
          );
        } else if (editingWeaponDefinition.kind === "grenade" && data.weaponKind === "grenade") {
          onUpdateGrenades(
            grenades.map((grenade) =>
              grenade.id === editingWeaponDefinition.weapon.id
                ? buildGrenadeSnapshot(
                    grenade.id,
                    grenade,
                    data,
                    editingWeaponDefinition.libraryItem.id,
                    versionId
                  )
                : grenade
            )
          );
        }

        setEditingWeaponDefinition(null);
        toast.success("Custom weapon draft updated.");
      } catch (err) {
        console.error("Failed to update custom weapon definition:", err);
        toast.error("Failed to update custom weapon definition.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      editingWeaponDefinition,
      grenades,
      meleeWeapons,
      onUpdateGrenades,
      onUpdateMelee,
      onUpdateRanged,
      rangedWeapons,
      toast,
      userId,
    ]
  );

  const saveEditedShieldDefinition = useCallback(
    async (shield: ShieldItem) => {
      if (!editingShieldDefinition || !userId || !onUpdateShields) return;

      try {
        const data = toCustomShieldData(shield);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingShieldDefinition.libraryItem.id,
          category: "armour",
          editor: { userId, characterId, characterName },
          data,
        });

        onUpdateShields(
          (shields ?? []).map((currentShield) =>
            currentShield.id === editingShieldDefinition.shield.id
              ? buildShieldSnapshot(
                  currentShield.id,
                  currentShield,
                  data,
                  editingShieldDefinition.libraryItem.id,
                  versionId
                )
              : currentShield
          )
        );

        setEditingShieldDefinition(null);
        toast.success("Custom shield draft updated.");
      } catch (err) {
        console.error("Failed to update custom shield definition:", err);
        toast.error("Failed to update custom shield definition.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      editingShieldDefinition,
      onUpdateShields,
      shields,
      toast,
      userId,
    ]
  );

  const removeMelee = useCallback(
    (index: number) => {
      if (!editable) return;
      const next = [...meleeWeapons];
      next.splice(index, 1);
      onUpdateMelee(next);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addUpgradeToMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((weapon) =>
          weapon.id === weaponId
            ? { ...weapon, upgrades: [...(weapon.upgrades ?? []), upgradeId] }
            : weapon
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const removeUpgradeFromMelee = useCallback(
    (weaponId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((weapon) =>
          weapon.id === weaponId
            ? {
                ...weapon,
                upgrades: (weapon.upgrades ?? []).filter((id) => id !== upgradeId),
              }
            : weapon
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const updateMeleeQuantity = useCallback(
    (weaponId: string, quantity: number) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map((w) => (w.id === weaponId ? { ...w, quantity } : w)));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const updateMeleeAlternateRangedAmmoEntries = useCallback(
    (
      weaponId: string,
      alternateRangedAmmoEntries: WeaponAmmoEntry[],
      loadedAlternateRangedAmmoId?: string
    ) => {
      if (!editable) return;
      onUpdateMelee(
        meleeWeapons.map((weapon) =>
          weapon.id === weaponId
            ? {
                ...weapon,
                alternateRangedAmmoEntries,
                loadedAlternateRangedAmmoId,
                alternateRangedAmmoReferenceId: undefined,
              }
            : weapon
        )
      );
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  // ── Shield handlers ────────────────────────────────────────────────────────

  const addFromShieldRef = useCallback(
    (ref: ShieldRef) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields([
        ...(shields ?? []),
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          ap: ref.ap,
          locations: ref.locations,
          damage: ref.damage,
          pen: String(ref.pen),
          specialRules: ref.specialRules,
          notes: ref.notes,
          weight: ref.weight,
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
        },
      ]);
    },
    [editable, shields, onUpdateShields]
  );

  const addCustomShield = useCallback(
    async (item: ShieldItem) => {
      if (!editable || !onUpdateShields) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom shields.");
        return;
      }

      try {
        const data = toCustomShieldData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "armour",
          creator: { userId, characterId, characterName },
          data,
        });

        onUpdateShields([
          ...(shields ?? []),
          buildShieldSnapshot(item.id, item, data, customItemId, versionId),
        ]);
        setShowCustomShield(false);
        setPicker("shields");
        toast.success("Custom shield saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom shield:", err);
        toast.error("Failed to save custom shield.");
      }
    },
    [campaignId, characterId, characterName, editable, onUpdateShields, shields, toast, userId]
  );

  const removeShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields((shields ?? []).filter((s) => s.id !== id));
    },
    [editable, shields, onUpdateShields]
  );

  const removeArcheotech = useCallback(
    (id: string) => {
      if (!editable || !onUpdateArcheotech) return;
      onUpdateArcheotech((archeotech ?? []).filter((a) => a.id !== id));
    },
    [editable, archeotech, onUpdateArcheotech]
  );

  // ── Equip toggle handlers ──────────────────────────────────────────────────

  const toggleEquipRanged = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.map((w) => (w.id === id ? { ...w, equipped: !w.equipped } : w)));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const toggleEquipMelee = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map((w) => (w.id === id ? { ...w, equipped: !w.equipped } : w)));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const toggleEquipArcheotech = useCallback(
    (id: string) => {
      if (!editable || !onUpdateArcheotech) return;
      onUpdateArcheotech(
        (archeotech ?? []).map((a) => (a.id === id ? { ...a, equipped: !a.equipped } : a))
      );
    },
    [editable, archeotech, onUpdateArcheotech]
  );

  const toggleEquipGrenade = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateGrenades(grenades.map((g) => (g.id === id ? { ...g, equipped: !g.equipped } : g)));
    },
    [editable, grenades, onUpdateGrenades]
  );

  const toggleEquipShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields(
        (shields ?? []).map((s) => (s.id === id ? { ...s, equipped: !s.equipped } : s))
      );
    },
    [editable, shields, onUpdateShields]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const visibleWeaponSectionClass = (section: WeaponMobileSection) =>
    [
      "space-y-3",
      activeWeaponSection === section
        ? `${uiSwipeableTabPanel} ${mobileSectionTransition}`
        : "hidden lg:block",
    ].join(" ");
  const weaponPairClass = [
    "grid grid-cols-1 lg:grid-cols-2 gap-8",
    activeWeaponSection === "ranged" || activeWeaponSection === "melee" ? "" : "hidden lg:grid",
  ].join(" ");

  const getLibraryItemForWeapon = useCallback(
    (weapon: RangedWeapon | MeleeWeapon, kind: "ranged" | "melee") => {
      const linkedLibraryItem = weapon.customLibraryId
        ? campaignCustomWeaponsById.get(weapon.customLibraryId)
        : undefined;
      return (
        linkedLibraryItem ??
        (weapon.customLibraryId
          ? buildFallbackWeaponLibraryItem({
              campaignId,
              weapon,
              kind,
              userId,
              characterId,
              characterName,
            })
          : undefined)
      );
    },
    [campaignCustomWeaponsById, campaignId, characterId, characterName, userId]
  );

  const getWeaponLibraryProps = useCallback(
    (weapon: RangedWeapon | MeleeWeapon, kind: "ranged" | "melee") => {
      const libraryItem = getLibraryItemForWeapon(weapon, kind);
      const canEditDefinition =
        !!libraryItem && editable && (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction = libraryItem ? getWeaponBusyAction(libraryItem.id) : null;

      return {
        libraryItem,
        isDM: isDM && editable,
        canEditDefinition,
        busyAction: rowBusyAction,
        onEditDefinition: () =>
          libraryItem &&
          setEditingWeaponDefinition(
            kind === "ranged"
              ? { kind, weapon: weapon as RangedWeapon, libraryItem }
              : { kind, weapon: weapon as MeleeWeapon, libraryItem }
          ),
        onPublish: () => libraryItem && publishWeaponDefinition(libraryItem),
        onArchive: () => libraryItem && archiveWeaponDefinition(libraryItem),
        onUpdateAllCopies: () => libraryItem && updateAllWeaponCopies(libraryItem),
      };
    },
    [
      archiveWeaponDefinition,
      editable,
      getWeaponBusyAction,
      getLibraryItemForWeapon,
      isDM,
      publishWeaponDefinition,
      updateAllWeaponCopies,
      userId,
    ]
  );

  const getLibraryItemForGrenade = useCallback(
    (grenade: GrenadeItem) => {
      const linkedLibraryItem = grenade.customLibraryId
        ? campaignCustomWeaponsById.get(grenade.customLibraryId)
        : undefined;
      return (
        linkedLibraryItem ??
        (grenade.customLibraryId
          ? buildFallbackGrenadeLibraryItem({
              campaignId,
              grenade,
              userId,
              characterId,
              characterName,
            })
          : undefined)
      );
    },
    [campaignCustomWeaponsById, campaignId, characterId, characterName, userId]
  );

  const getGrenadeLibraryProps = useCallback(
    (grenade: GrenadeItem) => {
      const libraryItem = getLibraryItemForGrenade(grenade);
      const canEditDefinition =
        !!libraryItem && editable && (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction = libraryItem ? getWeaponBusyAction(libraryItem.id) : null;

      return {
        libraryItem,
        isDM: isDM && editable,
        canEditDefinition,
        busyAction: rowBusyAction,
        onEditDefinition: () =>
          libraryItem &&
          setEditingWeaponDefinition({ kind: "grenade", weapon: grenade, libraryItem }),
        onPublish: () => libraryItem && publishWeaponDefinition(libraryItem),
        onArchive: () => libraryItem && archiveWeaponDefinition(libraryItem),
        onUpdateAllCopies: () => libraryItem && updateAllWeaponCopies(libraryItem),
      };
    },
    [
      archiveWeaponDefinition,
      editable,
      getWeaponBusyAction,
      getLibraryItemForGrenade,
      isDM,
      publishWeaponDefinition,
      updateAllWeaponCopies,
      userId,
    ]
  );

  const getLibraryItemForShield = useCallback(
    (shield: ShieldItem) => {
      const linkedLibraryItem = shield.customLibraryId
        ? campaignCustomArmourById.get(shield.customLibraryId)
        : undefined;
      return (
        linkedLibraryItem ??
        (shield.customLibraryId
          ? buildFallbackShieldLibraryItem({
              campaignId,
              shield,
              userId,
              characterId,
              characterName,
            })
          : undefined)
      );
    },
    [campaignCustomArmourById, campaignId, characterId, characterName, userId]
  );

  const getShieldLibraryProps = useCallback(
    (shield: ShieldItem) => {
      const libraryItem = getLibraryItemForShield(shield);
      const canEditDefinition =
        !!libraryItem && editable && (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction = libraryItem ? getShieldBusyAction(libraryItem.id) : null;

      return {
        libraryItem,
        isDM: isDM && editable,
        canEditDefinition,
        busyAction: rowBusyAction,
        onEditDefinition: () => libraryItem && setEditingShieldDefinition({ shield, libraryItem }),
        onPublish: () => libraryItem && publishShieldDefinition(libraryItem),
        onArchive: () => libraryItem && archiveShieldDefinition(libraryItem),
        onUpdateAllCopies: () => libraryItem && updateAllShieldCopies(libraryItem),
      };
    },
    [
      archiveShieldDefinition,
      editable,
      getShieldBusyAction,
      getLibraryItemForShield,
      isDM,
      publishShieldDefinition,
      updateAllShieldCopies,
      userId,
    ]
  );

  if (customItemsError) {
    return <ErrorState>Unable to load custom weapons.</ErrorState>;
  }

  if (customItemsLoading) {
    return <LoadingState>Loading custom weapons…</LoadingState>;
  }

  return (
    <div ref={containerRef} className="space-y-8">
      <div className="lg:hidden">
        <SegmentedTabs
          id={WEAPON_TABS_ID}
          ariaLabel="Weapon sections"
          options={MOBILE_WEAPON_SECTIONS}
          value={activeWeaponSection}
          onChange={showWeaponSection}
        />
      </div>

      <div className={weaponPairClass}>
        {/* ── RANGED ─────────────────────────────────────────────────────── */}
        <section
          id={segmentedTabPanelId(WEAPON_TABS_ID, "ranged")}
          aria-labelledby={segmentedTabId(WEAPON_TABS_ID, "ranged")}
          className={visibleWeaponSectionClass("ranged")}
          role="tabpanel"
        >
          <div className="flex items-center justify-between">
            <SectionHeader>Ranged</SectionHeader>
            {!showCustomRanged &&
              (editable ? (
                <AddButton label="Add ranged weapon" onClick={() => setPicker("ranged")} />
              ) : (
                <ViewButton label="View ranged weapons" onClick={() => setPicker("ranged")} />
              ))}
          </div>

          {allRangedEntries.length === 0 && !showCustomRanged && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No ranged weapons.</p>
          )}

          {allRangedEntries.map((entry) => {
            if (entry.kind === "cybernetic")
              return (
                <CyberneticWeaponCard
                  key={entry.cybernetic.id}
                  cyberneticName={entry.cybernetic.name}
                  weapon={entry.weapon}
                  craftsmanship={entry.cybernetic.craftsmanship ?? "Common"}
                  strengthBonus={strengthBonus}
                />
              );
            if (entry.kind === "archeotech")
              return (
                <ArcheotechWeaponCard
                  key={entry.item.id}
                  item={entry.item}
                  strengthBonus={strengthBonus}
                  editable={editable}
                  isEquipped={entry.item.equipped ?? false}
                  onToggleEquip={
                    entry.item.type !== "Integrated Weapon"
                      ? () => toggleEquipArcheotech(entry.item.id)
                      : undefined
                  }
                  slotsDisabled={
                    entry.item.type !== "Integrated Weapon" &&
                    !entry.item.equipped &&
                    slotsRemaining < 1
                  }
                />
              );
            if (entry.kind === "integrated")
              return (
                <RangedCard
                  key={entry.weapon.id}
                  weapon={entry.weapon}
                  editable={editable}
                  strengthBonus={strengthBonus}
                  integrated
                  allowUpgrades={false}
                  forceExpanded
                  isEquipped
                  onRemove={() => {}}
                  onAddUpgrade={() => {}}
                  onRemoveUpgrade={() => {}}
                  onUpdateAmmoEntries={(entries) =>
                    updateRangedAmmoEntries(entry.weapon.id, entries)
                  }
                  onUpdateLoadedAmmoByProfile={(profile, entryId) =>
                    updateRangedProfileLoadedAmmo(entry.weapon.id, profile, entryId)
                  }
                  onUpdateMagazineSlots={(slots, activeSlotId) =>
                    updateRangedMagazineSlots(entry.weapon.id, slots, activeSlotId)
                  }
                  onUpdateQuantity={(qty) => updateRangedQuantity(entry.weapon.id, qty)}
                  grenades={grenades}
                  onUpdateGrenades={onUpdateGrenades}
                  archeotechGrenades={archeotechGrenadeItems}
                />
              );
            return (
              <RangedCard
                key={entry.weapon.id}
                weapon={entry.weapon}
                editable={editable}
                strengthBonus={strengthBonus}
                {...getWeaponLibraryProps(entry.weapon, "ranged")}
                onRemove={() => removeRanged(entry.index)}
                onAddUpgrade={(upgradeId) => addUpgradeToRanged(entry.weapon.id, upgradeId)}
                onRemoveUpgrade={(upgradeId) => removeUpgradeFromRanged(entry.weapon.id, upgradeId)}
                onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(entry.weapon.id, entries)}
                onUpdateLoadedAmmoByProfile={(profile, entryId) =>
                  updateRangedProfileLoadedAmmo(entry.weapon.id, profile, entryId)
                }
                onUpdateMagazineSlots={(slots, activeSlotId) =>
                  updateRangedMagazineSlots(entry.weapon.id, slots, activeSlotId)
                }
                onUpdateQuantity={(qty) => updateRangedQuantity(entry.weapon.id, qty)}
                grenades={grenades}
                onUpdateGrenades={onUpdateGrenades}
                archeotechGrenades={archeotechGrenadeItems}
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipRanged(entry.weapon.id)}
                slotsDisabled={
                  !entry.weapon.equipped && slotsRemaining < getRangedSlots(entry.weapon)
                }
              />
            );
          })}

          {showCustomRanged && (
            <CustomRangedForm
              onAdd={addCustomRanged}
              onCancel={() => {
                setShowCustomRanged(false);
                setPicker("ranged");
              }}
            />
          )}
        </section>

        {/* ── MELEE ──────────────────────────────────────────────────────── */}
        <section
          id={segmentedTabPanelId(WEAPON_TABS_ID, "melee")}
          aria-labelledby={segmentedTabId(WEAPON_TABS_ID, "melee")}
          className={visibleWeaponSectionClass("melee")}
          role="tabpanel"
        >
          <div className="flex items-center justify-between">
            <SectionHeader>Melee</SectionHeader>
            {!showCustomMelee &&
              (editable ? (
                <AddButton label="Add melee weapon" onClick={() => setPicker("melee")} />
              ) : (
                <ViewButton label="View melee weapons" onClick={() => setPicker("melee")} />
              ))}
          </div>

          {allMeleeEntries.length === 0 && !showCustomMelee && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No melee weapons.</p>
          )}

          {allMeleeEntries.map((entry) => {
            if (entry.kind === "cybernetic")
              return (
                <CyberneticWeaponCard
                  key={entry.cybernetic.id}
                  cyberneticName={entry.cybernetic.name}
                  weapon={entry.weapon}
                  craftsmanship={entry.cybernetic.craftsmanship ?? "Common"}
                  strengthBonus={strengthBonus}
                />
              );
            if (entry.kind === "archeotech")
              return (
                <ArcheotechWeaponCard
                  key={entry.item.id}
                  item={entry.item}
                  strengthBonus={strengthBonus}
                  editable={editable}
                  isEquipped={entry.item.equipped ?? false}
                  onToggleEquip={
                    entry.item.type !== "Integrated Weapon"
                      ? () => toggleEquipArcheotech(entry.item.id)
                      : undefined
                  }
                  slotsDisabled={
                    entry.item.type !== "Integrated Weapon" &&
                    !entry.item.equipped &&
                    slotsRemaining < 1
                  }
                />
              );
            if (entry.kind === "integrated")
              return (
                <MeleeCard
                  key={entry.weapon.id}
                  weapon={entry.weapon}
                  editable={editable}
                  strengthBonus={strengthBonus}
                  integrated
                  allowUpgrades={false}
                  forceExpanded
                  isEquipped
                  onRemove={() => {}}
                  onAddUpgrade={() => {}}
                  onRemoveUpgrade={() => {}}
                  onUpdateQuantity={(qty) => updateMeleeQuantity(entry.weapon.id, qty)}
                  onUpdateAlternateRangedAmmoEntries={(entries, loadedAmmoId) =>
                    updateMeleeAlternateRangedAmmoEntries(entry.weapon.id, entries, loadedAmmoId)
                  }
                />
              );
            return (
              <MeleeCard
                key={entry.weapon.id}
                weapon={entry.weapon}
                editable={editable}
                strengthBonus={strengthBonus}
                {...getWeaponLibraryProps(entry.weapon, "melee")}
                onRemove={() => removeMelee(entry.index)}
                onAddUpgrade={(upgradeId) => addUpgradeToMelee(entry.weapon.id, upgradeId)}
                onRemoveUpgrade={(upgradeId) => removeUpgradeFromMelee(entry.weapon.id, upgradeId)}
                onUpdateQuantity={(qty) => updateMeleeQuantity(entry.weapon.id, qty)}
                onUpdateAlternateRangedAmmoEntries={(entries, loadedAmmoId) =>
                  updateMeleeAlternateRangedAmmoEntries(entry.weapon.id, entries, loadedAmmoId)
                }
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipMelee(entry.weapon.id)}
                slotsDisabled={
                  !entry.weapon.equipped && slotsRemaining < getMeleeSlots(entry.weapon)
                }
              />
            );
          })}

          {showCustomMelee && (
            <CustomMeleeForm
              onAdd={addCustomMelee}
              onCancel={() => {
                setShowCustomMelee(false);
                setPicker("melee");
              }}
            />
          )}
        </section>
      </div>

      {/* ── GRENADES & MINES ─────────────────────────────────────────────── */}
      <section
        id={segmentedTabPanelId(WEAPON_TABS_ID, "grenades")}
        aria-labelledby={segmentedTabId(WEAPON_TABS_ID, "grenades")}
        className={visibleWeaponSectionClass("grenades")}
        role="tabpanel"
      >
        <div className="flex items-center justify-between">
          <SectionHeader>Explosives</SectionHeader>
          {editable ? (
            <AddButton label="Add explosive" onClick={() => setPicker("grenades")} />
          ) : (
            <ViewButton label="View explosives" onClick={() => setPicker("grenades")} />
          )}
        </div>

        {allGrenadeEntries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
            No grenades or mines carried.
          </p>
        )}

        <IndependentCardGrid
          items={allGrenadeEntries.map((entry) => {
            if (entry.kind === "archeotech")
              return (
                <ArcheotechWeaponCard
                  key={entry.item.id}
                  item={entry.item}
                  editable={editable}
                  isEquipped={entry.item.equipped ?? false}
                  onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                  slotsDisabled={!entry.item.equipped && equippedGrenadeTypes >= MAX_GRENADE_TYPES}
                />
              );
            const item = entry.item;
            const isEquipped = !!item.equipped;
            const stowedCount = isEquipped ? Math.max(0, item.quantity - 3) : 0;
            return (
              <Fragment key={item.id}>
                <GrenadeCard
                  item={item}
                  editable={editable}
                  strengthBonus={strengthBonus}
                  {...getGrenadeLibraryProps(item)}
                  onRemove={() => removeGrenade(item.id)}
                  onUpdateQty={(qty) => updateGrenadeQty(item.id, qty)}
                  isEquipped={isEquipped}
                  onToggleEquip={() => toggleEquipGrenade(item.id)}
                  canEquipMoreTypes={isEquipped || equippedGrenadeTypes < MAX_GRENADE_TYPES}
                />
                {isEquipped && stowedCount > 0 && (
                  <GrenadeCard
                    item={{ ...item, quantity: stowedCount }}
                    editable={false}
                    strengthBonus={strengthBonus}
                    onRemove={() => {}}
                    onUpdateQty={() => {}}
                    isStowedCard
                  />
                )}
              </Fragment>
            );
          })}
        />
      </section>

      {/* ── SHIELDS ──────────────────────────────────────────────────────── */}
      <section
        id={segmentedTabPanelId(WEAPON_TABS_ID, "shields")}
        aria-labelledby={segmentedTabId(WEAPON_TABS_ID, "shields")}
        className={visibleWeaponSectionClass("shields")}
        role="tabpanel"
      >
        <div className="flex items-center justify-between">
          <SectionHeader>Shields</SectionHeader>
          {editable ? (
            <AddButton label="Add shield" onClick={() => setPicker("shields")} />
          ) : (
            <ViewButton label="View shields" onClick={() => setPicker("shields")} />
          )}
        </div>

        {(shields ?? []).length === 0 && archeotechShieldItems.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No shields carried.</p>
        )}

        <IndependentCardGrid
          items={sortedShields.map((item) => (
            <ShieldCard
              key={item.id}
              item={item}
              editable={editable}
              {...getShieldLibraryProps(item)}
              onRemove={() => removeShield(item.id)}
              isEquipped={item.equipped ?? false}
              onToggleEquip={() => toggleEquipShield(item.id)}
              slotsDisabled={!item.equipped && slotsRemaining < 1}
            />
          ))}
        />
        <IndependentCardGrid
          items={archeotechShieldItems.map((item) => (
            <ArcheotechShieldRow
              key={item.id}
              item={item}
              editable={editable}
              isEquipped={item.equipped ?? false}
              onToggleEquip={() => toggleEquipArcheotech(item.id)}
              slotsDisabled={!item.equipped && slotsRemaining < 1}
              onRemove={() => removeArcheotech(item.id)}
            />
          ))}
        />
      </section>

      {/* ── Pickers ───────────────────────────────────────────────────────── */}
      {picker === "ranged" && (
        <RangedPicker
          editable={editable}
          customItems={campaignCustomWeapons.filter((item) => item.status !== "archived")}
          onSelect={addFromRangedRef}
          onSelectCustomItem={addWeaponFromLibrary}
          references={NORMAL_RANGED_REFS}
          onCustom={() => {
            setShowCustomRanged(true);
          }}
          onClose={() => setPicker(null)}
          suspended={showCustomRanged}
        />
      )}
      {picker === "melee" && (
        <MeleePicker
          editable={editable}
          strengthBonus={strengthBonus}
          customItems={campaignCustomWeapons.filter((item) => item.status !== "archived")}
          onSelect={addFromMeleeRef}
          onSelectCustomItem={addWeaponFromLibrary}
          references={NORMAL_MELEE_REFS}
          onCustom={() => {
            setShowCustomMelee(true);
          }}
          onClose={() => setPicker(null)}
          suspended={showCustomMelee}
        />
      )}
      {picker === "grenades" && (
        <GrenadePicker
          editable={editable}
          strengthBonus={strengthBonus}
          customLibraryItems={campaignCustomGrenades}
          onSelect={addFromGrenadeRef}
          onSelectCustom={addWeaponFromLibrary}
          onCustom={() => {
            setShowCustomGrenade(true);
          }}
          onClose={() => setPicker(null)}
          suspended={showCustomGrenade}
        />
      )}
      {picker === "shields" && (
        <ShieldPicker
          editable={editable}
          customLibraryItems={campaignCustomShields}
          onSelect={addFromShieldRef}
          onSelectCustom={addShieldFromLibrary}
          onCustom={() => {
            setShowCustomShield(true);
          }}
          onClose={() => setPicker(null)}
          suspended={showCustomShield}
        />
      )}
      {showCustomGrenade && (
        <CustomGrenadeForm
          onAdd={addCustomGrenade}
          onCancel={() => {
            setShowCustomGrenade(false);
            setPicker("grenades");
          }}
        />
      )}
      {showCustomShield && (
        <CustomShieldForm
          onAdd={addCustomShield}
          onCancel={() => {
            setShowCustomShield(false);
            setPicker("shields");
          }}
        />
      )}
      {editingWeaponDefinition?.kind === "ranged" && (
        <CustomRangedForm
          title="Edit Custom Ranged Weapon"
          submitLabel="Save Draft"
          initialWeapon={{
            id: editingWeaponDefinition.weapon.id,
            ...stripWeaponKind(editingWeaponDefinition.libraryItem.data),
            ammoEntries: editingWeaponDefinition.weapon.ammoEntries,
            upgrades: editingWeaponDefinition.weapon.upgrades,
            quantity: editingWeaponDefinition.weapon.quantity,
            equipped: editingWeaponDefinition.weapon.equipped,
            customLibraryId: editingWeaponDefinition.libraryItem.id,
            customLibraryVersionId:
              editingWeaponDefinition.libraryItem.draftVersionId ??
              editingWeaponDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedWeaponDefinition}
          onCancel={() => setEditingWeaponDefinition(null)}
        />
      )}
      {editingWeaponDefinition?.kind === "melee" && (
        <CustomMeleeForm
          title="Edit Custom Melee Weapon"
          submitLabel="Save Draft"
          initialWeapon={{
            id: editingWeaponDefinition.weapon.id,
            ...stripWeaponKind(editingWeaponDefinition.libraryItem.data),
            upgrades: editingWeaponDefinition.weapon.upgrades,
            quantity: editingWeaponDefinition.weapon.quantity,
            equipped: editingWeaponDefinition.weapon.equipped,
            customLibraryId: editingWeaponDefinition.libraryItem.id,
            customLibraryVersionId:
              editingWeaponDefinition.libraryItem.draftVersionId ??
              editingWeaponDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedWeaponDefinition}
          onCancel={() => setEditingWeaponDefinition(null)}
        />
      )}
      {editingWeaponDefinition?.kind === "grenade" && (
        <CustomGrenadeForm
          title="Edit Custom Grenade or Mine"
          submitLabel="Save Draft"
          initialGrenade={{
            id: editingWeaponDefinition.weapon.id,
            ...stripWeaponKind(editingWeaponDefinition.libraryItem.data),
            quantity: editingWeaponDefinition.weapon.quantity,
            equipped: editingWeaponDefinition.weapon.equipped,
            customLibraryId: editingWeaponDefinition.libraryItem.id,
            customLibraryVersionId:
              editingWeaponDefinition.libraryItem.draftVersionId ??
              editingWeaponDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedWeaponDefinition}
          onCancel={() => setEditingWeaponDefinition(null)}
        />
      )}
      {editingShieldDefinition?.libraryItem.data.armourKind === "shield" && (
        <CustomShieldForm
          title="Edit Custom Shield"
          submitLabel="Save Draft"
          initialShield={{
            id: editingShieldDefinition.shield.id,
            ...stripArmourKind(editingShieldDefinition.libraryItem.data),
            equipped: editingShieldDefinition.shield.equipped,
            customLibraryId: editingShieldDefinition.libraryItem.id,
            customLibraryVersionId:
              editingShieldDefinition.libraryItem.draftVersionId ??
              editingShieldDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedShieldDefinition}
          onCancel={() => setEditingShieldDefinition(null)}
        />
      )}
    </div>
  );
}
