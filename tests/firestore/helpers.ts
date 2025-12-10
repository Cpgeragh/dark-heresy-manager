// tests/firestore/helpers.ts

import type {
  RulesTestEnvironment,
  RulesTestContext
} from "@firebase/rules-unit-testing";

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

/**
 * Create a campaign document bypassing security rules.
 * 
 * IMPORTANT: This now waits to ensure the campaign is readable
 * before returning, preventing "Service call error" in child documents.
 */
export async function createCampaign(
  env: RulesTestEnvironment,
  campaignId: string,
  dmId = "dm-1",
  extra: Record<string, unknown> = {}
) {
  await env.withSecurityRulesDisabled(async (ctx: RulesTestContext) => {
    await ctx.firestore().collection("campaigns").doc(campaignId).set({
      dmId,
      name: `Campaign ${campaignId}`,
      ...extra,
    });
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
    const base = {
      characterId,
      campaignId,
      name: `Character ${characterId}`,

      // VALID defaults — never null
      userId: "UNASSIGNED",
      isEditableByPlayer: false,
      recoveryCode: "none",

      createdAt: 1,
      updatedAt: 1,
    };

    await ctx.firestore()
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
    await ctx.firestore()
      .collection(
        `campaigns/${campaignId}/characters/${characterId}/claimLog`
      )
      .doc(logId)
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
    await ctx.firestore()
      .collection("recoveryIndex")
      .doc(code)
      .set(data);
  });
}