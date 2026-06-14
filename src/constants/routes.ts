// src/constants/routes.ts

/**
 * Route path constants for the application.
 * Use these instead of hardcoding paths to:
 * - Prevent typos
 * - Make refactoring easier
 * - Centralize route definitions
 */

// Static routes
export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/",
  DM_DASHBOARD: "/dm",
  PLAYER_DASHBOARD: "/player",
  SELECT_CAMPAIGN: "/select",
  SETTINGS: "/settings",
} as const;

// Route patterns (for React Router)
export const ROUTE_PATTERNS = {
  CHARACTER_SHEET: "/campaign/:campaignId/character/:characterId",
  CAMPAIGN_OVERVIEW: "/campaign/:campaignId",
} as const;

// Route builders (for navigation)
export const buildRoute = {
  /**
   * Build URL for character sheet
   * @example buildRoute.characterSheet("camp-123", "char-456")
   * => "/campaign/camp-123/character/char-456"
   */
  characterSheet: (campaignId: string, characterId: string) =>
    `/campaign/${campaignId}/character/${characterId}`,

  /**
   * Build URL for campaign overview
   * @example buildRoute.campaignOverview("camp-123")
   * => "/campaign/camp-123"
   */
  campaignOverview: (campaignId: string) => `/campaign/${campaignId}`,
} as const;
