// src/ui/ItemMetaChips.tsx
// Shared chip row used on item cards throughout all tabs.

import { rarityColour, sourceColour } from "./sourceStyles";

interface Props {
  weight?: string | null;
  value?: string | null;
  rarity?: string | null;
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
 * Renders weight, value, rarity, and source metadata chips.
 * Returns null when all props are falsy — callers need no guard.
 */
export function ItemMetaChips({
  weight,
  value,
  rarity,
  source,
  className,
  bare,
}: Props) {
  if (!weight && !value && !rarity && !source) return null;

  const chips = (
    <>
      {weight && (
        <span className="text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 text-slate-400 whitespace-nowrap">
          ⚖ {weight}
        </span>
      )}
      {value && (
        <span className="text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 text-amber-400/80 font-mono whitespace-nowrap">
          ₮ {value}
        </span>
      )}
      {rarity && (
        <span
          className={`text-xs lg:text-sm rounded border border-slate-700 bg-slate-800/40 px-1.5 lg:px-2 py-0.5 whitespace-nowrap ${rarityColour(rarity)}`}
        >
          {rarity}
        </span>
      )}
      {source && (
        <span
          className={`text-xs lg:text-sm rounded border bg-slate-800/40 px-1.5 lg:px-2 py-0.5 font-mono whitespace-nowrap ${sourceColour(source)}`}
        >
          {source}
        </span>
      )}
    </>
  );

  if (bare) return chips;
  return <div className={className ?? "flex flex-wrap gap-1.5"}>{chips}</div>;
}
