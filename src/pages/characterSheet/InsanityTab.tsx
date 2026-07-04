// src/pages/characterSheet/InsanityTab.tsx

import type { InsanityBlock } from "../../types/Character";
import { uiSection } from "../../ui/editableStyles";
import { InsanityPanel } from "../../features/insanity/InsanityPanel";

interface InsanityTabProps {
  insanity: InsanityBlock;
  editable: boolean;
  onUpdate: (next: InsanityBlock) => void;
}

export function InsanityTab({ insanity, editable, onUpdate }: InsanityTabProps) {
  return (
    <InsanityPanel
      insanity={insanity}
      editable={editable}
      onUpdate={onUpdate}
      sectionClassName={uiSection}
    />
  );
}
