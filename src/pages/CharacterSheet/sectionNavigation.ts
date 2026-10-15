// src/pages/CharacterSheet/sectionNavigation.ts

import type {
  SectionDrawerCategory,
  SectionDrawerPage,
  SectionNavigation,
} from "../../components/SectionDrawer";

interface SheetCategory extends SectionDrawerCategory {
  dmOnly?: boolean;
}

function alphabetisePages(pages: readonly SectionDrawerPage[]): SectionDrawerPage[] {
  return [...pages].sort((left, right) => left.label.localeCompare(right.label, "en-GB"));
}

const SHEET_CATEGORIES: readonly SheetCategory[] = [
  {
    label: "Abilities",
    pages: alphabetisePages([
      { id: "elite-advances", label: "Elite Advances" },
      { id: "psychic", label: "Psychic" },
      { id: "skills", label: "Skills" },
      { id: "talents", label: "Talents" },
      { id: "traits", label: "Traits" },
      { id: "training", label: "Weapon Training" },
    ]),
  },
  {
    label: "Admin",
    dmOnly: true,
    pages: [{ id: "admin", label: "Admin" }],
  },
  {
    label: "Character",
    pages: [
      { id: "background", label: "Background" },
      { id: "stats", label: "Characteristics" },
      { id: "corruption", label: "Corruption & Mutations" },
      { id: "insanity", label: "Insanity" },
      { id: "notes", label: "Notes" },
      { id: "xp", label: "XP" },
    ],
  },
  {
    label: "Combat",
    pages: [{ id: "vitals", label: "Vitals" }],
  },
  {
    label: "Companions",
    pages: [{ id: "companions", label: "Companions" }],
  },
  {
    label: "Equipment",
    pages: [
      { id: "archeotech", label: "Archeotech" },
      { id: "armour", label: "Armour" },
      { id: "cybernetics", label: "Cybernetics" },
      { id: "drugs", label: "Drugs" },
      { id: "gear", label: "Gear" },
      { id: "weapons", label: "Weapons" },
    ],
  },
];

const DM_NAVIGATION: SectionNavigation = { categories: SHEET_CATEGORIES };
const PLAYER_NAVIGATION: SectionNavigation = {
  categories: SHEET_CATEGORIES.filter((category) => !category.dmOnly),
};

export function getSheetNavigation(isDM: boolean): SectionNavigation {
  return isDM ? DM_NAVIGATION : PLAYER_NAVIGATION;
}
