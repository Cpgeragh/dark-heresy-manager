// src/pages/characterSheet/InsanityTab.tsx

import type { InsanityBlock, TalentsAndTraitsBlock } from "../../types/Character";
import { uiSection } from "../../ui/editableStyles";
import { InsanityPanel } from "../../features/insanity/InsanityPanel";

interface InsanityTabProps {
  insanity: InsanityBlock;
  editable: boolean;
  onUpdate: (next: InsanityBlock) => void;
  talents?: TalentsAndTraitsBlock;
}

export function InsanityTab({ insanity, editable, onUpdate, talents }: InsanityTabProps) {
  return (
    <InsanityPanel
      insanity={insanity}
      editable={editable}
      onUpdate={onUpdate}
      talents={talents}
      sectionClassName={uiSection}
    />
  );
}
