import type { ArmourUpgradeRef } from "../../../data/reference/armourUpgradeReference";
import { Button } from "../../../ui/buttons/Button";
import { InfoModal } from "../../../components/InfoModal";
import { NestedItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerList, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName, PickerRowText } from "../../../ui/pickers/PickerRowParts";
import { RemoveEntryButton } from "../../../ui/RemoveEntryButton";
import {
  uiSplitRow,
  uiCell,
  uiInfoModalWrapper,
  uiTextLabel,
  uiTextBody,
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
      <div className={`${uiSplitRow}`}>
        <span className={`text-xs lg:text-sm font-medium ${uiTextBody}`}>{upgrade.name}</span>
        {editable && (
          <RemoveEntryButton
            kind="Upgrade"
            name={upgrade.name}
            from="this armour"
            onRemove={() => onRemove(upgrade.id)}
          />
        )}
      </div>
      <NestedItemMetaChips
        weight={upgrade.weight}
        value={upgrade.value}
        availability={upgrade.availability}
        source={upgrade.source}
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
            <PickerRowName name={upgrade.name} />
            <PickerRowChips>
              <NestedItemMetaChips
                weight={upgrade.weight}
                value={upgrade.value}
                availability={upgrade.availability}
                source={upgrade.source}
                bare
              />
            </PickerRowChips>
            <PickerRowText className="leading-relaxed">{upgrade.description}</PickerRowText>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
