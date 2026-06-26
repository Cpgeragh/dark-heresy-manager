// src/pages/characterSheet/ArmourTab/index.tsx

import { useState, useCallback, useMemo, type ReactNode } from "react";
import type {
  WornArmourPiece,
  CyberneticItem,
  ArmourCraftsmanship,
  ArcheotechItem,
} from "../../../types/Character";
import type { ArmourRef } from "../../../data/reference/armourReference";
import type { CampaignCustomItem, CustomArmourData } from "../../../types/CustomItems";

import { wornApAt, bionicBonusAt, LOCATION_LABELS, LOCATION_ORDER } from "./armourHelpers";
import { ArmourPicker } from "./ArmourPicker";
import { ForceFieldPicker } from "./ForceFieldPicker";
import { PieceNotesModal } from "./PieceNotesModal";
import { CustomPieceForm } from "./CustomPieceForm";
import { ForceFieldRow } from "./ForceFieldRow";
import { PieceRow } from "./PieceRow";
import { ArcheotechArmourRow } from "./ArcheotechArmourRow";
import { uiSection, uiTextLabel, uiTextMuted, uiTextPlaceholder } from "../../../ui/editableStyles";
import { SectionHeader } from "../../../ui/SectionHeader";
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

interface ArmourTabProps {
  campaignId: string;
  characterId: string;
  userId: string | null;
  characterName?: string;
  isDM: boolean;
  armour: WornArmourPiece[];
  toughnessBonus: number;
  editable: boolean;
  onUpdate: (next: WornArmourPiece[]) => void | Promise<void>;
  cybernetics?: CyberneticItem[];
  archeotech?: ArcheotechItem[];
  onUpdateArcheotech?: (next: ArcheotechItem[]) => void | Promise<void>;
}

interface EditingArmourDefinition {
  piece: WornArmourPiece;
  libraryItem: CampaignCustomItem<"armour">;
}

type ArmourLibraryAction = "publish" | "archive" | "updateAll";

function formatKg(value: number): string {
  return `${Number(value.toFixed(2))} kg`;
}

function halveWeight(weight: string): string {
  const match = weight.trim().match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (!match) return weight;
  return formatKg(Number(match[1]) / 2);
}

function applyCraftsmanshipToRef(ref: ArmourRef, craftsmanship: ArmourCraftsmanship) {
  if (craftsmanship !== "Best") {
    return {
      ap: ref.ap,
      apOverrides: ref.apOverrides,
      weight: ref.weight,
    };
  }

  const apOverrides = ref.apOverrides
    ? (Object.fromEntries(
        Object.entries(ref.apOverrides).map(([location, ap]) => [location, (ap ?? ref.ap) + 1])
      ) as typeof ref.apOverrides)
    : undefined;

  return {
    ap: ref.ap + 1,
    apOverrides,
    weight: halveWeight(ref.weight),
  };
}

function ArmourPieceGrid({
  pieces,
  renderPiece,
}: {
  pieces: WornArmourPiece[];
  renderPiece: (piece: WornArmourPiece) => ReactNode;
}) {
  const columns = [
    pieces.filter((_, index) => index % 2 === 0),
    pieces.filter((_, index) => index % 2 === 1),
  ];

  return (
    <>
      <div className="space-y-2 sm:hidden">{pieces.map(renderPiece)}</div>
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-2 sm:items-start">
        {columns.map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map(renderPiece)}
          </div>
        ))}
      </div>
    </>
  );
}

function ForceFieldGrid({
  pieces,
  renderPiece,
}: {
  pieces: WornArmourPiece[];
  renderPiece: (piece: WornArmourPiece) => ReactNode;
}) {
  const columns = [
    pieces.filter((_, index) => index % 2 === 0),
    pieces.filter((_, index) => index % 2 === 1),
  ];

  return (
    <>
      <div className="space-y-2 sm:hidden">{pieces.map(renderPiece)}</div>
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-2 sm:items-start">
        {columns.map((column, index) => (
          <div key={index} className="space-y-2">
            {column.map(renderPiece)}
          </div>
        ))}
      </div>
    </>
  );
}

export function ArmourTab({
  campaignId,
  characterId,
  userId,
  characterName,
  isDM,
  armour,
  toughnessBonus,
  editable,
  onUpdate,
  cybernetics = [],
  archeotech,
  onUpdateArcheotech,
}: ArmourTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [infoTarget, setInfoTarget] = useState<WornArmourPiece | null>(null);
  const [pickerMode, setPickerMode] = useState<"worn" | "stowed">("worn");
  const [editingArmourDefinition, setEditingArmourDefinition] =
    useState<EditingArmourDefinition | null>(null);
  const [busyLibraryAction, setBusyLibraryAction] = useState<{
    itemId: string;
    action: ArmourLibraryAction;
  } | null>(null);
  const toast = useToast();

  const { items: campaignCustomArmourItems, loading: armourLoading } = useCampaignCustomItems({
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

  const addPiece = useCallback(
    async (piece: WornArmourPiece) => {
      if (!editable) return;
      const nextPiece = piece.isForceField
        ? piece
        : { ...piece, craftsmanship: piece.craftsmanship ?? ("Common" as const) };
      await onUpdate([
        ...armour,
        { ...nextPiece, worn: piece.isForceField ? piece.worn : pickerMode === "worn" },
      ]);
      setShowPicker(false);
      setShowFieldPicker(false);
      setShowCustomForm(false);
    },
    [editable, armour, onUpdate, pickerMode]
  );

  const fromReference = useCallback(
    (ref: ArmourRef, craftsmanship: ArmourCraftsmanship = "Common") => {
      const crafted = applyCraftsmanshipToRef(ref, craftsmanship);
      addPiece({
        id: crypto.randomUUID(),
        referenceId: ref.id,
        name: ref.name,
        locations: ref.locations,
        ap: crafted.ap,
        ...(crafted.apOverrides ? { apOverrides: crafted.apOverrides } : {}),
        ...(ref.isForceField ? { isForceField: true } : {}),
        ...(ref.protectionRating !== undefined ? { protectionRating: ref.protectionRating } : {}),
        ...(!ref.isForceField ? { craftsmanship } : {}),
        worn: true,
        weight: crafted.weight,
        value: ref.value,
        availability: ref.availability,
        source: ref.source,
      });
    },
    [addPiece]
  );

  const addCustomPiece = useCallback(
    async (piece: WornArmourPiece) => {
      if (!editable) return;
      if (!userId) {
        toast.error("You must be signed in to create campaign custom armour.");
        return;
      }

      try {
        const data = toCustomArmourData(piece);
        const { customItemId, versionId } = await createDraftCustomItem({
          campaignId,
          category: "armour",
          creator: { userId, characterId, characterName },
          data,
        });

        await onUpdate([
          ...armour,
          buildArmourSnapshot(piece.id, pickerMode === "worn", data, customItemId, versionId),
        ]);
        setShowCustomForm(false);
        toast.success("Custom armour saved as a campaign draft.");
      } catch (err) {
        console.error("Failed to create custom armour:", err);
        toast.error("Failed to save custom armour.");
      }
    },
    [armour, campaignId, characterId, characterName, editable, onUpdate, pickerMode, toast, userId]
  );

  const addArmourFromLibrary = useCallback(
    async (libraryItem: CampaignCustomItem<"armour">, wornState = pickerMode === "worn") => {
      if (!editable) return;
      if (libraryItem.data.armourKind !== "worn") return;

      const versionId =
        libraryItem.status === "published"
          ? libraryItem.publishedVersionId
          : libraryItem.draftVersionId ?? libraryItem.latestVersionId;

      if (!versionId) {
        toast.error("This custom armour has no usable version.");
        return;
      }

      await onUpdate([
        ...armour,
        buildArmourSnapshot(crypto.randomUUID(), wornState, libraryItem.data, libraryItem.id, versionId),
      ]);
      setShowPicker(false);
      setShowFieldPicker(false);
    },
    [armour, editable, onUpdate, pickerMode, toast]
  );

  const saveEditedArmourDefinition = useCallback(
    async (piece: WornArmourPiece) => {
      if (!editingArmourDefinition || !userId) return;

      try {
        const data = toCustomArmourData(piece);
        const versionId = await saveDraftCustomItem({
          campaignId,
          customItemId: editingArmourDefinition.libraryItem.id,
          editor: { userId, characterId, characterName },
          data,
        });
        const updatedArmour = armour.map((armourPiece) =>
          armourPiece.id === editingArmourDefinition.piece.id
            ? buildArmourSnapshot(
                armourPiece.id,
                armourPiece.worn,
                data,
                editingArmourDefinition.libraryItem.id,
                versionId
              )
            : armourPiece
        );

        await onUpdate(updatedArmour);
        setEditingArmourDefinition(null);
        toast.success("Custom armour draft updated.");
      } catch (err) {
        console.error("Failed to update custom armour definition:", err);
        toast.error("Failed to update custom armour definition.");
      }
    },
    [
      armour,
      campaignId,
      characterId,
      characterName,
      editingArmourDefinition,
      onUpdate,
      toast,
      userId,
    ]
  );

  const toggleWorn = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(armour.map((p) => (p.id === id ? { ...p, worn: !p.worn } : p)));
    },
    [editable, armour, onUpdate]
  );

  const removePiece = useCallback(
    (id: string) => {
      if (!editable) return;
      onUpdate(armour.filter((p) => p.id !== id));
    },
    [editable, armour, onUpdate]
  );

  const toggleForceField = useCallback(
    (id: string) => {
      if (!editable) return;
      const field = armour.find((p) => p.id === id);
      if (!field) return;
      const activating = !field.worn;
      onUpdate(
        armour.map((p) => {
          if (!p.isForceField) return p;
          if (activating) return { ...p, worn: p.id === id };
          return p.id === id ? { ...p, worn: false } : p;
        })
      );
    },
    [editable, armour, onUpdate]
  );

  const publishArmourDefinition = useCallback(
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
        toast.success("Custom armour published.");
      } catch (err) {
        console.error("Failed to publish custom armour:", err);
        toast.error("Failed to publish custom armour.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const archiveArmourDefinition = useCallback(
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
        toast.success("Custom armour archived and removed from all characters.");
      } catch (err) {
        console.error("Failed to archive custom armour:", err);
        toast.error("Failed to archive custom armour.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const updateAllArmourCopies = useCallback(
    async (libraryItem: CampaignCustomItem<"armour">) => {
      if (!userId) return;
      setBusyLibraryAction({ itemId: libraryItem.id, action: "updateAll" });
      try {
        const updatedCopies = await publishAndUpdateAllCopies({
          campaignId,
          customItemId: libraryItem.id,
          actorUserId: userId,
        });
        toast.success(`Updated ${updatedCopies} armour ${updatedCopies === 1 ? "copy" : "copies"}.`);
      } catch (err) {
        console.error("Failed to update custom armour copies:", err);
        toast.error("Failed to update custom armour copies.");
      } finally {
        setBusyLibraryAction(null);
      }
    },
    [campaignId, toast, userId]
  );

  const regularArmour = armour.filter((p) => !p.isForceField);
  const forceFields = armour.filter((p) => p.isForceField);
  const worn = regularArmour.filter((p) => p.worn);
  const stowed = regularArmour.filter((p) => !p.worn);

  const archeotechArmourItems = (archeotech ?? []).filter((a) => a.type === "Armour");
  const archeotechArmourWorn = archeotechArmourItems.filter((a) => a.equipped);
  const archeotechArmourStowed = archeotechArmourItems.filter((a) => !a.equipped);

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

  const getLibraryItemForPiece = useCallback(
    (piece: WornArmourPiece) => {
      const linkedLibraryItem = piece.customLibraryId
        ? campaignCustomArmourById.get(piece.customLibraryId)
        : undefined;
      return (
        linkedLibraryItem ??
        (piece.customLibraryId
          ? buildFallbackArmourLibraryItem({
              campaignId,
              piece,
              userId,
              characterId,
              characterName,
            })
          : undefined)
      );
    },
    [campaignCustomArmourById, campaignId, characterId, characterName, userId]
  );

  const renderArmourRow = useCallback(
    (piece: WornArmourPiece, wornState: boolean) => {
      const libraryItem = getLibraryItemForPiece(piece);
      const canEditDefinition =
        !!libraryItem &&
        !piece.isForceField &&
        editable &&
        (isDM || (!!userId && libraryItem.creator.userId === userId));
      const rowBusyAction =
        busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
          ? busyLibraryAction.action
          : null;

      return (
        <PieceRow
          key={piece.id}
          piece={piece}
          editable={editable}
          worn={wornState}
          libraryItem={libraryItem}
          isDM={isDM && editable}
          canEditDefinition={canEditDefinition}
          busyAction={rowBusyAction}
          onEditDefinition={() => libraryItem && setEditingArmourDefinition({ piece, libraryItem })}
          onPublish={() => libraryItem && publishArmourDefinition(libraryItem)}
          onArchive={() => libraryItem && archiveArmourDefinition(libraryItem)}
          onUpdateAllCopies={() => libraryItem && updateAllArmourCopies(libraryItem)}
          onToggle={toggleWorn}
          onRemove={removePiece}
          onInfo={setInfoTarget}
        />
      );
    },
    [
      archiveArmourDefinition,
      busyLibraryAction,
      editable,
      getLibraryItemForPiece,
      isDM,
      publishArmourDefinition,
      removePiece,
      toggleWorn,
      updateAllArmourCopies,
      userId,
    ]
  );

  const renderForceFieldRow = useCallback(
    (piece: WornArmourPiece) => {
      const libraryItem = getLibraryItemForPiece(piece);
      const rowBusyAction =
        busyLibraryAction && libraryItem && busyLibraryAction.itemId === libraryItem.id
          ? busyLibraryAction.action
          : null;

      return (
        <ForceFieldRow
          key={piece.id}
          piece={piece}
          editable={editable}
          libraryItem={libraryItem}
          isDM={isDM && editable}
          canEditDefinition={false}
          busyAction={rowBusyAction}
          onPublish={() => libraryItem && publishArmourDefinition(libraryItem)}
          onArchive={() => libraryItem && archiveArmourDefinition(libraryItem)}
          onUpdateAllCopies={() => libraryItem && updateAllArmourCopies(libraryItem)}
          onToggle={toggleForceField}
          onRemove={removePiece}
          onInfo={setInfoTarget}
        />
      );
    },
    [
      archiveArmourDefinition,
      busyLibraryAction,
      editable,
      getLibraryItemForPiece,
      isDM,
      publishArmourDefinition,
      removePiece,
      toggleForceField,
      updateAllArmourCopies,
    ]
  );

  if (armourLoading) return null;

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader className="mb-2">Location Summary</SectionHeader>
        <div className={uiSection}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm lg:text-base border-collapse">
              <thead>
                <tr className={uiTextLabel}>
                  <th className="text-left py-1.5 pr-4 font-medium">Location</th>
                  <th className="text-center py-1.5 px-3 font-medium">AP</th>
                  <th className="text-center py-1.5 px-3 font-medium">TB</th>
                  <th className="text-center py-1.5 px-3 font-medium">Bionic</th>
                  <th className="text-center py-1.5 px-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {LOCATION_ORDER.map((loc) => {
                  const regularAp = wornApAt(regularArmour, loc);
                  const nonStackingArcheotechAp = archeotechArmourWorn
                    .filter((a) => !a.stacks && (a.locations ?? []).includes(loc))
                    .reduce((max, a) => Math.max(max, a.ap ?? 0), 0);
                  const stackingAp = archeotechArmourWorn
                    .filter((a) => a.stacks && (a.locations ?? []).includes(loc))
                    .reduce((sum, a) => sum + (a.ap ?? 0), 0);
                  const ap = Math.max(regularAp, nonStackingArcheotechAp) + stackingAp;
                  const bionic = bionicBonusAt(loc, cybernetics);
                  const total = ap + toughnessBonus + bionic;
                  return (
                    <tr key={loc} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 pr-4 text-slate-100">{LOCATION_LABELS[loc]}</td>
                      <td className="py-2 px-3 text-center font-code text-slate-200">{ap}</td>
                      <td className={`py-2 px-3 text-center font-code ${uiTextMuted}`}>
                        {toughnessBonus}
                      </td>
                      <td
                        className={`py-2 px-3 text-center font-code ${bionic > 0 ? "text-cyan-400" : "text-slate-700"}`}
                      >
                        {bionic > 0 ? `+${bionic}` : "-"}
                      </td>
                      <td className="py-2 px-3 text-center font-code font-semibold text-amber-300">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={`text-xs lg:text-sm ${uiTextMuted} mt-2`}>
            Total = Armour Points (worn only) + Toughness Bonus + Bionic (+2 per installed bionic
            limb)
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Worn ({worn.length + archeotechArmourWorn.length})</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => {
                setPickerMode("worn");
                setShowPicker(true);
              }}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              {editable ? "+ Equip" : "View"}
            </button>
          )}
        </div>
        {worn.length === 0 && archeotechArmourWorn.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No armour worn.</p>
        )}
        {worn.length > 0 && (
          <ArmourPieceGrid pieces={worn} renderPiece={(piece) => renderArmourRow(piece, true)} />
        )}
        {archeotechArmourWorn.map((item) => (
          <ArcheotechArmourRow
            key={item.id}
            item={item}
            editable={editable}
            onToggleEquip={() => toggleEquipArcheotech(item.id)}
            onRemove={() => removeArcheotech(item.id)}
          />
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Stowed ({stowed.length + archeotechArmourStowed.length})</SectionHeader>
          {!showCustomForm && (
            <button
              onClick={() => {
                setPickerMode("stowed");
                setShowPicker(true);
              }}
              className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
            >
              {editable ? "+ Stow" : "View"}
            </button>
          )}
        </div>
        {stowed.length === 0 && archeotechArmourStowed.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No armour stowed.</p>
        )}
        {stowed.length > 0 && (
          <ArmourPieceGrid pieces={stowed} renderPiece={(piece) => renderArmourRow(piece, false)} />
        )}
        {archeotechArmourStowed.map((item) => (
          <ArcheotechArmourRow
            key={item.id}
            item={item}
            editable={editable}
            onToggleEquip={() => toggleEquipArcheotech(item.id)}
            onRemove={() => removeArcheotech(item.id)}
          />
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Force Fields ({forceFields.length})</SectionHeader>
          <button
            onClick={() => setShowFieldPicker(true)}
            className="text-xs lg:text-sm px-3 lg:px-4 py-1 lg:py-1.5 rounded border border-red-500 text-red-500 font-semibold hover:bg-red-500/10 transition"
          >
            {editable ? "+ Add" : "View"}
          </button>
        </div>
        {forceFields.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No force field equipped.</p>
        )}
        {forceFields.length > 0 && (
          <ForceFieldGrid pieces={forceFields} renderPiece={renderForceFieldRow} />
        )}
      </section>

      {editable && showCustomForm && (
        <section>
          <CustomPieceForm onAdd={addCustomPiece} onCancel={() => setShowCustomForm(false)} />
        </section>
      )}

      {editingArmourDefinition && (
        <section>
          <CustomPieceForm
            title="Edit Custom Armour"
            submitLabel="Save Draft"
            initialPiece={{
              id: editingArmourDefinition.piece.id,
              worn: editingArmourDefinition.piece.worn,
              ...stripArmourKind(editingArmourDefinition.libraryItem.data),
              customLibraryId: editingArmourDefinition.libraryItem.id,
              customLibraryVersionId:
                editingArmourDefinition.libraryItem.draftVersionId ??
                editingArmourDefinition.libraryItem.latestVersionId,
            }}
            onAdd={saveEditedArmourDefinition}
            onCancel={() => setEditingArmourDefinition(null)}
          />
        </section>
      )}

      {showPicker && (
        <ArmourPicker
          editable={editable}
          customItems={campaignCustomArmour.filter((item) => item.status !== "archived")}
          onSelect={fromReference}
          onSelectCustomItem={(item) => addArmourFromLibrary(item)}
          onCustom={() => {
            setShowPicker(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showFieldPicker && (
        <ForceFieldPicker
          editable={editable}
          customItems={campaignCustomArmour.filter((item) => item.status !== "archived")}
          onSelect={(ref) => {
            fromReference(ref);
            setShowFieldPicker(false);
          }}
          onSelectCustomItem={(item) => addArmourFromLibrary(item, true)}
          onClose={() => setShowFieldPicker(false)}
        />
      )}
      {infoTarget && <PieceNotesModal piece={infoTarget} onClose={() => setInfoTarget(null)} />}
    </div>
  );
}

function toCustomArmourData(piece: WornArmourPiece): CustomArmourData {
  const {
    id: _id,
    referenceId: _referenceId,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    worn: _worn,
    ...data
  } = piece;

  return {
    ...data,
    armourKind: "worn",
  };
}

function stripArmourKind(data: CustomArmourData): Omit<WornArmourPiece, "id" | "worn"> {
  if (data.armourKind !== "worn") {
    throw new Error("Unsupported armour library item for Armour tab.");
  }

  const { armourKind: _armourKind, ...pieceData } = data;
  return pieceData;
}

function buildArmourSnapshot(
  id: string,
  worn: boolean,
  data: CustomArmourData,
  customLibraryId: string,
  customLibraryVersionId: string
): WornArmourPiece {
  if (data.armourKind !== "worn") {
    throw new Error("Unsupported armour library item for Armour tab.");
  }

  const { armourKind: _armourKind, ...pieceData } = data;
  return {
    id,
    ...pieceData,
    worn,
    customLibraryId,
    customLibraryVersionId,
  };
}

function buildFallbackArmourLibraryItem({
  campaignId,
  piece,
  userId,
  characterId,
  characterName,
}: {
  campaignId: string;
  piece: WornArmourPiece;
  userId: string | null;
  characterId: string;
  characterName?: string;
}): CampaignCustomItem<"armour"> {
  const data = toCustomArmourData(piece);
  const creator = {
    userId: userId ?? "",
    characterId,
    characterName,
  };

  return {
    id: piece.customLibraryId ?? "",
    campaignId,
    category: "armour",
    status: inferCustomItemStatus(piece),
    name: piece.name,
    creator,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creator,
    updatedBy: creator,
    publishedVersionId: null,
    draftVersionId: piece.customLibraryVersionId ?? null,
    latestVersionId: piece.customLibraryVersionId ?? "",
    latestVersionNumber: 1,
    archivedAt: null,
    archivedByUserId: null,
    data,
  };
}
