import { describe, expect, it } from "vitest";
import { FIRESTORE_QUERY_LIMITS } from "../../src/constants/firestoreLimits";
import { PRODUCT_LIMITS } from "../../src/constants/productLimits";

describe("hard product limits", () => {
  it("records every agreed Stage 2 numerical ceiling", () => {
    expect(PRODUCT_LIMITS).toEqual({
      campaignCreationsPerWindow: 10,
      campaignCreationWindowMs: 86_400_000,
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
      characterFieldCharacters: 4_000,
      characterArrayEntries: 200,
      characterObjectKeys: 100,
      characterNestingDepth: 8,
      portraitInputBytes: 5_000_000,
      portraitEncodedBytes: 350_000,
      recoveryCodeAttemptsPerWindow: 5,
      linkCodeAttemptsPerWindow: 5,
      codeAttemptWindowMs: 900_000,
      bulkOperationDocuments: 440,
    });
  });

  it("keeps page, encoded-data, and bulk ceilings inside their parent boundaries", () => {
    expect(PRODUCT_LIMITS.messagesPerPage).toBeLessThanOrEqual(
      PRODUCT_LIMITS.messagesRetainedPerThread
    );
    expect(PRODUCT_LIMITS.portraitEncodedBytes).toBeLessThan(PRODUCT_LIMITS.characterDocumentBytes);
    expect(PRODUCT_LIMITS.characterImportBytes).toBeLessThan(PRODUCT_LIMITS.characterDocumentBytes);
    expect(PRODUCT_LIMITS.bulkOperationDocuments).toBeLessThan(500);
  });

  it("uses the product ceilings for matching live-query windows", () => {
    expect(FIRESTORE_QUERY_LIMITS.charactersPerCampaign).toBe(PRODUCT_LIMITS.charactersPerCampaign);
    expect(FIRESTORE_QUERY_LIMITS.messagesPerThread).toBe(PRODUCT_LIMITS.messagesPerPage);
    expect(FIRESTORE_QUERY_LIMITS.claimLogEntries).toBe(PRODUCT_LIMITS.claimHistoryEntriesPerPage);
    expect(FIRESTORE_QUERY_LIMITS.customItemsPerQuery).toBe(PRODUCT_LIMITS.customItemsPerCampaign);
  });
});
