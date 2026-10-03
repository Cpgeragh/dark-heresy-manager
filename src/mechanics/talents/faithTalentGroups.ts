import type { FaithTalentGroup, TalentData } from "shared-rules";

export const FAITH_TALENT_GROUP_LABELS: Record<FaithTalentGroup, string> = {
  general: "General",
  sign: "Emperor's Sign",
  mercy: "Emperor's Mercy",
  wrath: "Emperor's Wrath",
};

export const FAITH_TALENT_GROUP_CHIP_CLASSES: Record<FaithTalentGroup, string> = {
  general: "border-slate-500/60 bg-slate-800/60 text-slate-200",
  sign: "border-violet-500/60 bg-violet-950/30 text-violet-300",
  mercy: "border-emerald-500/60 bg-emerald-950/30 text-emerald-300",
  wrath: "border-amber-500/60 bg-amber-950/30 text-amber-300",
};

export interface FaithTalentGroupChip {
  label: string;
  className: string;
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
    className: FAITH_TALENT_GROUP_CHIP_CLASSES[talent.faithGroup],
  };
}
