// src/pages/characterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, getTotalColor, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";
import { Stepper } from "../../../components/Stepper";

interface SkillRowProps {
  skill: SkillWithComputed;
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  updateMisc: (id: string, value: number) => void;
  previewMode?: boolean;
}

const LEVEL_BADGE: Record<string, string> = {
  untrained: "bg-red-500/10 border-red-500 text-red-500",
  trained: "bg-orange-500/10 border-orange-400 text-orange-400",
  "+10": "bg-sky-500/10 border-sky-400 text-sky-400",
  "+20": "bg-green-500/10 border-green-400 text-green-400",
};

export function SkillRow({ skill, editable, updateLevel, updateMisc, previewMode = false }: SkillRowProps) {
  const [expanded, setExpanded] = useState(false);

  const totalColor = getTotalColor(skill.total);
  const levelBadgeClass = LEVEL_BADGE[skill.level] ?? "";

  const handleToggle = useCallback(() => setExpanded((p) => !p), []);

  const handleLevelClick = useCallback(
    (value: SkillAdvanceLevel) => updateLevel(skill.id, value),
    [skill.id, updateLevel]
  );

  const handleMiscChange = useCallback(
    (value: number) => updateMisc(skill.id, value),
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
        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition"
      >
        {/* Mobile: name + total + chevron on row 1, chips on row 2 */}
        <div className="lg:hidden space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-100 truncate">{skill.name}</span>
              {SKILL_DESCRIPTIONS[skill.name] && (
                <span className="inline-flex items-center -translate-y-[1.4px]" onClick={(e) => e.stopPropagation()}>
                  <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} />
                </span>
              )}
            </div>
            <span className={`text-base font-code font-semibold shrink-0 ${totalColor}`}>
              {skill.total ?? "--"}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded border bg-slate-800 text-[10px] font-code shrink-0 ${charColour(skill.characteristic)}`}>
              {CHAR_LABEL[skill.characteristic]}
            </span>
            <span className={`px-1.5 py-0.5 rounded border text-[10px] shrink-0 ${skill.advanced ? "bg-purple-700/40 border-purple-500 text-purple-300" : "bg-teal-900/40 border-teal-700/50 text-teal-300"}`}>
              {skill.advanced ? "Advanced" : "Basic"}
            </span>
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold shrink-0 ${levelBadgeClass}`}>
              {skill.level === "trained" ? "Trained" : skill.level === "untrained" ? "Untrained" : skill.level}
            </span>
          </div>
        </div>

        {/* Desktop: single row */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-base font-semibold text-slate-100 truncate">{skill.name}</span>
            {SKILL_DESCRIPTIONS[skill.name] && (
              <span className="inline-flex items-center -translate-y-[1.4px]" onClick={(e) => e.stopPropagation()}>
                <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} />
              </span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded border bg-slate-800 text-xs font-code shrink-0 ${charColour(skill.characteristic)}`}>
            {CHAR_LABEL[skill.characteristic]}
          </span>
          <span className={`px-2 py-0.5 rounded border text-xs shrink-0 ${skill.advanced ? "bg-purple-700/40 border-purple-500 text-purple-300" : "bg-teal-900/40 border-teal-700/50 text-teal-300"}`}>
            {skill.advanced ? "Advanced" : "Basic"}
          </span>
          <span className={`px-2 py-0.5 rounded border text-xs font-semibold shrink-0 ${levelBadgeClass}`}>
            {skill.level === "trained" ? "Trained" : skill.level === "untrained" ? "Untrained" : skill.level}
          </span>
          <span className={`text-lg font-code font-semibold shrink-0 ${totalColor}`}>
            {skill.total ?? "--"}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${expanded ? "" : "-rotate-90"}`}>
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {/* EXPANDED BODY */}
      {expanded && (
        <div className="px-3 lg:px-4 pb-3 lg:pb-4 pt-2 lg:pt-3 border-t border-slate-600 space-y-3">
          {/* Level buttons */}
          {(editable || previewMode) && (
            <div className="flex flex-wrap items-center gap-2">
              {(skill.advanced
                ? (["trained", "+10", "+20"] as const)
                : (["untrained", "trained", "+10", "+20"] as const)
              ).map((value) => (
                <button
                  key={value}
                  aria-pressed={skill.level === value}
                  aria-label={`Set skill level to ${value}`}
                  onClick={previewMode ? undefined : () => handleLevelClick(value)}
                  className={`px-3 lg:px-4 py-1 rounded border text-xs lg:text-sm ${
                    previewMode ? "cursor-default" : "transition focus:outline-none"
                  } ${
                    skill.level === value
                      ? `${LEVEL_BADGE[value]} font-semibold`
                      : "border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
                  }`}
                >
                  {value === "trained" ? "Trained" : value === "untrained" ? "Untrained" : value}
                </button>
              ))}

              {skill.advanced && !previewMode && (
                <button
                  onClick={handleRemove}
                  className="ml-auto text-xs lg:text-sm text-red-400 hover:text-red-300 transition focus:outline-none"
                  aria-label={`Remove ${skill.name}`}
                >
                  Remove
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className={`grid gap-2 ${editable && !previewMode ? "grid-cols-2" : "grid-cols-1"}`}>
            {editable && !previewMode && (
              <div className="text-center rounded border border-slate-500 bg-slate-900/60 px-2 py-1.5">
                <div className="text-[10px] lg:text-xs text-slate-100 uppercase tracking-wide mb-1">Misc</div>
                <Stepper
                  value={skill.miscModifier ?? 0}
                  min={-100}
                  editable={editable}
                  onChange={handleMiscChange}
                />
              </div>
            )}
            <div className="text-center rounded border border-slate-500 bg-slate-900/60 px-2 py-1.5">
              <div className="text-[10px] lg:text-xs text-slate-100 uppercase tracking-wide mb-1">Half</div>
              <div className={`h-7 sm:h-8 lg:h-10 flex items-center justify-center text-xl lg:text-2xl font-code font-semibold ${getTotalColor(skill.half)}`}>
                {skill.half ?? "--"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
