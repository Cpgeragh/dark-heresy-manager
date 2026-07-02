// src/pages/characterSheet/InsanityCorruptionTab.tsx

import type { CorruptionBlock, InsanityBlock } from "../../types/Character";
import { uiSection } from "../../ui/editableStyles";
import { InsanityPanel } from "../../features/insanity/InsanityPanel";
import { CorruptionPanel } from "../../features/corruption/CorruptionPanel";

interface InsanityCorruptionTabProps {
  insanity: InsanityBlock;
  corruption: CorruptionBlock;
  editable: boolean;
  onUpdateInsanity: (next: InsanityBlock) => void;
  onUpdateCorruption: (next: CorruptionBlock) => void;
}

export function InsanityCorruptionTab({
  insanity,
  corruption,
  editable,
  onUpdateInsanity,
  onUpdateCorruption,
}: InsanityCorruptionTabProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InsanityPanel
        insanity={insanity}
        editable={editable}
        onUpdate={onUpdateInsanity}
        sectionClassName={uiSection}
      />

      <CorruptionPanel
        corruption={corruption}
        editable={editable}
        onUpdate={onUpdateCorruption}
        sectionClassName={uiSection}
      />
    </div>
  );
}
