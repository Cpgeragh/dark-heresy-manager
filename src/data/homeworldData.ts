// src/data/homeworldData.ts

import { SkillSource } from "../types/SkillSource";

export interface HomeworldData {
  id: string;
  name: string;
  source: SkillSource;
  description: string;
}

export const HOMEWORLD_LIST: readonly HomeworldData[] = [
  // ─── Core Rulebook ──────────────────────────────────────────────────────────
  {
    id: "feral-world",
    name: "Feral World",
    source: SkillSource.CR,
    description:
      "Born on savage, primitive worlds where survival depends on brute strength and instinct. Feral Worlders are physically powerful but often unlettered.",
  },
  {
    id: "hive-world",
    name: "Hive World",
    source: SkillSource.CR,
    description:
      "Raised in the teeming, crime-ridden underhives and hab-blocks of a great city-planet. Hive Worlders are streetwise, quick, and resourceful.",
  },
  {
    id: "imperial-world",
    name: "Imperial World",
    source: SkillSource.CR,
    description:
      "From one of the countless settled worlds of the Imperium — the most common background. Imperial Worlders are well-rounded and grounded in Imperial faith.",
  },
  {
    id: "void-born",
    name: "Void Born",
    source: SkillSource.CR,
    description:
      "Born aboard a voidship or orbital station — unnervingly calm, psychically sensitive, and unsettling to planetfolk.",
  },
  {
    id: "forge-world",
    name: "Forge World",
    source: SkillSource.CR,
    description:
      "Raised on the vast industrial planets of the Adeptus Mechanicus. Forge Worlders are technically adept but often lack social grace.",
  },
  {
    id: "death-world",
    name: "Death World",
    source: SkillSource.CR,
    description:
      "Forged by survival on a world where every creature is a predator. Death Worlders are frighteningly capable fighters and expert outdoorsmen.",
  },

  // ─── Inquisitor's Handbook ──────────────────────────────────────────────────
  {
    id: "mind-cleansed",
    name: "Mind Cleansed",
    source: SkillSource.IH,
    description:
      "A person whose past has been scoured away by the Inquisition — memories erased, identity replaced. They are loyal but hollow.",
  },
  {
    id: "noble-born",
    name: "Noble Born",
    source: SkillSource.IH,
    description:
      "From the aristocratic ruling classes of an Imperial world. Noble Born are well-educated, silver-tongued, and accustomed to command.",
  },
  {
    id: "schola-progenium",
    name: "Schola Progenium",
    source: SkillSource.IH,
    description:
      "Orphaned children of the Imperium's servants, raised by the Schola Progenium. Disciplined, loyal, and educated in Imperial doctrine.",
  },

  // ─── Blood of Martyrs ───────────────────────────────────────────────────────
  {
    id: "shrine-world",
    name: "Shrine World",
    source: SkillSource.BoM,
    description:
      "Born on a world dedicated to the veneration of saints and martyrs. Shrine Worlders have deep faith and familiarity with Ecclesiarchy rites.",
  },
  {
    id: "famulous-protege",
    name: "Famulous Protégé",
    source: SkillSource.BoM,
    description:
      "Trained by the order Famulous as a political advisor. Highly educated in noble society and Imperial genealogy.",
  },
  {
    id: "monastic-upbringing",
    name: "Monastic Upbringing",
    source: SkillSource.BoM,
    description:
      "Raised within a monastic order devoted to the Emperor, steeped in scripture, meditation, and communal service.",
  },

  // ─── Radical's Handbook ─────────────────────────────────────────────────────
  {
    id: "blighted-schola",
    name: "Blighted Schola",
    source: SkillSource.RH,
    description:
      "Trained in a Schola corrupted by heresy, unknowingly shaped by the Ruinous Powers from an early age.",
  },
  {
    id: "darkholder",
    name: "Darkholder",
    source: SkillSource.RH,
    description:
      "Born among those who worship the Dark Gods in secret. A life in the shadows of heresy has given them arcane knowledge and a dangerous edge.",
  },
  {
    id: "hive-mutant",
    name: "Hive Mutant",
    source: SkillSource.RH,
    description:
      "A mutant raised in the underhive, hiding their deformities from persecution. Mutations are both a curse and a source of unusual ability.",
  },
  {
    id: "tainted-blood-of-malfi",
    name: "Tainted Blood of Malfi",
    source: SkillSource.RH,
    description:
      "Of noble Mafian descent, carrying the bloodline's curse of warp taint and political intrigue. Charming, ambitious, and marked by fate.",
  },
] as const;

export type HomeworldId = (typeof HOMEWORLD_LIST)[number]["id"];
