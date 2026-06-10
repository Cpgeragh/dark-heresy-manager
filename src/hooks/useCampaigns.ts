// src/hooks/useCampaigns.ts
// Returns DM campaigns from the shared CampaignsContext.
// Kept for backwards-compat during the DMDashboard → Dashboard migration.
// Deleted in batch 3 along with DMDashboard.

import { useCampaignsContext } from "../context/CampaignsContext";

export function useCampaigns(_dmUid: string) {
  const { dmCampaigns, loading, error } = useCampaignsContext();
  return { campaigns: dmCampaigns, loading, error };
}
