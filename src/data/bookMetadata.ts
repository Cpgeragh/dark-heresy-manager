import { SkillSource } from "../types/SkillSource";

export const BOOK_METADATA = {
  [SkillSource.CR]: { code: "CR", name: "Core Rulebook", year: 2008 },
  [SkillSource.IH]: { code: "IH", name: "Inquisitor’s Handbook", year: 2009 },
  [SkillSource.RH]: { code: "RH", name: "Radical’s Handbook", year: 2009 },
  [SkillSource.BoM]: { code: "BoM", name: "Blood of Martyrs", year: 2010 },
  [SkillSource.BoJ]: { code: "BoJ", name: "Book of Judgement", year: 2010 },
  [SkillSource.CA]: { code: "CA", name: "Creatures Anathema", year: 2008 },
  [SkillSource.DH]: { code: "DH", name: "Daemon Hunter", year: 2011 },
  [SkillSource.LW]: { code: "LW", name: "Lathe Worlds", year: 2011 },
  [SkillSource.Asc]: { code: "Asc", name: "Ascension", year: 2010 },
  [SkillSource.DotDG]: { code: "DotDG", name: "Disciples of the Dark Gods", year: 2008 },
  [SkillSource.BSep]: { code: "BSep", name: "The Black Sepulchre", year: 2009 },
  [SkillSource.CC]: { code: "CC", name: "The Chaos Commandment", year: 2010 },
} as const;
