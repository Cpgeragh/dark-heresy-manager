// src/ui/pickers/OptionPickerScreen.tsx

import { PickerList, PickerModal, PickerRow } from "./PickerModal";
import { ArrowLeft } from "../icons/PickerArrows";
import { PickerRowChips, PickerRowName } from "./PickerRowParts";
import { Chip } from "../chips/Chip";
import { uiTextBody } from "../styles/editableStyles";

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
  intro,
  options,
  selected,
  onSelect,
  onClose,
  standalone = false,
  maxWidth,
}: {
  title: string;
  /** A sentence above the options, such as how to roll for them. */
  intro?: string;
  options: readonly PickerOption[];
  selected?: string;
  /** A handler that returns a promise keeps the chosen row busy until it settles. */
  onSelect: (value: string) => unknown;
  onClose: () => void;
  /** A list opened straight from a field, with no earlier screen: shows the Close cross, not the Back arrow. */
  standalone?: boolean;
  maxWidth?: string;
}) {
  return (
    <PickerModal
      title={title}
      closeLabel={standalone ? undefined : <ArrowLeft />}
      closeAriaLabel={standalone ? undefined : "Back"}
      maxWidth={maxWidth}
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={false}
      hideSearch
    >
      <PickerList>
        {intro && <p className={`px-3 py-2 text-sm ${uiTextBody} lg:text-base`}>{intro}</p>}
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
                    <Chip key={rank} colour="fuchsia" className="font-code">
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
