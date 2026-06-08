// src/data/reference/consumablesReference.ts
// Reference data for consumable items from the Core Rulebook.
// Drugs are handled separately in drugsReference.ts.

import { SkillSource } from "../../types/SkillSource";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConsumableRef {
  id: string;
  name: string;
  source: SkillSource;
  description?: string;
  weight?: string;
  /** Cost per dose, pack, or bottle */
  value: string;
  rarity: string;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export const CONSUMABLES_REFERENCE: ConsumableRef[] = [
  // ── Core Rulebook ─────────────────────────────────────────────────────────

  {
    id: "cr-amasec",
    name: "Amasec",
    source: SkillSource.CR,
    description:
      "A popular alcoholic drink distilled from wine. It can range from lesser brews barely fit " +
      "for firebombs to well-aged and flavourful brands suitable for only the finest of the Emperor's servants.",
    value: "50 Thrones",
    rarity: "Scarce",
  },
  {
    id: "cr-injector",
    name: "Injector",
    source: SkillSource.CR,
    description:
      "Injectors can take many forms from cheap low-tech disposable syringes up to sophisticated " +
      "hypo-sprays and even bio-attuned skin patches. An injector can hold a single dose of any drug, " +
      "which a character may administer as a Full Action.",
    value: "5 Thrones",
    rarity: "Abundant",
  },
  {
    id: "cr-lho-sticks",
    name: "Lho-sticks",
    source: SkillSource.CR,
    description:
      "Common with Imperial Guard troopers and many menial workers. Each rolled paper tube contains " +
      "a scented, mildly narcotic (and addictive) plant-derived substance, which is then lit and the " +
      "resulting smoke inhaled through the tube.",
    value: "10 Thrones",
    rarity: "Common",
  },
  {
    id: "cr-medikit",
    name: "Medikit",
    source: SkillSource.CR,
    description:
      "A vital piece of equipment for any medic. Contains various cataplasm patches, contraseptics " +
      "and synth-skin. A character with a medikit at hand when using the Medicae skill gains a +20 " +
      "bonus to their Test. Medikits also come with 6 doses of stimm, which must be replaced separately when used.",
    weight: "2 kg",
    value: "150 Thrones",
    rarity: "Common",
  },
  {
    id: "cr-ration-packs",
    name: "Ration Packs",
    source: SkillSource.CR,
    description:
      "Most food in the Imperium is packaged, processed and usually completely unrecognisable as " +
      "anything edible. Quality varies widely, from corpse starch rations and cultured algae up to " +
      "flavourful strips of grox meat and finest nutrislurry.",
    value: "10 Thrones",
    rarity: "Plentiful",
  },
  {
    id: "cr-recaf",
    name: "Recaf",
    source: SkillSource.CR,
    description:
      "A popular hot beverage made from crushed and brewed leaves. Composition varies from planet " +
      "to planet, but most blends have a stimulant such as caffeine as a basic release agent.",
    value: "5 Thrones",
    rarity: "Abundant",
  },
  {
    id: "cr-rotgut-booze",
    name: "Rotgut Booze",
    source: SkillSource.CR,
    description:
      "Alcohol comes in many shapes and sizes throughout the Imperium, and most cultures are noted " +
      "for at least one kind of fermented liquid. The catch-all term for these more basic brews " +
      "(especially by travellers) is rotgut booze.",
    value: "10 Thrones",
    rarity: "Abundant",
  },
  {
    id: "cr-sacred-machine-oil",
    name: "Sacred Machine Oil",
    source: SkillSource.CR,
    description:
      "Machine oil blessed by the Omnissiah. If applied to a weapon (a Full Action) it becomes immune " +
      "to Jamming for a number of shots equal to its clip size. If the weapon is already Jammed and the " +
      "oil is applied, it immediately unjams, but there is no further effect.",
    value: "150 Thrones",
    rarity: "Very Rare",
  },
];
