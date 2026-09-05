// src/pages/CharacterSheet/SkillsTab/SkillGroupRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import {
  CHAR_LABEL,
  getSkillGroupCharacteristics,
  type SkillWithComputed,
} from "./skillsConstants";
import type { SkillTierAccess } from "../../../mechanics/experience/skillAdvanceCosts";
import { charColour } from "../../../ui/styles/sourceStyles";
import { Chip } from "../../../ui/chips/Chip";
import { SkillRow } from "./SkillRow";
import { colourPurple } from "../../../ui/styles/colourTokens";
import { ExpandChevron } from "../../../ui/icons/ExpandChevron";
import { uiSectionShell } from "../../../ui/styles/editableStyles";

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
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);
  const characteristics = getSkillGroupCharacteristics(skills);

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition"
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="block text-sm lg:text-base font-semibold text-slate-100 truncate">
            {category}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {characteristics.map((characteristic) => (
              <Chip
                key={characteristic}
                size="sm"
                className={`bg-slate-800 font-code shrink-0 ${charColour(characteristic)}`}
              >
                {CHAR_LABEL[characteristic]}
              </Chip>
            ))}
            {skills[0].advanced && (
              <Chip size="sm" className={`shrink-0 ${colourPurple}`}>
                Advanced
              </Chip>
            )}
          </div>
        </div>
        <ExpandChevron expanded={expanded} />
      </button>
      {expanded && (
        <div className="border-t border-slate-700 space-y-2 p-2">
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
    </div>
  );
}
