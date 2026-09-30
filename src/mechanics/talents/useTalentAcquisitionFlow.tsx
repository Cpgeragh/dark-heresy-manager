import { useCallback, useState } from "react";
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
  WeaponTrainingBlock,
} from "../../types/Character";
import { TalentAcquisitionModal } from "./TalentAcquisitionModal";
import type { TalentAcquisitionResult } from "./talentAcquisitionResult";
import { needsTalentAcquisition } from "./talentUtils";

interface TalentAcquisitionFlowOptions {
  talents: TalentsAndTraitsBlock;
  career?: string;
  psychic: PsychicBlock;
  cybernetics: CyberneticItem[];
  rangedWeapons: RangedWeapon[];
  meleeWeapons: MeleeWeapon[];
  archeotech: ArcheotechItem[];
  insanity: InsanityBlock;
  willpowerBonus: number;
  weaponTraining: WeaponTrainingBlock;
  onSave: (partial: Partial<Character>) => Promise<boolean>;
}

function prepareTalentEntry(entry: TalentEntry, willpowerBonus: number): TalentEntry {
  const psyRatingMatch = entry.talentId.match(/^psy-rating-[1-6]$/);
  const psyRating = psyRatingMatch ? Number(entry.talentId.slice(-1)) : 0;
  const minorGrants =
    psyRating === 1 || psyRating === 2 ? Math.ceil(willpowerBonus / 2) : undefined;
  return psyRatingMatch
    ? {
        ...entry,
        acquisition: {
          ...entry.acquisition,
          psyRatingWillpowerBonus: willpowerBonus,
          ...(minorGrants !== undefined ? { psyRatingMinorPowerGrants: minorGrants } : {}),
        },
      }
    : entry;
}

export function useTalentAcquisitionFlow({
  talents,
  career,
  psychic,
  cybernetics,
  rangedWeapons,
  meleeWeapons,
  archeotech,
  insanity,
  willpowerBonus,
  weaponTraining,
  onSave,
}: TalentAcquisitionFlowOptions) {
  const [pendingAcquisition, setPendingAcquisition] = useState<TalentEntry | null>(null);

  const addTalent = useCallback(
    (entry: TalentEntry) => {
      const preparedEntry = prepareTalentEntry(entry, willpowerBonus);
      if (needsTalentAcquisition(preparedEntry, talents)) {
        setPendingAcquisition(preparedEntry);
        return;
      }
      void onSave({
        talentsAndTraits: { ...talents, talents: [...talents.talents, preparedEntry] },
      });
    },
    [onSave, talents, willpowerBonus]
  );

  const completeAcquisition = useCallback(
    async (result: TalentAcquisitionResult): Promise<boolean> => {
      const nextTalents = {
        ...talents,
        talents: [...talents.talents, result.entry, ...(result.additionalTalentEntries ?? [])],
      };
      const grantedDiscipline = result.entry.acquisition?.psyRatingNewDiscipline
        ? result.entry.acquisition.psyRatingDiscipline
        : undefined;
      const nextPsychic =
        grantedDiscipline && !(psychic.disciplines ?? []).includes(grantedDiscipline)
          ? { ...psychic, disciplines: [...(psychic.disciplines ?? []), grantedDiscipline] }
          : psychic;
      const saved = await onSave({
        talentsAndTraits: nextTalents,
        ...(nextPsychic !== psychic ? { psychic: nextPsychic } : {}),
        ...(result.cybernetics ? { cybernetics: result.cybernetics } : {}),
        ...(result.rangedWeapons ? { rangedWeapons: result.rangedWeapons } : {}),
        ...(result.meleeWeapons ? { meleeWeapons: result.meleeWeapons } : {}),
        ...(result.archeotech ? { archeotech: result.archeotech } : {}),
        ...(result.insanity ? { insanity: result.insanity } : {}),
      });
      if (saved === false) return false;
      setPendingAcquisition(null);
      return true;
    },
    [onSave, psychic, talents]
  );

  return {
    addTalent,
    acquisitionPending: pendingAcquisition !== null,
    acquisitionModal: pendingAcquisition ? (
      <TalentAcquisitionModal
        entry={pendingAcquisition}
        talents={talents}
        career={career}
        currentHomeworldId={talents.homeworld}
        cybernetics={cybernetics}
        rangedWeapons={rangedWeapons}
        meleeWeapons={meleeWeapons}
        archeotech={archeotech}
        insanity={insanity}
        willpowerBonus={willpowerBonus}
        knownDisciplines={psychic.disciplines ?? []}
        weaponTraining={weaponTraining}
        onComplete={completeAcquisition}
        onClose={() => setPendingAcquisition(null)}
      />
    ) : null,
  };
}
