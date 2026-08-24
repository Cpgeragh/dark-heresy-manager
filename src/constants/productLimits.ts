/**
 * Authoritative product ceilings for user-created and stored Firebase data.
 *
 * Some limits are already enforced. The remaining enforcement is added by
 * the relevant Stage 2 validation, rules, throttling, and bulk-operation
 * sections. Keeping every agreed number here prevents those layers drifting.
 */
export const PRODUCT_LIMITS = {
  campaignCreationsPerWindow: 10,
  campaignCreationWindowMs: 24 * 60 * 60 * 1_000,
  campaignMembers: 100,
  charactersPerCampaign: 100,

  campaignNameCharacters: 100,
  characterNameCharacters: 100,
  firstNameCharacters: 50,

  messageCharacters: 2_000,
  threadSummaryPreviewCharacters: 500,
  messagesPerPage: 100,
  messagesRetainedPerThread: 5_000,
  claimHistoryEntriesPerPage: 50,

  sessionSummaryCharacters: 4_000,
  sessionDmNotesCharacters: 4_000,
  sessionXpAward: 100_000,
  sessionAttendees: 100,

  xpProposalsPerCharacter: 50,
  customItemsPerCampaign: 200,
  customItemVersions: 50,
  customItemNameCharacters: 100,
  customItemTextCharacters: 4_000,
  customItemDataBytes: 100_000,
  customItemArrayEntries: 100,
  customItemObjectKeys: 100,
  customItemNestingDepth: 8,

  characterImportBytes: 750_000,
  characterDocumentBytes: 900_000,
  characterArrayEntries: 200,
  characterObjectKeys: 100,
  characterNestingDepth: 8,
  characterFieldCharacters: 4_000,

  portraitInputBytes: 5_000_000,
  portraitEncodedBytes: 350_000,

  recoveryCodeAttemptsPerWindow: 5,
  linkCodeAttemptsPerWindow: 5,
  codeAttemptWindowMs: 15 * 60 * 1_000,

  bulkOperationDocuments: 440,
} as const;
