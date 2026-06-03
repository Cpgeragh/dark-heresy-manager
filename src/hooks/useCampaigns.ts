// src/hooks/useCampaigns.ts
// Reads DM campaigns from the shared CampaignsContext (started at app load).

import { useCampaignsContext } from "../context/CampaignsContext";

export function useCampaigns(_dmUid: string) {
  return useCampaignsContext();
}
