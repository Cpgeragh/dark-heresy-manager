// src/pages/characterSheet/ArcheotechTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import type { ArcheotechRef } from "../../../data/reference/archeotechReference";
import type { CampaignCustomItem, CustomArcheotechData } from "../../../types/CustomItems";
import { ArcheotechPickerModal } from "./ArcheotechPickerModal";
import { ItemCard } from "./ItemCard";
import { ArcheotechWeaponCard } from "../weapons/ArcheotechWeaponCard";
import { CustomItemForm } from "./CustomItemForm";
import { SectionHeader } from "../../../ui/SectionHeader";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArcheotechTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  archeotech: ArcheotechItem[];
  editable: boolean;
  onUpdate: (next: ArcheotechItem[]) => void | Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditingArcheotechDefinition {
  item: ArcheotechItem;
  libraryItem: CampaignCustomItem<"archeotech">;
}

type ArcheotechLibraryAction = "publish" | "archive" | "updateAll";

export function ArcheotechTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  archeotech,
  editable,
  onUpdate,
}: ArcheotechTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingArcheotechDefinition, setEditingArcheotechDefinition] =
    useState<EditingArcheotechDefinition | null>(null);
  const [busyLibraryAction, setBusyLibraryAction] = useState<{
    itemId: string;
    action: ArcheotechLibraryAction;
  } | null>(null);
  const toast = useToast();

  const { items: campaignCustomArcheotechItems, loading: archeotechLoading } = useCampaignCustomItems({
    campaignId,
    category: "archeotech",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomArcheotech = useMemo(
    () => campaignCustomArcheotechItems as CampaignCustomItem<"archeotech">[],
    [campaignCustomArcheotechItems]
  );
  const campaignCustomArcheotechById = useMemo(
    () => new Map(campaignCustomArcheotech.map((item) => [item.id, item])),
    [campaignCustomArcheotech]
  );

  const addFromRef = useCallback(
    (ref: ArcheotechRef, gmValue?: string, gmRarity?: string) => {
      if (!editable) return;
      onUpdate([
        ...archeotech,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          type: ref.type,
          source: ref.source,
          // Store GM-assigned values directly on the item so they override "—"
          value: gmValue || undefined,
          availability: gmRarity || undefined,
        },
      ]);
      setShowPicker(false);
    },
    [editable, archeotech, onUpdate]
  );

  const addCustom = useCallback(
    async (item: ArcheotechItem) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom archeotech.");
        return;
      }

      try {
        const data = toCustomArcheotechData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "archeotech",
          creator: { userId, characterId, characterName },
          data,
        });

        await onUpdate([
          ...archeotech,
          buildArcheotechSnapshot(item.id, item.equipped, data, customItemId, versionId),
        ]);
        setShowCustomForm(false);
        toast.success("Custom archeotech saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom archeotech:", err);
        toast.error("Failed to save custom archeotech.");
      }
    },
    [archeotech, campaignId, characterId, characterName, editable, onUpdate, toast, userId]
  );

  const addArcheotechFromLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"archeotech">) => {
      if (!editable) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

      if (!versionId) {
        toast.error("This custom archeotech has no usable version.");
        return;
      }

      await onUpdate([
        ...archeotech,
        buildArcheotechSnapshot(crypto.randomUUID(), undefined, libraryItem.data, libraryItem.id, versionId),
      ]);
      setShowPicker(false);
    },
    [archeotech, editable, onUpdate, toast]
  );

  const saveEditedArcheotechDefinition = useCallback(
    async (item: ArcheotechItem) => {
      if (!editingArcheotechDefinition || !userId) return;

      try {
        const data = toCustomArcheotechData(item);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingArcheotechDefinition.libraryItem.id,
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedArcheotech = archeotech.map((archeotechItem) =>
          archeotechItem.id === editingArcheotechDefinition.item.id
            ? buildArcheotechSnapshot(
                archeotechItem.id,
                archeotechItem.equipped,
                data,
                editingArcheotechDefinition.libraryItem.id,
                versionId
              )
            : archeotechItem
        );

        await onUpdate(updatedArcheotech);
        setEditingArcheotechDefinition(null);
        toast.success("Custom archeotech draft updated.");
      } catch (err) {
        console.error("Failed to update custom archeotech definition:", err);
        toast.error("Failed to update custom archeotech definition.");
      }
    },
    [
      archeotech,
      campaignId,
      characterId,
      characterName,
      editingArcheotechDefinition,
      onUpdate,
      toast,
      userId,
    ]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(archeotech.filter((a) => a.id !== id));
    },
    [editable, archeotech, onUpdate]
  );

  const toggleEquip = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(archeotech.map((a) => (a.id === id ? { ...a, equipped: !a.equipped } : a)));
    },
    [editable, archeotech, onUpdate]
  );

  const publishArcheotechDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"archeotech">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom archeotech published.");
      } catch (err) {
        console.error("Failed to publish custom archeotech:", err);
        toast.error("Failed to publish custom archeotech.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveArcheotechDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"archeotech">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        toast.success("Custom archeotech archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom archeotech:", err);
        toast.error("Failed to archive custom archeotech.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllArcheotechCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"archeotech">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(
          `Updated ${updatedCopies} archeotech ${updatedCopies === 1 ? "copy" : "copies"}.`
        );
      } catch (err) {
        console.error("Failed to update custom archeotech copies:", err);
        toast.error("Failed to update custom archeotech copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const sortedArcheotech = useMemo(
    () => [...archeotech].sort((a, b) => a.name.localeCompare(b.name)),
    [archeotech]
  );
  const archeotechColumns = [
    sortedArcheotech.filter((_, index) => index % 2 === 0),
    sortedArcheotech.filter((_, index) => index % 2 === 1),
  ];

  const renderItemCard = (item: ArcheotechItem) => {
    const linkedLibraryItem = item.customLibraryId
      ? campaignCustomArcheotechById.get(item.customLibraryId)
      : undefined;
    const libraryItem =
      linkedLibraryItem ??
      (item.customLibraryId
        ? buildFallbackArcheotechLibraryItem({
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

    const sharedAdminProps = {
      editable,
      libraryItem,
      isDM: isDM && editable,
      canEditDefinition,
      busyAction: rowBusyAction,
      onEditDefinition: () => libraryItem && setEditingArcheotechDefinition({ item, libraryItem }),
      onPublish: () => libraryItem && publishArcheotechDefinition(libraryItem),
      onArchive: () => libraryItem && archiveArcheotechDefinition(libraryItem),
      onUpdateAllCopies: () => libraryItem && updateAllArcheotechCopies(libraryItem),
      onRemove: () => removeItem(item.id),
    };

    const isWeaponType = ["Weapon", "Integrated Weapon", "Grenade", "Mine"].includes(item.type ?? "");
    if (isWeaponType)
      return (
        <ArcheotechWeaponCard
          key={item.id}
          item={item}
          {...sharedAdminProps}
          isEquipped={item.equipped ?? false}
          onToggleEquip={item.type !== "Integrated Weapon" ? () => toggleEquip(item.id) : undefined}
        />
      );

    return (
      <ItemCard
        key={item.id}
        item={item}
        {...sharedAdminProps}
      />
    );
  };

  if (archeotechLoading) return null;

  return (
    <div className="space-y-8">
      {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Inventory ({archeotech.length})</SectionHeader>
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {archeotech.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No archeotech recorded.</p>
        )}

        <div className="space-y-3 sm:hidden">
          {sortedArcheotech.map(renderItemCard)}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {archeotechColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map(renderItemCard)}
            </div>
          ))}
        </div>

        {showCustomForm && (
          <CustomItemForm
            onAdd={addCustom}
            onCancel={() => setShowCustomForm(false)}
            onBack={() => { setShowCustomForm(false); setShowPicker(true); }}
          />
        )}

        {editingArcheotechDefinition && (
          <CustomItemForm
            title="Edit Custom Archeotech"
            submitLabel="Save Draft"
            initialItem={{
              id: editingArcheotechDefinition.item.id,
              equipped: editingArcheotechDefinition.item.equipped,
              ...editingArcheotechDefinition.libraryItem.data,
              customLibraryId: editingArcheotechDefinition.libraryItem.id,
              customLibraryVersionId:
                editingArcheotechDefinition.libraryItem.draftVersionId ??
                editingArcheotechDefinition.libraryItem.latestVersionId,
            }}
            onAdd={saveEditedArcheotechDefinition}
            onCancel={() => setEditingArcheotechDefinition(null)}
          />
        )}
      </section>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {showPicker && (
        <ArcheotechPickerModal
          editable={editable}
          customItems={campaignCustomArcheotech.filter((item) => item.status !== "archived")}
          onSelect={addFromRef}
          onSelectCustomItem={addArcheotechFromLibrary}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

function toCustomArcheotechData(item: ArcheotechItem): CustomArcheotechData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    equipped: _equipped,
    ...data
  } = item;

  return data;
}

function buildArcheotechSnapshot(
  id: string,
  equipped: boolean | undefined,
  data: CustomArcheotechData,
  customLibraryId: string,
  customLibraryVersionId: string
): ArcheotechItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
    ...(equipped !== undefined ? { equipped } : {}),
  };
}

function buildFallbackArcheotechLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: ArcheotechItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"archeotech"> {
  const data = toCustomArcheotechData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "archeotech",
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
