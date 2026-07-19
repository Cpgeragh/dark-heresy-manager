// src/pages/characterSheet/SkillsTab/SkillGroupRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { SkillRow } from "./SkillRow";
import { colourPurple } from "../../../ui/colourTokens";
import { ExpandChevron } from "../../../ui/ExpandChevron";

interface SkillGroupRowProps {
  category: string;
  skills: SkillWithComputed[];
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
}

export function SkillGroupRow({
  category,
  skills,
  editable,
  updateLevel,
}: SkillGroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  return (
    <div className="rounded-lg border border-slate-500 bg-slate-900/60 overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition"
      >
        <span className="text-sm lg:text-base font-semibold text-slate-100 flex-1 min-w-0 truncate">
          {category}
        </span>
        <Chip size="sm" className={`bg-slate-800 font-code shrink-0 ${charColour(skills[0].characteristic)}`}>
          {CHAR_LABEL[skills[0].characteristic]}
        </Chip>
        {skills[0].advanced && (
          <Chip size="sm" className={`shrink-0 ${colourPurple}`}>
            Advanced
          </Chip>
        )}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
