// src/mechanics/career/careerStartingBenefits.ts

import { CAREER_LIST } from "../../data/reference/careerData";
import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import type { CareerStartingChoices, CyberneticItem } from "../../types/Character";

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

export const TECH_PRIEST_MECHANICUS_IMPLANT_GRANT_UID = "career:tech-priest:mechanicus-implants";

const TECH_PRIEST_IMPLANT_REFERENCE_IDS = [
  "cr-electro-graft",
  "cr-electoo-inductors",
  "cr-respirator-unit",
  "cr-cyber-mantle",
  "cr-potentia-coil",
  "cr-cranial-circuitry",
];

/** Tech-Priests are judged a suitable vessel for these implants at creation, no real cost or craftsmanship listed. */
export function applyTechPriestImplants(
  cybernetics: CyberneticItem[],
  careerName: string
): CyberneticItem[] {
  const withoutOld = cybernetics.filter(
    (item) => item.grantedByTalentEntryUid !== TECH_PRIEST_MECHANICUS_IMPLANT_GRANT_UID
  );
  if (careerName !== "Tech-Priest") return withoutOld;
  const granted: CyberneticItem[] = TECH_PRIEST_IMPLANT_REFERENCE_IDS.map((referenceId) => {
    const reference = CYBERNETICS_REFERENCE.find((ref) => ref.id === referenceId)!;
    return {
      id: `${TECH_PRIEST_MECHANICUS_IMPLANT_GRANT_UID}:${referenceId}`,
      referenceId,
      name: reference.name,
      availability: reference.availability,
      grantedByTalentEntryUid: TECH_PRIEST_MECHANICUS_IMPLANT_GRANT_UID,
      grantedByTalentName: "Tech-Priest",
      grantedByType: "Career",
    };
  });
  return [...withoutOld, ...granted];
}
