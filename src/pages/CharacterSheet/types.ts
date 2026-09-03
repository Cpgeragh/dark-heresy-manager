export const TAB_IDS = [
  "vitals",
  "insanity",
  "corruption",
  "stats",
  "skills",
  "talents",
  "traits",
  "weapons",
  "armour",
  "cybernetics",
  "psychic",
  "gear",
  "companions",
  "drugs",
  "xp",
  "notes",
  "archeotech",
  "background",
  "training",
  "admin",
] as const;

export type TabId = (typeof TAB_IDS)[number];

export function isTabId(value: string | null): value is TabId {
  return value !== null && (TAB_IDS as readonly string[]).includes(value);
}
