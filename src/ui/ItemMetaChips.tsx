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
   * When true, renders the value chip in amber (₮ currency style).
   * Defaults to slate. Use for drugs, cybernetics, archeotech.
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
  valueAmber,
}: Props) {
  if (!weight && !value && !rarity && !source) return null;

  const chips = (
    <>
      {weight && (
        <span className="text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 text-slate-400">
          ⚖ {weight}
        </span>
      )}
      {value && (
        <span
          className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${
            valueAmber ? "text-amber-400/80 font-mono" : "text-slate-400"
          }`}
        >
          ₮ {value}
        </span>
      )}
      {rarity && (
        <span
          className={`text-xs rounded border border-slate-700 bg-slate-800/40 px-1.5 py-0.5 ${rarityColour(rarity)}`}
        >
          {rarity}
        </span>
      )}
      {source && (
        <span
          className={`text-xs rounded border bg-slate-800/40 px-1.5 py-0.5 font-mono ${sourceColour(source)}`}
        >
          {source}
        </span>
      )}
    </>
  );

  if (bare) return chips;
  return <div className={className ?? "flex flex-wrap gap-1.5"}>{chips}</div>;
}
