// src/pages/characterSheet/SkillsTab/SkillGroupRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { SkillRow } from "./SkillRow";
import { colourPurple } from "../../../ui/colourTokens";

interface SkillGroupRowProps {
  category: string;
  skills: SkillWithComputed[];
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  updateMisc: (id: string, value: number) => void;
}

export function SkillGroupRow({
  category,
  skills,
  editable,
  updateLevel,
  updateMisc,
}: SkillGroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((p) => !p), []);

  return (
    <div className="rounded border border-slate-600 bg-slate-800/40 overflow-hidden">
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-slate-700 space-y-2 p-2">
          {skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              editable={editable}
              updateLevel={updateLevel}
              updateMisc={updateMisc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
