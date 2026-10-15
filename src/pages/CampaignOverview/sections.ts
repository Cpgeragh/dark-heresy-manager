// src/pages/CampaignOverview/sections.ts

import type { SectionNavigation } from "../../components/SectionDrawer";

export type CampaignSectionId = "party" | "custom-items" | "sessions";

export const DEFAULT_CAMPAIGN_SECTION: CampaignSectionId = "party";

const SECTION_LABELS: Record<CampaignSectionId, string> = {
  party: "Party",
  "custom-items": "Custom Item Library",
  sessions: "Session History",
};

const DM_SECTION_IDS: readonly CampaignSectionId[] = ["party", "custom-items", "sessions"];
const PLAYER_SECTION_IDS: readonly CampaignSectionId[] = ["party", "sessions"];

function toNavigation(ids: readonly CampaignSectionId[]): SectionNavigation {
  return { pages: ids.map((id) => ({ id, label: SECTION_LABELS[id] })) };
}

const DM_NAVIGATION = toNavigation(DM_SECTION_IDS);
const PLAYER_NAVIGATION = toNavigation(PLAYER_SECTION_IDS);

export function getCampaignNavigation(isDM: boolean): SectionNavigation {
  return isDM ? DM_NAVIGATION : PLAYER_NAVIGATION;
}

export function getCampaignSectionLabel(id: CampaignSectionId): string {
  return SECTION_LABELS[id];
}

export function isCampaignSectionAllowed(
  value: string | null,
  isDM: boolean
): value is CampaignSectionId {
  const ids: readonly string[] = isDM ? DM_SECTION_IDS : PLAYER_SECTION_IDS;
  return value !== null && ids.includes(value);
}
