// src/pages/characterSheet/ArmourTab/index.tsx

import { useState, useCallback, useMemo, type ReactNode } from "react";
import type {
  WornArmourPiece,
  CyberneticItem,
  ArmourCraftsmanship,
  ArcheotechItem,
  TalentEntry,
} from "../../../types/Character";
import type { ArmourRef } from "../../../data/reference/armourReference";
import type { CampaignCustomItem, CustomArmourData } from "../../../types/CustomItems";

import { wornApAt, bionicBonusAt, naturalArmourBonus } from "./armourHelpers";
import { ARMOUR_LOCATION_LABELS, ARMOUR_LOCATION_ORDER } from "../../../constants/locations";
import { ArmourPicker } from "./ArmourPicker";
import { ForceFieldPicker } from "./ForceFieldPicker";
import { CustomPieceForm } from "./CustomPieceForm";
import { ForceFieldRow } from "./ForceFieldRow";
import { PieceRow } from "./PieceRow";
import { ArcheotechArmourRow } from "./ArcheotechArmourRow";
import { ArcheotechForceFieldRow } from "./ArcheotechForceFieldRow";
import { Button } from "../../../ui/Button";
import {
  uiSection,
  uiTextLabel,
  uiTextPlaceholder,
  uiInfoModalWrapper,
} from "../../../ui/editableStyles";
import { SectionHeader } from "../../../ui/SectionHeader";
import { ErrorState } from "../../../ui/ErrorState";
import { LoadingState } from "../../../ui/LoadingState";
import { InfoModal } from "../../../components/InfoModal";
import { useCampaignCustomItems } from "../../../hooks/useCampaignCustomItems";
import { useCustomItemLibraryActions } from "../../../hooks/useCustomItemLibraryActions";
import {
  createDraftCustomItem,
  inferCustomItemStatus,
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
  traits?: TalentEntry[];
}

interface EditingArmourDefinition {
  piece: WornArmourPiece;
  libraryItem: CampaignCustomItem<"armour">;
}

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
  traits = [],
}: ArmourTabProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormForceField, setCustomFormForceField] = useState(false);
  const [pickerMode, setPickerMode] = useState<"worn" | "stowed">("worn");
  const [editingArmourDefinition, setEditingArmourDefinition] =
    useState<EditingArmourDefinition | null>(null);
  const toast = useToast();
  const {
    publishDefinition: publishArmourDefinition,
    archiveDefinition: archiveArmourDefinition,
    updateAllCopies: updateAllArmourCopies,
    getBusyAction,
  } = useCustomItemLibraryActions<"armour">({ campaignId, userId, itemLabel: "armour" });

  const {
    items: campaignCustomArmourItems,
    loading: armourLoading,
    error: armourError,
  } = useCampaignCustomItems({
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
        craftsmanship,
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
          buildArmourSnapshot(
            piece.id,
            piece.isForceField ? piece.worn : pickerMode === "worn",
            data,
            customItemId,
            versionId
          ),
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
          : (libraryItem.draftVersionId ?? libraryItem.latestVersionId);

      if (!versionId) {
        toast.error("This custom armour has no usable version.");
        return;
      }

      await onUpdate([
        ...armour,
        buildArmourSnapshot(
          crypto.randomUUID(),
          wornState,
          libraryItem.data,
          libraryItem.id,
          versionId
        ),
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

  const addUpgradeToArmour = useCallback(
    (pieceId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdate(
        armour.map((piece) =>
          piece.id === pieceId
            ? { ...piece, upgrades: [...(piece.upgrades ?? []), upgradeId] }
            : piece
        )
      );
    },
    [armour, editable, onUpdate]
  );

  const removeUpgradeFromArmour = useCallback(
    (pieceId: string, upgradeId: string) => {
      if (!editable) return;
      onUpdate(
        armour.map((piece) =>
          piece.id === pieceId
            ? { ...piece, upgrades: (piece.upgrades ?? []).filter((id) => id !== upgradeId) }
            : piece
        )
      );
    },
    [armour, editable, onUpdate]
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

  const regularArmour = armour.filter((p) => !p.isForceField);
  const forceFields = armour.filter((p) => p.isForceField);
  const worn = regularArmour.filter((p) => p.worn);
  const stowed = regularArmour.filter((p) => !p.worn);

  const archeotechArmourItems = (archeotech ?? []).filter((a) => a.type === "Armour");
  const archeotechArmourWorn = archeotechArmourItems.filter((a) => a.equipped);
  const archeotechArmourStowed = archeotechArmourItems.filter((a) => !a.equipped);
  const archeotechForceFieldItems = (archeotech ?? []).filter((a) => a.type === "Force Field");

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
      const rowBusyAction = libraryItem ? getBusyAction(libraryItem.id) : null;

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
          onAddUpgrade={addUpgradeToArmour}
          onRemoveUpgrade={removeUpgradeFromArmour}
        />
      );
    },
    [
      archiveArmourDefinition,
      addUpgradeToArmour,
      editable,
      getBusyAction,
      getLibraryItemForPiece,
      isDM,
      publishArmourDefinition,
      removePiece,
      removeUpgradeFromArmour,
      toggleWorn,
      updateAllArmourCopies,
      userId,
    ]
  );

  const renderForceFieldRow = useCallback(
    (piece: WornArmourPiece) => {
      const libraryItem = getLibraryItemForPiece(piece);
      const rowBusyAction = libraryItem ? getBusyAction(libraryItem.id) : null;

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
        />
      );
    },
    [
      archiveArmourDefinition,
      editable,
      getBusyAction,
      getLibraryItemForPiece,
      isDM,
      publishArmourDefinition,
      removePiece,
      toggleForceField,
      updateAllArmourCopies,
    ]
  );

  if (armourError) {
    return <ErrorState>Unable to load custom armour items.</ErrorState>;
  }

  if (armourLoading) {
    return <LoadingState>Loading custom armour items…</LoadingState>;
  }

  const naturalBonus = naturalArmourBonus(traits);
  const bionicLocations = ARMOUR_LOCATION_ORDER.filter(
    (loc) => bionicBonusAt(loc, cybernetics) > 0
  );
  const hasMisc = naturalBonus > 0 || bionicLocations.length > 0;

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader className="mb-2">Location Summary</SectionHeader>
        <div className={uiSection}>
          <div className="overflow-x-auto">
            <table className="w-full lg:table-fixed text-sm lg:text-base border-collapse">
              <thead>
                <tr className={uiTextLabel}>
                  <th className="lg:w-32 text-left py-1.5 pr-4 font-medium">Location</th>
                  <th className="text-center py-1.5 px-3 font-medium">TB</th>
                  <th className="text-center py-1.5 px-3 font-medium">AP</th>
                  <th className="text-center py-1.5 px-3 font-medium">
                    <span className="inline-flex items-center gap-1">
                      Misc
                      {hasMisc && (
                        <span className={uiInfoModalWrapper}>
                          <InfoModal
                            title="Misc Bonuses"
                            content={
                              <>
                                {naturalBonus > 0 && (
                                  <p>Natural Armour: +{naturalBonus} to all locations.</p>
                                )}
                                {bionicLocations.length > 0 && (
                                  <p>
                                    Bionic: +2 at{" "}
                                    {bionicLocations
                                      .map((l) => ARMOUR_LOCATION_LABELS[l])
                                      .join(", ")}
                                    .
                                  </p>
                                )}
                              </>
                            }
                          />
                        </span>
                      )}
                    </span>
                  </th>
                  <th className="text-center py-1.5 px-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ARMOUR_LOCATION_ORDER.map((loc) => {
                  const regularAp = wornApAt(regularArmour, loc);
                  const nonStackingArcheotechAp = archeotechArmourWorn
                    .filter((a) => !a.stacks && (a.locations ?? []).includes(loc))
                    .reduce((max, a) => Math.max(max, a.ap ?? 0), 0);
                  const stackingAp = archeotechArmourWorn
                    .filter((a) => a.stacks && (a.locations ?? []).includes(loc))
                    .reduce((sum, a) => sum + (a.ap ?? 0), 0);
                  const ap = Math.max(regularAp, nonStackingArcheotechAp) + stackingAp;
                  const bionic = bionicBonusAt(loc, cybernetics);
                  const misc = bionic + naturalBonus;
                  const total = ap + toughnessBonus + misc;
                  return (
                    <tr key={loc} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 pr-4 text-slate-100">{ARMOUR_LOCATION_LABELS[loc]}</td>
                      <td className="py-2 px-3 text-center font-code text-white">
                        {toughnessBonus}
                      </td>
                      <td className="py-2 px-3 text-center font-code text-white">+{ap}</td>
                      <td
                        className={`py-2 px-3 text-center font-code ${misc > 0 ? "text-white" : "text-slate-700"}`}
                      >
                        {misc > 0 ? `+${misc}` : "-"}
                      </td>
                      <td className="py-2 px-3 text-center font-code font-semibold text-emerald-400">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Worn</SectionHeader>
          <Button
            size="sm"
            onClick={() => {
              setPickerMode("worn");
              setShowPicker(true);
            }}
          >
            {editable ? "+ Equip" : "View"}
          </Button>
        </div>
        {worn.length === 0 && archeotechArmourWorn.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No armour worn.</p>
        )}
        {worn.length > 0 && (
          <ArmourPieceGrid pieces={worn} renderPiece={(piece) => renderArmourRow(piece, true)} />
        )}
        {archeotechArmourWorn.length > 0 && (
          <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 sm:items-start">
            {archeotechArmourWorn.map((item) => (
              <ArcheotechArmourRow
                key={item.id}
                item={item}
                editable={editable}
                onToggleEquip={() => toggleEquipArcheotech(item.id)}
                onRemove={() => removeArcheotech(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Stowed</SectionHeader>
          <Button
            size="sm"
            onClick={() => {
              setPickerMode("stowed");
              setShowPicker(true);
            }}
          >
            {editable ? "+ Stow" : "View"}
          </Button>
        </div>
        {stowed.length === 0 && archeotechArmourStowed.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No armour stowed.</p>
        )}
        {stowed.length > 0 && (
          <ArmourPieceGrid pieces={stowed} renderPiece={(piece) => renderArmourRow(piece, false)} />
        )}
        {archeotechArmourStowed.length > 0 && (
          <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0 sm:items-start">
            {archeotechArmourStowed.map((item) => (
              <ArcheotechArmourRow
                key={item.id}
                item={item}
                editable={editable}
                onToggleEquip={() => toggleEquipArcheotech(item.id)}
                onRemove={() => removeArcheotech(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeader>Force Fields</SectionHeader>
          <Button size="sm" onClick={() => setShowFieldPicker(true)}>
            {editable ? "+ Add" : "View"}
          </Button>
        </div>
        {forceFields.length === 0 && archeotechForceFieldItems.length === 0 && (
          <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No force field equipped.</p>
        )}
        {forceFields.length > 0 && (
          <ForceFieldGrid pieces={forceFields} renderPiece={renderForceFieldRow} />
        )}
        {archeotechForceFieldItems.map((item) => (
          <ArcheotechForceFieldRow
            key={item.id}
            item={item}
            editable={editable}
            onToggleEquip={() => toggleEquipArcheotech(item.id)}
            onRemove={() => removeArcheotech(item.id)}
          />
        ))}
      </section>

      {editable && showCustomForm && (
        <CustomPieceForm
          title={customFormForceField ? "Custom Force Field" : "Custom Piece"}
          forceField={customFormForceField}
          onAdd={addCustomPiece}
          onCancel={() => setShowCustomForm(false)}
        />
      )}

      {editingArmourDefinition && (
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
      )}

      {showPicker && (
        <ArmourPicker
          editable={editable}
          customItems={campaignCustomArmour.filter((item) => item.status !== "archived")}
          onSelect={fromReference}
          onSelectCustomItem={(item) => addArmourFromLibrary(item)}
          onCustom={() => {
            setShowPicker(false);
            setCustomFormForceField(false);
            setShowCustomForm(true);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showFieldPicker && (
        <ForceFieldPicker
          editable={editable}
          customItems={campaignCustomArmour.filter((item) => item.status !== "archived")}
          onSelect={(ref, craftsmanship) => {
            fromReference(ref, craftsmanship);
            setShowFieldPicker(false);
          }}
          onSelectCustomItem={(item) => addArmourFromLibrary(item, true)}
          onCustom={() => {
            setShowFieldPicker(false);
            setCustomFormForceField(true);
            setShowCustomForm(true);
          }}
          onClose={() => setShowFieldPicker(false)}
        />
      )}
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
    upgrades: _upgrades,
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
