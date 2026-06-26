// src/pages/characterSheet/WeaponsTab.tsx
// Orchestration layer: state management and layout for all weapon categories.
// Card components, pickers and helpers live in ./weapons/.

import { useState, useCallback, useRef, Fragment, useMemo } from "react";
import type { TouchEvent } from "react";
import type {
  RangedWeapon,
  MeleeWeapon,
  WeaponAmmoEntry,
  GrenadeItem,
  CyberneticItem,
  ShieldItem,
  ArcheotechItem,
  WeaponCraftsmanship,
} from "../../types/Character";
import type {
  CampaignCustomItem,
  CustomArmourData,
  CustomGrenadeData,
  CustomWeaponData,
} from "../../types/CustomItems";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import { ARCHEOTECH_REFERENCE } from "../../data/reference/archeotechReference";
import {
  type RangedWeaponRef,
  type MeleeWeaponRef,
  type GrenadeRef,
  type ShieldRef,
} from "../../data/reference/weaponReference";
import { RangedCard, RangedPicker, CustomRangedForm } from "./weapons/RangedCard";
import { MeleeCard, MeleePicker, CustomMeleeForm } from "./weapons/MeleeCard";
import { GrenadeCard, GrenadePicker, CustomGrenadeForm } from "./weapons/GrenadeCard";
import { ShieldCard, ShieldPicker, CustomShieldForm } from "./weapons/ShieldCard";
import { CyberneticWeaponCard } from "./weapons/CyberneticWeaponCard";
import { ArcheotechWeaponCard } from "./weapons/ArcheotechWeaponCard";
import { IndependentCardGrid } from "./weapons/IndependentCardGrid";
import {
  isIntegratedRangedWeapon,
  isIntegratedMeleeWeapon,
  NORMAL_RANGED_REFS,
  NORMAL_MELEE_REFS,
  rangedRulesForCraftsmanship,
  meleeDamageForCraftsmanship,
  compareWeaponEntries,
} from "../../utils/weaponUtils";
import { SectionHeader } from "../../ui/SectionHeader";
import { uiTextPlaceholder } from "../../ui/editableStyles";
import { useCampaignCustomItems } from "../../hooks/useCampaignCustomItems";
import {
  archiveCustomItem,
  createDraftCustomItem,
  inferCustomItemStatus,
  publishAndUpdateAllCopies,
  publishCustomItem,
  removeAllCustomItemCopies,
  saveDraftCustomItem,
} from "../../services/customItemService";
import { useToast } from "../../components/Toast";

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

type WeaponLibraryAction = "publish" | "archive" | "updateAll";

type PickerTarget = "ranged" | "melee" | "grenades" | "shields" | null;
type WeaponMobileSection = NonNullable<PickerTarget>;

const MOBILE_WEAPON_SECTIONS: {
  id: WeaponMobileSection;
  label: string;
  ariaLabel: string;
  activeClass: string;
}[] = [
  {
    id: "ranged",
    label: "Ranged",
    ariaLabel: "Ranged weapons",
    activeClass: "border-sky-400 bg-sky-600/80 text-white shadow-sm shadow-sky-950/50",
  },
  {
    id: "melee",
    label: "Melee",
    ariaLabel: "Melee weapons",
    activeClass: "border-rose-400 bg-rose-600/80 text-white shadow-sm shadow-rose-950/50",
  },
  {
    id: "grenades",
    label: "Gren.",
    ariaLabel: "Grenades and mines",
    activeClass: "border-orange-400 bg-orange-600/80 text-white shadow-sm shadow-orange-950/50",
  },
  {
    id: "shields",
    label: "Shields",
    ariaLabel: "Shields",
    activeClass: "border-emerald-400 bg-emerald-600/80 text-white shadow-sm shadow-emerald-950/50",
  },
];

// ─── Slot System ─────────────────────────────────────────────────────────────

const MAX_WEAPON_SLOTS = 4;
const MAX_GRENADE_TYPES = 2;

function getRangedSlots(weapon: RangedWeapon): number {
  return (weapon.class ?? "").toLowerCase().includes("heavy") ? 2 : 1;
}
function getMeleeSlots(weapon: MeleeWeapon): number {
  return (weapon.class ?? "").toLowerCase().includes("two-handed") ? 2 : 1;
}

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
  const [weaponSectionTransition, setWeaponSectionTransition] = useState<"idle" | "sliding">(
    "idle"
  );
  const [editingWeaponDefinition, setEditingWeaponDefinition] =
    useState<EditingWeaponDefinition | null>(null);
  const [editingShieldDefinition, setEditingShieldDefinition] =
    useState<EditingShieldDefinition | null>(null);
  const [busyLibraryAction, setBusyLibraryAction] = useState<{
    itemId: string;
    action: WeaponLibraryAction;
  } | null>(null);
  const touchStartX = useRef<number | null>(null);
  const toast = useToast();

  const { items: campaignCustomWeaponItems, loading: weaponsLoading } = useCampaignCustomItems({
    campaignId,
    category: "weapon",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomWeapons = useMemo(
    () => campaignCustomWeaponItems as CampaignCustomItem<"weapon">[],
    [campaignCustomWeaponItems]
  );
  const campaignCustomWeaponsById = useMemo(
    () => new Map(campaignCustomWeapons.map((item) => [item.id, item])),
    [campaignCustomWeapons]
  );
  const campaignCustomGrenades = useMemo(
    () => campaignCustomWeapons.filter((item) => item.data.weaponKind === "grenade"),
    [campaignCustomWeapons]
  );
  const { items: campaignCustomArmourItems, loading: armoursLoading } = useCampaignCustomItems({
    campaignId,
    category: "armour",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomArmour = useMemo(
    () => campaignCustomArmourItems as CampaignCustomItem<"armour">[],
    [campaignCustomArmourItems]
  );
  const campaignCustomArmourById = useMemo(
    () => new Map(campaignCustomArmour.map((item) => [item.id, item])),
    [campaignCustomArmour]
  );
  const campaignCustomShields = useMemo(
    () => campaignCustomArmour.filter((item) => item.data.armourKind === "shield"),
    [campaignCustomArmour]
  );

  // ── Archeotech weapons ─────────────────────────────────────────────────────
  const archeotechGrenadeItems = (archeotech ?? []).filter((a) => a.type === "Grenade");
  const archeotechMineItems = (archeotech ?? []).filter((a) => a.type === "Mine");
  const archeotechWeaponItems = (archeotech ?? []).filter((a) => a.type === "Weapon");
  const archeotechRangedItems = archeotechWeaponItems.filter((a) => {
    const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === a.referenceId);
    return ref?.weaponClass !== "Melee";
  });
  const archeotechMeleeWeaponItems = archeotechWeaponItems.filter((a) => {
    const ref = ARCHEOTECH_REFERENCE.find((r) => r.id === a.referenceId);
    return ref?.weaponClass === "Melee";
  });

  // ── Cybernetic weapons ─────────────────────────────────────────────────────
  const cyberneticWeaponItems = (cybernetics ?? []).flatMap((c) => {
    const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
    if (!ref?.weapon) return [];
    return [{ cybernetic: c, weapon: ref.weapon }];
  });
  const cyberneticRangedItems = cyberneticWeaponItems.filter(
    ({ weapon }) => weapon.type === "ranged"
  );
  const cyberneticMeleeItems = cyberneticWeaponItems.filter(
    ({ weapon }) => weapon.type === "melee"
  );

  const normalRangedWeapons = rangedWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => !isIntegratedRangedWeapon(weapon));
  const equippedIntegratedRanged = rangedWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => isIntegratedRangedWeapon(weapon) && weapon.equipped);
  const normalMeleeWeapons = meleeWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => !isIntegratedMeleeWeapon(weapon));
  const equippedIntegratedMelee = meleeWeapons
    .map((weapon, index) => ({ weapon, index }))
    .filter(({ weapon }) => isIntegratedMeleeWeapon(weapon) && weapon.equipped);

  // ── Unified sorted lists ───────────────────────────────────────────────────
  const allRangedEntries = [
    ...normalRangedWeapons.map(({ weapon, index }) => ({
      kind: "regular" as const,
      weapon,
      index,
      name: weapon.name,
    })),
    ...cyberneticRangedItems.map(({ cybernetic, weapon }) => ({
      kind: "cybernetic" as const,
      cybernetic,
      weapon,
      name: weapon.name,
    })),
    ...archeotechRangedItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...equippedIntegratedRanged.map(({ weapon, index }) => ({
      kind: "integrated" as const,
      weapon,
      index,
      name: weapon.name,
    })),
  ].sort(compareWeaponEntries);

  const allMeleeEntries = [
    ...normalMeleeWeapons.map(({ weapon, index }) => ({
      kind: "regular" as const,
      weapon,
      index,
      name: weapon.name,
    })),
    ...cyberneticMeleeItems.map(({ cybernetic, weapon }) => ({
      kind: "cybernetic" as const,
      cybernetic,
      weapon,
      name: weapon.name,
    })),
    ...archeotechMeleeWeaponItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...equippedIntegratedMelee.map(({ weapon, index }) => ({
      kind: "integrated" as const,
      weapon,
      index,
      name: weapon.name,
    })),
  ].sort(compareWeaponEntries);

  const allGrenadeEntries = [
    ...grenades.map((item) => ({ kind: "regular" as const, item, name: item.name })),
    ...archeotechGrenadeItems.map((item) => ({
      kind: "archeotech" as const,
      item,
      name: item.name,
    })),
    ...archeotechMineItems.map((item) => ({ kind: "archeotech" as const, item, name: item.name })),
  ].sort((a, b) => {
    const aEq = a.item.equipped ? 0 : 1;
    const bEq = b.item.equipped ? 0 : 1;
    if (aEq !== bEq) return aEq - bEq;
    return a.name.localeCompare(b.name);
  });

  // ── Slot counting ──────────────────────────────────────────────────────────
  const equippedWeaponSlots =
    normalRangedWeapons
      .filter(({ weapon }) => weapon.equipped)
      .reduce((sum, { weapon }) => sum + getRangedSlots(weapon), 0) +
    normalMeleeWeapons
      .filter(({ weapon }) => weapon.equipped)
      .reduce((sum, { weapon }) => sum + getMeleeSlots(weapon), 0) +
    archeotechRangedItems.filter((a) => a.equipped).length +
    archeotechMeleeWeaponItems.filter((a) => a.equipped).length +
    equippedIntegratedRanged.reduce((sum, { weapon }) => sum + getRangedSlots(weapon), 0) +
    equippedIntegratedMelee.reduce((sum, { weapon }) => sum + getMeleeSlots(weapon), 0) +
    (shields ?? []).filter((s) => s.equipped).length;
  const slotsRemaining = MAX_WEAPON_SLOTS - equippedWeaponSlots;
  const equippedGrenadeTypes =
    grenades.filter((g) => g.equipped).length +
    [...archeotechGrenadeItems, ...archeotechMineItems].filter((a) => a.equipped).length;

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
      setPicker(null);
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
      setPicker(null);
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
          weight: ref.weight,
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
          craftsmanship,
          quantity: isThrown ? 1 : undefined,
        },
      ]);
      setPicker(null);
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
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

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
        setPicker(null);
        return;
      }

      if (libraryItem.data.weaponKind === "grenade") {
        onUpdateGrenades([
          ...grenades,
          buildGrenadeSnapshot(crypto.randomUUID(), {}, libraryItem.data, libraryItem.id, versionId),
        ]);
        setPicker(null);
        return;
      }

      onUpdateMelee([
        ...meleeWeapons,
        buildMeleeWeaponSnapshot(crypto.randomUUID(), {}, libraryItem.data, libraryItem.id, versionId),
      ]);
      setPicker(null);
    },
    [editable, grenades, meleeWeapons, onUpdateGrenades, onUpdateMelee, onUpdateRanged, rangedWeapons, toast]
  );

  const addShieldFromLibrary = useCallback(
    (libraryItem: CampaignCustomItem<"armour">) => {
      if (!editable || !onUpdateShields) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

      if (!versionId) {
        toast.error("This custom shield has no usable version.");
        return;
      }

      if (libraryItem.data.armourKind !== "shield") return;

      onUpdateShields([
        ...(shields ?? []),
        buildShieldSnapshot(crypto.randomUUID(), {}, libraryItem.data, libraryItem.id, versionId),
      ]);
      setPicker(null);
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

  const publishWeaponDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"weapon">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom weapon published.");
      } catch (err) {
        console.error("Failed to publish custom weapon:", err);
        toast.error("Failed to publish custom weapon.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveWeaponDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"weapon">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        toast.success("Custom weapon archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom weapon:", err);
        toast.error("Failed to archive custom weapon.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllWeaponCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"weapon">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(`Updated ${updatedCopies} weapon ${updatedCopies === 1 ? "copy" : "copies"}.`);
      } catch (err) {
        console.error("Failed to update custom weapon copies:", err);
        toast.error("Failed to update custom weapon copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const publishShieldDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"armour">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom shield published.");
      } catch (err) {
        console.error("Failed to publish custom shield:", err);
        toast.error("Failed to publish custom shield.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveShieldDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"armour">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        toast.success("Custom shield archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom shield:", err);
        toast.error("Failed to archive custom shield.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllShieldCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"armour">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(`Updated ${updatedCopies} shield ${updatedCopies === 1 ? "copy" : "copies"}.`);
      } catch (err) {
        console.error("Failed to update custom shield copies:", err);
        toast.error("Failed to update custom shield copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
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
      setPicker(null);
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
        toast.success("Custom shield saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom shield:", err);
        toast.error("Failed to save custom shield.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      editable,
      onUpdateShields,
      shields,
      toast,
      userId,
    ]
  );

  const removeShield = useCallback(
    (id: string) => {
      if (!editable || !onUpdateShields) return;
      onUpdateShields((shields ?? []).filter((s) => s.id !== id));
    },
    [editable, shields, onUpdateShields]
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

  const showWeaponSection = useCallback((section: WeaponMobileSection) => {
    setActiveWeaponSection((current) => {
      if (section === current) return current;
      setWeaponSectionTransition("sliding");
      window.setTimeout(() => setWeaponSectionTransition("idle"), 180);
      return section;
    });
  }, []);

  const shiftWeaponSection = useCallback((offset: -1 | 1) => {
    setActiveWeaponSection((current) => {
      const currentIndex = MOBILE_WEAPON_SECTIONS.findIndex((section) => section.id === current);
      const nextIndex =
        (currentIndex + offset + MOBILE_WEAPON_SECTIONS.length) % MOBILE_WEAPON_SECTIONS.length;
      const next = MOBILE_WEAPON_SECTIONS[nextIndex].id;
      if (next === current) return current;
      setWeaponSectionTransition("sliding");
      window.setTimeout(() => setWeaponSectionTransition("idle"), 180);
      return next;
    });
  }, []);

  const handleWeaponTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleWeaponTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const startX = touchStartX.current;
      const endX = event.changedTouches[0]?.clientX;
      touchStartX.current = null;
      if (startX === null || endX === undefined) return;

      const deltaX = endX - startX;
      if (Math.abs(deltaX) < 50) return;
      shiftWeaponSection(deltaX < 0 ? 1 : -1);
    },
    [shiftWeaponSection]
  );

  const mobileSectionTransition =
    weaponSectionTransition === "sliding" ? "opacity-0 translate-x-3" : "opacity-100";
  const visibleWeaponSectionClass = (section: WeaponMobileSection) =>
    [
      "space-y-3",
      activeWeaponSection === section
        ? `min-h-[45vh] lg:min-h-0 transition-all duration-150 ease-out motion-reduce:transition-none ${mobileSectionTransition}`
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
        !!libraryItem &&
        editable &&
        (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction =
        busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
          ? busyLibraryAction.action
          : null;

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
      busyLibraryAction,
      editable,
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
        !!libraryItem &&
        editable &&
        (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction =
        busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
          ? busyLibraryAction.action
          : null;

      return {
        libraryItem,
        isDM: isDM && editable,
        canEditDefinition,
        busyAction: rowBusyAction,
        onEditDefinition: () =>
          libraryItem && setEditingWeaponDefinition({ kind: "grenade", weapon: grenade, libraryItem }),
        onPublish: () => libraryItem && publishWeaponDefinition(libraryItem),
        onArchive: () => libraryItem && archiveWeaponDefinition(libraryItem),
        onUpdateAllCopies: () => libraryItem && updateAllWeaponCopies(libraryItem),
      };
    },
    [
      archiveWeaponDefinition,
      busyLibraryAction,
      editable,
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
        !!libraryItem &&
        editable &&
        (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction =
        busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
          ? busyLibraryAction.action
          : null;

      return {
        libraryItem,
        isDM: isDM && editable,
        canEditDefinition,
        busyAction: rowBusyAction,
        onEditDefinition: () =>
          libraryItem && setEditingShieldDefinition({ shield, libraryItem }),
        onPublish: () => libraryItem && publishShieldDefinition(libraryItem),
        onArchive: () => libraryItem && archiveShieldDefinition(libraryItem),
        onUpdateAllCopies: () => libraryItem && updateAllShieldCopies(libraryItem),
      };
    },
    [
      archiveShieldDefinition,
      busyLibraryAction,
      editable,
      getLibraryItemForShield,
      isDM,
      publishShieldDefinition,
      updateAllShieldCopies,
      userId,
    ]
  );

  if (weaponsLoading || armoursLoading) return null;

  return (
    <div
      className="space-y-8"
      onTouchStart={handleWeaponTouchStart}
      onTouchEnd={handleWeaponTouchEnd}
    >
      <div className="lg:hidden">
        <div
          className="grid grid-cols-4 gap-1 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Weapon sections"
        >
          {MOBILE_WEAPON_SECTIONS.map((section) => {
            const active = activeWeaponSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={section.ariaLabel}
                onClick={() => showWeaponSection(section.id)}
                className={[
                  "rounded-md px-1 py-1.5 text-[11px] font-semibold transition border",
                  active
                    ? section.activeClass
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={weaponPairClass}>
        {/* ── RANGED ─────────────────────────────────────────────────────── */}
        <section className={visibleWeaponSectionClass("ranged")}>
          <div className="flex items-center justify-between">
            <SectionHeader>Ranged</SectionHeader>
            {!showCustomRanged && (
              <button
                onClick={() => setPicker("ranged")}
                className="text-sm lg:text-base px-2 py-0.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
              >
                {editable ? "+ Add" : "View"}
              </button>
            )}
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
                  onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                  slotsDisabled={!entry.item.equipped && slotsRemaining < 1}
                />
              );
            if (entry.kind === "integrated")
              return (
                <RangedCard
                  key={entry.weapon.id}
                  weapon={entry.weapon}
                  editable={editable}
                  integrated
                  allowUpgrades={false}
                  forceExpanded
                  isEquipped
                  onRemove={() => {}}
                  onAddUpgrade={() => {}}
                  onRemoveUpgrade={() => {}}
                  onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(entry.weapon.id, entries)}
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
                {...getWeaponLibraryProps(entry.weapon, "ranged")}
                onRemove={() => removeRanged(entry.index)}
                onAddUpgrade={(upgradeId) => addUpgradeToRanged(entry.weapon.id, upgradeId)}
                onRemoveUpgrade={(upgradeId) =>
                  removeUpgradeFromRanged(entry.weapon.id, upgradeId)
                }
                onUpdateAmmoEntries={(entries) => updateRangedAmmoEntries(entry.weapon.id, entries)}
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
            <CustomRangedForm onAdd={addCustomRanged} onCancel={() => setShowCustomRanged(false)} />
          )}
        </section>

        {/* ── MELEE ──────────────────────────────────────────────────────── */}
        <section className={visibleWeaponSectionClass("melee")}>
          <div className="flex items-center justify-between">
            <SectionHeader>Melee</SectionHeader>
            {!showCustomMelee && (
              <button
                onClick={() => setPicker("melee")}
                className="text-sm lg:text-base px-2 py-0.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
              >
                {editable ? "+ Add" : "View"}
              </button>
            )}
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
                  onToggleEquip={() => toggleEquipArcheotech(entry.item.id)}
                  slotsDisabled={!entry.item.equipped && slotsRemaining < 1}
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
                onRemoveUpgrade={(upgradeId) =>
                  removeUpgradeFromMelee(entry.weapon.id, upgradeId)
                }
                onUpdateQuantity={(qty) => updateMeleeQuantity(entry.weapon.id, qty)}
                isEquipped={entry.weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipMelee(entry.weapon.id)}
                slotsDisabled={
                  !entry.weapon.equipped && slotsRemaining < getMeleeSlots(entry.weapon)
                }
              />
            );
          })}

          {showCustomMelee && (
            <CustomMeleeForm onAdd={addCustomMelee} onCancel={() => setShowCustomMelee(false)} />
          )}
        </section>
      </div>

      {/* ── GRENADES & MINES ─────────────────────────────────────────────── */}
      <section className={visibleWeaponSectionClass("grenades")}>
        <div className="flex items-center justify-between">
          <SectionHeader>Grenades & Mines</SectionHeader>
          <button
            onClick={() => setPicker("grenades")}
            className="text-sm lg:text-base px-2 py-0.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {allGrenadeEntries.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No grenades or mines carried.</p>
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
      <section className={visibleWeaponSectionClass("shields")}>
        <div className="flex items-center justify-between">
          <SectionHeader>Shields</SectionHeader>
          <button
            onClick={() => setPicker("shields")}
            className="text-sm lg:text-base px-2 py-0.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {(shields ?? []).length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No shields carried.</p>
        )}

        <IndependentCardGrid
          items={[...(shields ?? [])]
            .sort((a, b) => {
              if (a.equipped && !b.equipped) return -1;
              if (!a.equipped && b.equipped) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((item) => (
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
            setPicker(null);
            setShowCustomRanged(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "melee" && (
        <MeleePicker
          editable={editable}
          customItems={campaignCustomWeapons.filter((item) => item.status !== "archived")}
          onSelect={addFromMeleeRef}
          onSelectCustomItem={addWeaponFromLibrary}
          references={NORMAL_MELEE_REFS}
          onCustom={() => {
            setPicker(null);
            setShowCustomMelee(true);
          }}
          onClose={() => setPicker(null)}
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
            setPicker(null);
            setShowCustomGrenade(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "shields" && (
        <ShieldPicker
          editable={editable}
          customLibraryItems={campaignCustomShields}
          onSelect={addFromShieldRef}
          onSelectCustom={addShieldFromLibrary}
          onCustom={() => {
            setPicker(null);
            setShowCustomShield(true);
          }}
          onClose={() => setPicker(null)}
        />
      )}
      {showCustomGrenade && (
        <CustomGrenadeForm
          onAdd={addCustomGrenade}
          onCancel={() => setShowCustomGrenade(false)}
        />
      )}
      {showCustomShield && (
        <CustomShieldForm
          onAdd={addCustomShield}
          onCancel={() => setShowCustomShield(false)}
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

type CustomRangedWeaponData = Extract<CustomWeaponData, { weaponKind: "ranged" }>;
type CustomMeleeWeaponData = Extract<CustomWeaponData, { weaponKind: "melee" }>;
type CustomShieldData = Extract<CustomArmourData, { armourKind: "shield" }>;

function toCustomRangedWeaponData(weapon: RangedWeapon): CustomRangedWeaponData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    ammoEntries: _ammoEntries,
    equipped: _equipped,
    quantity: _quantity,
    upgrades: _upgrades,
    ...data
  } = weapon;

  return {
    ...data,
    weaponKind: "ranged",
  };
}

function toCustomMeleeWeaponData(weapon: MeleeWeapon): CustomMeleeWeaponData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    quantity: _quantity,
    upgrades: _upgrades,
    ...data
  } = weapon;

  return {
    ...data,
    weaponKind: "melee",
  };
}

function toCustomGrenadeData(grenade: GrenadeItem): CustomGrenadeData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    quantity: _quantity,
    custom: _custom,
    ...data
  } = grenade;

  return {
    ...data,
    weaponKind: "grenade",
  };
}

function toCustomShieldData(shield: ShieldItem): CustomShieldData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    ...data
  } = shield;

  return {
    ...data,
    armourKind: "shield",
  };
}

function stripWeaponKind<TData extends CustomWeaponData>(data: TData): Omit<TData, "weaponKind"> {
  const { weaponKind: _weaponKind, ...weaponData } = data;
  return weaponData;
}

function stripArmourKind<TData extends CustomArmourData>(data: TData): Omit<TData, "armourKind"> {
  const { armourKind: _armourKind, ...armourData } = data;
  return armourData;
}

function buildRangedWeaponSnapshot(
  id: string,
  copyFields: Partial<RangedWeapon>,
  data: CustomRangedWeaponData,
  customLibraryId: string,
  customLibraryVersionId: string
): RangedWeapon {
  const { weaponKind: _weaponKind, ...weaponData } = data;
  const quantity =
    copyFields.quantity ??
    (weaponData.class?.toLowerCase().includes("thrown") ? 1 : undefined);

  return {
    id,
    ...weaponData,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.ammoEntries ? { ammoEntries: copyFields.ammoEntries } : {}),
    ...(copyFields.upgrades ? { upgrades: copyFields.upgrades } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

function buildMeleeWeaponSnapshot(
  id: string,
  copyFields: Partial<MeleeWeapon>,
  data: CustomMeleeWeaponData,
  customLibraryId: string,
  customLibraryVersionId: string
): MeleeWeapon {
  const { weaponKind: _weaponKind, ...weaponData } = data;
  const quantity =
    copyFields.quantity ??
    (weaponData.class?.toLowerCase().includes("thrown") ? 1 : undefined);

  return {
    id,
    ...weaponData,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.upgrades ? { upgrades: copyFields.upgrades } : {}),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

function buildGrenadeSnapshot(
  id: string,
  copyFields: Partial<GrenadeItem>,
  data: CustomGrenadeData,
  customLibraryId: string,
  customLibraryVersionId: string
): GrenadeItem {
  const { weaponKind: _weaponKind, ...grenadeData } = data;

  return {
    id,
    ...grenadeData,
    custom: true,
    quantity: copyFields.quantity ?? 1,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

function buildShieldSnapshot(
  id: string,
  copyFields: Partial<ShieldItem>,
  data: CustomShieldData,
  customLibraryId: string,
  customLibraryVersionId: string
): ShieldItem {
  const { armourKind: _armourKind, ...shieldData } = data;

  return {
    id,
    ...shieldData,
    custom: true,
    customLibraryId,
    customLibraryVersionId,
    ...(copyFields.equipped !== undefined ? { equipped: copyFields.equipped } : {}),
  };
}

function buildFallbackWeaponLibraryItem({
  campaignId,
  weapon,
  kind,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  weapon: RangedWeapon | MeleeWeapon;
  kind: "ranged" | "melee";
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"weapon"> {
  const data =
    kind === "ranged"
      ? toCustomRangedWeaponData(weapon as RangedWeapon)
      : toCustomMeleeWeaponData(weapon as MeleeWeapon);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: weapon.customLibraryId ?? "",
    campaignId,
    category: "weapon",
    status: inferCustomItemStatus(weapon),
    name: weapon.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: weapon.customLibraryVersionId ?? null,
    latestVersionId: weapon.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}

function buildFallbackGrenadeLibraryItem({
  campaignId,
  grenade,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  grenade: GrenadeItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"weapon"> {
  const data = toCustomGrenadeData(grenade);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: grenade.customLibraryId ?? "",
    campaignId,
    category: "weapon",
    status: inferCustomItemStatus(grenade),
    name: grenade.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: grenade.customLibraryVersionId ?? null,
    latestVersionId: grenade.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}

function buildFallbackShieldLibraryItem({
  campaignId,
  shield,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  shield: ShieldItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"armour"> {
  const data = toCustomShieldData(shield);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: shield.customLibraryId ?? "",
    campaignId,
    category: "armour",
    status: inferCustomItemStatus(shield),
    name: shield.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: shield.customLibraryVersionId ?? null,
    latestVersionId: shield.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}
