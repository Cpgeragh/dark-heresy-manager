import { CYBERNETICS_REFERENCE } from "../../data/reference/cyberneticsReference";
import { defaultCraftsmanship } from "../../pages/CharacterSheet/CyberneticsTab/cyberneticsHelpers";
import {
  isIntegratedMeleeWeapon,
  isIntegratedRangedWeapon,
} from "../../pages/CharacterSheet/weapons/weaponHelpers";
import type {
  ArcheotechItem,
  ArmourLocationKey,
  CyberneticItem,
  HomeworldTraitChoices,
  InsanityBlock,
  MeleeWeapon,
  RangedWeapon,
  TalentEntry,
  TalentsAndTraitsBlock,
  WeaponTrainingTalentId,
} from "../../types/Character";
import {
  getPurityFatePoints,
  getPurityRemovalInventory,
  isPurityArcheotech,
} from "./purityOfFlesh";
import { getPsyRatingAcquisitionGrants } from "./talentUtils";

export interface TalentAcquisitionResult {
  entry: TalentEntry;
  cybernetics?: CyberneticItem[];
  rangedWeapons?: RangedWeapon[];
  meleeWeapons?: MeleeWeapon[];
  archeotech?: ArcheotechItem[];
  insanity?: InsanityBlock;
  additionalTalentEntries?: TalentEntry[];
}

export interface TalentAcquisitionChoices {
  primaryChoice: string;
  secondaryChoice: string;
  toughnessLoss: number;
  replacement: string;
  concealedWeaponChoice: string;
  removedDisorderIds: string[];
  replacementDisorders: Record<string, string>;
  fatalRemovalKeys: string[];
  fatalReplacements: Record<string, string>;
  homeworldTraitChoices?: HomeworldTraitChoices;
}

interface BuildTalentAcquisitionResultArgs {
  entry: TalentEntry;
  talents: TalentsAndTraitsBlock;
  cybernetics: CyberneticItem[];
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  archeotech: ArcheotechItem[];
  insanity: InsanityBlock;
  willpowerBonus: number;
  choices: TalentAcquisitionChoices;
  createId: () => string;
}

const HERETEK_TALENTS = [
  ["autosanguine", "Autosanguine"],
  ["logis-implant", "Logis Implant"],
  ["orthoproxy", "Orthoproxy"],
  ["technical-knock", "Technical Knock"],
] as const;

export function buildTalentAcquisitionResult({
  entry,
  talents,
  cybernetics,
  rangedWeapons,
  meleeWeapons,
  archeotech,
  insanity,
  willpowerBonus,
  choices,
  createId,
}: BuildTalentAcquisitionResultArgs): TalentAcquisitionResult {
  const {
    primaryChoice,
    secondaryChoice,
    toughnessLoss,
    replacement,
    concealedWeaponChoice,
    removedDisorderIds,
    replacementDisorders,
    fatalRemovalKeys,
    fatalReplacements,
    homeworldTraitChoices,
  } = choices;
  const selectedCybernetic = CYBERNETICS_REFERENCE.find((item) => item.id === primaryChoice);
  const selectingConcealedWeapon = selectedCybernetic?.id === "ih-concealed-weapon-bionic";
  const disorders = Array.isArray(insanity.disorders) ? insanity.disorders : [];
  const purityEntries = talents.talents.filter(
    (owned) =>
      owned.talentId === "purity-of-flesh" && (owned.acquisition?.purity?.fatePointsGained ?? 0) > 0
  );
  const purityEntry = purityEntries[0];
  const psyRating = /^psy-rating-[3-6]$/.test(entry.talentId)
    ? Number(entry.talentId.slice(-1))
    : 0;
  const psyRatingGrant = getPsyRatingAcquisitionGrants(
    psyRating,
    willpowerBonus,
    secondaryChoice === "new" ? "new" : "known"
  );
  const psyRatingMinorGrants = secondaryChoice || psyRating === 3 ? psyRatingGrant.minor : 0;
  const psyRatingMajorGrants = secondaryChoice || psyRating === 3 ? psyRatingGrant.major : 0;
  const purityInventory = getPurityRemovalInventory(
    cybernetics,
    rangedWeapons,
    meleeWeapons,
    archeotech
  );
  const qualifyingBionics = purityInventory.filter((item) => item.qualifiesForFate).length;
  const purityFatePoints = getPurityFatePoints(purityInventory);
  const fatalRemovalItems = purityInventory.filter((item) => fatalRemovalKeys.includes(item.key));
  const hasFatalRemovals = fatalRemovalItems.length > 0;

  let completedEntry = entry;
  let nextCybernetics: CyberneticItem[] | undefined;
  let nextRangedWeapons: RangedWeapon[] | undefined;
  let nextMeleeWeapons: MeleeWeapon[] | undefined;
  let nextArcheotech: ArcheotechItem[] | undefined;
  let nextInsanity: InsanityBlock | undefined;
  const additionalTalentEntries: TalentEntry[] = [];

  if (entry.talentId === "cult-briefing") {
    if (entry.specialisation === "Heretek" && selectedCybernetic) {
      const granted = HERETEK_TALENTS.find(([id]) => id === secondaryChoice);
      const bodyLocation =
        selectedCybernetic.requiresLocation && replacement
          ? [replacement as ArmourLocationKey]
          : undefined;
      const craftsmanship = defaultCraftsmanship(selectedCybernetic);
      const cyberneticId = createId();
      const [concealedWeaponType, concealedWeaponId] = concealedWeaponChoice.split(":") as [
        "ranged" | "melee",
        string,
      ];
      const augmetic: CyberneticItem = {
        id: cyberneticId,
        referenceId: selectedCybernetic.id,
        name: selectedCybernetic.name,
        craftsmanship,
        value: selectedCybernetic.value,
        availability: selectedCybernetic.availability,
        source: selectedCybernetic.source,
        grantedByTalentEntryUid: entry.uid,
        grantedByTalentName: entry.name,
        grantedByType: "Talent",
        ...(bodyLocation ? { bodyLocation } : {}),
        ...(selectingConcealedWeapon
          ? {
              concealedWeapon: {
                armId: replacement,
                weaponId: concealedWeaponId,
                weaponType: concealedWeaponType,
              },
            }
          : {}),
      };
      nextCybernetics = [...cybernetics, augmetic];
      if (selectingConcealedWeapon && concealedWeaponType === "ranged") {
        nextRangedWeapons = rangedWeapons.map((weapon) =>
          weapon.id === concealedWeaponId
            ? { ...weapon, concealedBionic: { cyberneticId, craftsmanship } }
            : weapon
        );
      }
      if (selectingConcealedWeapon && concealedWeaponType === "melee") {
        nextMeleeWeapons = meleeWeapons.map((weapon) =>
          weapon.id === concealedWeaponId
            ? { ...weapon, concealedBionic: { cyberneticId, craftsmanship } }
            : weapon
        );
      }
      completedEntry = {
        ...entry,
        acquisition: {
          grantedTalentId: granted?.[0],
          grantedTalentName: granted?.[1],
          augmeticName: selectedCybernetic.name,
          augmeticReferenceId: selectedCybernetic.id,
        },
      };
    } else if (entry.specialisation === "Pleasure") {
      const reference = primaryChoice === "chem-geld" ? "Chem Geld" : "Decadence";
      completedEntry = {
        ...entry,
        acquisition: { grantedTalentId: primaryChoice, grantedTalentName: reference },
      };
    } else if (entry.specialisation === "Blood") {
      completedEntry = {
        ...entry,
        acquisition: { weaponTrainingId: primaryChoice as WeaponTrainingTalentId },
      };
    } else if (entry.specialisation === "Culture") {
      completedEntry = {
        ...entry,
        acquisition: {
          homeworldId: primaryChoice,
          ...(homeworldTraitChoices ? { homeworldTraitChoices } : {}),
        },
      };
    }
  } else if (entry.talentId === "sicarius-tutoring") {
    completedEntry =
      entry.specialisation === "Guardsman"
        ? { ...entry, acquisition: { exoticWeapon: primaryChoice.trim() } }
        : {
            ...entry,
            acquisition: {
              grantedTalentId: "peer",
              grantedTalentName: "Peer",
              grantedTalentSpecialisation: primaryChoice,
            },
          };
  } else if (entry.talentId === "touched-by-the-fates") {
    completedEntry = {
      ...entry,
      acquisition: { touchedByFatesPoints: Math.ceil(willpowerBonus / 2) },
    };
  } else if (entry.talentId === "purity-of-flesh") {
    const removedCyberneticIds = new Set(cybernetics.map((item) => item.id));
    const removedIntegratedRangedWeapons = rangedWeapons.filter(isIntegratedRangedWeapon);
    const removedIntegratedMeleeWeapons = meleeWeapons.filter(isIntegratedMeleeWeapon);
    const removedArcheotech = archeotech.filter(isPurityArcheotech);
    const removedConcealedWeaponLinks = [
      ...rangedWeapons.flatMap((weapon) =>
        weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
          ? [
              {
                weaponId: weapon.id,
                weaponType: "ranged" as const,
                ...weapon.concealedBionic,
              },
            ]
          : []
      ),
      ...meleeWeapons.flatMap((weapon) =>
        weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
          ? [
              {
                weaponId: weapon.id,
                weaponType: "melee" as const,
                ...weapon.concealedBionic,
              },
            ]
          : []
      ),
    ];
    completedEntry = {
      ...entry,
      acquisition: {
        purity: {
          removedCyberneticIds: cybernetics.map((item) => item.id),
          removedCybernetics: cybernetics,
          ...(removedIntegratedRangedWeapons.length > 0 ? { removedIntegratedRangedWeapons } : {}),
          ...(removedIntegratedMeleeWeapons.length > 0 ? { removedIntegratedMeleeWeapons } : {}),
          ...(removedArcheotech.length > 0 ? { removedArcheotech } : {}),
          ...(removedConcealedWeaponLinks.length > 0 ? { removedConcealedWeaponLinks } : {}),
          qualifyingBionicsRemoved: qualifyingBionics,
          fatePointsGained: purityFatePoints,
          ...(hasFatalRemovals ? { toughnessLoss, woundsLoss: 1 } : {}),
        },
      },
    };
    nextCybernetics = [];
    nextRangedWeapons = rangedWeapons
      .filter((weapon) => !isIntegratedRangedWeapon(weapon))
      .map((weapon) =>
        weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
          ? { ...weapon, concealedBionic: undefined }
          : weapon
      );
    nextMeleeWeapons = meleeWeapons
      .filter((weapon) => !isIntegratedMeleeWeapon(weapon))
      .map((weapon) =>
        weapon.concealedBionic && removedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
          ? { ...weapon, concealedBionic: undefined }
          : weapon
      );
    nextArcheotech = archeotech.filter((item) => !isPurityArcheotech(item));
    if (hasFatalRemovals) {
      for (const fatalItem of fatalRemovalItems) {
        const fatalReplacement = fatalReplacements[fatalItem.key].trim();
        additionalTalentEntries.push({
          uid: createId(),
          talentId: "reformed-skin",
          name: `Reformed Skin (${fatalReplacement})`,
          specialisation: fatalReplacement,
          notes: `Immediate replacement required after removing ${fatalItem.name} through Purity of Flesh.`,
          acquisition: {
            reformedSkinPurityReplacement: true,
            purityTalentEntryUid: entry.uid,
          },
        });
      }
    }
  } else if (entry.talentId === "reformed-skin") {
    completedEntry =
      primaryChoice === "purity"
        ? {
            ...entry,
            acquisition: {
              ...entry.acquisition,
              reformedSkinPurityReplacement: true,
              purityTalentEntryUid: purityEntry?.uid,
            },
          }
        : {
            ...entry,
            acquisition: {
              ...entry.acquisition,
              reformedSkinPurityReplacement: false,
            },
          };
  } else if (entry.talentId === "rite-of-pure-thought") {
    const retained = disorders.filter((disorder) => !removedDisorderIds.includes(disorder.id));
    const replacements = disorders
      .filter((disorder) => removedDisorderIds.includes(disorder.id))
      .map((disorder) => ({
        ...disorder,
        id: createId(),
        referenceId: undefined,
        name: replacementDisorders[disorder.id].trim(),
        notes: `Replacement for ${disorder.name} through Rite of Pure Thought.`,
        custom: true,
      }));
    nextInsanity = { ...insanity, disorders: [...retained, ...replacements] };
    completedEntry = {
      ...entry,
      acquisition: {
        riteOfPureThoughtReviewed: true,
        riteOriginalDisorders: disorders.filter((disorder) =>
          removedDisorderIds.includes(disorder.id)
        ),
        riteReplacementDisorderIds: replacements.map((disorder) => disorder.id),
      },
    };
  } else if (/^psy-rating-[3-6]$/.test(entry.talentId)) {
    completedEntry = {
      ...entry,
      acquisition: {
        ...entry.acquisition,
        psyRatingWillpowerBonus: willpowerBonus,
        psyRatingMinorPowerGrants: psyRatingMinorGrants,
        psyRatingMajorPowerGrants: psyRatingMajorGrants,
        psyRatingDiscipline: primaryChoice,
        psyRatingNewDiscipline: psyRatingGrant.newDiscipline,
      },
    };
  }

  return {
    entry: completedEntry,
    ...(nextCybernetics ? { cybernetics: nextCybernetics } : {}),
    ...(nextRangedWeapons ? { rangedWeapons: nextRangedWeapons } : {}),
    ...(nextMeleeWeapons ? { meleeWeapons: nextMeleeWeapons } : {}),
    ...(nextArcheotech ? { archeotech: nextArcheotech } : {}),
    ...(nextInsanity ? { insanity: nextInsanity } : {}),
    ...(additionalTalentEntries.length > 0 ? { additionalTalentEntries } : {}),
  };
}
