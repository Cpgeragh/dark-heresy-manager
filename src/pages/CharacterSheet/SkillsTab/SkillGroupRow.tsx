import { uiChipRow } from "../../../ui/styles/editableStyles";

// src/pages/CharacterSheet/SkillsTab/SkillGroupRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import {
  CHAR_LABEL,
  getSkillGroupCharacteristics,
  type SkillWithComputed,
} from "./skillsConstants";
import type { SkillTierAccess } from "shared-rules";
import { characteristicChipColour } from "../../../ui/styles/sourceStyles";
import { Chip } from "../../../ui/chips/Chip";
import { SkillRow } from "./SkillRow";
import { AccordionCard } from "../../../ui/AccordionCard";
import { recordComponentRender } from "../../../performance/performanceMetrics";
import { colourTextPrimary, colourDivider } from "../../../ui/styles/colourTokens";

interface SkillGroupRowProps {
  category: string;
  skills: SkillWithComputed[];
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  getNextTierAccess?: (skillId: string, level: SkillAdvanceLevel) => SkillTierAccess;
  onManualUpgrade?: (id: string, level: SkillAdvanceLevel, cost: number) => void;
  isDM?: boolean;
}

export function SkillGroupRow({
  category,
  skills,
  editable,
  updateLevel,
  getNextTierAccess,
  onManualUpgrade,
  isDM,
}: SkillGroupRowProps) {
  recordComponentRender("SkillGroupRow");
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);
  const characteristics = getSkillGroupCharacteristics(skills);

  return (
    <AccordionCard
      expanded={expanded}
      onToggle={toggle}
      header={
        <div className="space-y-1.5">
          <span
            className={`block truncate text-sm font-semibold ${colourTextPrimary} lg:text-base`}
          >
            {category}
          </span>
          <div className={`${uiChipRow} items-center`}>
            {characteristics.map((characteristic) => (
              <Chip
                key={characteristic}
                size="sm"
                colour={characteristicChipColour(characteristic)}
                className="font-code shrink-0"
              >
                {CHAR_LABEL[characteristic]}
              </Chip>
            ))}
            {skills[0].advanced && (
              <Chip size="sm" colour="purple" className="shrink-0">
                Advanced
              </Chip>
            )}
          </div>
        </div>
      }
    >
      {expanded && (
        <div className={`border-t ${colourDivider} space-y-2 p-2`}>
          {skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              editable={editable}
              updateLevel={updateLevel}
              nextTierAccess={getNextTierAccess?.(skill.id, skill.level)}
              onManualUpgrade={onManualUpgrade}
              isDM={isDM}
            />
          ))}
        </div>
      )}
    </AccordionCard>
  );
}
