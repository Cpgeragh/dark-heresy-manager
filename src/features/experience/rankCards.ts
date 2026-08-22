import { WEAPON_TRAINING_GROUPS } from "../../data/weaponTrainingData";
import type {
  Character,
  CharacteristicAdvanceTier,
  Characteristics,
  SkillAdvanceLevel,
  WeaponTrainingTalentId,
  XpPurchaseRecord,
} from "../../types/Character";
import { CHARACTERISTIC_ADVANCE_TIERS } from "./characteristicAdvanceCosts";
import {
  getCareerRankProgression,
  getRankXpBand,
  type RankXpBand,
} from "./careerRankProgression";

export type RankCardEntryKind =
  | "characteristic"
  | "skill"
  | "talent"
  | "trait"
  | "weapon-training"
  | "xp-spend";

export interface RankCardEntry {
  id: string;
  name: string;
  cost: number;
  kind: RankCardEntryKind;
}

export interface RankCard {
  rankId: string;
  name: string;
  tier: number;
  xpLevel: string;
  xpBand: RankXpBand;
  isCurrent: boolean;
  careerPurchases: RankCardEntry[];
  rankUpXpSpent: RankCardEntry[];
  careerPurchasesTotal: number;
  rankUpXpSpentTotal: number;
  spentTotal: number;
}

const CHARACTERISTIC_NAMES: Record<keyof Characteristics, string> = {
  ws: "Weapon Skill",
  bs: "Ballistic Skill",
  s: "Strength",
  t: "Toughness",
  ag: "Agility",
  int: "Intelligence",
  per: "Perception",
  wp: "Willpower",
  fel: "Fellowship",
};

const CHARACTERISTIC_TIER_NAMES: Record<CharacteristicAdvanceTier, string> = {
  simple: "Simple Advance",
  intermediate: "Intermediate Advance",
  trained: "Trained Advance",
  expert: "Expert Advance",
};

const SKILL_TIERS = ["trained", "+10", "+20"] as const satisfies readonly Exclude<
  SkillAdvanceLevel,
  "untrained"
>[];

function ownedSkillTierCount(level: SkillAdvanceLevel): number {
  return level === "untrained" ? 0 : SKILL_TIERS.indexOf(level) + 1;
}

function weaponTrainingName(id: WeaponTrainingTalentId): string {
  for (const group of WEAPON_TRAINING_GROUPS) {
    const item = group.items.find((candidate) => candidate.id === id);
    if (item) return `${group.label} (${item.display})`;
  }
  return id;
}

function total(entries: readonly RankCardEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.cost, 0);
}

/**
 * Generate the reached named-rank ledger from the character's persisted
 * purchase attribution. Legacy purchases without attribution are deliberately
 * omitted rather than guessed onto an incorrect Rank Card.
 */
export function buildRankCards(character: Character): RankCard[] {
  const progression = getCareerRankProgression(
    character.header.career,
    character.header.rank,
    character.experience.spent,
    character.header.careerPath
  );
  if (!progression) return [];

  const cards = progression.reachedRanks.map((rank): RankCard => {
    const xpBand = getRankXpBand(rank.tier);
    if (!xpBand) throw new Error(`Missing XP band for Career rank ${rank.id}`);
    return {
      rankId: rank.id,
      name: rank.name,
      tier: rank.tier,
      xpLevel: rank.xpLevel,
      xpBand,
      isCurrent: rank.id === progression.currentRank.id,
      careerPurchases: [],
      rankUpXpSpent: [],
      careerPurchasesTotal: 0,
      rankUpXpSpentTotal: 0,
      spentTotal: 0,
    };
  });
  const cardsByRankId = new Map(cards.map((card) => [card.rankId, card]));

  const addPurchase = (purchase: XpPurchaseRecord | undefined, entry: RankCardEntry) => {
    if (!purchase) return;
    if (purchase.careerId && purchase.careerId !== progression.career.id) return;
    if (purchase.sourceRankId) {
      cardsByRankId.get(purchase.sourceRankId)?.careerPurchases.push(entry);
      return;
    }
    if (purchase.purchasedAtRankId) {
      cardsByRankId.get(purchase.purchasedAtRankId)?.rankUpXpSpent.push(entry);
    }
  };

  for (const [statKey, field] of Object.entries(character.characteristics) as [
    keyof Characteristics,
    Character["characteristics"][keyof Characteristics],
  ][]) {
    for (let index = 0; index < field.advances; index += 1) {
      const tier = CHARACTERISTIC_ADVANCE_TIERS[index];
      if (!tier) continue;
      const purchase = field.advancePurchases?.[tier];
      addPurchase(purchase, {
        id: `characteristic:${statKey}:${tier}`,
        name: `${CHARACTERISTIC_NAMES[statKey]} — ${CHARACTERISTIC_TIER_NAMES[tier]}`,
        cost: purchase?.cost ?? 0,
        kind: "characteristic",
      });
    }
  }

  for (const skill of character.skills) {
    const ownedTierCount = ownedSkillTierCount(skill.level);
    for (let index = 0; index < ownedTierCount; index += 1) {
      const tier = SKILL_TIERS[index];
      const purchase = skill.xpPurchases?.[tier];
      addPurchase(purchase, {
        id: `skill:${skill.id}:${tier}`,
        name: `${skill.name} — ${tier === "trained" ? "Trained" : tier}`,
        cost: purchase?.cost ?? 0,
        kind: "skill",
      });
    }
  }

  for (const [kind, entries] of [
    ["talent", character.talentsAndTraits.talents],
    ["trait", character.talentsAndTraits.traits],
  ] as const) {
    for (const entry of entries) {
      if (entry.grantedByTalentEntryUid) continue;
      addPurchase(entry.xpPurchase, {
        id: `${kind}:${entry.uid}`,
        name: entry.name,
        cost: entry.xpPurchase?.cost ?? 0,
        kind,
      });
    }
  }

  for (const id of character.weaponTraining.trained) {
    const purchase = character.weaponTraining.xpPurchases?.[id];
    addPurchase(purchase, {
      id: `weapon-training:${id}`,
      name: weaponTrainingName(id),
      cost: purchase?.cost ?? 0,
      kind: "weapon-training",
    });
  }

  for (const [index, weapon] of character.weaponTraining.exoticWeapons.entries()) {
    addPurchase(weapon.xpPurchase, {
      id: `weapon-training:exotic:${index}:${weapon.name}`,
      name: `Exotic Weapon Training (${weapon.name})`,
      cost: weapon.xpPurchase?.cost ?? 0,
      kind: "weapon-training",
    });
  }

  for (const transaction of character.experience.transactions ?? []) {
    if (transaction.type !== "spend") continue;
    cardsByRankId.get(transaction.rankId)?.rankUpXpSpent.push({
      id: `xp-transaction:${transaction.id}`,
      name: transaction.reason?.trim() || "DM XP Spend",
      cost: transaction.amount,
      kind: "xp-spend",
    });
  }

  for (const card of cards) {
    card.careerPurchases.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    card.rankUpXpSpent.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    card.careerPurchasesTotal = total(card.careerPurchases);
    card.rankUpXpSpentTotal = total(card.rankUpXpSpent);
    card.spentTotal = card.careerPurchasesTotal + card.rankUpXpSpentTotal;
  }

  return cards;
}
