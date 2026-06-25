// src/pages/characterSheet/CyberneticsTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type {
  CyberneticItem,
  CyberneticCraftsmanship,
  ArmourLocationKey,
} from "../../../types/Character";
import type { CyberneticRef } from "../../../data/reference/cyberneticsReference";
import type { CampaignCustomItem, CustomCyberneticData } from "../../../types/CustomItems";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface CyberneticsTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  cybernetics: CyberneticItem[];
  editable: boolean;
  onUpdate: (next: CyberneticItem[]) => void | Promise<void>;
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
  editable,
  onUpdate,
}: CyberneticsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
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
