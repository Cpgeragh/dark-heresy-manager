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
import type { CampaignCustomItem, CustomCyberneticData, CustomWeaponData } from "../../../types/CustomItems";
import { ImplantPicker } from "./ImplantPicker";
import { ImplantRow } from "./ImplantRow";
import { CustomImplantForm } from "./CustomImplantForm";
import { nextAvailableCraftsmanship } from "./cyberneticsHelpers";
import { SectionHeader } from "../../../ui/SectionHeader";
import { CYBERNETICS_REFERENCE } from "../../../data/reference/cyberneticsReference";
import { uiTextPlaceholder } from "../../../ui/editableStyles";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import {
  archiveCustomItem,
  createDraftCustomItem,
  inferCustomItemStatus,
  publishAndUpdateAllCopies,
  publishCustomItem,
  removeAllCustomItemCopies,
  saveDraftCustomItem,
} from "../../../services/customItemService";
import { useToast } from "../../../components/Toast";
import { IntegratedWeaponPicker } from "../weapons/IntegratedWeaponPicker";
import { RangedCard, CustomRangedForm } from "../weapons/RangedCard";
import { MeleeCard, CustomMeleeForm } from "../weapons/MeleeCard";
import { IndependentCardGrid } from "../weapons/IndependentCardGrid";
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
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditingCyberneticDefinition {
  item: CyberneticItem;
  libraryItem: CampaignCustomItem<"cybernetic">;
}

type CyberneticLibraryAction = "publish" | "archive" | "updateAll";

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
}: CyberneticsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showIntegratedPicker, setShowIntegratedPicker] = useState(false);
  const [showCustomIntegratedRanged, setShowCustomIntegratedRanged] = useState(false);
  const [showCustomIntegratedMelee, setShowCustomIntegratedMelee] = useState(false);
  const [installingCustomCybernetic, setInstallingCustomCybernetic] =
    useState<CampaignCustomItem<"cybernetic"> | null>(null);
  const [editingCyberneticDefinition, setEditingCyberneticDefinition] =
    useState<EditingCyberneticDefinition | null>(null);
  const [busyLibraryAction, setBusyLibraryAction] = useState<{
    itemId: string;
    action: CyberneticLibraryAction;
  } | null>(null);
  const toast = useToast();

  const { items: campaignCustomCyberneticItems, loading: cyberneticsLoading } = useCampaignCustomItems({
    campaignId,
    category: "cybernetic",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomCybernetics = useMemo(
    () => campaignCustomCyberneticItems as CampaignCustomItem<"cybernetic">[],
    [campaignCustomCyberneticItems]
  );
  const campaignCustomCyberneticsById = useMemo(
    () => new Map(campaignCustomCybernetics.map((item) => [item.id, item])),
    [campaignCustomCybernetics]
  );

  const install = useCallback(
    (
      ref: CyberneticRef,
      craftsmanship: CyberneticCraftsmanship,
      bodyLocation?: ArmourLocationKey[],
      gmValue?: string,
      gmRarity?: string
    ) => {
      if (!editable) return;
      onUpdate([
        ...cybernetics,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          craftsmanship,
          value: gmValue ?? ref.value,
          availability: gmRarity ?? ref.availability,
          source: ref.source,
          ...(bodyLocation ? { bodyLocation } : {}),
        },
      ]);
      setShowPicker(false);
    },
    [editable, cybernetics, onUpdate]
  );

  const cycleQuality = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(
        cybernetics.map((c) => {
          if (c.id !== id) return c;
          const ref = CYBERNETICS_REFERENCE.find((r) => r.id === c.referenceId);
          return { ...c, craftsmanship: nextAvailableCraftsmanship(c.craftsmanship, ref) };
        })
      );
    },
    [editable, cybernetics, onUpdate]
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
          buildCyberneticSnapshot(
            item.id,
            item.bodyLocation,
            data,
            customItemId,
            versionId
          ),
        ]);
        setShowCustomForm(false);
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
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

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
      onUpdate(cybernetics.filter((c) => c.id !== id));
    },
    [editable, cybernetics, onUpdate]
  );

  // ── Integrated weapons ─────────────────────────────────────────────────────

  const integratedRanged = useMemo(
    () => rangedWeapons.filter(isIntegratedRangedWeapon).sort((a, b) => a.name.localeCompare(b.name)),
    [rangedWeapons]
  );
  const integratedMelee = useMemo(
    () => meleeWeapons.filter(isIntegratedMeleeWeapon).sort((a, b) => a.name.localeCompare(b.name)),
    [meleeWeapons]
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
      setShowIntegratedPicker(false);
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
      setShowIntegratedPicker(false);
    },
    [editable, meleeWeapons, onUpdateMelee]
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

  const publishCyberneticDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"cybernetic">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom cybernetic published.");
      } catch (err) {
        console.error("Failed to publish custom cybernetic:", err);
        toast.error("Failed to publish custom cybernetic.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveCyberneticDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"cybernetic">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        toast.success("Custom cybernetic archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom cybernetic:", err);
        toast.error("Failed to archive custom cybernetic.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllCyberneticCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"cybernetic">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(
          `Updated ${updatedCopies} cybernetic ${updatedCopies === 1 ? "copy" : "copies"}.`
        );
      } catch (err) {
        console.error("Failed to update custom cybernetic copies:", err);
        toast.error("Failed to update custom cybernetic copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const cyberneticColumns = [
    cybernetics.filter((_, index) => index % 2 === 0),
    cybernetics.filter((_, index) => index % 2 === 1),
  ];

  const renderImplantRow = (item: CyberneticItem) => {
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
      !!libraryItem &&
      editable &&
      (isDM || (!!userId && libraryItem.creator.userId === userId));
    const rowBusyAction =
      busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
        ? busyLibraryAction.action
        : null;

    return (
      <ImplantRow
        key={item.id}
        item={item}
        editable={editable}
        libraryItem={libraryItem}
        isDM={isDM && editable}
        canEditDefinition={canEditDefinition}
        busyAction={rowBusyAction}
        onEditDefinition={() => libraryItem && setEditingCyberneticDefinition({ item, libraryItem })}
        onPublish={() => libraryItem && publishCyberneticDefinition(libraryItem)}
        onArchive={() => libraryItem && archiveCyberneticDefinition(libraryItem)}
        onUpdateAllCopies={() => libraryItem && updateAllCyberneticCopies(libraryItem)}
        onCycleQuality={cycleQuality}
        onRemove={removeImplant}
      />
    );
  };

  if (cyberneticsLoading) return null;

  return (
    <div className="space-y-6">
      {/* ── INTEGRATED WEAPONS ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Integrated Weapons</SectionHeader>
          <button
            onClick={() => setShowIntegratedPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Install" : "View"}
          </button>
        </div>

        {integratedRanged.length === 0 && integratedMelee.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No integrated weapons installed.</p>
        )}

        <IndependentCardGrid
          items={[
            ...integratedRanged.map((weapon) => (
              <RangedCard
                key={weapon.id}
                weapon={weapon}
                editable={editable}
                integrated
                allowUpgrades={false}
                forceExpanded
                isEquipped={weapon.equipped ?? false}
                onToggleEquip={() => toggleEquipIntegratedRanged(weapon.id)}
                onRemove={() => removeIntegratedRanged(weapon.id)}
                onAddUpgrade={() => {}}
                onRemoveUpgrade={() => {}}
                onUpdateAmmoEntries={(entries) =>
                  onUpdateRanged(rangedWeapons.map((w) => (w.id === weapon.id ? { ...w, ammoEntries: entries } : w)))
                }
                onUpdateQuantity={(qty) =>
                  onUpdateRanged(rangedWeapons.map((w) => (w.id === weapon.id ? { ...w, quantity: qty } : w)))
                }
              />
            )),
            ...integratedMelee.map((weapon) => (
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
                  onUpdateMelee(meleeWeapons.map((w) => (w.id === weapon.id ? { ...w, quantity: qty } : w)))
                }
              />
            )),
          ]}
        />
      </section>

      {/* ── INSTALLED IMPLANTS ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Installed Implants</SectionHeader>
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Install" : "View"}
          </button>
        </div>

        {cybernetics.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No cybernetics installed.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {cybernetics.map(renderImplantRow)}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {cyberneticColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map(renderImplantRow)}
            </div>
          ))}
        </div>
      </section>

      {showIntegratedPicker && (
        <IntegratedWeaponPicker
          editable={editable}
          onSelectRanged={addIntegratedFromRangedRef}
          onSelectMelee={addIntegratedFromMeleeRef}
          onCustomRanged={editable ? () => { setShowIntegratedPicker(false); setShowCustomIntegratedRanged(true); } : undefined}
          onCustomMelee={editable ? () => { setShowIntegratedPicker(false); setShowCustomIntegratedMelee(true); } : undefined}
          onClose={() => setShowIntegratedPicker(false)}
        />
      )}

      {showCustomIntegratedRanged && (
        <CustomRangedForm
          title="Custom Integrated Ranged Weapon"
          integrated
          onAdd={addCustomIntegratedRanged}
          onCancel={() => setShowCustomIntegratedRanged(false)}
        />
      )}

      {showCustomIntegratedMelee && (
        <CustomMeleeForm
          title="Custom Integrated Melee Weapon"
          integrated
          onAdd={addCustomIntegratedMelee}
          onCancel={() => setShowCustomIntegratedMelee(false)}
        />
      )}

      {showPicker && (
        <ImplantPicker
          editable={editable}
          customItems={campaignCustomCybernetics.filter((item) => item.status !== "archived")}
          onSelect={install}
          onSelectCustomItem={beginInstallCyberneticFromLibrary}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showCustomForm && (
        <CustomImplantForm
          onAdd={addCustomImplant}
          onCancel={() => setShowCustomForm(false)}
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
          onCancel={() => setInstallingCustomCybernetic(null)}
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
