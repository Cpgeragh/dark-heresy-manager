// src/pages/CharacterSheet/GearTab/index.tsx

import { useState, useCallback, useMemo } from "react";
import type { GearItem, ConsumableItem } from "../../../types/Character";
import type { GearRef } from "../../../data/reference/gearReference";
import type { ConsumableRef } from "../../../data/reference/consumablesReference";
import type {
  CampaignCustomItem,
  CustomConsumableData,
  CustomGearData,
} from "../../../types/CustomItems";
import { ConsumableRow } from "./ConsumableRow";
import { ConsumablePicker } from "./ConsumablePicker";
import { ItemRow } from "./ItemRow";
import { GearPicker } from "./GearPicker";
import { CustomGearForm } from "./CustomGearForm";
import { CustomConsumableForm } from "./CustomConsumableForm";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import { SectionHeader } from "../../../ui/SectionHeader";
import { ErrorState } from "../../../ui/ErrorState";
import { LoadingState } from "../../../ui/LoadingState";
import { uiTextPlaceholder } from "../../../ui/styles/editableStyles";
import { colourActiveSky, colourActiveRose } from "../../../ui/styles/colourTokens";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../../hooks/useCustomItemLibraryActions";
import { useSwipeableTabs } from "../../../hooks/useSwipeableTabs";
import { SegmentedTabs, type SegmentedTabOption } from "../../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../../ui/styles/segmentedTabStyles";
import {
  createDraftCustomItem,
  inferCustomItemStatus,
  saveDraftCustomItem,
} from "../../../services/customItemService";
import { useToast } from "../../../components/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GearTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  gear: GearItem[];
  consumables: ConsumableItem[];
  editable: boolean;
  onUpdate: (next: GearItem[]) => void | Promise<void>;
  onUpdateConsumables: (next: ConsumableItem[]) => void | Promise<void>;
}

type GearSection = "items" | "consumables";
const GEAR_SECTIONS = ["items", "consumables"] as const satisfies readonly GearSection[];
const GEAR_TABS = [
  {
    value: "items",
    label: "Items",
    activeClassName: colourActiveSky,
  },
  {
    value: "consumables",
    label: "Consumables",
    activeClassName: colourActiveRose,
  },
] as const satisfies readonly SegmentedTabOption<GearSection>[];
const GEAR_TABS_ID = "gear-sections";

// ─── Component ────────────────────────────────────────────────────────────────

interface EditingGearDefinition {
  item: GearItem;
  libraryItem: CampaignCustomItem<"gear">;
}

interface EditingConsumableDefinition {
  item: ConsumableItem;
  libraryItem: CampaignCustomItem<"consumable">;
}

export function GearTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  gear,
  consumables,
  editable,
  onUpdate,
  onUpdateConsumables,
}: GearTabProps) {
  const [showGearPicker, setShowGearPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showConsumablePicker, setShowConsumablePicker] = useState(false);
  const [showCustomConsumableForm, setShowCustomConsumableForm] = useState(false);
  const [editingGearDefinition, setEditingGearDefinition] = useState<EditingGearDefinition | null>(
    null
  );
  const [editingConsumableDefinition, setEditingConsumableDefinition] =
    useState<EditingConsumableDefinition | null>(null);
  const [activeGearSection, setActiveGearSection] = useState<GearSection>("items");
  const {
    containerRef,
    transitionClass,
    switchTo: switchGearSection,
  } = useSwipeableTabs(GEAR_SECTIONS, activeGearSection, setActiveGearSection);
  const toast = useToast();
  const {
    publishDefinition: publishGearDefinition,
    archiveDefinition: archiveGearDefinition,
    updateAllCopies: updateAllGearCopies,
    getBusyAction: getGearBusyAction,
  } = useCustomItemLibraryActions<"gear">({ campaignId, userId, itemLabel: "gear" });
  const {
    publishDefinition: publishConsumableDefinition,
    archiveDefinition: archiveConsumableDefinition,
    updateAllCopies: updateAllConsumableCopies,
    getBusyAction: getConsumableBusyAction,
  } = useCustomItemLibraryActions<"consumable">({
    campaignId,
    userId,
    itemLabel: "consumable",
  });

  const {
    items: campaignCustomItems,
    loading: customItemsLoading,
    error: customItemsError,
  } = useCampaignCustomItems({
    campaignId,
    categories: ["gear", "consumable"],
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomGear = useMemo(
    () =>
      campaignCustomItems.filter(
        (item) => item.category === "gear"
      ) as CampaignCustomItem<"gear">[],
    [campaignCustomItems]
  );

  const campaignCustomGearById = useMemo(
    () => new Map(campaignCustomGear.map((item) => [item.id, item])),
    [campaignCustomGear]
  );

  const campaignCustomConsumables = useMemo(
    () =>
      campaignCustomItems.filter(
        (item) => item.category === "consumable"
      ) as CampaignCustomItem<"consumable">[],
    [campaignCustomItems]
  );

  const campaignCustomConsumablesById = useMemo(
    () => new Map(campaignCustomConsumables.map((item) => [item.id, item])),
    [campaignCustomConsumables]
  );
  const sortedGear = useMemo(() => [...gear].sort((a, b) => a.name.localeCompare(b.name)), [gear]);
  const sortedConsumables = useMemo(
    () => [...consumables].sort((a, b) => a.name.localeCompare(b.name)),
    [consumables]
  );

  // ── Consumable handlers ──────────────────────────────────────────────────

  const addConsumableFromRef = useCallback(
    (ref: ConsumableRef) => {
      if (!editable) return;
      onUpdateConsumables([
        ...consumables,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          quantity: 1,
          description: ref.description,
          weight: ref.weight,
          value: ref.value,
          availability: ref.availability,
          source: ref.source,
        },
      ]);
    },
    [editable, consumables, onUpdateConsumables]
  );

  const updateConsumableQty = useCallback(
    (id: string, qty: number) => {
      if (!editable) return;
      onUpdateConsumables(consumables.map((c) => (c.id === id ? { ...c, quantity: qty } : c)));
    },
    [editable, consumables, onUpdateConsumables]
  );

  const removeConsumable = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdateConsumables(consumables.filter((c) => c.id !== id));
    },
    [editable, consumables, onUpdateConsumables]
  );

  const addCustomConsumable = useCallback(
    async (item: ConsumableItem) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom consumables.");
        return;
      }

      try {
        const data = toCustomConsumableData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "consumable",
          creator: { userId, characterId, characterName },
          data,
        });

        await onUpdateConsumables([
          ...consumables,
          buildConsumableSnapshot(item.id, item.quantity, data, customItemId, versionId),
        ]);
        setShowCustomConsumableForm(false);
        setShowConsumablePicker(true);
        setActiveGearSection("consumables");
        toast.success("Custom consumable saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom consumable:", err);
        toast.error("Failed to save custom consumable.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      consumables,
      editable,
      onUpdateConsumables,
      toast,
      userId,
    ]
  );

  const addConsumableFromLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"consumable">) => {
      if (!editable) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);

      if (!versionId) {
        toast.error("This custom consumable has no usable version.");
        return;
      }

      await onUpdateConsumables([
        ...consumables,
        buildConsumableSnapshot(
          crypto.randomUUID(),
          1,
          libraryItem.data,
          libraryItem.id,
          versionId
        ),
      ]);
    },
    [consumables, editable, onUpdateConsumables, toast]
  );

  const saveEditedConsumableDefinition = useCallback(
    async (item: ConsumableItem) => {
      if (!editingConsumableDefinition || !userId) return;

      try {
        const data = toCustomConsumableData(item);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingConsumableDefinition.libraryItem.id,
          category: "consumable",
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedConsumables = consumables.map((consumable) =>
          consumable.id === editingConsumableDefinition.item.id
            ? buildConsumableSnapshot(
                consumable.id,
                consumable.quantity,
                data,
                editingConsumableDefinition.libraryItem.id,
                versionId
              )
            : consumable
        );

        await onUpdateConsumables(updatedConsumables);
        setEditingConsumableDefinition(null);
        toast.success("Custom consumable draft updated.");
      } catch (err) {
        console.error("Failed to update custom consumable definition:", err);
        toast.error("Failed to update custom consumable definition.");
      }
    },
    [
      campaignId,
      characterId,
      characterName,
      consumables,
      editingConsumableDefinition,
      onUpdateConsumables,
      toast,
      userId,
    ]
  );

  // ── Gear handlers ────────────────────────────────────────────────────────

  const addFromRef = useCallback(
    (ref: GearRef, gmValue?: string, gmRarity?: string) => {
      if (!editable) return;
      onUpdate([
        ...gear,
        {
          id: crypto.randomUUID(),
          referenceId: ref.id,
          name: ref.name,
          description: ref.description,
          weight: ref.weight,
          value: gmValue ?? ref.value,
          availability: gmRarity ?? ref.availability,
          source: ref.source,
        },
      ]);
    },
    [editable, gear, onUpdate]
  );

  const addCustom = useCallback(
    async (item: GearItem) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom gear.");
        return;
      }

      try {
        const data = toCustomGearData(item);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "gear",
          creator: { userId, characterId, characterName },
          data,
        });

        await onUpdate([...gear, buildGearSnapshot(item.id, data, customItemId, versionId)]);
        setShowCustomForm(false);
        setShowGearPicker(true);
        setActiveGearSection("items");
        toast.success("Custom gear saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom gear:", err);
        toast.error("Failed to save custom gear.");
      }
    },
    [campaignId, characterId, characterName, editable, gear, onUpdate, toast, userId]
  );

  const addCustomFromLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"gear">) => {
      if (!editable) return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);

      if (!versionId) {
        toast.error("This custom gear has no usable version.");
        return;
      }

      await onUpdate([
        ...gear,
        buildGearSnapshot(crypto.randomUUID(), libraryItem.data, libraryItem.id, versionId),
      ]);
    },
    [editable, gear, onUpdate, toast]
  );

  const saveEditedGearDefinition = useCallback(
    async (item: GearItem) => {
      if (!editingGearDefinition || !userId) return;

      try {
        const data = toCustomGearData(item);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingGearDefinition.libraryItem.id,
          category: "gear",
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedGear = gear.map((gearItem) =>
          gearItem.id === editingGearDefinition.item.id
            ? buildGearSnapshot(gearItem.id, data, editingGearDefinition.libraryItem.id, versionId)
            : gearItem
        );

        await onUpdate(updatedGear);
        setEditingGearDefinition(null);
        toast.success("Custom gear draft updated.");
      } catch (err) {
        console.error("Failed to update custom gear definition:", err);
        toast.error("Failed to update custom gear definition.");
      }
    },
    [campaignId, characterId, characterName, editingGearDefinition, gear, onUpdate, toast, userId]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(gear.filter((g) => g.id !== id));
    },
    [editable, gear, onUpdate]
  );

  const visibleGearSectionClass = (section: GearSection) =>
    [
      "space-y-3",
      activeGearSection === section
        ? `${uiSwipeableTabPanel} ${transitionClass}`
        : "hidden lg:block",
    ].join(" ");

  if (customItemsError) {
    return <ErrorState>Unable to load custom gear.</ErrorState>;
  }

  if (customItemsLoading) {
    return <LoadingState>Loading custom gear…</LoadingState>;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="lg:hidden">
        <SegmentedTabs
          id={GEAR_TABS_ID}
          ariaLabel="Gear sections"
          options={GEAR_TABS}
          value={activeGearSection}
          onChange={switchGearSection}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <section
          id={segmentedTabPanelId(GEAR_TABS_ID, "items")}
          aria-labelledby={segmentedTabId(GEAR_TABS_ID, "items")}
          className={visibleGearSectionClass("items")}
          role="tabpanel"
        >
          <div className="flex items-center justify-between">
            <SectionHeader>Items</SectionHeader>
            {!showCustomForm &&
              (editable ? (
                <AddButton label="Add item" onClick={() => setShowGearPicker(true)} />
              ) : (
                <ViewButton label="View items" onClick={() => setShowGearPicker(true)} />
              ))}
          </div>

          {gear.length === 0 && !showCustomForm && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No items recorded.</p>
          )}

          <div className="space-y-3">
            {sortedGear.map((item) =>
              (() => {
                const linkedLibraryItem = item.customLibraryId
                  ? campaignCustomGearById.get(item.customLibraryId)
                  : undefined;
                const libraryItem =
                  linkedLibraryItem ??
                  (item.customLibraryId
                    ? buildFallbackGearLibraryItem({
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
                  ((!!userId && libraryItem.creator.userId === userId) ||
                    (isDM &&
                      (characterId === libraryItem.creator.characterId ||
                        userId === libraryItem.creator.userId)));
                const rowBusyAction = libraryItem ? getGearBusyAction(libraryItem.id) : null;

                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    editable={editable}
                    libraryItem={libraryItem}
                    isDM={
                      isDM &&
                      editable &&
                      !!libraryItem &&
                      (characterId === libraryItem.creator.characterId ||
                        userId === libraryItem.creator.userId)
                    }
                    canEditDefinition={canEditDefinition}
                    busyAction={rowBusyAction}
                    onEditDefinition={() =>
                      libraryItem && setEditingGearDefinition({ item, libraryItem })
                    }
                    onPublish={() => libraryItem && publishGearDefinition(libraryItem)}
                    onArchive={() => libraryItem && archiveGearDefinition(libraryItem)}
                    onUpdateAllCopies={() => libraryItem && updateAllGearCopies(libraryItem)}
                    onRemove={() => removeItem(item.id)}
                  />
                );
              })()
            )}
          </div>
        </section>
        {/* CONSUMABLES ──────────────────────────────────────────────────────── */}
        <section
          id={segmentedTabPanelId(GEAR_TABS_ID, "consumables")}
          aria-labelledby={segmentedTabId(GEAR_TABS_ID, "consumables")}
          className={visibleGearSectionClass("consumables")}
          role="tabpanel"
        >
          <div className="flex items-center justify-between">
            <SectionHeader>Consumables</SectionHeader>
            {editable ? (
              <AddButton label="Add consumable" onClick={() => setShowConsumablePicker(true)} />
            ) : (
              <ViewButton label="View consumables" onClick={() => setShowConsumablePicker(true)} />
            )}
          </div>

          {consumables.length === 0 && (
            <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No consumables recorded.</p>
          )}

          <div className="space-y-3">
            {sortedConsumables.map((item) =>
              (() => {
                const linkedLibraryItem = item.customLibraryId
                  ? campaignCustomConsumablesById.get(item.customLibraryId)
                  : undefined;
                const libraryItem =
                  linkedLibraryItem ??
                  (item.customLibraryId
                    ? buildFallbackConsumableLibraryItem({
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
                  ((!!userId && libraryItem.creator.userId === userId) ||
                    (isDM &&
                      (characterId === libraryItem.creator.characterId ||
                        userId === libraryItem.creator.userId)));
                const rowBusyAction = libraryItem ? getConsumableBusyAction(libraryItem.id) : null;

                return (
                  <ConsumableRow
                    key={item.id}
                    item={item}
                    editable={editable}
                    libraryItem={libraryItem}
                    isDM={
                      isDM &&
                      editable &&
                      !!libraryItem &&
                      (characterId === libraryItem.creator.characterId ||
                        userId === libraryItem.creator.userId)
                    }
                    canEditDefinition={canEditDefinition}
                    busyAction={rowBusyAction}
                    onEditDefinition={() =>
                      libraryItem && setEditingConsumableDefinition({ item, libraryItem })
                    }
                    onPublish={() => libraryItem && publishConsumableDefinition(libraryItem)}
                    onArchive={() => libraryItem && archiveConsumableDefinition(libraryItem)}
                    onUpdateAllCopies={() => libraryItem && updateAllConsumableCopies(libraryItem)}
                    onUpdateQty={updateConsumableQty}
                    onRemove={removeConsumable}
                  />
                );
              })()
            )}
          </div>
        </section>
      </div>

      {showConsumablePicker && (
        <ConsumablePicker
          editable={editable}
          customItems={campaignCustomConsumables.filter(
            (item) =>
              item.status !== "archived" &&
              (item.status === "published" ||
                item.creator.userId === userId ||
                item.creator.characterId === characterId)
          )}
          onSelect={addConsumableFromRef}
          onSelectCustomItem={addConsumableFromLibrary}
          onCustom={() => {
            setShowCustomConsumableForm(true);
            setActiveGearSection("consumables");
          }}
          onClose={() => setShowConsumablePicker(false)}
          suspended={showCustomConsumableForm}
        />
      )}

      {showCustomConsumableForm && (
        <CustomConsumableForm
          onAdd={addCustomConsumable}
          onCancel={() => {
            setShowCustomConsumableForm(false);
            setShowConsumablePicker(true);
          }}
        />
      )}

      {showGearPicker && (
        <GearPicker
          editable={editable}
          customItems={campaignCustomGear.filter(
            (item) =>
              item.status !== "archived" &&
              (item.status === "published" ||
                item.creator.userId === userId ||
                item.creator.characterId === characterId)
          )}
          onSelect={addFromRef}
          onSelectCustomItem={addCustomFromLibrary}
          onCustom={() => {
            setShowCustomForm(true);
            setActiveGearSection("items");
          }}
          onClose={() => setShowGearPicker(false)}
          suspended={showCustomForm}
        />
      )}

      {showCustomForm && (
        <CustomGearForm
          onAdd={addCustom}
          onCancel={() => {
            setShowCustomForm(false);
            setShowGearPicker(true);
          }}
        />
      )}

      {editingGearDefinition && (
        <CustomGearForm
          title="Edit Custom Item"
          submitLabel="Save Draft"
          initialItem={{
            id: editingGearDefinition.item.id,
            ...editingGearDefinition.libraryItem.data,
            customLibraryId: editingGearDefinition.libraryItem.id,
            customLibraryVersionId:
              editingGearDefinition.libraryItem.draftVersionId ??
              editingGearDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedGearDefinition}
          onCancel={() => setEditingGearDefinition(null)}
        />
      )}

      {editingConsumableDefinition && (
        <CustomConsumableForm
          title="Edit Custom Consumable"
          submitLabel="Save Draft"
          includeQuantity={false}
          initialItem={{
            id: editingConsumableDefinition.item.id,
            quantity: editingConsumableDefinition.item.quantity,
            ...editingConsumableDefinition.libraryItem.data,
            customLibraryId: editingConsumableDefinition.libraryItem.id,
            customLibraryVersionId:
              editingConsumableDefinition.libraryItem.draftVersionId ??
              editingConsumableDefinition.libraryItem.latestVersionId,
          }}
          onAdd={saveEditedConsumableDefinition}
          onCancel={() => setEditingConsumableDefinition(null)}
        />
      )}
    </div>
  );
}

function toCustomGearData(item: GearItem): CustomGearData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    ...data
  } = item;

  return data;
}

function toCustomConsumableData(item: ConsumableItem): CustomConsumableData {
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

function buildGearSnapshot(
  id: string,
  data: CustomGearData,
  customLibraryId: string,
  customLibraryVersionId: string
): GearItem {
  return {
    id,
    ...data,
    customLibraryId,
    customLibraryVersionId,
  };
}

function buildConsumableSnapshot(
  id: string,
  quantity: number,
  data: CustomConsumableData,
  customLibraryId: string,
  customLibraryVersionId: string
): ConsumableItem {
  return {
    id,
    ...data,
    quantity,
    customLibraryId,
    customLibraryVersionId,
  };
}

function buildFallbackGearLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: GearItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"gear"> {
  const data = toCustomGearData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "gear",
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

function buildFallbackConsumableLibraryItem({
  campaignId,
  item,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  item: ConsumableItem;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"consumable"> {
  const data = toCustomConsumableData(item);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: item.customLibraryId ?? "",
    campaignId,
    category: "consumable",
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
