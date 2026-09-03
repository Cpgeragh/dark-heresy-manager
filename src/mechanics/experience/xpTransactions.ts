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

  if (transaction.type === "spend" || transaction.type === "remove") {
    const remaining = experience.total - experience.spent;
    if (transaction.amount > remaining) {
      throw new Error(
        transaction.type === "remove"
          ? "Cannot remove XP that has already been spent."
          : "Cannot spend more XP than the character has remaining."
      );
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
        : transaction.type === "remove"
          ? experience.total - transaction.amount
          : experience.total,
    spent:
      transaction.type === "spend"
        ? experience.spent + transaction.amount
        : experience.spent,
    transactions: [...(experience.transactions ?? []), persisted],
  };
}

/** Set the single manual XP cost attached to a Rank Up, replacing any existing cost for that rank. */
export function setRankUpXpCost(
  experience: ExperienceBlock,
  cost: Omit<NewXpTransaction, "type">
): ExperienceBlock {
  if (!Number.isInteger(cost.amount) || cost.amount <= 0) {
    throw new Error("XP amount must be a positive whole number.");
  }

  const existingCosts = (experience.transactions ?? []).filter(
    (transaction) => transaction.type === "spend" && transaction.rankId === cost.rankId
  );
  const existingTotal = existingCosts.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );
  const spentWithoutExistingCost = experience.spent - existingTotal;
  if (cost.amount > experience.total - spentWithoutExistingCost) {
    throw new Error("Cannot spend more XP than the character has remaining.");
  }

  const reason = cost.reason?.trim();
  const persisted: XpTransaction = {
    id: existingCosts[0]?.id ?? cost.id,
    type: "spend",
    amount: cost.amount,
    rankId: cost.rankId,
    ...(reason ? { reason } : {}),
  };

  return {
    ...experience,
    spent: spentWithoutExistingCost + cost.amount,
    transactions: [
      ...(experience.transactions ?? []).filter(
        (transaction) =>
          transaction.type !== "spend" || transaction.rankId !== cost.rankId
      ),
      persisted,
    ],
  };
}

/** Remove an unconfirmed Rank Up XP cost that was persisted against the still-current rank. */
export function clearRankUpXpCost(
  experience: ExperienceBlock,
  rankId: string
): ExperienceBlock {
  const existingCosts = (experience.transactions ?? []).filter(
    (transaction) => transaction.type === "spend" && transaction.rankId === rankId
  );
  if (existingCosts.length === 0) return experience;

  const existingTotal = existingCosts.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );
  const transactions = (experience.transactions ?? []).filter(
    (transaction) => transaction.type !== "spend" || transaction.rankId !== rankId
  );

  return {
    ...experience,
    spent: Math.max(0, experience.spent - existingTotal),
    transactions: transactions.length > 0 ? transactions : undefined,
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
