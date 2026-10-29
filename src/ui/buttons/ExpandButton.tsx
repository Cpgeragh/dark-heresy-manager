// src/ui/buttons/ExpandButton.tsx
// The chevron that expands or collapses a card's details, sitting above the card's tap overlay.

import { ExpandChevron } from "../icons/ExpandChevron";
import { uiFocusRing, uiHoverSurface, uiPressFeedback } from "../styles/buttonStyles";
import { uiLayerLocal } from "../styles/layerStyles";
import { uiCornerSmall } from "../styles/shapeStyles";

interface ExpandButtonProps {
  expanded: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}

export function ExpandButton({ expanded, label, onClick, className = "" }: ExpandButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-label={label}
      className={`relative ${uiLayerLocal} pointer-events-auto p-1 -m-1 ${uiCornerSmall} transition ${uiHoverSurface} ${uiPressFeedback()} ${uiFocusRing} ${className}`.trim()}
    >
      <ExpandChevron expanded={expanded} />
    </button>
  );
}
