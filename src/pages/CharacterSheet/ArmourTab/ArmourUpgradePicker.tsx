import type { ArmourUpgradeRef } from "../../../data/reference/armourUpgradeReference";
import { Button } from "../../../ui/buttons/Button";
import { InfoModal } from "../../../components/InfoModal";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerList, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { RemoveButton } from "../../../ui/buttons/RemoveButton";
import {
  uiCell,
  uiInfoModalWrapper,
  uiTextBody,
  uiTextLabel,
  uiTextPlaceholder,
  uiItemNameHover,
} from "../../../ui/styles/editableStyles";

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
    <div className={`${uiCell} px-2 lg:px-3 py-1.5 lg:py-2`}>
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
      footer={
        <Button variant="secondary" fullWidth onClick={onClose}>
          Done
        </Button>
      }
    >
      <PickerList>
        {upgrades.map((upgrade) => (
          <PickerRow key={upgrade.id} interactive={editable} onClick={() => onSelect(upgrade.id)}>
            <span className={uiItemNameHover}>{upgrade.name}</span>
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
      </PickerList>
    </PickerModal>
  );
}
