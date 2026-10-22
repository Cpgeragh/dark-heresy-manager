import { useState } from "react";
import type { WornArmourPiece } from "../../../types/Character";
import { uiTextLabel, uiTextPlaceholder, uiStackList } from "../../../ui/styles/editableStyles";
import { StateToggleButton } from "../../../ui/buttons/StateToggleButton";
import { OwnedEntryRow } from "../../../ui/OwnedEntryRow";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { InfoParagraph } from "../../../ui/InfoSection";
import {
  apBreakdown,
  armourCraftsmanshipDescription,
  compatibleArmourUpgrades,
  effectiveArmourWeight,
} from "./armourHelpers";
import { locationLabel } from "../../../utils/armourLocations";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { ArmourQualitiesContent } from "./ArmourQualitiesContent";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import { ARMOUR_UPGRADE_REFERENCE } from "../../../data/reference/armourUpgradeReference";
import { ArmourUpgradeCard, ArmourUpgradePicker } from "./ArmourUpgradePicker";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { colourDivider } from "../../../ui/styles/colourTokens";

interface Props extends CustomItemLibraryActionProps<"armour"> {
  piece: WornArmourPiece;
  editable: boolean;
  worn: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAddUpgrade: (pieceId: string, upgradeId: string) => void;
  onRemoveUpgrade: (pieceId: string, upgradeId: string) => void;
}

export function PieceRow({
  piece,
  editable,
  worn,
  libraryItem,
  isDM = false,
  canEditDefinition = false,
  busyAction = null,
  onEditDefinition,
  onPublish,
  onArchive,
  onUpdateAllCopies,
  onToggle,
  onRemove,
  onAddUpgrade,
  onRemoveUpgrade,
}: Props) {
  recordComponentRender("ArmourPieceRow");
  const [showUpgradePicker, setShowUpgradePicker] = useState(false);
  const apDesc = apBreakdown(piece);
  const craftsmanship = piece.craftsmanship ?? "Common";

  const ref = ARMOUR_REFERENCE.find((r) => r.id === piece.referenceId);
  const qualities = piece.qualities ?? ref?.qualities ?? [];
  const notes = piece.notes ?? ref?.notes;
  const upgradeIds = piece.upgrades ?? [];
  const upgradeRefs = ARMOUR_UPGRADE_REFERENCE.filter((upgrade) => upgradeIds.includes(upgrade.id));
  const compatible = compatibleArmourUpgrades(piece);
  const addableCompatible = compatible.filter((upgrade) => !upgradeIds.includes(upgrade.id));

  return (
    <>
      <OwnedEntryRow
        name={piece.name}
        editable={editable}
        inactive={!worn}
        information={
          piece.description ? <InfoParagraph>{piece.description}</InfoParagraph> : undefined
        }
        chips={
          <>
            <StatChip label="Location" value={locationLabel(piece.locations)} />
            <StatChip label="AP" value={apDesc} />
            <ItemMetaChips
              bare
              weight={effectiveArmourWeight(piece, upgradeRefs)}
              value={piece.value}
              availability={piece.availability}
              source={piece.source}
            />
          </>
        }
        lines={{
          craftsmanship: {
            value: craftsmanship,
            info: (
              <InfoModal
                title={`${craftsmanship} Armour`}
                content={armourCraftsmanshipDescription(craftsmanship)}
              />
            ),
          },
          qualities: {
            value: qualities.length > 0 ? qualities.join(", ") : undefined,
            info:
              qualities.length > 0 ? (
                <InfoModal
                  title={`${piece.name} Qualities`}
                  content={<ArmourQualitiesContent qualities={qualities} />}
                />
              ) : undefined,
          },
          rules: {
            info: notes ? (
              <InfoModal
                title={`${piece.name} Rules`}
                content={<InfoParagraph>{notes}</InfoParagraph>}
              />
            ) : undefined,
          },
        }}
        actions={
          <StateToggleButton
            active={worn}
            activeLabel="Stow"
            inactiveLabel="Wear"
            activeBusyLabel="Stowing"
            inactiveBusyLabel="Wearing"
            statusLabel="Worn"
            disabled={false}
            editable={editable}
            onChange={() => onToggle(piece.id)}
          />
        }
        body={
          upgradeRefs.length > 0 || addableCompatible.length > 0 ? (
            <div className={`border-t ${colourDivider} pt-2 ${uiStackList}`}>
              <div className="flex items-center justify-between">
                <span className={uiTextLabel}>Upgrades</span>
                {editable ? (
                  <AddButton
                    label="Add upgrade"
                    size="sm"
                    onClick={() => setShowUpgradePicker(true)}
                  />
                ) : (
                  <ViewButton
                    label="View upgrades"
                    size="sm"
                    onClick={() => setShowUpgradePicker(true)}
                  />
                )}
              </div>
              {upgradeRefs.length === 0 ? (
                <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>None fitted</p>
              ) : (
                <div className={uiStackList}>
                  {upgradeRefs.map((upgrade) => (
                    <ArmourUpgradeCard
                      key={upgrade.id}
                      upgrade={upgrade}
                      editable={editable}
                      onRemove={(upgradeId) => onRemoveUpgrade(piece.id, upgradeId)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : undefined
        }
        library={{
          libraryItem,
          isDM,
          canEditDefinition,
          busyAction,
          onEditDefinition,
          onPublish,
          onArchive,
          onUpdateAllCopies,
        }}
        removal={{ kind: "Armour Piece", onRemove: () => onRemove(piece.id) }}
      />

      {showUpgradePicker && (
        <ArmourUpgradePicker
          upgrades={editable ? addableCompatible : compatible}
          editable={editable}
          onSelect={(upgradeId) => {
            onAddUpgrade(piece.id, upgradeId);
          }}
          onClose={() => setShowUpgradePicker(false)}
        />
      )}
    </>
  );
}
