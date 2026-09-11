export const SERVER_PRODUCT_LIMITS = {
  campaignCreationsPerWindow: 10,
  campaignCreationWindowMs: 24 * 60 * 60 * 1_000,
  campaignsPerAccount: 100,
  campaignNameCharacters: 100,
  firstNameCharacters: 50,
  inquisitorNameCharacters: 100,
} as const;
