import { createContext, useContext } from "react";
import type { CampaignWithId } from "../types/Firestore";

export interface CampaignsContextValue {
  dmCampaigns: CampaignWithId[];
  playerCampaigns: CampaignWithId[];
  dmLoading: boolean;
  playerLoading: boolean;
  loading: boolean;
  dmError: Error | null;
  playerError: Error | null;
  error: Error | null;
  archivedCampaigns: CampaignWithId[];
  archivedLoading: boolean;
  archivedError: Error | null;
}

export const CampaignsContext = createContext<CampaignsContextValue>({
  dmCampaigns: [],
  playerCampaigns: [],
  dmLoading: true,
  playerLoading: true,
  loading: true,
  dmError: null,
  playerError: null,
  error: null,
  archivedCampaigns: [],
  archivedLoading: true,
  archivedError: null,
});

export function useCampaignsContext() {
  return useContext(CampaignsContext);
}
