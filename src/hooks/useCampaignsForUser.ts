// src/hooks/useCampaignsForUser.ts
// Reads player campaigns from the shared CampaignsContext (started at app load).

import { useCampaignsContext } from "../context/CampaignsContext";

export function useCampaignsForUser(_uid: string, _role: "player" | "dm") {
  return useCampaignsContext();
}
