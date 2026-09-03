import type { WornArmourPiece } from "../../../types/Character";
import {
  ARMOUR_UPGRADE_REFERENCE,
  type ArmourUpgradeRef,
} from "../../../data/reference/armourUpgradeReference";
import { ARMOUR_REFERENCE } from "../../../data/reference/armourReference";
import { Button } from "../../../ui/buttons/Button";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
} from "../../../ui/styles/editableStyles";

export function compatibleArmourUpgrades(piece: WornArmourPiece): ArmourUpgradeRef[] {
  const reference = piece.referenceId
    ? ARMOUR_REFERENCE.find((entry) => entry.id === piece.referenceId)
    : ARMOUR_REFERENCE.find((entry) => entry.name === piece.name && entry.source === piece.source);

  if (!reference) return [];

  const name = reference.name.toLowerCase();
  const isCarapaceBreastplateOrSuit =
    reference.locations.includes("body") && name.includes("carapace");
  const isPowerArmour = name.includes("power armour") || name.includes("powered armour");

  const generallyCompatible = isCarapaceBreastplateOrSuit || isPowerArmour;
  return ARMOUR_UPGRADE_REFERENCE.filter((upgrade) =>
    upgrade.restrictedToArmourIds
      ? upgrade.restrictedToArmourIds.includes(reference.id)
      : generallyCompatible
  );
}

export function ArmourUpgradeCard({
  upgrade,
  editable,
  onRemove,
}: {
  upgrade: ArmourUpgradeRef;
  editable: boolean;
  onRemove: (upgradeId: string) => void;
}) {
  return (
    <div className="bg-slate-800/60 rounded border border-slate-500 px-2 lg:px-3 py-1.5 lg:py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs lg:text-sm font-medium text-slate-300">{upgrade.name}</span>
        {editable && (
          <RemoveButton onClick={() => onRemove(upgrade.id)} label={`Remove ${upgrade.name}`} />
        )}
      </div>
      <ItemMetaChips
        weight={upgrade.weight}
        value={upgrade.value}
        availability={upgrade.availability}
        source={upgrade.source}
        size="sm"
        className="flex flex-wrap gap-1 mt-1"
      />
      <div className="flex items-center gap-1.5 mt-1">
        <span className={uiTextLabel}>Rules</span>
        <span className={uiInfoModalWrapper}>
          <InfoModal title={upgrade.name} content={upgrade.description} />
        </span>
      </div>
    </div>
  );
}

export function ArmourUpgradePicker({
  upgrades,
  editable = true,
  onSelect,
  onClose,
}: {
  upgrades: ArmourUpgradeRef[];
  editable?: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <PickerModal
      title={editable ? "Add Upgrade" : "View Upgrades"}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={upgrades.length === 0}
      emptyMessage="No compatible upgrades available."
      hideSearch
      footer={<Button variant="secondary" fullWidth onClick={onClose}>Done</Button>}
    >
      {upgrades.map((upgrade) => (
        <PickerRow key={upgrade.id} interactive={editable} onClick={() => onSelect(upgrade.id)}>
          <span className={`${uiItemName} group-hover:text-white`}>{upgrade.name}</span>
          <ItemMetaChips
            weight={upgrade.weight}
            value={upgrade.value}
            availability={upgrade.availability}
            source={upgrade.source}
            size="sm"
            className="flex flex-wrap gap-1.5 mt-1"
          />
          <p className={`text-xs lg:text-sm ${uiTextBody} leading-relaxed mt-2`}>
            {upgrade.description}
          </p>
          <p className={`text-xs lg:text-sm ${uiTextPlaceholder} mt-1`}>{upgrade.applicableTo}</p>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
