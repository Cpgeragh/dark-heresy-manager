// shared-rules/src/skillSource.ts
// A duplicate of src/types/SkillSource.ts. This is a small, stable sourcebook-name
// lookup that almost never changes, so it's copied rather than shared, the same
// convention already used elsewhere for small stable pieces like the Recovery Code format.

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
  BSep: "BSep",
  CC: "CC",
  H3: "H3",
  LD: "LD",
  SDS: "SDS", // Salvation Demands Sacrifice
} as const;

export type SkillSource = (typeof SkillSource)[keyof typeof SkillSource];
