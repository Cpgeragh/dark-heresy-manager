// tests/firestore/helpers.ts

import type { RulesTestEnvironment, RulesTestContext } from "@firebase/rules-unit-testing";
import { createEmptyCharacterData } from "../../src/utils/characterFactory";

/**
 * Get an authenticated Firestore client for a user id.
 */
export function dbAs(env: RulesTestEnvironment, uid: string) {
  return env.authenticatedContext(uid).firestore();
}

/**
 * Get an unauthenticated Firestore client.
 */
export function dbAnon(env: RulesTestEnvironment) {
  return env.unauthenticatedContext().firestore();
}

export function validCampaignDocument(
  dmId: string,
  name = "Test Campaign",
  overrides: Record<string, unknown> = {}
) {
  return {
    dmId,
    name,
    memberIds: [],
    createdAt: new Date(),
    archivedAt: null,
    ...overrides,
  };
}

export function validCharacterDocument(
  campaignId: string,
  recoveryCode: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    ...createEmptyCharacterData({ campaignId, recoveryCode, characterName: "Test Acolyte" }),
    ...overrides,
  };
}

/**
 * Create a campaign document bypassing security rules.
 *
 * IMPORTANT: Waits to ensure the campaign is readable before returning,
 * preventing "Service call error" in child documents.
 */
export async function createCampaign(
  env: RulesTestEnvironment,
  campaignId: string,
  dmId = "dm-1",
  extra: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection("campaigns")
      .doc(campaignId)
      .set(validCampaignDocument(dmId, `Campaign ${campaignId}`, extra));
  });

  // CRITICAL: Wait for the campaign to be readable by verifying with an authenticated read
  // This ensures the document is committed and available for get() calls in rules
  const dmDb = dbAs(env, dmId);
  await dmDb.collection("campaigns").doc(campaignId).get();
}

/**
 * Create a character document bypassing security rules.
 *
 * IMPORTANT:
 * - No null fields ever.
 * - All schema fields should exist on first write.
 * - This prevents inconsistent parent reads during rule evaluation.
 */
export async function createCharacter(
  env: RulesTestEnvironment,
  campaignId: string,
  characterId: string,
  overrides: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    const base = createEmptyCharacterData({
      campaignId,
      recoveryCode: "DH-TEST-0001",
      userId: "UNASSIGNED",
      characterName: `Character ${characterId}`,
    });

    await ctx
      .firestore()
      .collection(`campaigns/${campaignId}/characters`)
      .doc(characterId)
      .set({
        ...base,
        ...overrides,
      });
  });
}

/**
 * Create a claim log document bypassing rules.
 */
export async function createClaimLog(
  env: RulesTestEnvironment,
  campaignId: string,
  characterId: string,
  logId: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection(`campaigns/${campaignId}/characters/${characterId}/claimLog`)
      .doc(logId)
      .set(data);
  });
}

/**
 * Create a characterSummaries entry bypassing rules.
 */
export async function createCharacterSummary(
  env: RulesTestEnvironment,
  campaignId: string,
  characterId: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx
      .firestore()
      .collection(`campaigns/${campaignId}/characterSummaries`)
      .doc(characterId)
      .set(data);
  });
}

/**
 * Create a recoveryIndex entry bypassing rules.
 */
export async function createRecoveryIndexEntry(
  env: RulesTestEnvironment,
  code: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("recoveryIndex").doc(code).set(data);
  });
}

/**
 * Create an identityRecovery entry bypassing rules.
 */
export async function createIdentityRecoveryEntry(
  env: RulesTestEnvironment,
  code: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("identityRecovery").doc(code).set(data);
  });
}

/**
 * Create an identitySecret entry bypassing rules.
 */
export async function createIdentitySecretEntry(
  env: RulesTestEnvironment,
  uid: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("identitySecret").doc(uid).set(data);
  });
}

/**
 * Create an identityReclaims proof document bypassing rules.
 */
export async function createIdentityReclaimEntry(
  env: RulesTestEnvironment,
  uid: string,
  data: Record<string, unknown>
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("identityReclaims").doc(uid).set(data);
  });
}
