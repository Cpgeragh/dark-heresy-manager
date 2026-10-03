import { ELITE_ADVANCES } from "shared-rules";
import type {
  Characteristics,
  SkillAdvanceLevel,
  TalentsAndTraitsBlock,
} from "../../types/Character";

export interface EliteAdvanceGrantOrigin {
  uid: string;
  name: string;
}

export interface EliteAdvanceSkillGrant {
  origin: EliteAdvanceGrantOrigin;
  skillId: string;
  level: Exclude<SkillAdvanceLevel, "untrained">;
}

export interface EliteAdvanceReferenceGrant {
  origin: EliteAdvanceGrantOrigin;
  referenceId: string;
}

function ownedReferences(talents: TalentsAndTraitsBlock) {
  return (talents.eliteAdvances ?? []).flatMap((entry) => {
    const reference = ELITE_ADVANCES.find((advance) => advance.id === entry.eliteAdvanceId);
    return reference ? [{ entry, reference }] : [];
  });
}

export function getEliteAdvanceSkillGrants(
  talents: TalentsAndTraitsBlock
): EliteAdvanceSkillGrant[] {
  return ownedReferences(talents).flatMap(({ entry, reference }) =>
    (reference.grantedSkills ?? []).map((grant) => ({
      origin: { uid: entry.uid, name: reference.name },
      skillId: grant.skillId,
      level: grant.level,
    }))
  );
}

export function getEliteAdvanceTalentGrants(
  talents: TalentsAndTraitsBlock
): EliteAdvanceReferenceGrant[] {
  return ownedReferences(talents).flatMap(({ entry, reference }) =>
    (reference.grantedTalents ?? []).map((referenceId) => ({
      origin: { uid: entry.uid, name: reference.name },
      referenceId,
    }))
  );
}

export function getEliteAdvanceTraitGrants(
  talents: TalentsAndTraitsBlock
): EliteAdvanceReferenceGrant[] {
  return ownedReferences(talents).flatMap(({ entry, reference }) =>
    (reference.grantedTraits ?? []).map((referenceId) => ({
      origin: { uid: entry.uid, name: reference.name },
      referenceId,
    }))
  );
}

export function getEliteAdvanceCharacteristicModifierSources(
  talents: TalentsAndTraitsBlock,
  characteristic: keyof Characteristics
): { name: string; type: "Elite Advance"; amount: number }[] {
  return (talents.eliteAdvances ?? []).flatMap((entry) => {
    const amount = entry.acquisition?.characteristicReductions?.[characteristic];
    return amount ? [{ name: entry.name, type: "Elite Advance" as const, amount: -amount }] : [];
  });
}
