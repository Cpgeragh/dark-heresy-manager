import type { EliteAdvancePurchase, SkillAdvanceLevel } from "../../types/Character";
import {
  CHAR_FULL_LABEL,
  CHAR_LABEL,
  type SkillWithComputed,
} from "../../pages/CharacterSheet/SkillsTab/skillsConstants";
import {
  LEVEL_BADGE,
  getSkillInfoContent,
  getTalentSourceSummary,
  skillLevelLabel,
} from "../../pages/CharacterSheet/SkillsTab/skillRowShared";
import { Chip } from "../../ui/chips/Chip";
import { OwnedEntryRow } from "../../ui/OwnedEntryRow";
import { entryNotesLine } from "../../ui/entryNotesLine";
import { characteristicChipColour } from "../../ui/styles/sourceStyles";

interface EliteSkillCardProps {
  skill: SkillWithComputed;
  /** The one tier this card stands for. */
  tier: Exclude<SkillAdvanceLevel, "untrained">;
  purchase: EliteAdvancePurchase;
  editable: boolean;
  onRemove: () => unknown;
  /** Why this tier cannot be removed yet, shown instead of the confirmation. */
  blockedMessage?: string;
}

/** One skill tier bought through an Elite Advance: the regular skill card without Upgrade and Downgrade. */
export function EliteSkillCard({
  skill,
  tier,
  purchase,
  editable,
  onRemove,
  blockedMessage,
}: EliteSkillCardProps) {
  const total = skill.total ?? "—";
  const characteristicName = CHAR_FULL_LABEL[skill.characteristic].replace(/\s+\([^)]+\)$/, "");
  const talentSourceSummary = getTalentSourceSummary(skill);

  return (
    <OwnedEntryRow
      name={skill.name}
      editable={editable}
      information={getSkillInfoContent(skill)}
      informationAs="span"
      collapsible
      chips={
        <>
          <Chip
            colour={characteristicChipColour(skill.characteristic)}
            className="font-code"
            aria-label={`${characteristicName} ${total}`}
          >
            {CHAR_LABEL[skill.characteristic]} {total}
          </Chip>
          <Chip colour={skill.advanced ? "purple" : "teal"}>
            {skill.advanced ? "Advanced" : "Basic"}
          </Chip>
          <Chip colour={LEVEL_BADGE[tier]}>{skillLevelLabel(tier)}</Chip>
        </>
      }
      lines={{
        gainedFrom: `${purchase.sourceName} (Elite Advance)`,
        talentEffects: talentSourceSummary || undefined,
        notes: entryNotesLine(skill.name, undefined, {
          collection: "skills",
          id: skill.id,
          notes: skill.personalNotes,
          editable,
        }),
      }}
      removal={{ kind: "Skill", onRemove, blockedMessage }}
    />
  );
}
