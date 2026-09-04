import { useState } from "react";
import type { WornArmourPiece } from "../../../types/Character";
import { uiSection, uiTextLabel, uiTextMuted, uiTextPlaceholder, uiItemName, uiInfoModalWrapper } from "../../../ui/styles/editableStyles";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { StatChip } from "../../../ui/chips/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import {
  apBreakdown,
  armourCraftsmanshipDescription,
  compatibleArmourUpgrades,
  effectiveArmourWeight,
} from "./armourHelpers";
import { locationLabel } from "../../../utils/armourLocations";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { ARMOUR_SPECIAL_RULES } from "../../../data/reference/armourSpecialRules";
import type { CustomItemLibraryActionProps } from "../../../types/CustomItemActions";
import { CustomItemActionButtons } from "../../../ui/forms/CustomItemActionButtons";
import { StatusBadge } from "../../../ui/chips/StatusBadge";
import { AddButton } from "../../../ui/buttons/AddButton";
import { ViewButton } from "../../../ui/buttons/ViewButton";
import { ARMOUR_UPGRADE_REFERENCE } from "../../../data/reference/armourUpgradeReference";
import {
  ArmourUpgradeCard,
  ArmourUpgradePicker,
} from "./ArmourUpgradePicker";

interface Props extends CustomItemLibraryActionProps<"armour"> {
  piece: WornArmourPiece;
  editable: boolean;
  worn: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAddUpgrade: (pieceId: string, upgradeId: string) => void;
  onRemoveUpgrade: (pieceId: string, upgradeId: string) => void;
}

function ArmourQualitiesContent({ qualities }: { qualities: string[] }) {
  return (
    <div className="space-y-4">
      {qualities.map((name) => {
        const desc = ARMOUR_SPECIAL_RULES[name];
        if (!desc) return null;
        return (
          <div key={name}>
            <p className="text-sm lg:text-base font-semibold text-amber-300">{name}</p>
            <p className={`text-sm lg:text-base ${uiTextMuted} mt-1 leading-relaxed`}>{desc}</p>
          </div>
        );
      })}
    </div>
  );
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
    <div className={[uiSection, "flex items-start gap-3", !worn ? "opacity-60" : ""].join(" ")}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`${uiItemName} truncate`}>{piece.name}</span>
          {libraryItem && (
            <StatusBadge status={libraryItem.status} />
          )}
        </div>

        <div className="mt-1 space-y-1">
          <div className="flex flex-wrap gap-1.5">
            <StatChip label="Location" value={locationLabel(piece.locations)} />
            <StatChip label="AP" value={apDesc} />
          </div>
          <ItemMetaChips
            weight={effectiveArmourWeight(piece, upgradeRefs)}
            value={piece.value}
            availability={piece.availability}
            source={piece.source}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Qualities</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>
            {qualities.length > 0 ? qualities.join(", ") : "-"}
          </span>
          {qualities.length > 0 && (
            <span className={uiInfoModalWrapper}>
              <InfoModal
                title={`${piece.name} Qualities`}
                content={<ArmourQualitiesContent qualities={qualities} />}
              />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Rules</span>
          {notes ? (
            <span className={uiInfoModalWrapper}>
              <InfoModal title={`${piece.name} Rules`} content={notes} />
            </span>
          ) : (
            <span className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>-</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={uiTextLabel}>Craftsmanship</span>
          <span className={`text-xs lg:text-sm ${uiTextMuted} italic`}>{craftsmanship}</span>
          <InfoModal
            title={`${craftsmanship} Armour`}
            content={armourCraftsmanshipDescription(craftsmanship)}
          />
        </div>

        {(upgradeRefs.length > 0 || addableCompatible.length > 0) && (
          <div className="border-t border-slate-800 pt-2 mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={uiTextLabel}>Upgrades</span>
              {editable ? (
                <AddButton label="Add upgrade" size="sm" onClick={() => setShowUpgradePicker(true)} />
              ) : (
                <ViewButton label="View upgrades" onClick={() => setShowUpgradePicker(true)} />
              )}
            </div>
            {upgradeRefs.length === 0 ? (
              <p className={`text-xs lg:text-sm ${uiTextPlaceholder}`}>None fitted</p>
            ) : (
              <div className="space-y-1.5">
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
        )}

        {libraryItem && (
          <CustomItemActionButtons
            libraryItem={libraryItem}
            isDM={isDM}
            canEditDefinition={canEditDefinition}
            busyAction={busyAction}
            onEditDefinition={onEditDefinition}
            onPublish={onPublish}
            onArchive={onArchive}
            onUpdateAllCopies={onUpdateAllCopies}
          />
        )}
      </div>

      {editable && (
        <button type="button"
          onClick={() => onToggle(piece.id)}
          className="text-xs lg:text-sm px-2 lg:px-3 py-1 rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition whitespace-nowrap"
        >
          {worn ? "Stow" : "Wear"}
        </button>
      )}

      {editable && (
        <RemoveButton onClick={() => onRemove(piece.id)} label="Remove" />
      )}

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
    </div>
  );
}
