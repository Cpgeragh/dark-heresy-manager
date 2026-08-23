// src/pages/characterSheet/CyberneticsTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type {
  CyberneticItem,
  CyberneticCraftsmanship,
  ArmourLocationKey,
  RangedWeapon,
  MeleeWeapon,
  WeaponCraftsmanship,
} from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import type { RangedWeaponRef, MeleeWeaponRef } from "../../../data/reference/weaponReference";
import type {
  CampaignCustomItem,
  CustomCyberneticData,
  CustomWeaponData,
} from "../../../types/CustomItems";
import type { ArcheotechItem } from "../../../types/Character";
import { ImplantPicker } from "./ImplantPicker";
import { ImplantRow } from "./ImplantRow";
import { CustomImplantForm } from "./CustomImplantForm";
import {
  craftsmanshipAvailability,
  craftsmanshipValue,
  nextAvailableCraftsmanship,
} from "./cyberneticsHelpers";
import { Button } from "../../../ui/Button";
import { SectionHeader } from "../../../ui/SectionHeader";
import { ErrorState } from "../../../ui/ErrorState";
import { LoadingState } from "../../../ui/LoadingState";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { uiItemName, uiSection, uiTextPlaceholder } from "../../../ui/editableStyles";
import { Chip } from "../../../ui/Chip";
import { sourceColour } from "../../../ui/sourceStyles";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../../hooks/useCustomItemLibraryActions";
import {
  createDraftCustomItem,
  inferCustomItemStatus,
  saveDraftCustomItem,
} from "../../../services/customItemService";
import { useToast } from "../../../components/Toast";
import { IntegratedWeaponPicker } from "../weapons/IntegratedWeaponPicker";
import { RangedCard } from "../weapons/RangedCard";
import { CustomRangedForm } from "../weapons/CustomRangedForm";
import { MeleeCard } from "../weapons/MeleeCard";
import { CustomMeleeForm } from "../weapons/CustomMeleeForm";
import { IndependentCardGrid } from "../weapons/IndependentCardGrid";
import { ArcheotechWeaponCard } from "../weapons/ArcheotechWeaponCard";
import {
  buildMeleeWeaponSnapshot,
  buildRangedWeaponSnapshot,
} from "../weapons/weaponSnapshotHelpers";
import { ArcheotechImplantRow } from "./ArcheotechImplantRow";
import { ConcealedWeaponBionicInstaller } from "./ConcealedWeaponBionicInstaller";
import {
  isIntegratedRangedWeapon,
  isIntegratedMeleeWeapon,
  rangedRulesForCraftsmanship,
  meleeDamageForCraftsmanship,
} from "../../../utils/weaponUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CyberneticsTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  cybernetics: CyberneticItem[];
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  strengthBonus?: number;
  editable: boolean;
  onUpdate: (next: CyberneticItem[]) => void | Promise<void>;
  onUpdateRanged: (next: RangedWeapon[]) => void | Promise<void>;
  onUpdateMelee: (next: MeleeWeapon[]) => void | Promise<void>;
  archeotech?: ArcheotechItem[];
  onUpdateArcheotech?: (next: ArcheotechItem[]) => void | Promise<void>;
  career?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditingCyberneticDefinition {
  item: CyberneticItem;
  libraryItem: CampaignCustomItem<"cybernetic">;
}

export function CyberneticsTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  cybernetics,
  rangedWeapons,
  meleeWeapons,
  strengthBonus = 0,
  editable,
  onUpdate,
  onUpdateRanged,
  onUpdateMelee,
  archeotech,
  onUpdateArcheotech,
  career,
}: CyberneticsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [installingConcealedWeapon, setInstallingConcealedWeapon] = useState<{
    ref: CyberneticRef;
    craftsmanship: CyberneticCraftsmanship;
  } | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showIntegratedPicker, setShowIntegratedPicker] = useState(false);
  const [showCustomIntegratedRanged, setShowCustomIntegratedRanged] = useState(false);
  const [showCustomIntegratedMelee, setShowCustomIntegratedMelee] = useState(false);
  const [installingCustomCybernetic, setInstallingCustomCybernetic] =
    useState<CampaignCustomItem<"cybernetic"> | null>(null);
  const [editingCyberneticDefinition, setEditingCyberneticDefinition] =
    useState<EditingCyberneticDefinition | null>(null);
  const toast = useToast();
  const {
    publishDefinition: publishCyberneticDefinition,
    archiveDefinition: archiveCyberneticDefinition,
    updateAllCopies: updateAllCyberneticCopies,
    getBusyAction,
  } = useCustomItemLibraryActions<"cybernetic">({
    campaignId,
    userId,
    itemLabel: "cybernetic",
  });

  const {
    items: campaignCustomItems,
    loading: customItemsLoading,
    error: customItemsError,
  } = useCampaignCustomItems({
    campaignId,
    categories: ["cybernetic", "weapon"],
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomCybernetics = useMemo(
    () =>
      campaignCustomItems.filter(
        (item) => item.category === "cybernetic"
      ) as CampaignCustomItem<"cybernetic">[],
    [campaignCustomItems]
  );
  const campaignCustomCyberneticsById = useMemo(
    () => new Map(campaignCustomCybernetics.map((item) => [item.id, item])),
    [campaignCustomCybernetics]
  );
  const campaignCustomIntegratedWeapons = useMemo(
    () =>
      (
        campaignCustomItems.filter(
          (item) => item.category === "weapon"
        ) as CampaignCustomItem<"weapon">[]
      ).filter((item) => {
        const data = item.data;
        return (
          item.status !== "archived" &&
          (data.weaponKind === "ranged" || data.weaponKind === "melee") &&
          !!data.integrated
        );
      }),
    [campaignCustomItems]
  );
  const sortedCybernetics = useMemo(
    () => [...cybernetics].sort((a, b) => a.name.localeCompare(b.name)),
    [cybernetics]
  );

  const install = useCallback(
    (
      ref: CyberneticRef,
      craftsmanship: CyberneticCraftsmanship | undefined,
      bodyLocation?: ArmourLocationKey[],
      gmValue?: string,
      gmRarity?: string
    ) => {
      if (!editable) return;
      if (ref.id === "ih-concealed-weapon-bionic") {
        setShowPicker(false);
        setInstallingConcealedWeapon({ ref, craftsmanship: craftsmanship ?? "Common" });
        return;
      }
      onUpdate([
        ...cybernetics,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          ...(craftsmanship ? { craftsmanship } : {}),
          ...(craftsmanship
            ? { value: gmValue ?? craftsmanshipValue(ref, craftsmanship) }
            : gmValue !== undefined
              ? { value: gmValue }
              : {}),
          availability: gmRarity ?? ref.availability,
          source: ref.source,
          ...(bodyLocation ? { bodyLocation } : {}),
        },
      ]);
    },
    [editable, cybernetics, onUpdate]
  );

  const installConcealedWeaponBionic = useCallback(
    (armId: string, weapon: { id: string; type: "ranged" | "melee" }) => {
      if (!editable || !installingConcealedWeapon) return;
      const { ref, craftsmanship } = installingConcealedWeapon;
      const cyberneticId = crypto.randomUUID();
      onUpdate([
        ...cybernetics,
        {
          id: cyberneticId,
          referenceId: ref.id,
          name: ref.name,
          craftsmanship,
          value: craftsmanshipValue(ref, craftsmanship),
          availability: craftsmanshipAvailability(ref, craftsmanship),
          source: ref.source,
          concealedWeapon: { armId, weaponId: weapon.id, weaponType: weapon.type },
        },
      ]);
      if (weapon.type === "ranged") {
        onUpdateRanged(
          rangedWeapons.map((item) =>
            item.id === weapon.id
              ? { ...item, concealedBionic: { cyberneticId, craftsmanship } }
              : item
          )
        );
      } else {
        onUpdateMelee(
          meleeWeapons.map((item) =>
            item.id === weapon.id
              ? { ...item, concealedBionic: { cyberneticId, craftsmanship } }
              : item
          )
        );
      }
      setInstallingConcealedWeapon(null);
      setShowPicker(true);
    },
    [
      cybernetics,
      editable,
      installingConcealedWeapon,
      meleeWeapons,
      onUpdate,
      onUpdateMelee,
      onUpdateRanged,
      rangedWeapons,
    ]
  );

  const cycleQuality = useCallback(
    (id: string) => {
      if (!editable) return;
      const current = cybernetics.find((item) => item.id === id);
      const ref = CYBERNETICS_REFERENCE.find((item) => item.id === current?.referenceId);
      const craftsmanship = nextAvailableCraftsmanship(current?.craftsmanship ?? "Common", ref);
      if (current?.concealedWeapon) {
        if (current.concealedWeapon.weaponType === "ranged") {
          onUpdateRanged(
            rangedWeapons.map((item) =>
              item.id === current.concealedWeapon?.weaponId && item.concealedBionic
                ? { ...item, concealedBionic: { ...item.concealedBionic, craftsmanship } }
                : item
            )
          );
        } else {
          onUpdateMelee(
            meleeWeapons.map((item) =>
              item.id === current.concealedWeapon?.weaponId && item.concealedBionic
                ? { ...item, concealedBionic: { ...item.concealedBionic, craftsmanship } }
                : item
            )
          );
        }
      }
      onUpdate(
        cybernetics.map((c) => {
          if (c.id !== id) return c;
          const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
          const craftsmanship = nextAvailableCraftsmanship(c.craftsmanship ?? "Common", ref);
          const hasQualitySpecificCost = Boolean(ref?.poorValue || ref?.goodValue);
          const hasQualitySpecificAvailability = Boolean(
            ref?.poorAvailability || ref?.goodAvailability
          );
          return {
            ...c,
            craftsmanship,
            ...(hasQualitySpecificCost && ref
              ? { value: craftsmanshipValue(ref, craftsmanship) }
              : {}),
            ...(hasQualitySpecificAvailability && ref
              ? { availability: craftsmanshipAvailability(ref, craftsmanship) }
              : {}),
          };
        })
      );
    },
    [editable, cybernetics, meleeWeapons, onUpdate, onUpdateMelee, onUpdateRanged, rangedWeapons]
  );

  const addCustomImplant = useCallback(
    async (item: CyberneticItem) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom cybernetics.");
        return;
      }

      try {
        const data = toCustomCyberneticData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "cybernetic",
          creator: { userId, characterId, characterName },
          data,
        });

        await onUpdate([
          ...cybernetics,
          buildCyberneticSnapshot(item.id, item.bodyLocation, data, customItemId, versionId),
        ]);
        setShowCustomForm(false);
        setShowPicker(true);
        toast.success("Custom cybernetic saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom cybernetic:", err);
        toast.error("Failed to save custom cybernetic.");
      }
    },
    [campaignId, characterId, characterName, cybernetics, editable, onUpdate, toast, userId]
  );

  const beginInstallCyberneticFromLibrary = useCallback(
    (libraryItem: CampaignCustomItem<"cybernetic">) => {
      if (!editable) return;
      setShowPicker(false);
      setInstallingCustomCybernetic(libraryItem);
    },
    [editable]
  );

  const finishInstallCyberneticFromLibrary = useCallback(
    async (item: CyberneticItem) => {
      if (!editable || !installingCustomCybernetic) return;

      const libraryItem = installingCustomCybernetic;
      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);

      if (!versionId) {
        toast.error("This custom cybernetic has no usable version.");
        return;
      }

      await onUpdate([
        ...cybernetics,
        buildCyberneticSnapshot(
          item.id,
          item.bodyLocation,
          libraryItem.data,
          libraryItem.id,
          versionId
        ),
      ]);
      setInstallingCustomCybernetic(null);
      setShowPicker(true);
    },
    [cybernetics, editable, installingCustomCybernetic, onUpdate, toast]
  );

  const saveEditedCyberneticDefinition = useCallback(
    async (item: CyberneticItem) => {
      if (!editingCyberneticDefinition || !userId) return;

      try {
        const data = toCustomCyberneticData(item);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingCyberneticDefinition.libraryItem.id,
          category: "cybernetic",
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedCybernetics = cybernetics.map((cybernetic) =>
          cybernetic.id === editingCyberneticDefinition.item.id
            ? buildCyberneticSnapshot(
                cybernetic.id,
                cybernetic.bodyLocation,
                data,
                editingCyberneticDefinition.libraryItem.id,
                versionId
              )
            : cybernetic
        );

        await onUpdate(updatedCybernetics);
        setEditingCyberneticDefinition(null);
        toast.success("Custom cybernetic draft updated.");
      } catch (err) {
        console.error("Failed to update custom cybernetic definition:", err);
        toast.error("Failed to update custom cybernetic definition.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      cybernetics,
      editingCyberneticDefinition,
      onUpdate,
      toast,
      userId,
    ]
  );

  const removeImplant = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateRanged(
        rangedWeapons.map((item) =>
          item.concealedBionic?.cyberneticId === id ? { ...item, concealedBionic: undefined } : item
        )
      );
      onUpdateMelee(
        meleeWeapons.map((item) =>
          item.concealedBionic?.cyberneticId === id ? { ...item, concealedBionic: undefined } : item
        )
      );
      onUpdate(cybernetics.filter((c) => c.id !== id));
    },
    [editable, cybernetics, meleeWeapons, onUpdate, onUpdateMelee, onUpdateRanged, rangedWeapons]
  );

  // ── Integrated weapons ─────────────────────────────────────────────────────

  const integratedRanged = useMemo(
    () =>
      rangedWeapons.filter(isIntegratedRangedWeapon).sort((a, b) => a.name.localeCompare(b.name)),
    [rangedWeapons]
  );
  const integratedMelee = useMemo(
    () => meleeWeapons.filter(isIntegratedMeleeWeapon).sort((a, b) => a.name.localeCompare(b.name)),
    [meleeWeapons]
  );
  const archeotechCyberneticItems = useMemo(
    () =>
      (archeotech ?? [])
        .filter((a) => a.type === "Cybernetic")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [archeotech]
  );
  const archeotechIntegratedItems = useMemo(
    () =>
      (archeotech ?? [])
        .filter((a) => a.type === "Integrated Weapon")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [archeotech]
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

  const removeArcheotech = useCallback(
    (id: string) => {
      if (!editable || !onUpdateArcheotech) return;
      onUpdateArcheotech((archeotech ?? []).filter((a) => a.id !== id));
    },
    [editable, archeotech, onUpdateArcheotech]
  );

  const addIntegratedFromRangedRef = useCallback(
    (ref: RangedWeaponRef, craftsmanship: WeaponCraftsmanship = "Common") => {
      if (!editable) return;
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
          integrated: true,
        },
      ]);
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const addIntegratedFromMeleeRef = useCallback(
    (ref: MeleeWeaponRef, craftsmanship: WeaponCraftsmanship = "Common") => {
      if (!editable) return;
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
          integrated: true,
        },
      ]);
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const addIntegratedFromLibrary = useCallback(
    (libraryItem: CampaignCustomItem<"weapon">) => {
      if (!editable) return;
      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);
      if (!versionId) {
        toast.error("This custom integrated weapon has no usable version.");
        return;
      }

      const id = crypto.randomUUID();
      if (libraryItem.data.weaponKind === "ranged") {
        onUpdateRanged([
          ...rangedWeapons,
          {
            ...buildRangedWeaponSnapshot(
              id,
              { integrated: true },
              libraryItem.data,
              libraryItem.id,
              versionId
            ),
            integrated: true,
          },
        ]);
      } else if (libraryItem.data.weaponKind === "melee") {
        onUpdateMelee([
          ...meleeWeapons,
          {
            ...buildMeleeWeaponSnapshot(
              id,
              { integrated: true },
              libraryItem.data,
              libraryItem.id,
              versionId
            ),
            integrated: true,
          },
        ]);
      }
    },
    [editable, meleeWeapons, onUpdateMelee, onUpdateRanged, rangedWeapons, toast]
  );

  const addCustomIntegratedRanged = useCallback(
    async (weapon: RangedWeapon) => {
      if (!editable || !userId) return;
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
        setShowCustomIntegratedRanged(false);
        setShowIntegratedPicker(true);
        toast.success("Custom integrated ranged weapon saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom integrated ranged weapon:", err);
        toast.error("Failed to save custom integrated ranged weapon.");
      }
    },
    [campaignId, characterId, characterName, editable, onUpdateRanged, rangedWeapons, toast, userId]
  );

  const addCustomIntegratedMelee = useCallback(
    async (weapon: MeleeWeapon) => {
      if (!editable || !userId) return;
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
        setShowCustomIntegratedMelee(false);
        setShowIntegratedPicker(true);
        toast.success("Custom integrated melee weapon saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom integrated melee weapon:", err);
        toast.error("Failed to save custom integrated melee weapon.");
      }
    },
    [campaignId, characterId, characterName, editable, onUpdateMelee, meleeWeapons, toast, userId]
  );

  const removeIntegratedRanged = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.filter((w) => w.id !== id));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const removeIntegratedMelee = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.filter((w) => w.id !== id));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const toggleEquipIntegratedRanged = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateRanged(rangedWeapons.map((w) => (w.id === id ? { ...w, equipped: !w.equipped } : w)));
    },
    [editable, rangedWeapons, onUpdateRanged]
  );

  const toggleEquipIntegratedMelee = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateMelee(meleeWeapons.map((w) => (w.id === id ? { ...w, equipped: !w.equipped } : w)));
    },
    [editable, meleeWeapons, onUpdateMelee]
  );

  const cyberneticColumns = [
    sortedCybernetics.filter((_, index) => index % 2 === 0),
    sortedCybernetics.filter((_, index) => index % 2 === 1),
  ];

  const renderImplantRow = (item: CyberneticItem) => {
    const linkedArm = item.concealedWeapon
      ? cybernetics.find((candidate) => candidate.id === item.concealedWeapon?.armId)
      : undefined;
    const linkedWeapon =
      item.concealedWeapon?.weaponType === "ranged"
        ? rangedWeapons.find((candidate) => candidate.id === item.concealedWeapon?.weaponId)
        : item.concealedWeapon?.weaponType === "melee"
          ? meleeWeapons.find((candidate) => candidate.id === item.concealedWeapon?.weaponId)
          : undefined;
    const linkedLibraryItem = item.customLibraryId
      ? campaignCustomCyberneticsById.get(item.customLibraryId)
      : undefined;
    const libraryItem =
      linkedLibraryItem ??
      (item.customLibraryId
        ? buildFallbackCyberneticLibraryItem({
            campaignId,
            item,
            userId,
            characterId,
            characterName,
          })
        : undefined);
    const canEditDefinition =
      !!libraryItem && editable && (isDM || (!!userId && libraryItem.creator.userId === userId));
    const rowBusyAction = libraryItem ? getBusyAction(libraryItem.id) : null;

    return (
      <ImplantRow
        key={item.id}
        item={item}
        linkedArmName={linkedArm?.name}
        linkedWeaponName={linkedWeapon?.name}
        linkedWeaponType={item.concealedWeapon?.weaponType}
        editable={editable}
        libraryItem={libraryItem}
        isDM={isDM && editable}
        canEditDefinition={canEditDefinition}
        busyAction={rowBusyAction}
        onEditDefinition={() =>
          libraryItem && setEditingCyberneticDefinition({ item, libraryItem })
        }
        onPublish={() => libraryItem && publishCyberneticDefinition(libraryItem)}
        onArchive={() => libraryItem && archiveCyberneticDefinition(libraryItem)}
        onUpdateAllCopies={() => libraryItem && updateAllCyberneticCopies(libraryItem)}
        onCycleQuality={cycleQuality}
        onRemove={removeImplant}
      />
    );
  };

  if (customItemsError) {
    return <ErrorState>Unable to load custom cybernetic or integrated weapon items.</ErrorState>;
  }

  if (customItemsLoading) {
    return <LoadingState>Loading custom cybernetic items…</LoadingState>;
  }

  return (
    <div className="space-y-6">
      {/* ── INTEGRATED WEAPONS ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Integrated Weapons</SectionHeader>
          <Button size="sm" onClick={() => setShowIntegratedPicker(true)}>
            {editable ? "+ Install" : "View"}
          </Button>
        </div>

        {integratedRanged.length === 0 &&
          integratedMelee.length === 0 &&
          archeotechIntegratedItems.length === 0 && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>
              No integrated weapons installed.
            </p>
          )}

        <IndependentCardGrid
          items={[
            ...integratedRanged.map((weapon) => ({
              name: weapon.name,
              card: (
                <RangedCard
                  key={weapon.id}
                  weapon={weapon}
                  editable={editable}
                  strengthBonus={strengthBonus}
                  integrated
                  allowUpgrades={false}
                  forceExpanded
                  isEquipped={weapon.equipped ?? false}
                  onToggleEquip={() => toggleEquipIntegratedRanged(weapon.id)}
                  onRemove={() => removeIntegratedRanged(weapon.id)}
                  onAddUpgrade={() => {}}
                  onRemoveUpgrade={() => {}}
                  onUpdateAmmoEntries={(entries) =>
                    onUpdateRanged(
                      rangedWeapons.map((w) =>
                        w.id === weapon.id ? { ...w, ammoEntries: entries } : w
                      )
                    )
                  }
                  onUpdateQuantity={(qty) =>
                    onUpdateRanged(
                      rangedWeapons.map((w) => (w.id === weapon.id ? { ...w, quantity: qty } : w))
                    )
                  }
                />
              ),
            })),
            ...integratedMelee.map((weapon) => ({
              name: weapon.name,
              card: (
                <MeleeCard
                  key={weapon.id}
                  weapon={weapon}
                  editable={editable}
                  strengthBonus={strengthBonus}
                  integrated
                  allowUpgrades={false}
                  forceExpanded
                  isEquipped={weapon.equipped ?? false}
                  onToggleEquip={() => toggleEquipIntegratedMelee(weapon.id)}
                  onRemove={() => removeIntegratedMelee(weapon.id)}
                  onAddUpgrade={() => {}}
                  onRemoveUpgrade={() => {}}
                  onUpdateQuantity={(qty) =>
                    onUpdateMelee(
                      meleeWeapons.map((w) => (w.id === weapon.id ? { ...w, quantity: qty } : w))
                    )
                  }
                />
              ),
            })),
            ...archeotechIntegratedItems.map((item) => ({
              name: item.name,
              card: (
                <ArcheotechWeaponCard
                  key={item.id}
                  item={item}
                  editable={editable}
                  isEquipped={item.equipped ?? false}
                  onToggleEquip={() => toggleEquipArcheotech(item.id)}
                  onRemove={() => removeArcheotech(item.id)}
                />
              ),
            })),
          ]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((entry) => entry.card)}
        />
      </section>

      {/* ── INSTALLED IMPLANTS ────────────────────────────────────────────── */}
      {career === "Tech-Priest" && (
        <section className="space-y-3">
          <SectionHeader>Mechanicus Implants</SectionHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Electro-Graft",
              "Electoo Inductors",
              "Respirator Unit",
              "Cyber-Mantle",
              "Potentia Coil",
              "Cranial Circuitry",
            ].map((name) => (
              <div key={name} className={uiSection}>
                <div className={uiItemName}>{name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Chip className={`bg-slate-800/40 font-code ${sourceColour("CR")}`}>CR</Chip>
                  <Chip className="border-amber-500/60 bg-amber-950/30 text-amber-300">
                    Granted by Mechanicus Implants
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Installed Implants</SectionHeader>
          <Button size="sm" onClick={() => setShowPicker(true)}>
            {editable ? "+ Install" : "View"}
          </Button>
        </div>

        {cybernetics.length === 0 && archeotechCyberneticItems.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No cybernetics installed.</p>
        )}

        <div className="space-y-3 sm:hidden">{sortedCybernetics.map(renderImplantRow)}</div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {cyberneticColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map(renderImplantRow)}
            </div>
          ))}
        </div>
        {archeotechCyberneticItems.map((item) => (
          <ArcheotechImplantRow
            key={item.id}
            item={item}
            editable={editable}
            onRemove={() => removeArcheotech(item.id)}
          />
        ))}
      </section>

      {showIntegratedPicker && (
        <IntegratedWeaponPicker
          editable={editable}
          onSelectRanged={addIntegratedFromRangedRef}
          onSelectMelee={addIntegratedFromMeleeRef}
          customItems={campaignCustomIntegratedWeapons}
          onSelectCustomItem={addIntegratedFromLibrary}
          onCustomRanged={editable ? () => setShowCustomIntegratedRanged(true) : undefined}
          onCustomMelee={editable ? () => setShowCustomIntegratedMelee(true) : undefined}
          onClose={() => setShowIntegratedPicker(false)}
          suspended={showCustomIntegratedRanged || showCustomIntegratedMelee}
        />
      )}

      {showCustomIntegratedRanged && (
        <CustomRangedForm
          title="Custom Integrated Ranged Weapon"
          integrated
          onAdd={addCustomIntegratedRanged}
          onCancel={() => {
            setShowCustomIntegratedRanged(false);
            setShowIntegratedPicker(true);
          }}
        />
      )}

      {showCustomIntegratedMelee && (
        <CustomMeleeForm
          title="Custom Integrated Melee Weapon"
          integrated
          onAdd={addCustomIntegratedMelee}
          onCancel={() => {
            setShowCustomIntegratedMelee(false);
            setShowIntegratedPicker(true);
          }}
        />
      )}

      {showPicker && (
        <ImplantPicker
          editable={editable}
          customItems={campaignCustomCybernetics.filter((item) => item.status !== "archived")}
          onSelect={install}
          onSelectCustomItem={beginInstallCyberneticFromLibrary}
          onCustom={() => {
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
          suspended={showCustomForm}
        />
      )}
      {installingConcealedWeapon && (
        <ConcealedWeaponBionicInstaller
          cybernetics={cybernetics}
          rangedWeapons={rangedWeapons}
          meleeWeapons={meleeWeapons}
          strengthBonus={strengthBonus}
          onInstall={installConcealedWeaponBionic}
          onClose={() => {
            setInstallingConcealedWeapon(null);
            setShowPicker(true);
          }}
        />
      )}

      {showCustomForm && (
        <CustomImplantForm
          onAdd={addCustomImplant}
          onCancel={() => {
            setShowCustomForm(false);
            setShowPicker(true);
          }}
        />
      )}

      {installingCustomCybernetic && (
        <CustomImplantForm
          title="Install Custom Cybernetic"
          submitLabel="Install"
          initialItem={{
            ...installingCustomCybernetic.data,
            customLibraryId: installingCustomCybernetic.id,
            customLibraryVersionId:
              installingCustomCybernetic.publishedVersionId ??
              installingCustomCybernetic.draftVersionId ??
              installingCustomCybernetic.latestVersionId,
          }}
          onAdd={finishInstallCyberneticFromLibrary}
          onCancel={() => {
            setInstallingCustomCybernetic(null);
            setShowPicker(true);
          }}
        />
      )}

      {editingCyberneticDefinition && (
        <CustomImplantForm
          title="Edit Custom Cybernetic"
          submitLabel="Save Draft"
          includeLocation={false}
          initialItem={{
            id: editingCyberneticDefinition.item.id,
            bodyLocation: editingCyberneticDefinition.item.bodyLocation,
            ...editingCyberneticDefinition.libraryItem.data,
            customLibraryId: editingCyberneticDefinition.libraryItem.id,
            customLibraryVersionId:
              editingCyberneticDefinition.libraryItem.draftVersionId ??
              editingCyberneticDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedCyberneticDefinition}
          onCancel={() => setEditingCyberneticDefinition(null)}
        />
      )}
    </div>
  );
}

type CustomRangedWeaponData = Extract<CustomWeaponData, { weaponKind: "ranged" }>;
type CustomMeleeWeaponData = Extract<CustomWeaponData, { weaponKind: "melee" }>;

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
  return { ...data, weaponKind: "ranged" };
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
  return { ...data, weaponKind: "melee" };
}

function toCustomCyberneticData(item: CyberneticItem): CustomCyberneticData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    bodyLocation: _bodyLocation,
    ...data
  } = item;

  return data;
}

function buildCyberneticSnapshot(
  id: string,
  bodyLocation: ArmourLocationKey[] | undefined,
  data: CustomCyberneticData,
  customLibraryId: string,
  customLibraryVersionId: string
): CyberneticItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
    ...(bodyLocation ? { bodyLocation } : {}),
  };
}

function buildFallbackCyberneticLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: CyberneticItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"cybernetic"> {
  const data = toCustomCyberneticData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "cybernetic",
    status: inferCustomItemStatus(item),
    name: item.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: item.customLibraryVersionId ?? null,
    latestVersionId: item.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}
