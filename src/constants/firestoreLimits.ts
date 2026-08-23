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
  charactersPerCampaign: 100,
  playerCharactersPerCampaign: 20,
  sessionsPerCampaign: 200,
  threadSummariesPerCampaign: 100,
  messagesPerThread: 100,
  claimLogEntries: 50,
  customItemsPerQuery: 200,
} as const;
