// src/pages/CharacterSheet/InsanityTab.tsx

import type { InsanityBlock, TalentsAndTraitsBlock } from "../../types/Character";
import { uiSection } from "../../ui/styles/editableStyles";
import { InsanityPanel } from "../../mechanics/insanity/InsanityPanel";

interface InsanityTabProps {
  insanity: InsanityBlock;
  editable: boolean;
  onUpdate: (next: InsanityBlock) => void;
  talents?: TalentsAndTraitsBlock;
  career?: string;
}

export function InsanityTab({ insanity, editable, onUpdate, talents, career }: InsanityTabProps) {
  return (
    <InsanityPanel
      insanity={insanity}
      editable={editable}
      onUpdate={onUpdate}
      talents={talents}
      career={career}
      sectionClassName={uiSection}
    />
  );
}
