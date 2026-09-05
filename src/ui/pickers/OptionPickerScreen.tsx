// src/ui/pickers/OptionPickerScreen.tsx

import { PickerModal, PickerRow } from "./PickerModal";
import { ArrowLeft } from "../icons/PickerArrows";
import { uiItemName } from "../styles/editableStyles";
import { Chip } from "../chips/Chip";
import { colourAmberFaint, colourRank, colourValue } from "../styles/colourTokens";

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
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const owned = typeof option === "string" ? false : option.owned;
        const ownedCount = typeof option === "string" ? undefined : option.ownedCount;
        const cost = typeof option === "string" ? undefined : option.cost;
        const rankChips = typeof option === "string" ? undefined : option.rankChips;
        return (
          <PickerRow key={value} onClick={() => onSelect(value)} selected={value === selected}>
            <span className="flex w-full flex-col gap-1.5">
              <span className="flex w-full items-center justify-between gap-3">
                <span className={`${uiItemName} group-hover:text-white`}>{label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {cost !== undefined && <Chip className={colourValue}>{cost} XP</Chip>}
                  {ownedCount !== undefined && ownedCount > 0 ? (
                    <Chip className={colourAmberFaint}>Owned: {ownedCount}</Chip>
                  ) : owned ? (
                    <Chip className={colourAmberFaint}>Owned</Chip>
                  ) : null}
                </span>
              </span>
              {rankChips && rankChips.length > 0 && (
                <span className="flex flex-wrap gap-1.5">
                  {rankChips.map((rank) => (
                    <Chip key={rank} size="sm" className={`${colourRank} font-code`}>
                      {rank}
                    </Chip>
                  ))}
                </span>
              )}
            </span>
          </PickerRow>
        );
      })}
    </PickerModal>
  );
}
