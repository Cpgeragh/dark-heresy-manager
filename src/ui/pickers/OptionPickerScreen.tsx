// src/ui/pickers/OptionPickerScreen.tsx

import { PickerList, PickerModal, PickerRow } from "./PickerModal";
import { ArrowLeft } from "../icons/PickerArrows";
import { PickerRowChips, PickerRowName } from "./PickerRowParts";
import { Chip } from "../chips/Chip";

export type PickerOption =
  | string
  | {
      value: string;
      label: string;
      owned?: boolean;
      ownedCount?: number;
      /** Real XP cost, shown as a chip when known. */
      cost?: number;
      /** Rank names this option is granted at, shown as their own chip row below the option, when known. */
      rankChips?: readonly string[];
    };

export function OptionPickerScreen({
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  title: string;
  options: readonly PickerOption[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <PickerModal
      title={title}
      closeLabel={<ArrowLeft />}
      closeAriaLabel="Back"
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={false}
      hideSearch
    >
      <PickerList>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          const owned = typeof option === "string" ? false : option.owned;
          const ownedCount = typeof option === "string" ? undefined : option.ownedCount;
          const cost = typeof option === "string" ? undefined : option.cost;
          const rankChips = typeof option === "string" ? undefined : option.rankChips;
          return (
            <PickerRow key={value} onClick={() => onSelect(value)} selected={value === selected}>
              <PickerRowName name={label} />
              {(cost !== undefined ||
                (ownedCount !== undefined && ownedCount > 0) ||
                owned ||
                (rankChips && rankChips.length > 0)) && (
                <PickerRowChips>
                  {cost !== undefined && <Chip colour="amber">{cost} XP</Chip>}
                  {ownedCount !== undefined && ownedCount > 0 ? (
                    <Chip colour="amber">Owned: {ownedCount}</Chip>
                  ) : owned ? (
                    <Chip colour="amber">Owned</Chip>
                  ) : null}
                  {rankChips?.map((rank) => (
                    <Chip key={rank} size="sm" colour="fuchsia" className="font-code">
                      {rank}
                    </Chip>
                  ))}
                </PickerRowChips>
              )}
            </PickerRow>
          );
        })}
      </PickerList>
    </PickerModal>
  );
}
