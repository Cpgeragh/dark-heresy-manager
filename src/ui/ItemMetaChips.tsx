// src/ui/ItemMetaChips.tsx
// Shared helper for ordinary item metadata chips.

import { Chip } from "./Chip";
import { formatMoneyForDisplay } from "./moneyFormat";
import { availabilityColour, sourceColour } from "./sourceStyles";
import { formatWeightForDisplay } from "./weightFormat";
import { colourMeta, colourValue } from "./colourTokens";

interface Props {
  weight?: string | null;
  value?: string | null;
  availability?: string | null;
  source?: string | null;
  purchaseAmount?: string | null;
  /** Override the wrapper className. Defaults to "flex flex-wrap gap-1.5". */
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
  const displayedValue = value !== undefined && value !== null ? formatMoneyForDisplay(value) : undefined;

  const chips = (
    <>
      {displayedWeight && (
        <Chip size={size} className={colourMeta}>
          <span className="leading-none">{"\u2696"}</span>
          <span className="leading-none">{displayedWeight}</span>
        </Chip>
      )}
      {displayedValue && (
        <Chip size={size} className={colourValue}>
          {displayedValue}
        </Chip>
      )}
      {purchaseAmount && (
        <Chip size={size} className={colourMeta}>
          per {purchaseAmount}
        </Chip>
      )}
      {availability && (
        <Chip
          size={size}
          className={`border-slate-700 bg-slate-900/40 ${availabilityColour(availability)}`}
        >
          {availability}
        </Chip>
      )}
      {source && (
        <Chip size={size} className={`bg-slate-900/40 ${sourceColour(source)}`}>
          {source}
        </Chip>
      )}
    </>
  );

  if (bare) return chips;
  return <div className={className ?? "flex flex-wrap gap-1.5"}>{chips}</div>;
}
