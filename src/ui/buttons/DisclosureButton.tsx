// src/ui/buttons/DisclosureButton.tsx
// The button that shows or hides a block of content beneath it: a chevron, a label and aria-expanded.

import type { ReactNode } from "react";
import { ExpandChevron } from "../icons/ExpandChevron";
import { uiFocusRing, uiPressFeedback } from "../styles/buttonStyles";
import { colourHoverTextBody } from "../styles/colourTokens";
import { uiTextPlaceholder } from "../styles/editableStyles";

interface DisclosureButtonProps {
  expanded: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function DisclosureButton({ expanded, onClick, children }: DisclosureButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={`inline-flex items-center gap-1 text-sm lg:text-base ${uiTextPlaceholder} ${colourHoverTextBody} ${uiPressFeedback()} ${uiFocusRing} transition-colors`}
    >
      <ExpandChevron expanded={expanded} />
      <span>{children}</span>
    </button>
  );
}
