// src/pages/CharacterSheet/SkillsTab/skillRowShared.tsx

import type { ReactNode } from "react";
import { SKILL_DESCRIPTIONS } from "../../../data/reference/skillDescriptions";
import { InfoSection } from "../../../ui/InfoSection";
import { uiStackBody, uiStackField, uiTextDescription } from "../../../ui/styles/editableStyles";
import type { ChipColour } from "../../../ui/styles/colourTokens";
import type { SkillWithComputed } from "./skillsConstants";

export const LEVEL_BADGE: Record<string, ChipColour> = {
  untrained: "red",
  trained: "orange",
  "+10": "sky",
  "+20": "green",
};

export function skillLevelLabel(level: string): string {
  return level === "trained" ? "Trained" : level === "untrained" ? "Untrained" : level;
}

/** The talents and traits that change a skill, as one line of text. */
export function getTalentSourceSummary(skill: SkillWithComputed): string {
  return (skill.talentSources ?? [])
    .map(
      (source) =>
        `${source.name} (${source.type})${
          source.detail
            ? `: ${source.detail}`
            : source.amount !== 0
              ? `: ${source.amount > 0 ? "+" : ""}${source.amount}`
              : ""
        }`
    )
    .join(" · ");
}

/** The content of a skill's information window, or nothing when the skill has no description and no effects. */
export function getSkillInfoContent(skill: SkillWithComputed): ReactNode | undefined {
  const talentSources = skill.talentSources ?? [];
  const skillDescription = SKILL_DESCRIPTIONS[skill.name];
  if (!skillDescription && talentSources.length === 0) return undefined;
  return (
    <div className={uiStackBody}>
      {skillDescription && <p className={uiTextDescription}>{skillDescription}</p>}
      {talentSources.length > 0 && (
        <InfoSection heading="Effects">
          <ul className={`${uiStackField} ${uiTextDescription}`}>
            {talentSources.map((source, index) => (
              <li key={index}>
                {source.name} ({source.type})
                {source.detail
                  ? `: ${source.detail}`
                  : source.amount !== 0
                    ? `: ${source.amount > 0 ? "+" : ""}${source.amount}`
                    : ""}
              </li>
            ))}
          </ul>
        </InfoSection>
      )}
    </div>
  );
}
