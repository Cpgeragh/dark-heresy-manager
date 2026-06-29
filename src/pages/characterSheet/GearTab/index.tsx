// src/pages/characterSheet/GearTab/index.tsx

import { useState, useCallback, useMemo, useRef } from "react";
import type { TouchEvent } from "react";
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
import { CustomItemForm } from "./CustomItemForm";
import { CustomConsumableForm } from "./CustomConsumableForm";
import { SectionHeader } from "../../../ui/SectionHeader";
import { uiTextPlaceholder } from "../../../ui/editableStyles";
import { colourActiveSky, colourActiveRose } from "../../../ui/colourTokens";
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

// ─── Component ────────────────────────────────────────────────────────────────

interface EditingGearDefinition {
  item: GearItem;
  libraryItem: CampaignCustomItem<"gear">;
}

interface EditingConsumableDefinition {
  item: ConsumableItem;
  libraryItem: CampaignCustomItem<"consumable">;
}

type GearLibraryAction = "publish" | "archive" | "updateAll";

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
  const [showGearPicker, setShowGearPicker]               = useState(false);
  const [showCustomForm, setShowCustomForm]               = useState(false);
  const [showConsumablePicker, setShowConsumablePicker]   = useState(false);
  const [showCustomConsumableForm, setShowCustomConsumableForm] = useState(false);
  const [editingGearDefinition, setEditingGearDefinition] = useState<EditingGearDefinition | null>(null);
  const [editingConsumableDefinition, setEditingConsumableDefinition] =
    useState<EditingConsumableDefinition | null>(null);
  const [busyLibraryAction, setBusyLibraryAction] = useState<{
    itemId: string;
    action: GearLibraryAction;
  } | null>(null);
  const [activeGearSection, setActiveGearSection]         = useState<GearSection>("items");
  const [gearTransition, setGearTransition]               = useState<"idle" | "sliding">("idle");
  const touchStartX = useRef<number | null>(null);
  const toast = useToast();

  const { items: campaignCustomItems, loading: gearLoading } = useCampaignCustomItems({
    campaignId,
    category: "gear",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomGear = useMemo(
    () => campaignCustomItems as CampaignCustomItem<"gear">[],
    [campaignCustomItems]
  );

  const campaignCustomGearById = useMemo(
    () => new Map(campaignCustomGear.map((item) => [item.id, item])),
    [campaignCustomGear]
  );

  const { items: campaignCustomConsumableItems, loading: consumableLoading } = useCampaignCustomItems({
    campaignId,
    category: "consumable",
    mode: isDM ? "admin" : "picker",
    userId,
    characterId,
    includeArchived: isDM,
  });
  const campaignCustomConsumables = useMemo(
    () => campaignCustomConsumableItems as CampaignCustomItem<"consumable">[],
    [campaignCustomConsumableItems]
  );

  const campaignCustomConsumablesById = useMemo(
    () => new Map(campaignCustomConsumables.map((item) => [item.id, item])),
    [campaignCustomConsumables]
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
      setShowConsumablePicker(false);
    },
    [editable, consumables, onUpdateConsumables]
  );

  const updateConsumableQty = useCallback(
    (id: string, qty: number) => {
      if (!editable) return;
      onUpdateConsumables(
        consumables.map((c) => (c.id === id ? { ...c, quantity: qty } : c))
      );
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
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

      if (!versionId) {
        toast.error("This custom consumable has no usable version.");
        return;
      }

      await onUpdateConsumables([
        ...consumables,
        buildConsumableSnapshot(crypto.randomUUID(), 1, libraryItem.data, libraryItem.id, versionId),
      ]);
      setShowConsumablePicker(false);
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
      setShowGearPicker(false);
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

        await onUpdate([
          ...gear,
          buildGearSnapshot(item.id, data, customItemId, versionId),
        ]);
        setShowCustomForm(false);
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
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

      if (!versionId) {
        toast.error("This custom gear has no usable version.");
        return;
      }

      await onUpdate([
        ...gear,
        buildGearSnapshot(crypto.randomUUID(), libraryItem.data, libraryItem.id, versionId),
      ]);
      setShowGearPicker(false);
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
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedGear = gear.map((gearItem) =>
          gearItem.id === editingGearDefinition.item.id
            ? buildGearSnapshot(
                gearItem.id,
                data,
                editingGearDefinition.libraryItem.id,
                versionId
              )
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
    [
      campaignId,
      characterId,
      characterName,
      editingGearDefinition,
      gear,
      onUpdate,
      toast,
      userId,
    ]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(gear.filter((g) => g.id !== id));
    },
    [editable, gear, onUpdate]
  );

  const publishGearDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"gear">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom gear published.");
      } catch (err) {
        console.error("Failed to publish custom gear:", err);
        toast.error("Failed to publish custom gear.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveGearDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"gear">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({ campaignId, customItemId: libraryItem.id, actorUserId: userId });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        toast.success("Custom gear archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom gear:", err);
        toast.error("Failed to archive custom gear.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllGearCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"gear">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(`Updated ${updatedCopies} gear ${updatedCopies === 1 ? "copy" : "copies"}.`);
      } catch (err) {
        console.error("Failed to update custom gear copies:", err);
        toast.error("Failed to update custom gear copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const publishConsumableDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"consumable">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "publish" });
      try {
        await publishCustomItem({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
          versionId: libraryItem.draftVersionId ?? libraryItem.latestVersionId,
        });
        toast.success("Custom consumable published.");
      } catch (err) {
        console.error("Failed to publish custom consumable:", err);
        toast.error("Failed to publish custom consumable.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveConsumableDefinition = useCallback(
    async (libraryItem: CampaignCustomItem<"consumable">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "archive" });
      try {
        await archiveCustomItem({ campaignId, customItemId: libraryItem.id, actorUserId: userId });
        await removeAllCustomItemCopies({ campaignId, customItemId: libraryItem.id });
        toast.success("Custom consumable archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom consumable:", err);
        toast.error("Failed to archive custom consumable.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllConsumableCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"consumable">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(
          `Updated ${updatedCopies} consumable ${updatedCopies === 1 ? "copy" : "copies"}.`
        );
      } catch (err) {
        console.error("Failed to update custom consumable copies:", err);
        toast.error("Failed to update custom consumable copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const switchGearSection = useCallback((section?: GearSection) => {
    setActiveGearSection((current) => {
      const next = section ?? (current === "items" ? "consumables" : "items");
      if (next === current) return current;
      setGearTransition("sliding");
      window.setTimeout(() => setGearTransition("idle"), 180);
      return next;
    });
  }, []);

  const handleGearTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleGearTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 50) return;
    switchGearSection();
  }, [switchGearSection]);

  const transitionClass =
    gearTransition === "sliding"
      ? activeGearSection === "items"
        ? "opacity-0 -translate-x-3"
        : "opacity-0 translate-x-3"
      : "opacity-100";
  const visibleGearSectionClass = (section: GearSection) =>
    [
      "space-y-3",
      activeGearSection === section
        ? `transition-all duration-150 ease-out motion-reduce:transition-none ${transitionClass}`
        : "hidden lg:block",
    ].join(" ");

  if (gearLoading || consumableLoading) return null;

  return (
    <div className="space-y-6" onTouchStart={handleGearTouchStart} onTouchEnd={handleGearTouchEnd}>
      <div className="lg:hidden">
        <div
          className="grid grid-cols-2 rounded-lg border border-slate-600 bg-slate-950/70 p-1"
          role="tablist"
          aria-label="Gear sections"
        >
          {(["items", "consumables"] as const).map((section) => {
            const active = activeGearSection === section;
            return (
              <button
                key={section}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchGearSection(section)}
                className={[
                  "rounded-md px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold transition border",
                  active
                    ? (section === "items" ? colourActiveSky : colourActiveRose)
                    : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                ].join(" ")}
              >
                {section === "items" ? "Items" : "Consumables"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      <section className={visibleGearSectionClass("items")} role="tabpanel">
        <div className="flex items-center justify-between">
          <SectionHeader>Items</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => setShowGearPicker(true)}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              {editable ? "+ Add" : "View"}
            </button>
          )}
        </div>

        {gear.length === 0 && !showCustomForm && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No items recorded.</p>
        )}

        <div className="space-y-3">
          {gear.map((item) => (
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
                (
                  (!!userId && libraryItem.creator.userId === userId) ||
                  (isDM && (characterId === libraryItem.creator.characterId || userId === libraryItem.creator.userId))
                );
              const rowBusyAction =
                busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
                  ? busyLibraryAction.action
                  : null;

              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  editable={editable}
                  libraryItem={libraryItem}
                  isDM={isDM && editable && !!libraryItem && (characterId === libraryItem.creator.characterId || userId === libraryItem.creator.userId)}
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
          ))}
        </div>
      </section>
      {/* CONSUMABLES ──────────────────────────────────────────────────────── */}
      <section className={visibleGearSectionClass("consumables")} role="tabpanel">
        <div className="flex items-center justify-between">
          <SectionHeader>Consumables</SectionHeader>
          <button
            onClick={() => setShowConsumablePicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>

        {consumables.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No consumables recorded.</p>
        )}

        <div className="space-y-3">
          {consumables.map((item) => (
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
                (
                  (!!userId && libraryItem.creator.userId === userId) ||
                  (isDM && (characterId === libraryItem.creator.characterId || userId === libraryItem.creator.userId))
                );
              const rowBusyAction =
                busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
                  ? busyLibraryAction.action
                  : null;

              return (
                <ConsumableRow
                  key={item.id}
                  item={item}
                  editable={editable}
                  libraryItem={libraryItem}
                  isDM={isDM && editable && !!libraryItem && (characterId === libraryItem.creator.characterId || userId === libraryItem.creator.userId)}
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
          ))}
        </div>
      </section>
      </div>

      {showConsumablePicker && (
        <ConsumablePicker
          editable={editable}
          customItems={campaignCustomConsumables.filter((item) =>
            item.status !== "archived" &&
            (item.status === "published" || item.creator.userId === userId || item.creator.characterId === characterId)
          )}
          onSelect={addConsumableFromRef}
          onSelectCustomItem={addConsumableFromLibrary}
          onCustom={() => {
            setShowConsumablePicker(false);
            setShowCustomConsumableForm(true);
            setActiveGearSection("consumables");
          }}
          onClose={() => setShowConsumablePicker(false)}
        />
      )}

      {showCustomConsumableForm && (
        <CustomConsumableForm
          onAdd={addCustomConsumable}
          onCancel={() => setShowCustomConsumableForm(false)}
        />
      )}

      {showGearPicker && (
        <GearPicker
          editable={editable}
          customItems={campaignCustomGear.filter((item) =>
            item.status !== "archived" &&
            (item.status === "published" || item.creator.userId === userId || item.creator.characterId === characterId)
          )}
          onSelect={addFromRef}
          onSelectCustomItem={addCustomFromLibrary}
          onCustom={() => {
            setShowGearPicker(false);
            setShowCustomForm(true);
            setActiveGearSection("items");
          }}
          onClose={() => setShowGearPicker(false)}
        />
      )}

      {showCustomForm && (
        <CustomItemForm
          onAdd={addCustom}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

      {editingGearDefinition && (
        <CustomItemForm
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
