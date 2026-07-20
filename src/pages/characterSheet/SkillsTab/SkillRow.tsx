// src/pages/characterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";
import { uiIconRemoveButton } from "../../../ui/buttonStyles";
import { uiInfoModalWrapper, uiItemName, uiSectionShell } from "../../../ui/editableStyles";
import { TrashIcon } from "../../../ui/TrashIcon";
import { ExpandChevron } from "../../../ui/ExpandChevron";
import { colourPurple, colourTeal } from "../../../ui/colourTokens";

interface SkillRowProps {
  skill: SkillWithComputed;
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  previewMode?: boolean;
  onSelect?: (id: string) => void;
  indented?: boolean;
  hideLevelChip?: boolean;
}

const LEVEL_BADGE: Record<string, string> = {
  untrained: "bg-red-500/10 border-red-500 text-red-500",
  trained: "bg-orange-500/10 border-orange-400 text-orange-400",
  "+10": "bg-sky-500/10 border-sky-400 text-sky-400",
  "+20": "bg-green-500/10 border-green-400 text-green-400",
};

export function SkillRow({ skill, editable, updateLevel, previewMode = false, onSelect, indented = false, hideLevelChip = false }: SkillRowProps) {
  const [expanded, setExpanded] = useState(false);

  const levelBadgeClass = LEVEL_BADGE[skill.level] ?? "";

  const displayName = indented
    ? skill.name.slice(skill.category.length).trim().replace(/^\(|\)$/g, "").trim() || skill.name
    : skill.name;

  const handleToggle = useCallback(() => setExpanded((p) => !p), []);

  const handleLevelClick = useCallback(
    (value: SkillAdvanceLevel) => updateLevel(skill.id, value),
    [skill.id, updateLevel]
  );

  const handleRemove = useCallback(
    () => updateLevel(skill.id, "untrained"),
    [skill.id, updateLevel]
  );

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      {/* COLLAPSED ROW */}
      <button
        onClick={onSelect ? () => onSelect(skill.id) : handleToggle}
        aria-expanded={expanded}
        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-slate-700/40 transition group"
      >
        {/* Mobile: name+chips in a left column, total in its own centered column, chevron last */}
        <div className="lg:hidden flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`${uiItemName} truncate ${onSelect ? "group-hover:text-white" : ""}`}>{displayName}</span>
              {SKILL_DESCRIPTIONS[skill.name] && (
                <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                  <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} as="span" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Chip size="sm" className={`bg-slate-800 font-code shrink-0 ${charColour(skill.characteristic)}`}>
                {CHAR_LABEL[skill.characteristic]}
              </Chip>
              <Chip size="sm" className={`shrink-0 ${skill.advanced ? colourPurple : colourTeal}`}>
                {skill.advanced ? "Advanced" : "Basic"}
              </Chip>
              {!hideLevelChip && (
                <Chip size="sm" className={`shrink-0 ${levelBadgeClass}`}>
                  {skill.level === "trained" ? "Trained" : skill.level === "untrained" ? "Untrained" : skill.level}
                </Chip>
              )}
            </div>
          </div>
          <span className="font-code font-extrabold shrink-0 text-white text-xl">
            {skill.total ?? "--"}<span className="text-sm font-normal text-slate-300 ml-1">pts</span>
          </span>
          {onSelect ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={expanded ? "Collapse skill details" : "Expand skill details"}
              onClick={(e) => { e.stopPropagation(); handleToggle(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); handleToggle(); } }}
              className="p-1 -m-1"
            >
              <ExpandChevron expanded={expanded} />
            </span>
          ) : (
            <ExpandChevron expanded={expanded} />
          )}
        </div>

        {/* Desktop: name+chips in a left column, total in its own centered column, chevron last */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`${uiItemName} truncate ${onSelect ? "group-hover:text-white" : ""}`}>{displayName}</span>
              {SKILL_DESCRIPTIONS[skill.name] && (
                <span className={uiInfoModalWrapper} onClick={(e) => e.stopPropagation()}>
                  <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} as="span" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Chip className={`bg-slate-800 font-code shrink-0 ${charColour(skill.characteristic)}`}>
                {CHAR_LABEL[skill.characteristic]}
              </Chip>
              <Chip className={`shrink-0 ${skill.advanced ? colourPurple : colourTeal}`}>
                {skill.advanced ? "Advanced" : "Basic"}
              </Chip>
              {!hideLevelChip && (
                <Chip className={`shrink-0 ${levelBadgeClass}`}>
                  {skill.level === "trained" ? "Trained" : skill.level === "untrained" ? "Untrained" : skill.level}
                </Chip>
              )}
            </div>
          </div>
          <span className="font-code font-extrabold shrink-0 text-white text-2xl">
            {skill.total ?? "--"}<span className="text-sm font-normal text-slate-300 ml-1">pts</span>
          </span>
          {onSelect ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={expanded ? "Collapse skill details" : "Expand skill details"}
              onClick={(e) => { e.stopPropagation(); handleToggle(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); handleToggle(); } }}
              className="p-1 -m-1"
            >
              <ExpandChevron expanded={expanded} />
            </span>
          ) : (
            <ExpandChevron expanded={expanded} />
          )}
        </div>
      </button>

      {/* EXPANDED BODY */}
      {expanded && (
        <div className="px-3 lg:px-4 pb-3 lg:pb-4 pt-2 lg:pt-3 border-t border-slate-600 space-y-3">
          {/* Level buttons */}
          <div className="space-y-2">
              {editable && skill.level !== "untrained" && (
                <div className="flex justify-end">
                  <button
                    onClick={handleRemove}
                    className={`${uiIconRemoveButton} focus:outline-none`}
                    aria-label={`Remove ${skill.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {(skill.advanced
                  ? (["trained", "+10", "+20"] as const)
                  : (previewMode ? ["untrained", "trained", "+10", "+20"] : ["trained", "+10", "+20"]) as readonly ("untrained" | "trained" | "+10" | "+20")[]
                ).map((value) => (
                  <button
                    key={value}
                    aria-pressed={skill.level === value}
                    aria-label={`Set skill level to ${value}`}
                    onClick={editable ? () => handleLevelClick(value) : undefined}
                    className={`flex-1 px-3 lg:px-4 py-2 rounded border text-sm lg:text-base ${
                      editable ? "transition focus:outline-none" : "cursor-default"
                    } ${
                      skill.level === value
                        ? `${LEVEL_BADGE[value]} font-semibold`
                        : "border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
                    }`}
                  >
                    {value === "trained" ? "Trained" : value === "untrained" ? "Untrained" : value}
                  </button>
                ))}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
