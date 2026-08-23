/** User-visible and stored-data limits enforced at client write boundaries. */
export const PRODUCT_LIMITS = {
  campaignNameCharacters: 100,
  characterNameCharacters: 100,
  firstNameCharacters: 50,
  messageCharacters: 2_000,
  sessionSummaryCharacters: 4_000,
  sessionDmNotesCharacters: 4_000,
  sessionXpAward: 100_000,
  sessionAttendees: 100,
  characterImportBytes: 750_000,
} as const;
