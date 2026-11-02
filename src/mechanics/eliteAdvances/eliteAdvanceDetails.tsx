import { TALENT_LIST, type EliteAdvanceData } from "shared-rules";
import { DEFAULT_SKILLS } from "../../data/reference/defaultSkills";
import { TRAIT_LIST } from "../../data/reference/traitData";
import { InfoParagraph, InfoSection } from "../../ui/InfoSection";
import { uiStackBody, uiStackField, uiTextBody } from "../../ui/styles/editableStyles";

function getSkillName(skillId: string): string {
  return DEFAULT_SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId;
}

function getTalentName(talentId: string): string {
  return TALENT_LIST.find((talent) => talent.id === talentId)?.name ?? talentId;
}

function getTraitName(traitId: string): string {
  return TRAIT_LIST.find((trait) => trait.id === traitId)?.name ?? traitId;
}

function getUnlockedAdvanceName(
  advance: NonNullable<EliteAdvanceData["unlockedAdvances"]>[number]
): string {
  if (advance.kind === "skill" && advance.skillId) {
    const name = getSkillName(advance.skillId);
    return advance.level && advance.level !== "trained" ? `${name} ${advance.level}` : name;
  }
  if (advance.kind === "talent" && advance.talentId) {
    const name = getTalentName(advance.talentId);
    return advance.specialisation ? `${name} (${advance.specialisation})` : name;
  }
  return "Unknown Advance";
}

/** Everything a package grants, unlocks and costs, shown in its information window and its purchase screen. */
export function EliteAdvanceDetails({ advance }: { advance: EliteAdvanceData }) {
  return (
    <div className={`${uiStackBody} ${uiTextBody}`}>
      <InfoParagraph>{advance.description}</InfoParagraph>
      {advance.downtime && (
        <InfoSection heading="Downtime">
          <InfoParagraph>{advance.downtime}</InfoParagraph>
        </InfoSection>
      )}
      {advance.grantedSkills && advance.grantedSkills.length > 0 && (
        <InfoSection heading="Granted skills">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            {advance.grantedSkills.map((skill) => (
              <li key={`${skill.skillId}-${skill.level}`}>{getSkillName(skill.skillId)}</li>
            ))}
          </ul>
        </InfoSection>
      )}
      {advance.grantedTalents && advance.grantedTalents.length > 0 && (
        <InfoSection heading="Granted talents">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            {advance.grantedTalents.map((talentId) => (
              <li key={talentId}>{getTalentName(talentId)}</li>
            ))}
          </ul>
        </InfoSection>
      )}
      {advance.grantedTraits && advance.grantedTraits.length > 0 && (
        <InfoSection heading="Granted traits">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            {advance.grantedTraits.map((traitId) => (
              <li key={traitId}>{getTraitName(traitId)}</li>
            ))}
          </ul>
        </InfoSection>
      )}
      {(advance.grantedMinorPsychicPowers ?? 0) > 0 && (
        <InfoSection heading="Granted psychic powers">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            <li>
              {advance.grantedMinorPsychicPowers} random permanent Minor Psychic Power
              {advance.grantedMinorPsychicPowers === 1 ? "" : "s"}
            </li>
          </ul>
        </InfoSection>
      )}
      {advance.unlockedAdvances && advance.unlockedAdvances.length > 0 && (
        <InfoSection heading="Unlocked advances">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            {advance.unlockedAdvances.map((unlocked, index) => (
              <li key={`${unlocked.kind}-${unlocked.skillId ?? unlocked.talentId}-${index}`}>
                {getUnlockedAdvanceName(unlocked)} — {unlocked.cost} XP
                {unlocked.prerequisites ? `; prerequisite: ${unlocked.prerequisites}` : ""}
              </li>
            ))}
          </ul>
        </InfoSection>
      )}
      {advance.consequences && advance.consequences.length > 0 && (
        <InfoSection heading="Consequences">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            {advance.consequences.map((consequence) => (
              <li key={consequence}>{consequence}</li>
            ))}
          </ul>
        </InfoSection>
      )}
      {advance.effects && advance.effects.length > 0 && (
        <InfoSection heading="Effects">
          <ul className={`list-disc ${uiStackField} pl-5`}>
            {advance.effects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        </InfoSection>
      )}
    </div>
  );
}
