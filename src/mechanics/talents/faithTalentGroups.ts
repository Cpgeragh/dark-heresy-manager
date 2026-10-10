import type { FaithTalentGroup, TalentData } from "shared-rules";
import type { ChipColour } from "../../ui/styles/colourTokens";

export const FAITH_TALENT_GROUP_LABELS: Record<FaithTalentGroup, string> = {
  general: "General",
  sign: "Emperor's Sign",
  mercy: "Emperor's Mercy",
  wrath: "Emperor's Wrath",
};

export const FAITH_TALENT_GROUP_CHIP_COLOURS: Record<FaithTalentGroup, ChipColour> = {
  general: "slate",
  sign: "violet",
  mercy: "emerald",
  wrath: "amber",
};

export interface FaithTalentGroupChip {
  label: string;
  colour: ChipColour;
}

export function getFaithTalentGroupLabel(
  talent: Pick<TalentData, "faithGroup"> | undefined
): string | undefined {
  return talent?.faithGroup ? FAITH_TALENT_GROUP_LABELS[talent.faithGroup] : undefined;
}

export function getFaithTalentGroupChip(
  talent: Pick<TalentData, "faithGroup"> | undefined
): FaithTalentGroupChip | undefined {
  if (!talent?.faithGroup) return undefined;
  return {
    label: FAITH_TALENT_GROUP_LABELS[talent.faithGroup],
    colour: FAITH_TALENT_GROUP_CHIP_COLOURS[talent.faithGroup],
  };
}
