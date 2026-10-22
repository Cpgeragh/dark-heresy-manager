// src/pages/CharacterSheet/SkillsTab/SkillPickerRow.tsx

import { Chip } from "../../../ui/chips/Chip";
import { StatChip } from "../../../ui/chips/StatChip";
import { PickerRow } from "../../../ui/pickers/PickerModal";
import { PickerRowChips, PickerRowLine, PickerRowName } from "../../../ui/pickers/PickerRowParts";
import { characteristicChipColour, sourceChipColour } from "../../../ui/styles/sourceStyles";
import { CHAR_LABEL, type SkillWithComputed } from "./skillsConstants";
import {
  LEVEL_BADGE,
  getSkillInfoContent,
  getTalentSourceSummary,
  skillLevelLabel,
} from "./skillRowShared";

interface SkillPickerRowProps {
  skill: SkillWithComputed;
  onSelect?: (id: string) => void | Promise<boolean | void>;
  /** Shows only the part of the name after the category, for a skill listed inside its group. */
  indented?: boolean;
  hideLevelChip?: boolean;
  /** Real XP cost to train this skill, shown as a chip when known. */
  cost?: number;
}

/** One skill in the Add Skill picker: the same row as every other picker, with the skill's chips and effects. */
export function SkillPickerRow({
  skill,
  onSelect,
  indented = false,
  hideLevelChip = false,
  cost,
}: SkillPickerRowProps) {
  const displayName = indented
    ? skill.name
        .slice(skill.category.length)
        .trim()
        .replace(/^\(|\)$/g, "")
        .trim() || skill.name
    : skill.name;
  const purchasedLevel = skill.baseLevel ?? skill.level;
  const eliteAdvancePurchase =
    purchasedLevel === "untrained" ? undefined : skill.eliteAdvancePurchases?.[purchasedLevel];
  const talentSourceSummary = getTalentSourceSummary(skill);

  return (
    <PickerRow
      aria-label={onSelect ? `Select ${skill.name}` : undefined}
      interactive={Boolean(onSelect)}
      onClick={onSelect ? () => onSelect(skill.id) : undefined}
    >
      <PickerRowName
        name={displayName}
        infoTitle={skill.name}
        information={getSkillInfoContent(skill)}
      />
      <PickerRowChips>
        {skill.source && (
          <Chip colour={sourceChipColour(skill.source)} className="font-code shrink-0">
            {skill.source}
          </Chip>
        )}
        {cost !== undefined && (
          <Chip colour="amber" className="font-code shrink-0">
            {cost} XP
          </Chip>
        )}
        <Chip
          colour={characteristicChipColour(skill.characteristic)}
          className="font-code shrink-0"
        >
          {CHAR_LABEL[skill.characteristic]}
        </Chip>
        <Chip colour={skill.advanced ? "purple" : "teal"} className="shrink-0">
          {skill.advanced ? "Advanced" : "Basic"}
        </Chip>
        {!hideLevelChip && (
          <Chip colour={LEVEL_BADGE[skill.level]} className="shrink-0">
            {skillLevelLabel(skill.level)}
          </Chip>
        )}
        <StatChip label="Total" value={skill.total ?? "—"} />
      </PickerRowChips>
      {eliteAdvancePurchase && (
        <PickerRowLine
          label="Gained from"
          value={`${eliteAdvancePurchase.sourceName} (Elite Advance)`}
        />
      )}
      {talentSourceSummary && <PickerRowLine label="Talent effects" value={talentSourceSummary} />}
    </PickerRow>
  );
}
