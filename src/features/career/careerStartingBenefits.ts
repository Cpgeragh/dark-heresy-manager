// src/features/career/careerStartingBenefits.ts

import { CAREER_LIST } from "../../data/careerData";
import type { CareerStartingChoices } from "../../types/Character";

function findCareer(careerName?: string) {
  return CAREER_LIST.find((career) => career.name === careerName);
}

/** Skill ids a character's career grants for free, resolving any "or" choice already made. */
export function getDerivedCareerSkillIds(
  careerName: string | undefined,
  choices: CareerStartingChoices | undefined
): string[] {
  const career = findCareer(careerName);
  if (!career) return [];
  const ids: string[] = [];
  career.startingSkillGrants?.forEach((grant, index) => {
    const optionIndex = grant.options.length > 1 ? choices?.skillChoices?.[index] : 0;
    if (optionIndex === undefined) return;
    const option = grant.options[optionIndex];
    if (option) ids.push(option.skillId);
  });
  return ids;
}

export interface DerivedCareerTalentGrant {
  talentId: string;
  specialisation?: string;
  grantIndex: number;
}

/** Talent grants a character's career gives for free, resolving any "or" choice already made. */
export function getDerivedCareerTalentGrants(
  careerName: string | undefined,
  choices: CareerStartingChoices | undefined
): DerivedCareerTalentGrant[] {
  const career = findCareer(careerName);
  if (!career) return [];
  const grants: DerivedCareerTalentGrant[] = [];
  career.startingTalentGrants?.forEach((grant, index) => {
    const optionIndex = grant.options.length > 1 ? choices?.talentChoices?.[index] : 0;
    if (optionIndex === undefined) return;
    const option = grant.options[optionIndex];
    if (option) grants.push({ ...option, grantIndex: index });
  });
  return grants;
}

/** Whether this career has at least one starting grant the player still needs to pick between. */
export function careerNeedsStartingChoice(careerName: string | undefined): boolean {
  const career = findCareer(careerName);
  if (!career) return false;
  return [
    ...(career.startingSkillGrants ?? []),
    ...(career.startingTalentGrants ?? []),
  ].some((grant) => grant.options.length > 1);
}
