import { uiChipRow } from "../styles/editableStyles";
// src/ui/chips/ItemMetaChips.tsx
// Shared helper for ordinary item metadata chips.

import { Chip } from "./Chip";
import { formatMoneyForDisplay } from "../format/moneyFormat";
import { availabilityChipColour, sourceChipColour } from "../styles/sourceStyles";
import { formatWeightForDisplay } from "../format/weightFormat";

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
  size?: "sm" | "md";
}

/**
 * Renders normal item metadata chips. Returns null when all props are falsy.
 */
export function ItemMetaChips({
  weight,
  value,
  availability,
  source,
  purchaseAmount,
  className,
  bare,
  size = "md",
}: Props) {
  if (!weight && !value && !purchaseAmount && !availability && !source) return null;

  const displayedWeight = weight ? formatWeightForDisplay(weight) : undefined;
  const displayedValue =
    value !== undefined && value !== null ? formatMoneyForDisplay(value) : undefined;

  const chips = (
    <>
      {displayedWeight && (
        <Chip size={size} colour="slate">
          <span className="leading-none">{"\u2696"}</span>
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
      {availability && (
        <Chip size={size} colour={availabilityChipColour(availability)}>
          {availability}
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
