// src/pages/characterSheet/SkillsTab/SkillRow.tsx

import { useState, useCallback } from "react";
import type { SkillAdvanceLevel } from "../../../types/Character";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import type { SkillTierAccess } from "../../../features/experience/skillAdvanceCosts";
import { charColour, sourceColour } from "../../../ui/sourceStyles";
import { Chip } from "../../../ui/Chip";
import { StatChip } from "../../../ui/StatChip";
import { InfoModal } from "../../../components/InfoModal";
import { SKILL_DESCRIPTIONS } from "../../../data/skillDescriptions";
import { RemoveButton } from "../../../ui/RemoveButton";
import { Button } from "../../../ui/Button";
import { PickerBody, PickerModal } from "../../../ui/PickerModal";
import {
  editableInputClass,
  uiFormLabel,
  uiInfoModalWrapper,
  uiItemName,
  uiSectionShell,
  uiTextBody,
} from "../../../ui/editableStyles";
import { uiPickerPressFeedback } from "../../../ui/buttonStyles";
import { colourPurple, colourTeal, colourValue } from "../../../ui/colourTokens";
import { sanitizeNonNegativeIntegerInput } from "../../../utils/formInput";

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
  /** What buying this skill's next tier looks like right now. Owned rows only, not previewMode. */
  nextTierAccess?: SkillTierAccess;
  onManualUpgrade?: (id: string, level: SkillAdvanceLevel, cost: number) => void;
}

const LEVEL_BADGE: Record<string, string> = {
  untrained: "bg-red-500/10 border-red-500 text-red-500",
  trained: "bg-orange-500/10 border-orange-400 text-orange-400",
  "+10": "bg-sky-500/10 border-sky-400 text-sky-400",
  "+20": "bg-green-500/10 border-green-400 text-green-400",
};

export function SkillRow({
  skill,
  editable,
  updateLevel,
  previewMode = false,
  onSelect,
  indented = false,
  hideLevelChip = false,
  cost,
  nextTierAccess,
  onManualUpgrade,
}: SkillRowProps) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [upgradeArmed, setUpgradeArmed] = useState(false);
  const [manualUpgradeArmed, setManualUpgradeArmed] = useState(false);
  const [manualUpgradeCost, setManualUpgradeCost] = useState("");

  const levelBadgeClass = LEVEL_BADGE[skill.level] ?? "";
  const talentSourceSummary = skill.talentSources
    ?.map((source) =>
      `${source.name}${source.amount !== 0 ? `: ${source.amount > 0 ? "+" : ""}${source.amount}` : ""}`
    )
    .join(" · ");

  const displayName = indented
    ? skill.name.slice(skill.category.length).trim().replace(/^\(|\)$/g, "").trim() || skill.name
    : skill.name;

  const handleRemove = useCallback(
    () => updateLevel(skill.id, "untrained"),
    [skill.id, updateLevel]
  );

  const manualUpgradeCostNumber = Number(manualUpgradeCost);
  const canConfirmManualUpgrade = manualUpgradeCost.trim() !== "";

  return (
    <div className={uiSectionShell + " overflow-hidden"}>
      {/* COLLAPSED ROW */}
      <div className={`relative w-full text-left hover:bg-slate-700/40 transition group ${
        previewMode ? "p-3 lg:p-4" : "px-3 lg:px-4 py-2.5 lg:py-3"
      }`}>
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(skill.id)}
            aria-label={`Select ${skill.name}`}
            className={`absolute inset-0 w-full rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${uiPickerPressFeedback(previewMode)}`}
          />
        )}
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
            {editable && nextTierAccess && nextTierAccess.status !== "maxed" && (
              <div className="relative z-20 pointer-events-auto">
                {nextTierAccess.status === "unlocked" && (
                  <Button size="xs" onClick={() => setUpgradeArmed(true)}>
                    Upgrade to {nextTierAccess.level} ({nextTierAccess.cost} XP)
                  </Button>
                )}
                {nextTierAccess.status === "not-on-career" && (
                  <Button size="xs" variant="ghost" onClick={() => setManualUpgradeArmed(true)}>
                    Upgrade to {nextTierAccess.level} (type your own cost)
                  </Button>
                )}
              </div>
            )}
            {editable && skill.level !== "untrained" && !(skill.talentMinimumLevel && skill.baseLevel === "untrained") && (
              <div className="relative z-20 pointer-events-auto">
                <RemoveButton
                  onClick={() => setDeleteArmed(true)}
                  label={`Delete ${skill.name}`}
                />
              </div>
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
            {editable && nextTierAccess && nextTierAccess.status !== "maxed" && (
              <div className="relative z-20 pointer-events-auto">
                {nextTierAccess.status === "unlocked" && (
                  <Button size="xs" onClick={() => setUpgradeArmed(true)}>
                    Upgrade to {nextTierAccess.level} ({nextTierAccess.cost} XP)
                  </Button>
                )}
                {nextTierAccess.status === "not-on-career" && (
                  <Button size="xs" variant="ghost" onClick={() => setManualUpgradeArmed(true)}>
                    Upgrade to {nextTierAccess.level} (type your own cost)
                  </Button>
                )}
              </div>
            )}
            {editable && skill.level !== "untrained" && !(skill.talentMinimumLevel && skill.baseLevel === "untrained") && (
              <div className="relative z-20 pointer-events-auto">
                <RemoveButton
                  onClick={() => setDeleteArmed(true)}
                  label={`Delete ${skill.name}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {upgradeArmed && nextTierAccess?.status === "unlocked" && (
        <PickerModal
          title="Upgrade Skill"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setUpgradeArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  updateLevel(skill.id, nextTierAccess.level);
                  setUpgradeArmed(false);
                }}
              >
                Upgrade
              </Button>
              <Button variant="ghost" onClick={() => setUpgradeArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              Upgrade {skill.name} to {nextTierAccess.level} for {nextTierAccess.cost} XP?
            </p>
          </PickerBody>
        </PickerModal>
      )}

      {manualUpgradeArmed && nextTierAccess?.status === "not-on-career" && (
        <PickerModal
          title="Upgrade Skill"
          query=""
          onQueryChange={() => undefined}
          onClose={() => setManualUpgradeArmed(false)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                disabled={!canConfirmManualUpgrade}
                onClick={() => {
                  onManualUpgrade?.(skill.id, nextTierAccess.level, manualUpgradeCostNumber);
                  setManualUpgradeArmed(false);
                  setManualUpgradeCost("");
                }}
              >
                Upgrade
              </Button>
              <Button variant="ghost" onClick={() => setManualUpgradeArmed(false)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <label className={uiFormLabel}>
              XP Cost to upgrade {skill.name} to {nextTierAccess.level}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={manualUpgradeCost}
              onChange={(event) => setManualUpgradeCost(sanitizeNonNegativeIntegerInput(event.target.value))}
              placeholder="0"
              className={editableInputClass(true) + " mt-0.5"}
            />
          </PickerBody>
        </PickerModal>
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
