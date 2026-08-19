// src/pages/characterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import { charColour, sourceColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { StatChip } from "../../../ui/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";
import { RemoveButton } from "../../../ui/RemoveButton";
import { Button } from "../../../ui/Button";
import { PickerBody, PickerModal } from "../../../ui/PickerModal";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiSectionShell,
  uiTextBody,
} from "../../../ui/editableStyles";
import { ExpandChevron } from "../../../ui/ExpandChevron";
import { uiPickerPressFeedback } from "../../../ui/buttonStyles";
import { colourPurple, colourTeal, colourValue } from "../../../ui/colourTokens";

interface SkillRowProps {
  skill: SkillWithComputed;
  editable: boolean;
  updateLevel: (id: string, level: SkillAdvanceLevel) => void;
  previewMode?: boolean;
  onSelect?: (id: string) => void;
  indented?: boolean;
  hideLevelChip?: boolean;
  /** Real XP cost to train this skill, shown as a chip in previewMode when known. */
  cost?: number;
}

const LEVEL_BADGE: Record<string, string> = {
  untrained: "bg-red-500/10 border-red-500 text-red-500",
  trained: "bg-orange-500/10 border-orange-400 text-orange-400",
  "+10": "bg-sky-500/10 border-sky-400 text-sky-400",
  "+20": "bg-green-500/10 border-green-400 text-green-400",
};

export function SkillRow({ skill, editable, updateLevel, previewMode = false, onSelect, indented = false, hideLevelChip = false, cost }: SkillRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const levelBadgeClass = LEVEL_BADGE[skill.level] ?? "";
  const talentSourceSummary = skill.talentSources
    ?.map((source) =>
      `${source.name}${source.amount !== 0 ? `: ${source.amount > 0 ? "+" : ""}${source.amount}` : ""}`
    )
    .join(" · ");

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
      <div className={`relative w-full text-left hover:bg-slate-700/40 transition group ${
        previewMode ? "p-3 lg:p-4" : "px-3 lg:px-4 py-2.5 lg:py-3"
      }`}>
        <button
          type="button"
          onClick={onSelect ? () => onSelect(skill.id) : handleToggle}
          aria-expanded={onSelect ? undefined : expanded}
          aria-label={
            onSelect
              ? `Select ${skill.name}`
              : `${expanded ? "Collapse" : "Expand"} ${skill.name} details`
          }
          className={`absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${uiPickerPressFeedback(previewMode && Boolean(onSelect))}`}
        />
        {/* Mobile: name+chips in a left column, total in its own centered column, chevron last */}
        <div className="relative pointer-events-none lg:hidden flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`${uiItemName} truncate ${onSelect ? "group-hover:text-white" : ""}`}>{displayName}</span>
              {SKILL_DESCRIPTIONS[skill.name] && (
                <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                  <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} as="span" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {previewMode && skill.source && (
                <Chip size="sm" className={`bg-slate-800/40 font-code shrink-0 ${sourceColour(skill.source)}`}>
                  {skill.source}
                </Chip>
              )}
              {previewMode && cost !== undefined && (
                <Chip size="sm" className={`font-code shrink-0 ${colourValue}`}>
                  {cost} XP
                </Chip>
              )}
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
            {talentSourceSummary && (
              <p className="text-xs leading-snug text-amber-300">
                Talent effect: {talentSourceSummary}
              </p>
            )}
          </div>
          <div className="relative pointer-events-none flex items-center gap-4 shrink-0">
            <StatChip label="Total" value={skill.total ?? "—"} />
            {(skill.talentSources?.length ?? 0) > 0 && (
              <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                <InfoModal
                  title={`${skill.name} Talent Adjustments`}
                  content={
                    <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                      {skill.talentSources?.map((source, index) => (
                        <li key={index}>
                          {source.name}{source.amount !== 0 ? `: ${source.amount > 0 ? "+" : ""}${source.amount}` : ""}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </span>
            )}
            {editable && skill.level !== "untrained" && !(skill.talentMinimumLevel && skill.baseLevel === "untrained") && (
              <div className="relative z-20 pointer-events-auto">
                <RemoveButton
                  onClick={() => setDeleteArmed(true)}
                  label={`Delete ${skill.name}`}
                />
              </div>
            )}
            {onSelect ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse skill details" : "Expand skill details"}
                onClick={handleToggle}
                className="relative z-10 pointer-events-auto p-1 -m-1"
              >
                <ExpandChevron expanded={expanded} />
              </button>
            ) : (
              <ExpandChevron expanded={expanded} />
            )}
          </div>
        </div>

        {/* Desktop: name+chips in a left column, total in its own centered column, chevron last */}
        <div className="relative pointer-events-none hidden lg:flex lg:items-center lg:gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`${uiItemName} truncate ${onSelect ? "group-hover:text-white" : ""}`}>{displayName}</span>
              {SKILL_DESCRIPTIONS[skill.name] && (
                <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                  <InfoModal title={skill.name} content={SKILL_DESCRIPTIONS[skill.name]} as="span" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {previewMode && skill.source && (
                <Chip className={`bg-slate-800/40 font-code shrink-0 ${sourceColour(skill.source)}`}>
                  {skill.source}
                </Chip>
              )}
              {previewMode && cost !== undefined && (
                <Chip className={`font-code shrink-0 ${colourValue}`}>
                  {cost} XP
                </Chip>
              )}
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
            {talentSourceSummary && (
              <p className="text-xs leading-snug text-amber-300">
                Talent effect: {talentSourceSummary}
              </p>
            )}
          </div>
          <div className="relative pointer-events-none flex items-center gap-4 shrink-0">
            <StatChip label="Total" value={skill.total ?? "—"} />
            {(skill.talentSources?.length ?? 0) > 0 && (
              <span className={`${uiInfoModalWrapper} pointer-events-auto`}>
                <InfoModal
                  title={`${skill.name} Talent Adjustments`}
                  content={
                    <ul className="space-y-1 text-sm leading-relaxed text-slate-300 lg:text-base">
                      {skill.talentSources?.map((source, index) => (
                        <li key={index}>
                          {source.name}{source.amount !== 0 ? `: ${source.amount > 0 ? "+" : ""}${source.amount}` : ""}
                        </li>
                      ))}
                    </ul>
                  }
                />
              </span>
            )}
            {editable && skill.level !== "untrained" && !(skill.talentMinimumLevel && skill.baseLevel === "untrained") && (
              <div className="relative z-20 pointer-events-auto">
                <RemoveButton
                  onClick={() => setDeleteArmed(true)}
                  label={`Delete ${skill.name}`}
                />
              </div>
            )}
            {onSelect ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse skill details" : "Expand skill details"}
                onClick={handleToggle}
                className="relative z-10 pointer-events-auto p-1 -m-1"
              >
                <ExpandChevron expanded={expanded} />
              </button>
            ) : (
              <ExpandChevron expanded={expanded} />
            )}
          </div>
        </div>
      </div>

      {/* EXPANDED BODY */}
      {expanded && (
        <div className="px-3 lg:px-4 pb-3 lg:pb-4 pt-2 lg:pt-3 border-t border-slate-600 space-y-3">
          {/* Level buttons */}
          <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {(skill.advanced
                  ? (["trained", "+10", "+20"] as const)
                  : (previewMode ? ["untrained", "trained", "+10", "+20"] : ["trained", "+10", "+20"]) as readonly ("untrained" | "trained" | "+10" | "+20")[]
                ).map((value) => (
                  <button type="button"
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

      {deleteArmed && (
        <PickerModal
          title="Delete Skill"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setDeleteArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={handleRemove}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setDeleteArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Delete {skill.name} from this character?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </div>
  );
}
