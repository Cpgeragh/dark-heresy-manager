import type { ArmourUpgradeRef } from "../../../data/reference/armourUpgradeReference";
import { Button } from "../../../ui/buttons/Button";
import { NestedItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { PickerList, PickerModal, PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { InfoParagraph } from "../../../ui/InfoSection";
import { UpgradeEntryCard } from "../../../ui/UpgradeEntryCard";

export function ArmourUpgradeCard({
  upgrade,
  editable,
  onRemove,
}: {
  upgrade: ArmourUpgradeRef;
  editable: boolean;
  onRemove: (upgradeId: string) => unknown;
}) {
  return (
    <UpgradeEntryCard
      name={upgrade.name}
      removeFrom="this armour"
      editable={editable}
      onRemove={() => onRemove(upgrade.id)}
      chips={
        <NestedItemMetaChips
          weight={upgrade.weight}
          value={upgrade.value}
          availability={upgrade.availability}
          source={upgrade.source}
          className="flex flex-wrap gap-1 mt-1"
        />
      }
      rules={upgrade.description}
    />
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
            <PickerRowName
              name={upgrade.name}
              infoTitle={upgrade.name}
              information={
                upgrade.description ? (
                  <InfoParagraph>{upgrade.description}</InfoParagraph>
                ) : undefined
              }
            />
            <PickerRowChips>
              <NestedItemMetaChips
                weight={upgrade.weight}
                value={upgrade.value}
                availability={upgrade.availability}
                source={upgrade.source}
                bare
              />
            </PickerRowChips>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
