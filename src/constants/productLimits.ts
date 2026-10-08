import { CUSTOM_ITEM_VALIDATION_LIMITS } from "shared-rules";

/**
 * Authoritative product ceilings for user-created and stored Firebase data.
 *
 * Some limits are already enforced; the rest is enforced by the relevant
 * validation, rules, throttling, and bulk-operation code. Keeping every
 * agreed number here prevents those layers drifting.
 */
export const PRODUCT_LIMITS = {
  campaignCreationsPerWindow: 10,
  campaignCreationWindowMs: 24 * 60 * 60 * 1_000,
  campaignsPerAccount: 100,
  campaignMembers: 100,
  charactersPerCampaign: 100,
  devicesPerAccount: 10,
  linkedDevicesPerQuery: 200,

  campaignNameCharacters: 100,
  characterNameCharacters: 100,
  firstNameCharacters: 50,
  deviceNameCharacters: 50,
  inquisitorNameCharacters: 100,

  messageCharacters: 2_000,
  threadSummaryPreviewCharacters: 500,
  messagesPerPage: 100,
  claimHistoryEntriesPerPage: 50,
  xpHistoryEntriesPerPage: 100,

  characterXpTotal: 10_000_000,
  xpHistoryReasonCharacters: 4_000,

  sessionSummaryCharacters: 4_000,
  sessionDmNotesCharacters: 4_000,
  sessionXpAward: 100_000,
  sessionAttendees: 100,

  customItemsPerCampaign: 200,
  customItemNameCharacters: CUSTOM_ITEM_VALIDATION_LIMITS.nameCharacters,
  customItemTextCharacters: CUSTOM_ITEM_VALIDATION_LIMITS.textCharacters,
  customItemDataBytes: CUSTOM_ITEM_VALIDATION_LIMITS.dataBytes,
  customItemArrayEntries: CUSTOM_ITEM_VALIDATION_LIMITS.arrayEntries,
  customItemObjectKeys: CUSTOM_ITEM_VALIDATION_LIMITS.objectKeys,
  customItemNestingDepth: CUSTOM_ITEM_VALIDATION_LIMITS.nestingDepth,

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
