// functions/src/index.ts
//
// Stage 3.0 scaffolding: proves a Function can be written, emulated, and
// called from the client end to end. Nothing here is protected yet — auth,
// App Check, rate limiting, and every other Stage 3.1 requirement land once
// the shared foundation is built.

import { initializeApp } from "firebase-admin/app";
initializeApp();

import { onCall } from "firebase-functions/v2/https";
import { protectedCallable } from "./shared/protectedCallable.js";
import { recoveryCodeHmacSecret } from "./shared/secrets.js";
import { hashRecoveryCode, hashForKey } from "./shared/recoveryCode.js";
import {
  registerRecoveryCode as runRegisterRecoveryCode,
  type RegisterRecoveryCodeInput,
} from "./operations/registerRecoveryCode.js";
import {
  lookupRecoveryCode as runLookupRecoveryCode,
  type LookupRecoveryCodeInput,
  type LookupRecoveryCodeResult,
} from "./operations/lookupRecoveryCode.js";
import {
  claimCharacter as runClaimCharacter,
  type ClaimCharacterInput,
  type ClaimCharacterResult,
} from "./operations/claimCharacter.js";
import {
  releaseCharacter as runReleaseCharacter,
  type ReleaseCharacterInput,
} from "./operations/releaseCharacter.js";
import {
  forceReleaseCharacter as runForceReleaseCharacter,
  type ForceReleaseCharacterInput,
} from "./operations/forceReleaseCharacter.js";
import {
  forceAssignCharacter as runForceAssignCharacter,
  type ForceAssignCharacterInput,
} from "./operations/forceAssignCharacter.js";
import {
  reclaimIdentity as runReclaimIdentity,
  type ReclaimIdentityInput,
} from "./operations/reclaimIdentity.js";
import {
  linkDevice as runLinkDevice,
  type LinkDeviceInput,
} from "./operations/linkDevice.js";
import {
  startCharacterDeletionJob as runStartCharacterDeletionJob,
  processCharacterDeletionChunk as runProcessCharacterDeletionChunk,
  type StartCharacterDeletionJobInput,
  type ProcessCharacterDeletionChunkInput,
  type ProcessCharacterDeletionChunkResult,
} from "./operations/characterDeletionJob.js";
import {
  startCampaignDeletionJob as runStartCampaignDeletionJob,
  processCampaignDeletionChunk as runProcessCampaignDeletionChunk,
  type StartCampaignDeletionJobInput,
  type ProcessCampaignDeletionChunkInput,
  type ProcessCampaignDeletionChunkResult,
} from "./operations/campaignDeletionJob.js";
import {
  startCustomItemMutationJob as runStartCustomItemMutationJob,
  processCustomItemMutationChunk as runProcessCustomItemMutationChunk,
  type StartCustomItemMutationJobInput,
  type ProcessCustomItemMutationChunkInput,
  type ProcessCustomItemMutationChunkResult,
} from "./operations/customItemMutationJob.js";

export const ping = onCall({ timeoutSeconds: 30 }, () => {
  return { ok: true };
});

export const protectedPing = onCall({ timeoutSeconds: 30 }, (request) =>
  protectedCallable({
    request,
    operation: "protected-ping",
    allowedFields: [],
    handler: async () => ({ ok: true }),
  })
);

export const registerRecoveryCode = onCall<RegisterRecoveryCodeInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) =>
    protectedCallable<RegisterRecoveryCodeInput, { code: string }>({
      request,
      operation: "register-recovery-code",
      allowedFields: ["campaignId", "characterId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: { campaignId: "string", characterId: "string" },
      rateLimits: [
        {
          key: `register-recovery-code:${request.auth?.uid ?? "anonymous"}`,
          limit: 20,
          windowMs: 60 * 60 * 1000,
        },
      ],
      handler: ({ uid, data }) => runRegisterRecoveryCode(data, uid, recoveryCodeHmacSecret.value()),
    })
);

export const lookupRecoveryCode = onCall<LookupRecoveryCodeInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) =>
    protectedCallable<LookupRecoveryCodeInput, LookupRecoveryCodeResult>({
      request,
      operation: "lookup-recovery-code",
      allowedFields: ["code"],
      requiredFields: ["code"],
      fieldShapes: { code: "string" },
      rateLimits: [
        {
          key: `recovery-lookup:user:${request.auth?.uid ?? "anonymous"}`,
          limit: 20,
          windowMs: 15 * 60 * 1000,
        },
        {
          // Matches recoveryCodeAttemptsPerWindow / codeAttemptWindowMs,
          // already recorded in src/constants/productLimits.ts since Stage 2
          // but never enforced anywhere until now.
          key: `recovery-lookup:code:${hashRecoveryCode(request.data?.code ?? "", recoveryCodeHmacSecret.value())}`,
          limit: 5,
          windowMs: 15 * 60 * 1000,
        },
        {
          key: "recovery-lookup:global",
          limit: 500,
          windowMs: 60 * 60 * 1000,
        },
      ],
      handler: ({ uid, data }) => runLookupRecoveryCode(data.code, uid, recoveryCodeHmacSecret.value()),
    })
);

export const claimCharacter = onCall<ClaimCharacterInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const codeHash = hashRecoveryCode(request.data?.code ?? "", recoveryCodeHmacSecret.value());

    return protectedCallable<ClaimCharacterInput, ClaimCharacterResult>({
      request,
      operation: "claim-character",
      allowedFields: ["code"],
      requiredFields: ["code"],
      fieldShapes: { code: "string" },
      rateLimits: [
        { key: `claim-character:user:${callerUid}`, limit: 20, windowMs: 15 * 60 * 1000 },
        { key: `claim-character:code:${codeHash}`, limit: 5, windowMs: 15 * 60 * 1000 },
        { key: "claim-character:global", limit: 500, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: `claim-character:${callerUid}:${codeHash}`,
      handler: ({ uid, data }) => runClaimCharacter(data, uid, recoveryCodeHmacSecret.value()),
    });
  }
);

export const releaseCharacter = onCall<ReleaseCharacterInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  return protectedCallable<ReleaseCharacterInput, void>({
    request,
    operation: "release-character",
    allowedFields: ["campaignId", "characterId"],
    requiredFields: ["campaignId", "characterId"],
    fieldShapes: { campaignId: "string", characterId: "string" },
    rateLimits: [{ key: `release-character:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 }],
    idempotencyKey: `release-character:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.characterId ?? ""}`,
    handler: ({ uid, data }) => runReleaseCharacter(data, uid),
  });
});

export const forceReleaseCharacter = onCall<ForceReleaseCharacterInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ForceReleaseCharacterInput, void>({
      request,
      operation: "force-release-character",
      allowedFields: ["campaignId", "characterId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: { campaignId: "string", characterId: "string" },
      rateLimits: [
        { key: `force-release-character:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: `force-release-character:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.characterId ?? ""}`,
      handler: ({ uid, data }) => runForceReleaseCharacter(data, uid),
    });
  }
);

export const forceAssignCharacter = onCall<ForceAssignCharacterInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ForceAssignCharacterInput, void>({
      request,
      operation: "force-assign-character",
      allowedFields: ["campaignId", "characterId", "targetUid"],
      requiredFields: ["campaignId", "characterId", "targetUid"],
      fieldShapes: { campaignId: "string", characterId: "string", targetUid: "string" },
      rateLimits: [
        { key: `force-assign-character:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: `force-assign-character:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.characterId ?? ""}:${request.data?.targetUid ?? ""}`,
      handler: ({ uid, data }) => runForceAssignCharacter(data, uid),
    });
  }
);

export const reclaimIdentity = onCall<ReclaimIdentityInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  const codeHash = hashForKey(request.data?.code ?? "");

  return protectedCallable<ReclaimIdentityInput, { role: "dm" | "player" }>({
    request,
    operation: "reclaim-identity",
    allowedFields: ["code"],
    requiredFields: ["code"],
    fieldShapes: { code: "string" },
    rateLimits: [
      { key: `reclaim-identity:user:${callerUid}`, limit: 20, windowMs: 15 * 60 * 1000 },
      { key: `reclaim-identity:code:${codeHash}`, limit: 5, windowMs: 15 * 60 * 1000 },
    ],
    idempotencyKey: `reclaim-identity:${callerUid}:${codeHash}`,
    handler: ({ uid, data }) => runReclaimIdentity(data, uid),
  });
});

export const linkDevice = onCall<LinkDeviceInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  const codeHash = hashForKey(request.data?.code ?? "");

  return protectedCallable<LinkDeviceInput, void>({
    request,
    operation: "link-device",
    allowedFields: ["code"],
    requiredFields: ["code"],
    fieldShapes: { code: "string" },
    rateLimits: [
      { key: `link-device:user:${callerUid}`, limit: 20, windowMs: 15 * 60 * 1000 },
      { key: `link-device:code:${codeHash}`, limit: 5, windowMs: 15 * 60 * 1000 },
    ],
    handler: ({ uid, data }) => runLinkDevice(data, uid),
  });
});

export const startCharacterDeletionJob = onCall<StartCharacterDeletionJobInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<StartCharacterDeletionJobInput, { jobId: string; totalCount: number }>({
      request,
      operation: "start-character-deletion-job",
      allowedFields: ["campaignId", "characterId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: { campaignId: "string", characterId: "string" },
      rateLimits: [
        { key: `start-character-deletion-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: `start-character-deletion-job:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.characterId ?? ""}`,
      handler: ({ uid, data }) => runStartCharacterDeletionJob(data, uid),
    });
  }
);

export const processCharacterDeletionChunk = onCall<ProcessCharacterDeletionChunkInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ProcessCharacterDeletionChunkInput, ProcessCharacterDeletionChunkResult>({
      request,
      operation: "process-character-deletion-chunk",
      allowedFields: ["jobId"],
      requiredFields: ["jobId"],
      fieldShapes: { jobId: "string" },
      rateLimits: [
        { key: `process-character-deletion-chunk:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid, data }) => runProcessCharacterDeletionChunk(data, uid),
    });
  }
);

export const startCampaignDeletionJob = onCall<StartCampaignDeletionJobInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<StartCampaignDeletionJobInput, { jobId: string; totalCount: number }>({
      request,
      operation: "start-campaign-deletion-job",
      allowedFields: ["campaignId"],
      requiredFields: ["campaignId"],
      fieldShapes: { campaignId: "string" },
      rateLimits: [
        { key: `start-campaign-deletion-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: `start-campaign-deletion-job:${callerUid}:${request.data?.campaignId ?? ""}`,
      handler: ({ uid, data }) => runStartCampaignDeletionJob(data, uid),
    });
  }
);

export const processCampaignDeletionChunk = onCall<ProcessCampaignDeletionChunkInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ProcessCampaignDeletionChunkInput, ProcessCampaignDeletionChunkResult>({
      request,
      operation: "process-campaign-deletion-chunk",
      allowedFields: ["jobId"],
      requiredFields: ["jobId"],
      fieldShapes: { jobId: "string" },
      rateLimits: [
        { key: `process-campaign-deletion-chunk:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid, data }) => runProcessCampaignDeletionChunk(data, uid),
    });
  }
);

export const startCustomItemMutationJob = onCall<StartCustomItemMutationJobInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<StartCustomItemMutationJobInput, { jobId: string; totalCount: number }>({
      request,
      operation: "start-custom-item-mutation-job",
      allowedFields: ["campaignId", "customItemId", "mode", "versionId", "actorUserId"],
      requiredFields: ["campaignId", "customItemId", "mode", "actorUserId"],
      fieldShapes: {
        campaignId: "string",
        customItemId: "string",
        mode: { enum: ["publish-and-update", "update", "remove", "archive-and-remove"] },
        versionId: "string",
        actorUserId: "string",
      },
      rateLimits: [
        { key: `start-custom-item-mutation-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: `start-custom-item-mutation-job:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.customItemId ?? ""}:${request.data?.mode ?? ""}`,
      handler: ({ uid, data }) => runStartCustomItemMutationJob(data, uid),
    });
  }
);

export const processCustomItemMutationChunk = onCall<ProcessCustomItemMutationChunkInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ProcessCustomItemMutationChunkInput, ProcessCustomItemMutationChunkResult>({
      request,
      operation: "process-custom-item-mutation-chunk",
      allowedFields: ["jobId"],
      requiredFields: ["jobId"],
      fieldShapes: { jobId: "string" },
      rateLimits: [
        { key: `process-custom-item-mutation-chunk:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid, data }) => runProcessCustomItemMutationChunk(data, uid),
    });
  }
);
