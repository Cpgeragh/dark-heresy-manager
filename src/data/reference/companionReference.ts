import { SkillSource } from "../../types/SkillSource";

export interface CompanionRef {
  id: string;
  name: string;
  source: SkillSource;
  description: string;
  characteristics: {
    ws: string;
    bs: string;
    s: string;
    t: string;
    ag: string;
    int: string;
    per: string;
    wp: string;
    fel: string;
  };
  movement: string;
  wounds: string;
  skills: string[];
  talents: string[];
  traits: string[];
  weapons: string[];
  armour: string[];
  gear: string[];
}

export const COMPANION_REFERENCE: CompanionRef[] = [
  {
    id: "ih-adeptus-arbites-cyber-mastiff",
    name: "Adeptus Arbites Cyber-Mastiff",
    source: SkillSource.IH,
    description:
      "Cyber-mastiffs are usually deployed under the control of Adeptus Arbites or enforcer units to bring down recidivists and heretics. Shaped in the form of a hound made of metal and guided by the brain and nervous system of a hunting creature, they are a fearsome extension of the Emperor’s law, and a truly terrible sight to see unleashed.",
    characteristics: {
      ws: "35",
      bs: "—",
      s: "40",
      t: "35",
      ag: "20",
      int: "17",
      per: "35",
      wp: "30",
      fel: "—",
    },
    movement: "4/8/12/24",
    wounds: "8",
    skills: [
      "Awareness (Per +10)",
      "Concealment (Ag +10)",
      "Silent Move (Ag +10)",
      "Swim (S)",
      "Tracking (Int +20)",
    ],
    talents: ["Double Team", "Fearless"],
    traits: [
      "Armour Plated",
      "Brutal Charge",
      "Enhanced Senses (Smell)",
      "Machine (4)",
      "Quadruped",
      "Size (Scrawny)",
    ],
    weapons: ["Bite (1d10+3 R)"],
    armour: ["Armour (Machine): Head 6, Forelegs 6, Body 6, Hindlegs 6."],
    gear: ["(Implanted) IR Vision Implant", "Filter Plugs"],
  },
];
