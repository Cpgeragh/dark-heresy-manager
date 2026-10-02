// functions/src/shared/characterFieldValidation.ts
//
// Server-side validators for individual Character document fields, used by
// patchCharacterField. functions/ cannot import from src/, so these limits
// are deliberately duplicated from src/constants/productLimits.ts and must
// be kept in sync by hand, the same coupling already accepted for the
// Recovery Code format (recoveryCode.ts) and the custom-item copy-mutation
// logic (customItemCopyMutation.ts).

import { HttpsError } from "firebase-functions/v2/https";
import {
  ALTERNATE_RANKS,
  CHARACTERISTIC_ADVANCE_TIERS,
  ELITE_ADVANCES,
  findCareerByName,
  getCharacteristicTierCosts,
  getCurrentCareerRankData,
  getEliteAdvanceGrantedSkillLevel,
  getEliteAdvanceSkillCost,
  getEliteAdvanceWeaponTrainingCost,
  getExoticWeaponTrainingPurchase,
  getMissedRankCareerAdvances,
  getNextTalentOrTraitPurchase,
  getNextSkillTierAccess,
  getValidNextCareerRanks,
  getWeaponTrainingPurchase,
  isPistolOnlyExoticWeaponTraining,
  WEAPON_TRAINING_GROUPS,
  type AlternateRankSelection,
  type CharacteristicKey,
  type WeaponTrainingTalentId,
} from "shared-rules";

const CHARACTER_FIELD_BYTES = 900_000; // matches PRODUCT_LIMITS.characterDocumentBytes
const CHARACTER_FIELD_ARRAY_ENTRIES = 200; // matches PRODUCT_LIMITS.characterArrayEntries
const CHARACTER_FIELD_OBJECT_KEYS = 100; // matches PRODUCT_LIMITS.characterObjectKeys
const CHARACTER_FIELD_NESTING_DEPTH = 8; // matches PRODUCT_LIMITS.characterNestingDepth
const CHARACTER_FIELD_STRING_CHARACTERS = 4_000; // matches PRODUCT_LIMITS.characterFieldCharacters

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Recursively bounds a single field's value the same way the client's
 * assertNestedDataBounds bounds the whole character document: byte size,
 * array length, object key count, nesting depth, and per-string character
 * length. Shared by every field validator in this file, present and future.
 */
export function assertFieldNestedBounds(value: unknown, label: string): void {
  let serialised: string;
  try {
    serialised = JSON.stringify(value);
  } catch {
    throw new HttpsError("invalid-argument", `${label} must be serialisable.`);
  }
  if (serialised === undefined) {
    throw new HttpsError("invalid-argument", `${label} must be serialisable.`);
  }
  if (Buffer.byteLength(serialised, "utf8") > CHARACTER_FIELD_BYTES) {
    throw new HttpsError(
      "invalid-argument",
      `${label} exceeds its ${CHARACTER_FIELD_BYTES}-byte limit.`
    );
  }

  const visit = (entry: unknown, depth: number, path: string): void => {
    if (depth > CHARACTER_FIELD_NESTING_DEPTH) {
      throw new HttpsError(
        "invalid-argument",
        `${label} cannot be nested deeper than ${CHARACTER_FIELD_NESTING_DEPTH} levels.`
      );
    }
    if (entry === null || typeof entry === "boolean") return;
    if (typeof entry === "number") {
      if (!Number.isFinite(entry)) {
        throw new HttpsError("invalid-argument", `${path} must be a finite number.`);
      }
      return;
    }
    if (typeof entry === "string") {
      if (entry.length > CHARACTER_FIELD_STRING_CHARACTERS) {
        throw new HttpsError(
          "invalid-argument",
          `${path} cannot exceed ${CHARACTER_FIELD_STRING_CHARACTERS} characters.`
        );
      }
      return;
    }
    if (Array.isArray(entry)) {
      if (entry.length > CHARACTER_FIELD_ARRAY_ENTRIES) {
        throw new HttpsError(
          "invalid-argument",
          `${path} cannot contain more than ${CHARACTER_FIELD_ARRAY_ENTRIES} entries.`
        );
      }
      entry.forEach((child, index) => visit(child, depth + 1, `${path}[${index}]`));
      return;
    }
    if (isRecord(entry)) {
      const keys = Object.keys(entry);
      if (keys.length > CHARACTER_FIELD_OBJECT_KEYS) {
        throw new HttpsError(
          "invalid-argument",
          `${path} cannot contain more than ${CHARACTER_FIELD_OBJECT_KEYS} fields.`
        );
      }
      for (const [key, child] of Object.entries(entry)) {
        if (child === undefined) {
          throw new HttpsError("invalid-argument", `${path}.${key} cannot be undefined.`);
        }
        visit(child, depth + 1, `${path}.${key}`);
      }
      return;
    }
    throw new HttpsError("invalid-argument", `${path} contains an unsupported value.`);
  };

  visit(value, 0, label);
}

function assertNotesValue(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new HttpsError("invalid-argument", "Notes must be an array.");
  }
  assertFieldNestedBounds(value, "Notes");
}

const HEADER_KEYS = new Set([
  "characterName",
  "playerName",
  "career",
  "rank",
  "careerPath",
  "homeWorld",
  "divination",
  "description",
  "age",
  "gender",
  "skin",
  "hair",
  "eyes",
  "height",
  "weight",
  "quirks",
]);

const CHARACTER_NAME_CHARACTERS = 100; // matches PRODUCT_LIMITS.characterNameCharacters

function assertHeaderValue(value: unknown): void {
  if (!isRecord(value)) {
    throw new HttpsError("invalid-argument", "Character header must be an object.");
  }
  const unknownKey = Object.keys(value).find((key) => !HEADER_KEYS.has(key));
  if (unknownKey) {
    throw new HttpsError(
      "invalid-argument",
      `Character header contains an unexpected field: ${unknownKey}.`
    );
  }
  const { characterName } = value;
  if (typeof characterName !== "string" || characterName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Character name is required.");
  }
  if (characterName.length > CHARACTER_NAME_CHARACTERS) {
    throw new HttpsError(
      "invalid-argument",
      `Character name cannot exceed ${CHARACTER_NAME_CHARACTERS} characters.`
    );
  }
  assertFieldNestedBounds(value, "Character header");
}

const PORTRAIT_ENCODED_BYTES = 350_000; // matches PRODUCT_LIMITS.portraitEncodedBytes
const PORTRAIT_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,/;

function assertPortraitUrlValue(value: unknown): void {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", "Portrait must be text.");
  }
  if (!PORTRAIT_DATA_URL_PATTERN.test(value)) {
    throw new HttpsError("invalid-argument", "Encoded portrait type is invalid.");
  }
  if (new TextEncoder().encode(value).byteLength > PORTRAIT_ENCODED_BYTES) {
    throw new HttpsError(
      "invalid-argument",
      `Portrait cannot exceed ${PORTRAIT_ENCODED_BYTES} encoded bytes.`
    );
  }
}

const CHARACTERISTIC_KEYS = ["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"];
const CHARACTERISTIC_FIELD_KEYS = new Set(["base", "advances", "advancePurchases"]);

function assertCharacteristicsValue(value: unknown): void {
  if (!isRecord(value)) {
    throw new HttpsError("invalid-argument", "Characteristics must be an object.");
  }
  const unknownKey = Object.keys(value).find((key) => !CHARACTERISTIC_KEYS.includes(key));
  if (unknownKey) {
    throw new HttpsError(
      "invalid-argument",
      `Characteristics contains an unexpected field: ${unknownKey}.`
    );
  }
  for (const key of CHARACTERISTIC_KEYS) {
    if (!(key in value)) {
      throw new HttpsError("invalid-argument", `Characteristics is missing "${key}".`);
    }
    const field = (value as Record<string, unknown>)[key];
    if (!isRecord(field)) {
      throw new HttpsError("invalid-argument", `Characteristic "${key}" must be an object.`);
    }
    const unknownFieldKey = Object.keys(field).find((k) => !CHARACTERISTIC_FIELD_KEYS.has(k));
    if (unknownFieldKey) {
      throw new HttpsError(
        "invalid-argument",
        `Characteristic "${key}" contains an unexpected field: ${unknownFieldKey}.`
      );
    }
    if (typeof field.base !== "number" || !Number.isFinite(field.base)) {
      throw new HttpsError(
        "invalid-argument",
        `Characteristic "${key}".base must be a finite number.`
      );
    }
    if (typeof field.advances !== "number" || !Number.isInteger(field.advances)) {
      throw new HttpsError(
        "invalid-argument",
        `Characteristic "${key}".advances must be a whole number.`
      );
    }
  }
  assertFieldNestedBounds(value, "Characteristics");
}

export type CharacterFieldValidator = (value: unknown) => void;

function makeRecordValidator(label: string): CharacterFieldValidator {
  return (value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new HttpsError("invalid-argument", `${label} must be an object.`);
    }
    assertFieldNestedBounds(value, label);
  };
}

function makeArrayValidator(label: string): CharacterFieldValidator {
  return (value) => {
    if (!Array.isArray(value)) {
      throw new HttpsError("invalid-argument", `${label} must be an array.`);
    }
    assertFieldNestedBounds(value, label);
  };
}

const CHARACTER_FIELD_VALIDATORS: Record<string, CharacterFieldValidator> = {
  notes: assertNotesValue,
  header: assertHeaderValue,
  portraitUrl: assertPortraitUrlValue,
  characteristics: assertCharacteristicsValue,
  talentsAndTraits: makeRecordValidator("Talents and traits"),
  weaponTraining: makeRecordValidator("Weapon training"),
  psychic: makeRecordValidator("Psychic"),
  insanity: makeRecordValidator("Insanity"),
  cybernetics: makeArrayValidator("Cybernetics"),
  rangedWeapons: makeArrayValidator("Ranged weapons"),
  meleeWeapons: makeArrayValidator("Melee weapons"),
  archeotech: makeArrayValidator("Archeotech"),
  gear: makeArrayValidator("Gear"),
  consumables: makeArrayValidator("Consumables"),
  drugs: makeArrayValidator("Drugs"),
  grenades: makeArrayValidator("Grenades"),
  shields: makeArrayValidator("Shields"),
  armour: makeArrayValidator("Armour"),
  companions: makeArrayValidator("Companions"),
  skills: makeArrayValidator("Skills"),
  wounds: makeRecordValidator("Wounds"),
  fate: makeRecordValidator("Fate"),
  corruption: makeRecordValidator("Corruption"),
  movement: makeRecordValidator("Movement"),
  experience: makeRecordValidator("Experience"),
};

export function assertValidCharacterFieldValue(field: string, value: unknown): void {
  const validator = CHARACTER_FIELD_VALIDATORS[field];
  if (!validator) {
    throw new HttpsError("invalid-argument", `Field "${field}" cannot be patched this way.`);
  }
  validator(value);
}

/**
 * Unlike CharacterFieldValidator, a transition validator sees the character's
 * current stored data too, since whether a change is legitimate can depend on
 * what it's changing from (the career, what's already been paid for), not just
 * whether the new value is shaped correctly on its own.
 */
export type CharacterFieldTransitionValidator = (
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  isDM: boolean
) => void;

function getCareerFromCharacter(character: Record<string, unknown>): string | undefined {
  const header = character.header;
  if (!isRecord(header)) return undefined;
  const career = header.career;
  return typeof career === "string" ? career : undefined;
}

function getRankFromCharacter(character: Record<string, unknown>): string | undefined {
  const header = character.header;
  if (!isRecord(header)) return undefined;
  const rank = header.rank;
  return typeof rank === "string" ? rank : undefined;
}

function getAlternateRanksFromCharacter(
  character: Record<string, unknown>
): AlternateRankSelection[] {
  const experience = character.experience;
  if (!isRecord(experience) || !Array.isArray(experience.alternateRanks)) return [];
  return experience.alternateRanks.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.alternateRankId !== "string" ||
      typeof entry.replacedRankId !== "string" ||
      typeof entry.takenAtTier !== "number"
    ) {
      return [];
    }
    return [
      {
        alternateRankId: entry.alternateRankId,
        replacedRankId: entry.replacedRankId,
        takenAtTier: entry.takenAtTier,
      },
    ];
  });
}

function getEliteAdvanceIdsFromCharacter(character: Record<string, unknown>): string[] {
  const talentsAndTraits = character.talentsAndTraits;
  if (!isRecord(talentsAndTraits) || !Array.isArray(talentsAndTraits.eliteAdvances)) return [];
  return talentsAndTraits.eliteAdvances.flatMap((entry) =>
    isRecord(entry) && typeof entry.eliteAdvanceId === "string" ? [entry.eliteAdvanceId] : []
  );
}

function getCharFieldAdvances(value: unknown, key: string): number {
  if (!isRecord(value)) return 0;
  const field = value[key];
  if (!isRecord(field)) return 0;
  const advances = field.advances;
  return typeof advances === "number" ? advances : 0;
}

function getCharFieldPurchaseCost(value: unknown, key: string, tier: string): number | undefined {
  if (!isRecord(value)) return undefined;
  const field = value[key];
  if (!isRecord(field)) return undefined;
  const purchases = field.advancePurchases;
  if (!isRecord(purchases)) return undefined;
  const record = purchases[tier];
  if (!isRecord(record)) return undefined;
  const cost = record.cost;
  return typeof cost === "number" ? cost : undefined;
}

/**
 * Rejects a characteristics patch that advances a stat without paying the real,
 * career-derived cost for it, or that advances a stat that's confirmed unbuyable
 * for the character's career. Where the career simply has no cost data
 * transcribed yet, this stays permissive, matching the client's own existing
 * behaviour, rather than enforcing a stricter rule than the app already does.
 * Decreases (refunds/undo) are not checked, only advances can create free XP.
 */
function assertValidCharacteristicsTransition(
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  _isDM: boolean
): void {
  const career = getCareerFromCharacter(character);
  for (const key of CHARACTERISTIC_KEYS) {
    const oldAdvances = getCharFieldAdvances(oldValue, key);
    const newAdvances = getCharFieldAdvances(newValue, key);
    if (newAdvances <= oldAdvances) continue;

    const tierCosts = getCharacteristicTierCosts(career, key as CharacteristicKey);
    for (let index = oldAdvances; index < newAdvances; index += 1) {
      const tier = CHARACTERISTIC_ADVANCE_TIERS[index];
      if (!tier) {
        throw new HttpsError(
          "invalid-argument",
          `Characteristic "${key}" cannot be advanced past ${CHARACTERISTIC_ADVANCE_TIERS.length} tiers.`
        );
      }
      const expectedCost = tierCosts[index];
      if (expectedCost === null) {
        throw new HttpsError(
          "invalid-argument",
          `Characteristic "${key}" cannot be advanced to "${tier}" for this career.`
        );
      }
      if (typeof expectedCost !== "number") {
        continue;
      }
      const recordedCost = getCharFieldPurchaseCost(newValue, key, tier);
      if (recordedCost !== expectedCost) {
        throw new HttpsError(
          "invalid-argument",
          `Characteristic "${key}" tier "${tier}" costs ${expectedCost} XP, not ${recordedCost ?? "nothing"}.`
        );
      }
    }
  }
}

const SKILL_TIERS = ["trained", "+10", "+20"] as const;

function skillTierIndex(level: unknown): number {
  if (level === "untrained" || typeof level !== "string") return -1;
  const index = (SKILL_TIERS as readonly string[]).indexOf(level);
  return index;
}

function findSkillById(value: unknown, id: string): Record<string, unknown> | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.find((entry) => isRecord(entry) && entry.id === id) as
    | Record<string, unknown>
    | undefined;
}

function getSkillPurchaseCost(
  skill: Record<string, unknown> | undefined,
  tier: string
): number | undefined {
  if (!skill) return undefined;
  const purchases = skill.xpPurchases;
  if (!isRecord(purchases)) return undefined;
  const record = purchases[tier];
  if (!isRecord(record)) return undefined;
  const cost = record.cost;
  return typeof cost === "number" ? cost : undefined;
}

function getSkillManualCost(skill: Record<string, unknown>, tier: string): number | undefined {
  const costs = skill.manualCosts;
  if (!isRecord(costs)) return undefined;
  const cost = costs[tier];
  return typeof cost === "number" ? cost : undefined;
}

function getSkillEliteAdvancePurchase(
  skill: Record<string, unknown>,
  tier: string
): Record<string, unknown> | undefined {
  const purchases = skill.eliteAdvancePurchases;
  if (!isRecord(purchases)) return undefined;
  const purchase = purchases[tier];
  return isRecord(purchase) ? purchase : undefined;
}

/**
 * Rejects a skills patch that advances a skill's tier without paying the real
 * cost for it. A skill on the character's own career table must match that
 * table's exact cost. A Skill from the normal Rank replaced by an Alternate Rank
 * uses its original cost plus 50 XP from the following Career tier. A Show all
 * purchase requires GM-approved provenance and DM authority, including when the
 * Skill is otherwise locked. A Skill not on any Career table can also be priced
 * directly by the DM. The DM's chosen cost is trusted rather than re-derived.
 * Decreases and removals are not checked, only advances can create free XP.
 */
function assertValidSkillsTransition(
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  isDM: boolean
): void {
  if (!Array.isArray(newValue)) return;
  const career = getCareerFromCharacter(character);
  const rank = getRankFromCharacter(character);
  const alternateRanks = getAlternateRanksFromCharacter(character);
  const eliteAdvanceIds = getEliteAdvanceIdsFromCharacter(character);

  for (const entry of newValue) {
    if (!isRecord(entry) || typeof entry.id !== "string") continue;
    const id = entry.id;
    const oldSkill = findSkillById(oldValue, id);
    const grantedLevel = getEliteAdvanceGrantedSkillLevel(eliteAdvanceIds, id);
    const oldIndex = oldSkill
      ? skillTierIndex(oldSkill.level)
      : skillTierIndex(grantedLevel ?? "untrained");
    const newIndex = skillTierIndex(entry.level);
    if (newIndex <= oldIndex) continue;

    let currentLevel: string = oldSkill
      ? (oldSkill.level as string)
      : (grantedLevel ?? "untrained");
    for (let index = oldIndex + 1; index <= newIndex; index += 1) {
      const tier = SKILL_TIERS[index];
      if (!tier) {
        throw new HttpsError(
          "invalid-argument",
          `Skill "${id}" cannot be advanced past ${SKILL_TIERS.length} tiers.`
        );
      }
      const access = getNextSkillTierAccess(
        career,
        rank,
        id,
        currentLevel as never,
        alternateRanks
      );
      const eliteAdvanceCost = getEliteAdvanceSkillCost(
        eliteAdvanceIds,
        id,
        tier as "trained" | "+10" | "+20"
      );
      const recordedCost = getSkillPurchaseCost(entry, tier);
      const eliteAdvancePurchase = getSkillEliteAdvancePurchase(entry, tier);
      if (eliteAdvancePurchase?.source === "gm-approved") {
        const approvedCost = eliteAdvancePurchase.cost;
        const manualCost = getSkillManualCost(entry, tier);
        if (
          !isDM ||
          typeof approvedCost !== "number" ||
          approvedCost !== recordedCost ||
          manualCost !== recordedCost
        ) {
          throw new HttpsError(
            "invalid-argument",
            `Skill "${id}" tier "${tier}" needs matching DM-approved costs.`
          );
        }
        currentLevel = tier;
        continue;
      }
      if (eliteAdvancePurchase?.source === "missed-rank") {
        const missedRankPurchase = getMissedRankCareerAdvances(career, rank, alternateRanks).find(
          (option) =>
            option.alternateRankId === eliteAdvancePurchase.alternateRankId &&
            option.replacedRankId === eliteAdvancePurchase.replacedRankId &&
            option.advance.kind === "skill" &&
            option.advance.skillId === id &&
            (option.advance.level ?? "trained") === tier
        );
        if (
          !missedRankPurchase ||
          eliteAdvancePurchase.cost !== missedRankPurchase.purchaseCost ||
          recordedCost !== missedRankPurchase.purchaseCost
        ) {
          throw new HttpsError(
            "invalid-argument",
            `Skill "${id}" tier "${tier}" is not a valid missed-rank purchase.`
          );
        }
        currentLevel = tier;
        continue;
      }
      if (typeof eliteAdvanceCost === "number" && recordedCost === eliteAdvanceCost) {
        currentLevel = tier;
        continue;
      }
      if (access.status === "maxed" || access.status === "locked") {
        throw new HttpsError("invalid-argument", `Skill "${id}" cannot be advanced right now.`);
      }
      if (access.status === "unlocked") {
        if (recordedCost !== access.cost) {
          throw new HttpsError(
            "invalid-argument",
            `Skill "${id}" tier "${tier}" costs ${access.cost} XP, not ${recordedCost ?? "nothing"}.`
          );
        }
      } else {
        // "not-on-career": only the DM may price a skill with no career-table cost.
        if (!isDM) {
          throw new HttpsError(
            "invalid-argument",
            `Skill "${id}" isn't on this career's table and can only be priced by the DM.`
          );
        }
        if (typeof recordedCost !== "number") {
          throw new HttpsError(
            "invalid-argument",
            `Skill "${id}" tier "${tier}" needs a DM-set cost recorded.`
          );
        }
      }
      currentLevel = tier;
    }
  }
}

function normaliseTalentSpecialisation(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("en-GB") : "";
}

function sameTalentOrTrait(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  return (
    left.talentId === right.talentId &&
    normaliseTalentSpecialisation(left.specialisation) ===
      normaliseTalentSpecialisation(right.specialisation)
  );
}

function getTalentOrTraitPurchaseCost(entry: Record<string, unknown>): number | undefined {
  if (!isRecord(entry.xpPurchase)) return undefined;
  return typeof entry.xpPurchase.cost === "number" ? entry.xpPurchase.cost : undefined;
}

function getTalentOrTraitElitePurchase(
  entry: Record<string, unknown>
): Record<string, unknown> | undefined {
  return isRecord(entry.eliteAdvancePurchase) ? entry.eliteAdvancePurchase : undefined;
}

function isCustomTraitEntry(entry: Record<string, unknown>): boolean {
  return (
    typeof entry.customLibraryId === "string" &&
    typeof entry.customLibraryVersionId === "string" &&
    entry.talentId === `custom-trait:${entry.customLibraryId}` &&
    entry.manualCost === undefined &&
    entry.xpPurchase === undefined &&
    entry.eliteAdvancePurchase === undefined
  );
}

function isPurityReplacement(
  entry: Record<string, unknown>,
  acceptedTalents: readonly Record<string, unknown>[]
): boolean {
  if (entry.talentId !== "reformed-skin" || !isRecord(entry.acquisition)) return false;
  const parentUid = entry.acquisition.purityTalentEntryUid;
  return (
    entry.acquisition.reformedSkinPurityReplacement === true &&
    typeof parentUid === "string" &&
    acceptedTalents.some(
      (talent) => talent.uid === parentUid && talent.talentId === "purity-of-flesh"
    )
  );
}

function assertValidEliteAdvanceEntries(
  oldEntries: unknown,
  newEntries: unknown,
  character: Record<string, unknown>,
  isDM: boolean
): void {
  if (!Array.isArray(newEntries)) {
    throw new HttpsError("invalid-argument", "Elite Advances must be an array.");
  }
  const previous = Array.isArray(oldEntries) ? oldEntries : [];
  const previousIds = new Set(
    previous.flatMap((entry) =>
      isRecord(entry) && typeof entry.eliteAdvanceId === "string" ? [entry.eliteAdvanceId] : []
    )
  );
  const selectedAlternateRankIds = new Set(
    getAlternateRanksFromCharacter(character).map((selection) => selection.alternateRankId)
  );
  const seenUids = new Set<string>();
  const seenIds = new Set(previousIds);

  for (const entry of newEntries) {
    if (
      !isRecord(entry) ||
      typeof entry.uid !== "string" ||
      typeof entry.eliteAdvanceId !== "string"
    ) {
      throw new HttpsError("invalid-argument", "Elite Advances must have an id and unique id.");
    }
    if (seenUids.has(entry.uid)) {
      throw new HttpsError("invalid-argument", "Elite Advances cannot reuse a unique id.");
    }
    seenUids.add(entry.uid);
    if (
      previous.some(
        (oldEntry) =>
          isRecord(oldEntry) &&
          oldEntry.uid === entry.uid &&
          oldEntry.eliteAdvanceId === entry.eliteAdvanceId
      )
    ) {
      continue;
    }

    const reference = ELITE_ADVANCES.find((advance) => advance.id === entry.eliteAdvanceId);
    if (!reference || seenIds.has(entry.eliteAdvanceId)) {
      throw new HttpsError("invalid-argument", "Elite Advance purchase is not available.");
    }
    seenIds.add(entry.eliteAdvanceId);

    if (typeof entry.grantedByAlternateRankId === "string") {
      const alternateRank = ALTERNATE_RANKS.find(
        (rank) => rank.id === entry.grantedByAlternateRankId
      );
      if (
        !reference.automaticGrantOnly ||
        !selectedAlternateRankIds.has(entry.grantedByAlternateRankId) ||
        !alternateRank?.grantedEliteAdvances?.includes(entry.eliteAdvanceId) ||
        entry.xpPurchase !== undefined
      ) {
        throw new HttpsError("invalid-argument", "Elite Advance grant is not valid.");
      }
      continue;
    }

    if (reference.automaticGrantOnly) {
      throw new HttpsError("invalid-argument", "This Elite Advance can only be granted.");
    }
    const restrictedToAlternateRank = (reference.alternateRankIds?.length ?? 0) > 0;
    const unlockedByAlternateRank = (reference.alternateRankIds ?? []).some((id) =>
      selectedAlternateRankIds.has(id)
    );
    if (restrictedToAlternateRank && !unlockedByAlternateRank && !isDM) {
      throw new HttpsError("invalid-argument", "Elite Advance is not available to this character.");
    }
    const recordedCost = getTalentOrTraitPurchaseCost(entry);
    if (recordedCost !== reference.cost) {
      throw new HttpsError(
        "invalid-argument",
        `Elite Advance "${entry.eliteAdvanceId}" costs ${reference.cost} XP, not ${recordedCost ?? "nothing"}.`
      );
    }
  }
}

function assertValidTalentOrTraitAdditions(
  kind: "Talent" | "Trait",
  oldEntries: unknown,
  newEntries: unknown,
  character: Record<string, unknown>,
  isDM: boolean,
  acceptedTalents: Record<string, unknown>[]
): void {
  if (!Array.isArray(newEntries)) {
    throw new HttpsError("invalid-argument", `${kind}s must be an array.`);
  }
  const previous = Array.isArray(oldEntries)
    ? oldEntries.filter(isRecord)
    : ([] as Record<string, unknown>[]);
  const seenUids = new Set<string>();
  const retained = newEntries.filter((entry): entry is Record<string, unknown> => {
    if (!isRecord(entry) || typeof entry.uid !== "string" || typeof entry.talentId !== "string") {
      throw new HttpsError("invalid-argument", `${kind}s must have an id and unique id.`);
    }
    if (seenUids.has(entry.uid)) {
      throw new HttpsError("invalid-argument", `${kind}s cannot reuse a unique id.`);
    }
    seenUids.add(entry.uid);
    return previous.some(
      (oldEntry) => oldEntry.uid === entry.uid && sameTalentOrTrait(oldEntry, entry)
    );
  });
  const countedEntries = [...retained];
  const career = getCareerFromCharacter(character);
  const rank = getRankFromCharacter(character);
  const alternateRanks = getAlternateRanksFromCharacter(character);
  const eliteAdvanceIds = getEliteAdvanceIdsFromCharacter(character);

  for (const entry of newEntries) {
    if (!isRecord(entry) || retained.includes(entry)) continue;
    const id = entry.talentId as string;
    const specialisation =
      typeof entry.specialisation === "string" ? entry.specialisation : undefined;
    const recordedCost = getTalentOrTraitPurchaseCost(entry);
    const elitePurchase = getTalentOrTraitElitePurchase(entry);

    if (kind === "Trait" && isCustomTraitEntry(entry)) {
      countedEntries.push(entry);
      continue;
    }
    if (kind === "Talent" && isPurityReplacement(entry, acceptedTalents)) {
      countedEntries.push(entry);
      acceptedTalents.push(entry);
      continue;
    }

    if (entry.manualCost !== undefined) {
      const approvedCost = typeof entry.manualCost === "number" ? entry.manualCost : undefined;
      const provenanceCost = elitePurchase?.cost;
      const provenanceSource = elitePurchase?.source;
      if (
        !isDM ||
        approvedCost === undefined ||
        !Number.isFinite(approvedCost) ||
        approvedCost < 0 ||
        approvedCost !== recordedCost ||
        (elitePurchase !== undefined &&
          (!["gm-approved", "faith-talent"].includes(String(provenanceSource)) ||
            provenanceCost !== recordedCost))
      ) {
        throw new HttpsError(
          "invalid-argument",
          `${kind} "${id}" needs matching DM-approved costs.`
        );
      }
      countedEntries.push(entry);
      if (kind === "Talent") acceptedTalents.push(entry);
      continue;
    }

    if (elitePurchase?.source === "missed-rank") {
      const options = getMissedRankCareerAdvances(career, rank, alternateRanks).filter(
        (option) =>
          option.alternateRankId === elitePurchase.alternateRankId &&
          option.replacedRankId === elitePurchase.replacedRankId &&
          (option.advance.kind === "talent" || option.advance.kind === "trait") &&
          (option.advance.talentId === id || option.advance.traitId === id) &&
          normaliseTalentSpecialisation(option.advance.specialisation) ===
            normaliseTalentSpecialisation(specialisation) &&
          option.purchaseCost === recordedCost
      );
      const availableCopies = options.reduce(
        (total, option) => total + (option.advance.repeatableAtThisRank ?? 1),
        0
      );
      const ownedCopies = countedEntries.filter((owned) => sameTalentOrTrait(owned, entry)).length;
      if (
        options.length === 0 ||
        elitePurchase.cost !== recordedCost ||
        ownedCopies >= availableCopies
      ) {
        throw new HttpsError(
          "invalid-argument",
          `${kind} "${id}" is not a valid missed-rank purchase.`
        );
      }
      countedEntries.push(entry);
      if (kind === "Talent") acceptedTalents.push(entry);
      continue;
    }

    if (elitePurchase?.source === "elite-package") {
      const packageReference = ELITE_ADVANCES.find(
        (advance) =>
          advance.id === elitePurchase.eliteAdvanceId && eliteAdvanceIds.includes(advance.id)
      );
      const option = packageReference?.unlockedAdvances?.find(
        (advance) =>
          advance.kind === "talent" &&
          advance.talentId === id &&
          normaliseTalentSpecialisation(advance.specialisation) ===
            normaliseTalentSpecialisation(specialisation) &&
          advance.cost === recordedCost
      );
      const alreadyOwned = countedEntries.some((owned) => sameTalentOrTrait(owned, entry));
      if (!option || alreadyOwned || elitePurchase.cost !== recordedCost) {
        throw new HttpsError(
          "invalid-argument",
          `${kind} "${id}" is not unlocked by that Elite Advance package.`
        );
      }
      countedEntries.push(entry);
      if (kind === "Talent") acceptedTalents.push(entry);
      continue;
    }

    if (elitePurchase !== undefined) {
      throw new HttpsError("invalid-argument", `${kind} "${id}" has invalid purchase provenance.`);
    }

    const purchase = getNextTalentOrTraitPurchase(
      career,
      rank,
      id,
      specialisation,
      countedEntries.map((owned) => ({
        talentId: owned.talentId as string,
        ...(typeof owned.specialisation === "string"
          ? { specialisation: owned.specialisation }
          : {}),
      })),
      alternateRanks
    );
    if (!purchase || recordedCost !== purchase.cost) {
      throw new HttpsError(
        "invalid-argument",
        purchase
          ? `${kind} "${id}" costs ${purchase.cost} XP, not ${recordedCost ?? "nothing"}.`
          : `${kind} "${id}" is not available on this character's Career table.`
      );
    }
    countedEntries.push(entry);
    if (kind === "Talent") acceptedTalents.push(entry);
  }
}

/**
 * Rejects new Talent, Trait, and Elite Advance entries unless their exact
 * Career, missed-rank, package, grant, or DM-priced route can be verified.
 * Existing entries and removals remain untouched so historical characters can
 * still be edited without revalidating past purchases.
 */
function assertValidTalentsAndTraitsTransition(
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  isDM: boolean
): void {
  if (!isRecord(newValue)) return;
  const oldBlock = isRecord(oldValue) ? oldValue : {};
  assertValidEliteAdvanceEntries(
    oldBlock.eliteAdvances,
    newValue.eliteAdvances ?? [],
    character,
    isDM
  );
  const acceptedTalents: Record<string, unknown>[] = [];
  assertValidTalentOrTraitAdditions(
    "Talent",
    oldBlock.talents,
    newValue.talents,
    character,
    isDM,
    acceptedTalents
  );
  assertValidTalentOrTraitAdditions(
    "Trait",
    oldBlock.traits,
    newValue.traits,
    character,
    isDM,
    acceptedTalents
  );
}

const WEAPON_TRAINING_IDS: ReadonlySet<string> = new Set(
  WEAPON_TRAINING_GROUPS.flatMap((group) => group.items.map((item) => item.id))
);

function getWeaponTrainingRecordedCost(
  block: Record<string, unknown>,
  id: string
): number | undefined {
  const purchases = block.xpPurchases;
  if (!isRecord(purchases)) return undefined;
  const record = purchases[id];
  if (!isRecord(record)) return undefined;
  const cost = record.cost;
  return typeof cost === "number" ? cost : undefined;
}

/**
 * Identifies an exotic weapon entry by the fields that matter for cost, not by the whole
 * entry, since Firestore stores map keys in a different order from the browser.
 */
function exoticWeaponKey(entry: unknown): string | undefined {
  if (!isRecord(entry)) return undefined;
  const purchase = isRecord(entry.xpPurchase) ? entry.xpPurchase : undefined;
  return [
    entry.name,
    entry.cost,
    purchase?.cost,
    purchase?.careerId,
    purchase?.sourceRankId,
    purchase?.purchasedAtRankId,
    entry.bonus === true,
  ]
    .map(String)
    .join("|");
}

/**
 * Rejects a weapon training patch that adds a fixed weapon group without paying the real
 * cost for it. A group unlocked on the character's own career table must be recorded at
 * exactly that table's cost. Any other group can only be priced by the DM (the client's own
 * UI already restricts this), and the DM's chosen cost is trusted since there is no table to
 * check it against, but a cost record must still exist. Exotic specialisations unlocked on
 * Career tables use their exact printed cost and source rank. Only the DM can add an off-Career
 * specialisation, which is stored as bonus training. Removals are not checked.
 */
function assertValidWeaponTrainingTransition(
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  isDM: boolean
): void {
  if (!isRecord(newValue)) return;
  if (!Array.isArray(newValue.trained)) {
    throw new HttpsError("invalid-argument", "Weapon training must include its trained list.");
  }
  if (!Array.isArray(newValue.exoticWeapons)) {
    throw new HttpsError(
      "invalid-argument",
      "Weapon training must include its exotic weapons list."
    );
  }
  const career = getCareerFromCharacter(character);
  const rank = getRankFromCharacter(character);
  const alternateRanks = getAlternateRanksFromCharacter(character);
  const eliteAdvanceIds = getEliteAdvanceIdsFromCharacter(character);
  const hasKnaveOfPistols = alternateRanks.some(
    (selection) => selection.alternateRankId === "metallican-gunslinger"
  );
  const previouslyTrained =
    isRecord(oldValue) && Array.isArray(oldValue.trained) ? oldValue.trained : [];

  for (const id of newValue.trained) {
    if (previouslyTrained.includes(id)) continue;
    if (typeof id !== "string" || !WEAPON_TRAINING_IDS.has(id)) {
      throw new HttpsError("invalid-argument", "Weapon training contains an unknown group.");
    }
    if (hasKnaveOfPistols && (id.startsWith("basic-") || id.startsWith("heavy-"))) {
      throw new HttpsError(
        "invalid-argument",
        "Knave of Pistols prevents acquiring new Basic or Heavy Weapon Training."
      );
    }
    const purchase = getWeaponTrainingPurchase(
      career,
      rank,
      id as WeaponTrainingTalentId,
      alternateRanks
    );
    const eliteAdvanceCost = getEliteAdvanceWeaponTrainingCost(
      eliteAdvanceIds,
      id as WeaponTrainingTalentId
    );
    const recordedCost = getWeaponTrainingRecordedCost(newValue, id);
    if (typeof eliteAdvanceCost === "number" && recordedCost === eliteAdvanceCost) {
      continue;
    }
    if (purchase) {
      if (recordedCost !== purchase.cost) {
        throw new HttpsError(
          "invalid-argument",
          `Weapon training "${id}" costs ${purchase.cost} XP, not ${recordedCost ?? "nothing"}.`
        );
      }
    } else {
      if (!isDM) {
        throw new HttpsError(
          "invalid-argument",
          `Weapon training "${id}" isn't unlocked on this career's table and can only be priced by the DM.`
        );
      }
      if (typeof recordedCost !== "number") {
        throw new HttpsError(
          "invalid-argument",
          `Weapon training "${id}" needs a DM-set cost recorded.`
        );
      }
    }
  }

  const unmatched = new Map<string, number>();
  const previousExotics =
    isRecord(oldValue) && Array.isArray(oldValue.exoticWeapons) ? oldValue.exoticWeapons : [];
  for (const entry of previousExotics) {
    const key = exoticWeaponKey(entry);
    if (key) unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
  }
  for (const entry of newValue.exoticWeapons) {
    const key = exoticWeaponKey(entry);
    const available = key ? (unmatched.get(key) ?? 0) : 0;
    if (key && available > 0) {
      unmatched.set(key, available - 1);
      continue;
    }
    if (
      !isRecord(entry) ||
      typeof entry.name !== "string" ||
      entry.name.trim() === "" ||
      typeof entry.cost !== "number" ||
      !Number.isFinite(entry.cost) ||
      entry.cost < 0
    ) {
      throw new HttpsError("invalid-argument", "Exotic Weapon Training needs a name and XP cost.");
    }
    if (hasKnaveOfPistols && !isPistolOnlyExoticWeaponTraining(entry.name)) {
      throw new HttpsError(
        "invalid-argument",
        "Knave of Pistols only permits Exotic Weapon Training for pistols."
      );
    }
    const recordedPurchase = isRecord(entry.xpPurchase) ? entry.xpPurchase : undefined;
    const recordedCost = recordedPurchase?.cost;
    if (recordedCost !== entry.cost) {
      throw new HttpsError(
        "invalid-argument",
        `Exotic Weapon Training (${entry.name}) must record its ${entry.cost} XP cost.`
      );
    }

    if (entry.bonus === true) {
      if (!isDM) {
        throw new HttpsError(
          "invalid-argument",
          "Only the DM can add bonus Exotic Weapon Training."
        );
      }
      continue;
    }

    const purchase = getExoticWeaponTrainingPurchase(career, rank, entry.name, alternateRanks);
    if (!purchase) {
      throw new HttpsError(
        "invalid-argument",
        `Exotic Weapon Training (${entry.name}) isn't unlocked on this career's table.`
      );
    }
    if (
      entry.cost !== purchase.cost ||
      recordedPurchase?.careerId !== purchase.careerId ||
      recordedPurchase?.sourceRankId !== purchase.sourceRankId ||
      recordedPurchase?.purchasedAtRankId !== undefined
    ) {
      throw new HttpsError(
        "invalid-argument",
        `Exotic Weapon Training (${entry.name}) costs ${purchase.cost} XP from its source rank.`
      );
    }
  }
}

function sameAlternateRank(a: unknown, b: unknown): boolean {
  return (
    isRecord(a) &&
    isRecord(b) &&
    a.alternateRankId === b.alternateRankId &&
    a.replacedRankId === b.replacedRankId &&
    a.takenAtTier === b.takenAtTier
  );
}

/**
 * Rejects an experience patch that adds an alternate rank selection a player could not have
 * made in the app: the career must match, a character-creation Advance Scheme must replace
 * the character's current Rank 1 table, and any later Alternate Rank must replace one of the
 * character's valid next ranks. The replacement must be at or above the Alternate Rank's
 * minimum. The DM may set any. Selections already on the character and removals are not
 * checked. XP, characteristic and story requirements are not checked, matching the app.
 */
function assertValidExperienceTransition(
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  isDM: boolean
): void {
  if (isDM || !isRecord(newValue) || newValue.alternateRanks === undefined) return;
  if (!Array.isArray(newValue.alternateRanks)) {
    throw new HttpsError("invalid-argument", "Alternate ranks must be a list.");
  }
  const previous =
    isRecord(oldValue) && Array.isArray(oldValue.alternateRanks) ? oldValue.alternateRanks : [];
  const careerName = getCareerFromCharacter(character);
  const career = findCareerByName(careerName);
  const currentRank = getCurrentCareerRankData(careerName, getRankFromCharacter(character));
  const header = character.header;
  const storedPath =
    isRecord(header) && typeof header.careerPath === "string" ? header.careerPath : undefined;
  const validNextRanks =
    career && currentRank ? getValidNextCareerRanks(career, currentRank, storedPath) : [];
  const selectedIds = new Set<string>();

  for (const selection of newValue.alternateRanks) {
    if (
      !isRecord(selection) ||
      typeof selection.alternateRankId !== "string" ||
      typeof selection.replacedRankId !== "string" ||
      typeof selection.takenAtTier !== "number"
    ) {
      throw new HttpsError("invalid-argument", "Alternate ranks contain a malformed entry.");
    }
    if (selectedIds.has(selection.alternateRankId)) {
      throw new HttpsError("invalid-argument", "An alternate rank can only be selected once.");
    }
    selectedIds.add(selection.alternateRankId);
    if (previous.some((entry) => sameAlternateRank(entry, selection))) continue;

    const alternateRank = ALTERNATE_RANKS.find((entry) => entry.id === selection.alternateRankId);
    if (!alternateRank) {
      throw new HttpsError("invalid-argument", "That alternate rank does not exist.");
    }
    if (!career || !alternateRank.requiredCareerIds.includes(career.id)) {
      throw new HttpsError("invalid-argument", `${alternateRank.name} is not open to this career.`);
    }
    const isCharacterCreationScheme =
      alternateRank.availableAtCharacterCreation === true &&
      selection.takenAtTier === 1 &&
      currentRank?.tier === 1 &&
      currentRank.id === selection.replacedRankId;
    if (isCharacterCreationScheme) continue;
    const replacedRank = validNextRanks.find((rank) => rank.id === selection.replacedRankId);
    if (!replacedRank || replacedRank.tier !== selection.takenAtTier) {
      throw new HttpsError(
        "invalid-argument",
        `${alternateRank.name} can only be taken when ranking up to a valid next rank.`
      );
    }
    if (replacedRank.tier < alternateRank.minimumRank) {
      throw new HttpsError(
        "invalid-argument",
        `${alternateRank.name} is not available until rank ${alternateRank.minimumRank}.`
      );
    }
  }
}

const CHARACTER_FIELD_TRANSITION_VALIDATORS: Partial<
  Record<string, CharacterFieldTransitionValidator>
> = {
  characteristics: assertValidCharacteristicsTransition,
  skills: assertValidSkillsTransition,
  talentsAndTraits: assertValidTalentsAndTraitsTransition,
  weaponTraining: assertValidWeaponTrainingTransition,
  experience: assertValidExperienceTransition,
};

/** A no-op for any field without a registered transition validator, deliberately
 * permissive: most fields don't have one yet, and that's not itself an error. */
export function assertValidCharacterFieldTransition(
  field: string,
  oldValue: unknown,
  newValue: unknown,
  character: Record<string, unknown>,
  isDM: boolean
): void {
  const validator = CHARACTER_FIELD_TRANSITION_VALIDATORS[field];
  if (!validator) return;
  validator(oldValue, newValue, character, isDM);
}
