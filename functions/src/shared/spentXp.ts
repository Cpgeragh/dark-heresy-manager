import { HttpsError } from "firebase-functions/v2/https";
import { getSpentXp, type CharacterForSpentXp } from "shared-rules";

const CHARACTER_XP_MAX = 10_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function calculateCharacterSpentXp(character: Record<string, unknown>): number {
  let spentXp: number;
  try {
    spentXp = getSpentXp(character as CharacterForSpentXp);
  } catch {
    throw new HttpsError("failed-precondition", "The stored XP purchase data is invalid.");
  }
  if (!Number.isSafeInteger(spentXp) || spentXp < 0 || spentXp > CHARACTER_XP_MAX) {
    throw new HttpsError("failed-precondition", "The calculated Spent XP is invalid.");
  }
  return spentXp;
}

export function getCharacterTotalXp(character: Record<string, unknown>): number {
  const experience = character.experience;
  const totalXp = isRecord(experience) ? experience.total : undefined;
  if (
    !Number.isSafeInteger(totalXp) ||
    (totalXp as number) < 0 ||
    (totalXp as number) > CHARACTER_XP_MAX
  ) {
    throw new HttpsError("failed-precondition", "The stored Total XP is invalid.");
  }
  return totalXp as number;
}

export function assertCharacterXpBudget(
  character: Record<string, unknown>,
  message = "This change would increase Spent XP above Total XP."
): number {
  const spentXp = calculateCharacterSpentXp(character);
  if (spentXp > getCharacterTotalXp(character)) {
    throw new HttpsError("failed-precondition", message);
  }
  return spentXp;
}
