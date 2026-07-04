// src/pages/characterSheet/CorruptionTab.tsx

import type { CorruptionBlock } from "../../types/Character";
import { uiSection } from "../../ui/editableStyles";
import { CorruptionPanel } from "../../features/corruption/CorruptionPanel";

interface CorruptionTabProps {
  corruption: CorruptionBlock;
  editable: boolean;
  onUpdate: (next: CorruptionBlock) => void;
}

export function CorruptionTab({ corruption, editable, onUpdate }: CorruptionTabProps) {
  return (
    <CorruptionPanel
      corruption={corruption}
      editable={editable}
      onUpdate={onUpdate}
      sectionClassName={uiSection}
    />
  );
}
