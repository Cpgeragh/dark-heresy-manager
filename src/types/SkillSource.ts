// src/types/SkillSource.ts

export const SkillSource = {
  CR: "CR",
  IH: "IH",
  RH: "RH",
  BoM: "BoM",
  BoJ: "BoJ",
  CA: "CA",
  DH: "DH",
  LW: "LW",
  Asc: "Asc",
  DotDG: "DotDG",
  BSep:  "BSep",
  CC:    "CC",
  H3:    "H3",
} as const;

// A type of all source keys (safe, no runtime code)
export type SkillSource = typeof SkillSource[keyof typeof SkillSource];