// src/hooks/useCampaignsForUser.ts
// Returns player campaigns from the shared CampaignsContext.
// Kept for backwards-compat during the PlayerDashboard → Dashboard migration.
// Deleted in batch 3 along with PlayerDashboard.

import { useCampaignsContext } from "../context/CampaignsContext";

export function useCampaignsForUser(_uid: string, _role: "player" | "dm") {
  const { playerCampaigns, loading, error } = useCampaignsContext();
  return { campaigns: playerCampaigns, loading, error };
}
