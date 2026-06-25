// src/pages/characterSheet/DrugsTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type { DrugItem } from "../../../types/Character";
import type { DrugRef } from "../../../data/reference/drugsReference";
import type { CampaignCustomItem, CustomDrugData } from "../../../types/CustomItems";
import { DrugPicker } from "./DrugPicker";
import { DrugRow } from "./DrugRow";
import { CustomDrugForm } from "./CustomDrugForm";
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiTextBody, uiTextPlaceholder } from "../../../ui/editableStyles";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import {
  archiveCustomItem,
  createDraftCustomItem,
  publishCustomItem,
  saveDraftCustomItem,
  updateAllCustomItemCopies,
} from "../../../services/customItemService";
import { useToast } from "../../../components/Toast";

interface DrugsTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  drugs: DrugItem[];
  editable: boolean;
  onUpdate: (next: DrugItem[]) => void | Promise<void>;
}

interface EditingDrugDefinition {
  item: DrugItem;
  libraryItem: CampaignCustomItem<"drug">;
}

type DrugLibraryAction = "publish" | "archive" | "updateAll";

export function DrugsTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  drugs,
  editable,
  onUpdate,
}: DrugsTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingDrugDefinition, setEditingDrugDefinition] =
    useState<EditingDrugDefinition | null>(null);
  const [busyLibraryAction, setBusyLibraryAction] = useState<{
    itemId: string;
    action: DrugLibraryAction;
  } | null>(null);
  const toast = useToast();

  const { items: campaignCustomDrugItems } = useCampaignCustomItems({
    campaignId,
    category: "drug",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomDrugs = useMemo(
    () => campaignCustomDrugItems as CampaignCustomItem<"drug">[],
    [campaignCustomDrugItems]
  );
  const campaignCustomDrugsById = useMemo(
    () => new Map(campaignCustomDrugs.map((item) => [item.id, item])),
    [campaignCustomDrugs]
  );

  const addDrug = useCallback(
    (ref: DrugRef) => {
      if (!editable) return;
      onUpdate([
        ...drugs,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          weight: ref.weight ?? "0 kg",
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
        },
      ]);
      setShowPicker(false);
    },
    [editable, drugs, onUpdate]
  );

  const updateQty = useCallback(
    (id: string, quantity: number) => {
      if (!editable) return;
      onUpdate(drugs.map((d) => (d.id === id ? { ...d, quantity } : d)));
    },
    [editable, drugs, onUpdate]
  );

  const addCustomDrug = useCallback(
    async (item: DrugItem) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom drugs.");
        return;
      }

      try {
        const data = toCustomDrugData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "drug",
          creator: { userId, characterId, characterName },
          data,
        });

        await onUpdate([
          ...drugs,
          buildDrugSnapshot(item.id, item.quantity, data, customItemId, versionId),
        ]);
        setShowCustomForm(false);
        toast.success("Custom drug saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom drug:", err);
        toast.error("Failed to save custom drug.");
      }
    },
    [campaignId, characterId, characterName, drugs, editable, onUpdate, toast, userId]
  );

  const addDrugFromLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"drug">) => {
      if (!editable) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

      if (!versionId) {
        toast.error("This custom drug has no usable version.");
        return;
      }

      await onUpdate([
        ...drugs,
        buildDrugSnapshot(crypto.randomUUID(), 1, libraryItem.data, libraryItem.id, versionId),
      ]);
      setShowPicker(false);
    },
    [drugs, editable, onUpdate, toast]
  );

  const saveEditedDrugDefinition = useCallback(
    async (item: DrugItem) => {
      if (!editingDrugDefinition || !userId) return;

      try {
        const data = toCustomDrugData(item);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingDrugDefinition.libraryItem.id,
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedDrugs = drugs.map((drug) =>
          drug.id === editingDrugDefinition.item.id
            ? buildDrugSnapshot(
                drug.id,
                drug.quantity,
                data,
                editingDrugDefinition.libraryItem.id,
                versionId
              )
            : drug
        );

        await onUpdate(updatedDrugs);
        setEditingDrugDefinition(null);
        toast.success("Custom drug draft updated.");
      } catch (err) {
        console.error("Failed to update custom drug definition:", err);
        toast.error("Failed to update custom drug definition.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      drugs,
      editingDrugDefinition,
      onUpdate,
      toast,
      userId,
    ]
  );

  const removeDrug = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(drugs.filter((d) => d.id !== id));
    },
    [editable, drugs, onUpdate]
  );

  const publishDrugDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"drug">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom drug published.");
      } catch (err) {
        console.error("Failed to publish custom drug:", err);
        toast.error("Failed to publish custom drug.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveDrugDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"drug">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success("Custom drug archived.");
      } catch (err) {
        console.error("Failed to archive custom drug:", err);
        toast.error("Failed to archive custom drug.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllDrugCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"drug">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await updateAllCustomItemCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.publishedVersionId ?? libraryItem.latestVersionId,
        });
        toast.success(`Updated ${updatedCopies} drug ${updatedCopies === 1 ? "copy" : "copies"}.`);
      } catch (err) {
        console.error("Failed to update custom drug copies:", err);
        toast.error("Failed to update custom drug copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const drugColumns = [
    drugs.filter((_, index) => index % 2 === 0),
    drugs.filter((_, index) => index % 2 === 1),
  ];

  const renderDrugRow = (item: DrugItem) => {
    const linkedLibraryItem = item.customLibraryId
      ? campaignCustomDrugsById.get(item.customLibraryId)
      : undefined;
    const libraryItem =
      linkedLibraryItem ??
      (item.customLibraryId
        ? buildFallbackDrugLibraryItem({
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
      <DrugRow
        key={item.id}
        item={item}
        editable={editable}
        libraryItem={libraryItem}
        isDM={isDM && editable}
        canEditDefinition={canEditDefinition}
        busyAction={rowBusyAction}
        onEditDefinition={() => libraryItem && setEditingDrugDefinition({ item, libraryItem })}
        onPublish={() => libraryItem && publishDrugDefinition(libraryItem)}
        onArchive={() => libraryItem && archiveDrugDefinition(libraryItem)}
        onUpdateAllCopies={() => libraryItem && updateAllDrugCopies(libraryItem)}
        onUpdateQty={updateQty}
        onRemove={removeDrug}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Excessive Drug Use rule */}
      <div className={`rounded-lg border border-violet-700/40 bg-violet-900/10 px-4 lg:px-5 py-3 lg:py-4 text-center text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>
        <p className="font-semibold text-violet-400 uppercase tracking-wide">
          Excessive Drug Use
        </p>
        <p className="mt-1">
          Using more than one dose of the same drug within a 24-hour period requires a Toughness Test
          for each use after the first, with a cumulative -20 penalty. On a failure, the drug has no
          effect and further doses do not affect the character for a full 24 hours.
        </p>
      </div>

      {/* Carried drugs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeader>Carried</SectionHeader>
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {drugs.length === 0 && <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No drugs carried.</p>}

        <div className="space-y-3 sm:hidden">
          {drugs.map(renderDrugRow)}
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-3 sm:items-start">
          {drugColumns.map((column, index) => (
            <div key={index} className="space-y-3">
              {column.map(renderDrugRow)}
            </div>
          ))}
        </div>
      </section>

      {showPicker && (
        <DrugPicker
          editable={editable}
          customItems={campaignCustomDrugs.filter((item) => item.status !== "archived")}
          onSelect={addDrug}
          onSelectCustomItem={addDrugFromLibrary}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showCustomForm && (
        <CustomDrugForm
          onAdd={addCustomDrug}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

      {editingDrugDefinition && (
        <CustomDrugForm
          title="Edit Custom Drug"
          submitLabel="Save Draft"
          includeQuantity={false}
          initialItem={{
            id: editingDrugDefinition.item.id,
            quantity: editingDrugDefinition.item.quantity,
            ...editingDrugDefinition.libraryItem.data,
            customLibraryId: editingDrugDefinition.libraryItem.id,
            customLibraryVersionId:
              editingDrugDefinition.libraryItem.draftVersionId ??
              editingDrugDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedDrugDefinition}
          onCancel={() => setEditingDrugDefinition(null)}
        />
      )}
    </div>
  );
}

function toCustomDrugData(item: DrugItem): CustomDrugData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    quantity: _quantity,
    ...data
  } = item;

  return data;
}

function buildDrugSnapshot(
  id: string,
  quantity: number,
  data: CustomDrugData,
  customLibraryId: string,
  customLibraryVersionId: string
): DrugItem {
  return {
    id,
    ...data,
    quantity,
    customLibraryId,
    customLibraryVersionId,
  };
}

function buildFallbackDrugLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: DrugItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"drug"> {
  const data = toCustomDrugData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "drug",
    status: "draft",
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
