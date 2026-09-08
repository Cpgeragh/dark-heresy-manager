// src/pages/CharacterSheet/CorruptionTab.tsx

import type { CorruptionBlock } from "../../types/Character";
import { uiSection } from "../../ui/styles/editableStyles";
import { CorruptionPanel } from "../../mechanics/corruption/CorruptionPanel";
import { recordComponentRender } from "../../performance/performanceMetrics";

interface CorruptionTabProps {
  corruption: CorruptionBlock;
  editable: boolean;
  onUpdate: (next: CorruptionBlock) => void;
}

export function CorruptionTab({ corruption, editable, onUpdate }: CorruptionTabProps) {
  recordComponentRender("CorruptionTab");
  return (
    <CorruptionPanel
      corruption={corruption}
      editable={editable}
      onUpdate={onUpdate}
      sectionClassName={uiSection}
    />
  );
}
