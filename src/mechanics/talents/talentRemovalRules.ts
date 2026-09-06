import type {
  ArcheotechItem,
  Character,
  CyberneticItem,
  InsanityBlock,
  MeleeWeapon,
  PsychicBlock,
  RangedWeapon,
  TalentEntry,
  TalentsAndTraitsBlock,
} from "../../types/Character";

interface BuildTalentRemovalUpdateArgs {
  entry: TalentEntry;
  restoreOneTimeEffects: boolean;
  talents: TalentsAndTraitsBlock;
  psychic: PsychicBlock;
  cybernetics: CyberneticItem[];
  insanity: InsanityBlock;
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  archeotech: ArcheotechItem[];
}

export type TalentRemovalUpdate = Partial<Character> & {
  talentsAndTraits: TalentsAndTraitsBlock;
};

export function hasRestorableTalentEffect(entry: TalentEntry): boolean {
  return (
    (entry.talentId === "purity-of-flesh" &&
      ((entry.acquisition?.purity?.removedCybernetics?.length ?? 0) > 0 ||
        (entry.acquisition?.purity?.removedIntegratedRangedWeapons?.length ?? 0) > 0 ||
        (entry.acquisition?.purity?.removedIntegratedMeleeWeapons?.length ?? 0) > 0 ||
        (entry.acquisition?.purity?.removedArcheotech?.length ?? 0) > 0)) ||
    (entry.talentId === "rite-of-pure-thought" &&
      (entry.acquisition?.riteOriginalDisorders?.length ?? 0) > 0)
  );
}

export function buildTalentRemovalUpdate({
  entry,
  restoreOneTimeEffects,
  talents,
  psychic,
  cybernetics,
  insanity,
  rangedWeapons,
  meleeWeapons,
  archeotech,
}: BuildTalentRemovalUpdateArgs): TalentRemovalUpdate {
  const nextTalents = {
    ...talents,
    talents: talents.talents.filter((talent) => talent.uid !== entry.uid),
  };
  const removedDiscipline = entry.acquisition?.psyRatingNewDiscipline
    ? entry.acquisition.psyRatingDiscipline
    : undefined;
  const disciplineStillGranted = removedDiscipline
    ? nextTalents.talents.some(
        (talent) =>
          talent.acquisition?.psyRatingNewDiscipline &&
          talent.acquisition.psyRatingDiscipline?.toLocaleLowerCase() ===
            removedDiscipline.toLocaleLowerCase()
      )
    : false;
  const nextPsychic =
    removedDiscipline && !disciplineStillGranted
      ? {
          ...psychic,
          disciplines: (psychic.disciplines ?? []).filter(
            (discipline) => discipline.toLocaleLowerCase() !== removedDiscipline.toLocaleLowerCase()
          ),
        }
      : psychic;
  const grantedCyberneticIds = new Set(
    cybernetics.filter((item) => item.grantedByTalentEntryUid === entry.uid).map((item) => item.id)
  );
  let nextCybernetics = cybernetics.filter((item) => item.grantedByTalentEntryUid !== entry.uid);
  let nextInsanity = insanity;
  let nextRangedWeapons =
    grantedCyberneticIds.size > 0
      ? rangedWeapons.map((weapon) =>
          weapon.concealedBionic && grantedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
            ? { ...weapon, concealedBionic: undefined }
            : weapon
        )
      : rangedWeapons;
  let nextMeleeWeapons =
    grantedCyberneticIds.size > 0
      ? meleeWeapons.map((weapon) =>
          weapon.concealedBionic && grantedCyberneticIds.has(weapon.concealedBionic.cyberneticId)
            ? { ...weapon, concealedBionic: undefined }
            : weapon
        )
      : meleeWeapons;
  let nextArcheotech = archeotech;

  if (restoreOneTimeEffects && entry.talentId === "purity-of-flesh") {
    const removed = entry.acquisition?.purity?.removedCybernetics ?? [];
    const currentIds = new Set(nextCybernetics.map((item) => item.id));
    nextCybernetics = [...nextCybernetics, ...removed.filter((item) => !currentIds.has(item.id))];
    const links = entry.acquisition?.purity?.removedConcealedWeaponLinks ?? [];
    const rangedLinks = new Map(
      links.filter((link) => link.weaponType === "ranged").map((link) => [link.weaponId, link])
    );
    const meleeLinks = new Map(
      links.filter((link) => link.weaponType === "melee").map((link) => [link.weaponId, link])
    );
    const removedRanged = entry.acquisition?.purity?.removedIntegratedRangedWeapons ?? [];
    const currentRangedIds = new Set(nextRangedWeapons.map((weapon) => weapon.id));
    nextRangedWeapons = [
      ...nextRangedWeapons,
      ...removedRanged.filter((weapon) => !currentRangedIds.has(weapon.id)),
    ].map((weapon) => {
      const link = rangedLinks.get(weapon.id);
      return link && !weapon.concealedBionic
        ? {
            ...weapon,
            concealedBionic: {
              cyberneticId: link.cyberneticId,
              craftsmanship: link.craftsmanship,
            },
          }
        : weapon;
    });
    const removedMelee = entry.acquisition?.purity?.removedIntegratedMeleeWeapons ?? [];
    const currentMeleeIds = new Set(nextMeleeWeapons.map((weapon) => weapon.id));
    nextMeleeWeapons = [
      ...nextMeleeWeapons,
      ...removedMelee.filter((weapon) => !currentMeleeIds.has(weapon.id)),
    ].map((weapon) => {
      const link = meleeLinks.get(weapon.id);
      return link && !weapon.concealedBionic
        ? {
            ...weapon,
            concealedBionic: {
              cyberneticId: link.cyberneticId,
              craftsmanship: link.craftsmanship,
            },
          }
        : weapon;
    });
    const removedArcheotech = entry.acquisition?.purity?.removedArcheotech ?? [];
    const currentArcheotechIds = new Set(nextArcheotech.map((item) => item.id));
    nextArcheotech = [
      ...nextArcheotech,
      ...removedArcheotech.filter((item) => !currentArcheotechIds.has(item.id)),
    ];
  }

  if (restoreOneTimeEffects && entry.talentId === "rite-of-pure-thought") {
    const current = Array.isArray(insanity.disorders) ? insanity.disorders : [];
    const replacementIds = new Set(entry.acquisition?.riteReplacementDisorderIds ?? []);
    nextInsanity = {
      ...insanity,
      disorders: [
        ...current.filter((disorder) => !replacementIds.has(disorder.id)),
        ...(entry.acquisition?.riteOriginalDisorders ?? []),
      ],
    };
  }

  return {
    talentsAndTraits: nextTalents,
    ...(nextPsychic !== psychic ? { psychic: nextPsychic } : {}),
    ...(nextCybernetics !== cybernetics ? { cybernetics: nextCybernetics } : {}),
    ...(nextInsanity !== insanity ? { insanity: nextInsanity } : {}),
    ...(nextRangedWeapons !== rangedWeapons ? { rangedWeapons: nextRangedWeapons } : {}),
    ...(nextMeleeWeapons !== meleeWeapons ? { meleeWeapons: nextMeleeWeapons } : {}),
    ...(nextArcheotech !== archeotech ? { archeotech: nextArcheotech } : {}),
  };
}
