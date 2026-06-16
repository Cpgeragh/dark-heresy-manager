// src/pages/characterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, getTotalColor, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { editableInputClass } from "../../../ui/editableStyles";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";

interface SkillRowProps {
  skill: SkillWithComputed;
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  updateMisc: (id: string, value: number) => void;
}

const LEVEL_BADGE: Record<string, string> = {
  trained: "bg-red-500/10 border-red-500 text-red-500",
  "+10": "bg-sky-500/10 border-sky-400 text-sky-400",
  "+20": "bg-green-500/10 border-green-400 text-green-400",
};

export function SkillRow({ skill, editable, updateLevel, updateMisc }: SkillRowProps) {
  const [expanded, setExpanded] = useState(false);

  const totalColor = getTotalColor(skill.total);
  const levelBadgeClass = LEVEL_BADGE[skill.level] ?? "";

  const handleToggle = useCallback(() => setExpanded((p) => !p), []);

  const handleLevelClick = useCallback(
    (value: SkillAdvanceLevel) => updateLevel(skill.id, value),
    [skill.id, updateLevel]
  );

  const handleMiscChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => updateMisc(skill.id, Number(e.target.value)),
    [skill.id, updateMisc]
  );

  const handleRemove = useCallback(
    () => updateLevel(skill.id, "untrained"),
    [skill.id, updateLevel]
  );

  return (
    <div className="rounded border border-slate-500 bg-slate-800/60 overflow-hidden">
      {/* COLLAPSED ROW */}
      <button
        onClick={handleToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700/40 transition"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-100 truncate">{skill.name}</span>
          {SKILL_DESCRIPTIONS[skill.name] && (
            <span
              className="inline-flex items-center leading-[0]"
              onClick={(e) => e.stopPropagation()}
            >
              <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} />
            </span>
          )}
        </div>

        <span
          className={`px-1.5 py-0.5 rounded border bg-slate-800 text-[10px] font-mono shrink-0 ${charColour(skill.characteristic)}`}
        >
          {CHAR_LABEL[skill.characteristic]}
        </span>

        <span
          className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold shrink-0 ${levelBadgeClass}`}
        >
          {skill.level === "trained" ? "Trained" : skill.level}
        </span>

        <span className={`text-base font-mono font-semibold shrink-0 ${totalColor}`}>
          {skill.total ?? "--"}
        </span>

        <span className="text-slate-400 text-xs shrink-0">{expanded ? "▼" : "▲"}</span>
      </button>

      {/* EXPANDED BODY */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-slate-600 space-y-3">
          {/* Level buttons */}
          {editable && (
            <div className="flex flex-wrap items-center gap-2">
              {(["trained", "+10", "+20"] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={skill.level === value}
                  aria-label={`Set skill level to ${value}`}
                  onClick={() => handleLevelClick(value)}
                  className={`px-3 py-1 rounded border text-xs transition focus:outline-none ${
                    skill.level === value
                      ? "bg-red-500/20 border-red-500 text-red-400 font-semibold"
                      : "border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                >
                  {value === "trained" ? "Trained" : value}
                </button>
              ))}

              <button
                onClick={handleRemove}
                className="ml-auto text-xs text-red-400 hover:text-red-300 transition focus:outline-none"
                aria-label={`Remove ${skill.name}`}
              >
                Remove
              </button>
            </div>
          )}

          {/* Stats */}
          <div className={`grid gap-2 ${editable ? "grid-cols-3" : "grid-cols-2"}`}>
            {editable && (
              <div className="text-center rounded border border-slate-500 bg-slate-900/60 px-2 py-1.5">
                <div className="text-[10px] text-slate-100 uppercase tracking-wide mb-1">Misc</div>
                <input
                  type="number"
                  value={skill.miscModifier ?? 0}
                  onChange={handleMiscChange}
                  aria-label={`${skill.name} miscellaneous modifier`}
                  className={editableInputClass(true) + " text-center text-xs py-0.5"}
                />
              </div>
            )}
            <div className="text-center rounded border border-slate-500 bg-slate-900/60 px-2 py-1.5">
              <div className="text-[10px] text-slate-100 uppercase tracking-wide">Half</div>
              <div className={`text-sm font-mono font-semibold mt-1 ${getTotalColor(skill.half)}`}>
                {skill.half ?? "--"}
              </div>
            </div>
            <div className="text-center rounded border border-slate-500 bg-slate-900/60 px-2 py-1.5">
              <div className="text-[10px] text-slate-100 uppercase tracking-wide">Opposed</div>
              <div
                className={`text-sm font-mono font-semibold mt-1 ${getTotalColor(skill.opposed)}`}
              >
                {skill.opposed ?? "--"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
