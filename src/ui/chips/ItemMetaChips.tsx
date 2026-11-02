import { uiChipRow } from "../styles/editableStyles";
// src/ui/chips/ItemMetaChips.tsx
// Shared helper for ordinary item metadata chips.

import { Chip } from "./Chip";
import { formatMoneyForDisplay } from "../format/moneyFormat";
import { isVariableMeta } from "../../data/reference/referenceMeta";
import { availabilityChipColour, sourceChipColour } from "../styles/sourceStyles";
import { formatWeightForDisplay } from "../format/weightFormat";
import { WeightIcon } from "../icons/WeightIcon";
import { uiIconSize } from "../styles/iconStyles";

interface Props {
  weight?: string | null;
  value?: string | null;
  availability?: string | null;
  source?: string | null;
  purchaseAmount?: string | null;
  /** Override the wrapper className. Defaults to uiChipRow. */
  className?: string;
  /**
   * When true, renders chips as a React Fragment with no wrapper div.
   * Use this when the chips sit inside an existing flex row alongside
   * other chips.
   */
  bare?: boolean;
  /**
   * Drawn in a picker for an item whose cost or availability is assigned when it is added:
   * a marker such as a dash or "Varies" shows the word "Varies" instead of a dash cost.
   */
  assignedLater?: boolean;
}

interface ItemMetaChipsBaseProps extends Props {
  size: "sm" | "md";
}

/**
 * Renders normal item metadata chips. Returns null when all props are falsy.
 */
function ItemMetaChipsBase({
  weight,
  value,
  availability,
  source,
  purchaseAmount,
  className,
  bare,
  assignedLater,
  size,
}: ItemMetaChipsBaseProps) {
  const displayedWeight = weight ? formatWeightForDisplay(weight) : "";
  if (!displayedWeight && !value && !purchaseAmount && !availability && !source) return null;

  const variesLater = (field?: string | null) =>
    Boolean(assignedLater && field && isVariableMeta(field));
  const displayedValue = variesLater(value)
    ? "Varies"
    : value !== undefined && value !== null
      ? formatMoneyForDisplay(value)
      : undefined;
  const displayedAvailability = variesLater(availability) ? "Varies" : availability;

  const chips = (
    <>
      {displayedWeight && (
        <Chip size={size} colour="slate">
          <WeightIcon className={`${uiIconSize.inline} shrink-0`} />
          <span className="leading-none">{displayedWeight}</span>
        </Chip>
      )}
      {displayedValue && (
        <Chip size={size} colour="amber">
          {displayedValue}
        </Chip>
      )}
      {purchaseAmount && (
        <Chip size={size} colour="slate">
          per {purchaseAmount}
        </Chip>
      )}
      {displayedAvailability && (
        <Chip size={size} colour={availabilityChipColour(displayedAvailability)}>
          {displayedAvailability}
        </Chip>
      )}
      {source && (
        <Chip size={size} colour={sourceChipColour(source)} className="font-code">
          {source}
        </Chip>
      )}
    </>
  );

  if (bare) return chips;
  return <div className={className ?? uiChipRow}>{chips}</div>;
}

export function ItemMetaChips(props: Props) {
  return <ItemMetaChipsBase {...props} size="md" />;
}

export function NestedItemMetaChips(props: Props) {
  return <ItemMetaChipsBase {...props} size="sm" />;
}
