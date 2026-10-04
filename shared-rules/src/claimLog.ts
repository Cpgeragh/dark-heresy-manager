export const CLAIM_LOG_ACTIONS = ["claim", "release", "force-assign", "force-release"] as const;

export type ClaimLogAction = (typeof CLAIM_LOG_ACTIONS)[number];
