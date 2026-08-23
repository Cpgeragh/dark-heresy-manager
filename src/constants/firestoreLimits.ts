import { PRODUCT_LIMITS } from "./productLimits";

/**
 * Client-side safety bounds for live Firestore queries.
 *
 * These are deliberately higher than the normal product usage expected today,
 * so they cap accidental or abusive read amplification without changing the
 * ordinary small-campaign experience. Product creation limits are enforced
 * separately at write boundaries.
 */
export const FIRESTORE_QUERY_LIMITS = {
  activeCampaignsPerRole: 50,
  archivedCampaigns: 100,
  charactersPerCampaign: PRODUCT_LIMITS.charactersPerCampaign,
  playerCharactersPerUser: 1_000,
  sessionsPerCampaign: 200,
  threadSummariesPerCampaign: 100,
  messagesPerThread: PRODUCT_LIMITS.messagesPerPage,
  claimLogEntries: PRODUCT_LIMITS.claimHistoryEntriesPerPage,
  customItemsPerQuery: PRODUCT_LIMITS.customItemsPerCampaign,
} as const;
