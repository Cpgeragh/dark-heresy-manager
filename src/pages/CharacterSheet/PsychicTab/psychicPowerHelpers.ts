import type { PsychicPower } from "../../../types/Character";
import type { CustomPsychicPowerData } from "../../../types/CustomItems";

export function normalisePowerName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function toCustomPowerData(power: PsychicPower): CustomPsychicPowerData {
  const {
    id: _id,
    talentEntryUid: _talentEntryUid,
    psyRatingTalentEntryUid: _psyRatingTalentEntryUid,
    customLibraryId: _customLibraryId,
    customLibraryVersionId: _customLibraryVersionId,
    known: _known,
    ...data
  } = power;
  return data;
}
