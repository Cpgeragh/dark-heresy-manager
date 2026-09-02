// functions/src/index.ts
//
// Cloud Functions entry point. Every exported callable is wrapped by
// protectedCallable (see ./shared/protectedCallable.ts), which handles
// auth, App Check, rate limiting, validation, idempotency, and
// audit/metrics uniformly.

import { initializeApp } from "firebase-admin/app";
initializeApp();

import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { protectedCallable } from "./shared/protectedCallable.js";
import { withMinimumDuration } from "./shared/timingSafety.js";
import { recoveryCodeHmacSecret, identityCodeHmacSecret } from "./shared/secrets.js";
import { hashRecoveryCode, hashForKey } from "./shared/recoveryCode.js";
import { buildOperationIdempotencyKey } from "./shared/operationIdempotency.js";
import {
  registerRecoveryCode as runRegisterRecoveryCode,
  type RegisterRecoveryCodeInput,
} from "./operations/registerRecoveryCode.js";
import {
  registerIdentityCode as runRegisterIdentityCode,
  type RegisterIdentityCodeInput,
} from "./operations/registerIdentityCode.js";
import {
  lookupRecoveryCode as runLookupRecoveryCode,
  type LookupRecoveryCodeInput,
  type LookupRecoveryCodeResult,
} from "./operations/lookupRecoveryCode.js";
import {
  revokeRecoveryCode as runRevokeRecoveryCode,
  type RevokeRecoveryCodeInput,
} from "./operations/revokeRecoveryCode.js";
import {
  patchCharacterField as runPatchCharacterField,
  type PatchCharacterFieldInput,
} from "./operations/patchCharacterField.js";
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
  startIdentityReclaimJob as runStartIdentityReclaimJob,
  processIdentityReclaimChunk as runProcessIdentityReclaimChunk,
  type StartIdentityReclaimJobInput,
  type StartIdentityReclaimJobResult,
  type ProcessIdentityReclaimChunkInput,
  type ProcessIdentityReclaimChunkResult,
} from "./operations/identityReclaimJob.js";
import {
  linkDevice as runLinkDevice,
  type LinkDeviceInput,
} from "./operations/linkDevice.js";
import {
  getIdentityRecoveryMode as runGetIdentityRecoveryMode,
  type GetIdentityRecoveryModeInput,
  type GetIdentityRecoveryModeResult,
} from "./operations/getIdentityRecoveryMode.js";
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
import {
  cancelBulkJob as runCancelBulkJob,
  type CancelBulkJobInput,
} from "./operations/cancelBulkJob.js";
import { revokeIdentityCode as runRevokeIdentityCode } from "./operations/revokeIdentityCode.js";
import {
  deleteAccount as runDeleteAccount,
  type DeleteAccountResult,
} from "./operations/deleteAccount.js";
import {
  repairSessionSummaries as runRepairSessionSummaries,
  type RepairSessionSummariesInput,
  type RepairSessionSummariesResult,
} from "./operations/repairSessionSummaries.js";

setGlobalOptions({ region: "europe-west2" });

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

export const registerIdentityCode = onCall<RegisterIdentityCodeInput>(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<RegisterIdentityCodeInput, { code: string }>({
      request,
      operation: "register-identity-code",
      allowedFields: ["role", "targetUid"],
      requiredFields: ["role"],
      fieldShapes: { role: { enum: ["dm", "player"] }, targetUid: "string" },
      rateLimits: [
        { key: `register-identity-code:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid, data }) => runRegisterIdentityCode(data, uid, identityCodeHmacSecret.value()),
    });
  }
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
          limit: 5,
          windowMs: 15 * 60 * 1000,
        },
        {
          // Matches recoveryCodeAttemptsPerWindow / codeAttemptWindowMs in
          // src/constants/productLimits.ts, enforced here.
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
      handler: ({ uid, data }) =>
        withMinimumDuration(250, () =>
          runLookupRecoveryCode(data.code, uid, recoveryCodeHmacSecret.value())
        ),
    })
);

export const revokeRecoveryCode = onCall<RevokeRecoveryCodeInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const operationId = request.data?.operationId;
    return protectedCallable<RevokeRecoveryCodeInput, void>({
      request,
      operation: "revoke-recovery-code",
      allowedFields: ["campaignId", "characterId", "operationId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: { campaignId: "string", characterId: "string", operationId: "string" },
      rateLimits: [
        { key: `revoke-recovery-code:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: buildOperationIdempotencyKey(
        "revoke-recovery-code",
        callerUid,
        operationId
      ),
      handler: ({ uid, data }) => runRevokeRecoveryCode(data, uid, recoveryCodeHmacSecret.value()),
    });
  }
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
      handler: ({ uid, data }) =>
        withMinimumDuration(250, () => runClaimCharacter(data, uid, recoveryCodeHmacSecret.value())),
    });
  }
);

export const releaseCharacter = onCall<ReleaseCharacterInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  const operationId = request.data?.operationId;
  return protectedCallable<ReleaseCharacterInput, void>({
    request,
    operation: "release-character",
    allowedFields: ["campaignId", "characterId", "operationId"],
    requiredFields: ["campaignId", "characterId"],
    fieldShapes: { campaignId: "string", characterId: "string", operationId: "string" },
    rateLimits: [{ key: `release-character:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 }],
    idempotencyKey: buildOperationIdempotencyKey("release-character", callerUid, operationId),
    handler: ({ uid, data }) => runReleaseCharacter(data, uid),
  });
});

export const forceReleaseCharacter = onCall<ForceReleaseCharacterInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const operationId = request.data?.operationId;
    return protectedCallable<ForceReleaseCharacterInput, void>({
      request,
      operation: "force-release-character",
      allowedFields: ["campaignId", "characterId", "operationId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: { campaignId: "string", characterId: "string", operationId: "string" },
      rateLimits: [
        { key: `force-release-character:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: buildOperationIdempotencyKey(
        "force-release-character",
        callerUid,
        operationId
      ),
      handler: ({ uid, data }) => runForceReleaseCharacter(data, uid),
    });
  }
);

export const forceAssignCharacter = onCall<ForceAssignCharacterInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const operationId = request.data?.operationId;
    return protectedCallable<ForceAssignCharacterInput, void>({
      request,
      operation: "force-assign-character",
      allowedFields: ["campaignId", "characterId", "targetUid", "operationId"],
      requiredFields: ["campaignId", "characterId", "targetUid"],
      fieldShapes: {
        campaignId: "string",
        characterId: "string",
        targetUid: "string",
        operationId: "string",
      },
      rateLimits: [
        { key: `force-assign-character:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: buildOperationIdempotencyKey(
        "force-assign-character",
        callerUid,
        operationId
      ),
      handler: ({ uid, data }) => runForceAssignCharacter(data, uid),
    });
  }
);

export const startIdentityReclaimJob = onCall<StartIdentityReclaimJobInput>(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const codeHash = hashForKey(request.data?.code ?? "");
    const idempotencyKey = `start-identity-reclaim-job:${callerUid}:${codeHash}`;

    return protectedCallable<
      StartIdentityReclaimJobInput,
      StartIdentityReclaimJobResult
    >({
      request,
      operation: "start-identity-reclaim-job",
      allowedFields: ["code"],
      requiredFields: ["code"],
      fieldShapes: { code: "string" },
      rateLimits: [
        { key: `start-identity-reclaim-job:user:${callerUid}`, limit: 5, windowMs: 15 * 60 * 1000 },
        { key: `start-identity-reclaim-job:code:${codeHash}`, limit: 5, windowMs: 15 * 60 * 1000 },
      ],
      idempotencyKey,
      handler: ({ uid, data }) =>
        runStartIdentityReclaimJob(data, uid, idempotencyKey, identityCodeHmacSecret.value()),
    });
  }
);

export const processIdentityReclaimChunk = onCall<ProcessIdentityReclaimChunkInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ProcessIdentityReclaimChunkInput, ProcessIdentityReclaimChunkResult>({
      request,
      operation: "process-identity-reclaim-chunk",
      allowedFields: ["jobId"],
      requiredFields: ["jobId"],
      fieldShapes: { jobId: "string" },
      rateLimits: [
        { key: `process-identity-reclaim-chunk:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid, data }) => runProcessIdentityReclaimChunk(data, uid),
    });
  }
);

export const linkDevice = onCall<LinkDeviceInput>(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const codeHash = hashForKey(request.data?.code ?? "");

    return protectedCallable<LinkDeviceInput, void>({
      request,
      operation: "link-device",
      allowedFields: ["code"],
      requiredFields: ["code"],
      fieldShapes: { code: "string" },
      rateLimits: [
        { key: `link-device:user:${callerUid}`, limit: 5, windowMs: 15 * 60 * 1000 },
        { key: `link-device:code:${codeHash}`, limit: 5, windowMs: 15 * 60 * 1000 },
      ],
      handler: ({ uid, data }) => runLinkDevice(data, uid, identityCodeHmacSecret.value()),
    });
  }
);

export const startCharacterDeletionJob = onCall<StartCharacterDeletionJobInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const idempotencyKey = `start-character-deletion-job:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.characterId ?? ""}`;
    return protectedCallable<StartCharacterDeletionJobInput, { jobId: string; totalCount: number }>({
      request,
      operation: "start-character-deletion-job",
      allowedFields: ["campaignId", "characterId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: { campaignId: "string", characterId: "string" },
      rateLimits: [
        { key: `start-character-deletion-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey,
      handler: ({ uid, data }) =>
        runStartCharacterDeletionJob(data, uid, idempotencyKey, recoveryCodeHmacSecret.value()),
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
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const idempotencyKey = `start-campaign-deletion-job:${callerUid}:${request.data?.campaignId ?? ""}`;
    return protectedCallable<StartCampaignDeletionJobInput, { jobId: string; totalCount: number }>({
      request,
      operation: "start-campaign-deletion-job",
      allowedFields: ["campaignId"],
      requiredFields: ["campaignId"],
      fieldShapes: { campaignId: "string" },
      rateLimits: [
        { key: `start-campaign-deletion-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey,
      handler: ({ uid, data }) =>
        runStartCampaignDeletionJob(data, uid, idempotencyKey, recoveryCodeHmacSecret.value()),
    });
  }
);

export const processCampaignDeletionChunk = onCall<ProcessCampaignDeletionChunkInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
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
      handler: ({ uid, data }) =>
        runProcessCampaignDeletionChunk(data, uid, recoveryCodeHmacSecret.value()),
    });
  }
);

export const startCustomItemMutationJob = onCall<StartCustomItemMutationJobInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const idempotencyKey = `start-custom-item-mutation-job:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.customItemId ?? ""}:${request.data?.mode ?? ""}`;
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
      idempotencyKey,
      handler: ({ uid, data }) => runStartCustomItemMutationJob(data, uid, idempotencyKey),
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

export const cancelBulkJob = onCall<CancelBulkJobInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  return protectedCallable<CancelBulkJobInput, void>({
    request,
    operation: "cancel-bulk-job",
    allowedFields: ["jobId"],
    requiredFields: ["jobId"],
    fieldShapes: { jobId: "string" },
    rateLimits: [{ key: `cancel-bulk-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 }],
    handler: ({ uid, data }) => runCancelBulkJob(data, uid),
  });
});

export const revokeIdentityCode = onCall(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<Record<string, never>, void>({
      request,
      operation: "revoke-identity-code",
      allowedFields: [],
      rateLimits: [
        { key: `revoke-identity-code:${callerUid}`, limit: 10, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid }) => runRevokeIdentityCode(uid, identityCodeHmacSecret.value()),
    });
  }
);

export const getIdentityRecoveryMode = onCall<GetIdentityRecoveryModeInput>(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const codeHash = hashForKey(request.data?.code ?? "");

    return protectedCallable<GetIdentityRecoveryModeInput, GetIdentityRecoveryModeResult>({
      request,
      operation: "get-identity-recovery-mode",
      allowedFields: ["code"],
      requiredFields: ["code"],
      fieldShapes: { code: "string" },
      rateLimits: [
        { key: `get-identity-recovery-mode:user:${callerUid}`, limit: 5, windowMs: 15 * 60 * 1000 },
        { key: `get-identity-recovery-mode:code:${codeHash}`, limit: 5, windowMs: 15 * 60 * 1000 },
      ],
      handler: ({ uid, data }) =>
        withMinimumDuration(250, () =>
          runGetIdentityRecoveryMode(data, uid, identityCodeHmacSecret.value())
        ),
    });
  }
);

export const deleteAccount = onCall(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 60 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<Record<string, never>, DeleteAccountResult>({
      request,
      operation: "delete-account",
      allowedFields: [],
      rateLimits: [
        { key: `delete-account:${callerUid}`, limit: 3, windowMs: 24 * 60 * 60 * 1000 },
      ],
      handler: ({ uid }) => runDeleteAccount(uid, identityCodeHmacSecret.value()),
    });
  }
);

export const repairSessionSummaries = onCall<RepairSessionSummariesInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<RepairSessionSummariesInput, RepairSessionSummariesResult>({
      request,
      operation: "repair-session-summaries",
      allowedFields: ["campaignId"],
      requiredFields: ["campaignId"],
      fieldShapes: { campaignId: "string" },
      rateLimits: [
        {
          key: `repair-session-summaries:${callerUid}`,
          limit: 10,
          windowMs: 60 * 60 * 1000,
        },
      ],
      handler: ({ uid, data }) => runRepairSessionSummaries(data, uid),
    });
  }
);

export const patchCharacterField = onCall<PatchCharacterFieldInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<PatchCharacterFieldInput, void>({
      request,
      operation: "patch-character-field",
      allowedFields: ["campaignId", "characterId", "field", "value", "fields", "operationId"],
      requiredFields: ["campaignId", "characterId"],
      fieldShapes: {
        campaignId: "string",
        characterId: "string",
        field: {
          enum: [
            "notes",
            "header",
            "portraitUrl",
            "characteristics",
            "talentsAndTraits",
            "weaponTraining",
            "psychic",
            "cybernetics",
            "rangedWeapons",
            "meleeWeapons",
            "archeotech",
            "insanity",
            "gear",
            "consumables",
            "drugs",
            "grenades",
            "shields",
            "armour",
            "companions",
            "skills",
            "wounds",
            "fate",
            "corruption",
            "movement",
          ],
        },
        operationId: "string",
      },
      payloadBounds: { maxBytes: 900_000, maxStringCharacters: 4_000 },
      rateLimits: [
        { key: `patch-character-field:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: buildOperationIdempotencyKey(
        "patch-character-field",
        callerUid,
        (request.data as PatchCharacterFieldInput | undefined)?.operationId
      ),
      handler: ({ uid, data }) => runPatchCharacterField(data, uid),
    });
  }
);
