import type {
  CharacterHeader,
  ExperienceBlock,
  XpTransaction,
} from "../../types/Character";
import { getCareerRankProgression } from "./careerRankProgression";

export interface NewXpTransaction {
  id: string;
  type: XpTransaction["type"];
  amount: number;
  reason?: string;
  rankId: string;
}

export function applyXpTransaction(
  experience: ExperienceBlock,
  transaction: NewXpTransaction
): ExperienceBlock {
  if (!Number.isInteger(transaction.amount) || transaction.amount <= 0) {
    throw new Error("XP amount must be a positive whole number.");
  }

  if (transaction.type === "spend") {
    const remaining = experience.total - experience.spent;
    if (transaction.amount > remaining) {
      throw new Error("Cannot spend more XP than the character has remaining.");
    }
  }

  const reason = transaction.reason?.trim();
  const persisted: XpTransaction = {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    rankId: transaction.rankId,
    ...(reason ? { reason } : {}),
  };

  return {
    ...experience,
    total:
      transaction.type === "add"
        ? experience.total + transaction.amount
        : experience.total,
    spent:
      transaction.type === "spend"
        ? experience.spent + transaction.amount
        : experience.spent,
    transactions: [...(experience.transactions ?? []), persisted],
  };
}

/** Build the header written when the DM confirms one valid Career rank step. */
export function applyCareerRankUp(
  header: CharacterHeader,
  spentXp: number,
  nextRankId: string
): CharacterHeader {
  const progression = getCareerRankProgression(
    header.career,
    header.rank,
    spentXp,
    header.careerPath
  );
  if (!progression?.canRankUp) {
    throw new Error("The character has not spent enough XP to rank up.");
  }

  const nextRank = progression.nextRanks.find((rank) => rank.id === nextRankId);
  if (!nextRank) {
    throw new Error("That rank is not a valid next step for this Career.");
  }

  const careerPath =
    progression.careerPath ??
    (nextRank.paths?.length === 1 ? nextRank.paths[0] : undefined);

  const nextHeader: CharacterHeader = {
    ...header,
    rank: nextRank.name,
  };
  if (careerPath) nextHeader.careerPath = careerPath;
  else delete nextHeader.careerPath;
  return nextHeader;
}
