// src/ui/ItemMetaChips.tsx
// Shared chip row used on item cards throughout all tabs.

import { availabilityColour, sourceColour } from "./sourceStyles";
import { formatWeightForDisplay } from "./weightFormat";
import { formatMoneyForDisplay } from "./moneyFormat";

interface Props {
  weight?: string | null;
  value?: string | null;
  availability?: string | null;
  source?: string | null;
  /** Override the wrapper className. Defaults to "flex flex-wrap gap-1.5". */
  className?: string;
  /**
   * When true, renders chips as a React Fragment with no wrapper div.
   * Use this when the chips sit inside an existing flex row alongside
   * other chips (e.g. ArmourTab's PR chip, CyberneticsTab's location chip).
   */
  bare?: boolean;
  /**
   * Kept for compatibility with existing callers. Value chips represent money
   * and render in amber by default across the app.
   */
  valueAmber?: boolean;
}

/**
 * Renders weight, value, availability, and source metadata chips.
 * Returns null when all props are falsy — callers need no guard.
 */
export function ItemMetaChips({
  weight,
  value,
  availability,
  source,
  className,
  bare,
}: Props) {
  if (!weight && !value && !availability && !source) return null;

  const displayedWeight = formatWeightForDisplay(weight);
  const displayedValue = value !== undefined && value !== null ? formatMoneyForDisplay(value) : undefined;

  const chips = (
    <>
      {displayedWeight && (
        <span className="inline-flex items-center gap-1 text-xs lg:text-sm leading-none rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 text-slate-400 whitespace-nowrap">
          <span className="leading-none">⚖</span>
          <span className="leading-none">{displayedWeight}</span>
        </span>
      )}
      {displayedValue && (
        <span className="text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 text-amber-400/80 whitespace-nowrap">
          {displayedValue}
        </span>
      )}
      {availability && (
        <span
          className={`text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 whitespace-nowrap ${availabilityColour(availability)}`}
        >
          {availability}
        </span>
      )}
      {source && (
        <span
          className={`text-xs lg:text-sm rounded border bg-slate-800/40 px-1.5 lg:px-2 py-0.5 font-code whitespace-nowrap ${sourceColour(source)}`}
        >
          {source}
        </span>
      )}
    </>
  );

  if (bare) return chips;
  return <div className={className ?? "flex flex-wrap gap-1.5"}>{chips}</div>;
}
