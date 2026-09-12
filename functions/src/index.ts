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
import { registerIdentityCode as runRegisterIdentityCode } from "./operations/registerIdentityCode.js";
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
  adjustCharacterNumber as runAdjustCharacterNumber,
  type AdjustCharacterNumberInput,
} from "./operations/adjustCharacterNumber.js";
import {
  reconcileCharacterSpentXp as runReconcileCharacterSpentXp,
  type ReconcileCharacterSpentXpInput,
} from "./operations/reconcileCharacterSpentXp.js";
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
import { linkDevice as runLinkDevice, type LinkDeviceInput } from "./operations/linkDevice.js";
import {
  disconnectDevice as runDisconnectDevice,
  type DisconnectDeviceInput,
  type DisconnectDeviceResult,
} from "./operations/disconnectDevice.js";
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
  createAccount as runCreateAccount,
  type CreateAccountResult,
} from "./operations/createAccount.js";
import { discardOnboardingSetup as runDiscardOnboardingSetup } from "./operations/discardOnboardingSetup.js";
import { completeOnboarding as runCompleteOnboarding } from "./operations/completeOnboarding.js";
import {
  createCampaign as runCreateCampaign,
  type CreateCampaignInput,
  type CreateCampaignResult,
} from "./operations/createCampaign.js";
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

export const createCampaign = onCall<CreateCampaignInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  const operationId = request.data?.operationId;
  return protectedCallable<CreateCampaignInput, CreateCampaignResult>({
    request,
    operation: "create-campaign",
    allowedFields: ["name", "inquisitorName", "operationId"],
    requiredFields: ["name", "operationId"],
    fieldShapes: { name: "string", inquisitorName: "string", operationId: "string" },
    idempotencyKey: buildOperationIdempotencyKey("create-campaign", callerUid, operationId),
    handler: ({ uid, data, idempotency }) => runCreateCampaign(data, uid, idempotency),
  });
});

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
      handler: ({ uid, data }) =>
        runRegisterRecoveryCode(data, uid, recoveryCodeHmacSecret.value()),
    })
);

export const registerIdentityCode = onCall(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<Record<string, never>, { code: string }>({
      request,
      operation: "register-identity-code",
      allowedFields: [],
      rateLimits: [
        { key: `register-identity-code:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid }) => runRegisterIdentityCode(uid, identityCodeHmacSecret.value()),
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
      idempotencyKey: buildOperationIdempotencyKey("revoke-recovery-code", callerUid, operationId),
      handler: ({ uid, data, idempotency }) =>
        runRevokeRecoveryCode(data, uid, recoveryCodeHmacSecret.value(), idempotency),
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
      handler: ({ uid, data, idempotency }) =>
        withMinimumDuration(250, () =>
          runClaimCharacter(data, uid, recoveryCodeHmacSecret.value(), idempotency)
        ),
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
    handler: ({ uid, data, idempotency }) => runReleaseCharacter(data, uid, idempotency),
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
      handler: ({ uid, data, idempotency }) => runForceReleaseCharacter(data, uid, idempotency),
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
      handler: ({ uid, data, idempotency }) => runForceAssignCharacter(data, uid, idempotency),
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

export const disconnectDevice = onCall<DisconnectDeviceInput>({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  return protectedCallable<DisconnectDeviceInput, DisconnectDeviceResult>({
    request,
    operation: "disconnect-device",
    allowedFields: ["confirmLastDevice"],
    rateLimits: [{ key: `disconnect-device:${callerUid}`, limit: 10, windowMs: 60 * 60 * 1000 }],
    handler: ({ uid, data }) => runDisconnectDevice(data, uid),
  });
});

export const startCharacterDeletionJob = onCall<StartCharacterDeletionJobInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const idempotencyKey = `start-character-deletion-job:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.characterId ?? ""}`;
    return protectedCallable<StartCharacterDeletionJobInput, { jobId: string; totalCount: number }>(
      {
        request,
        operation: "start-character-deletion-job",
        allowedFields: ["campaignId", "characterId"],
        requiredFields: ["campaignId", "characterId"],
        fieldShapes: { campaignId: "string", characterId: "string" },
        rateLimits: [
          { key: `start-character-deletion-job:${callerUid}`, limit: 20, windowMs: 60 * 60 * 1000 },
        ],
        idempotencyKey,
        handler: ({ uid, data, idempotency }) =>
          runStartCharacterDeletionJob(
            data,
            uid,
            idempotencyKey,
            recoveryCodeHmacSecret.value(),
            idempotency
          ),
      }
    );
  }
);

export const processCharacterDeletionChunk = onCall<ProcessCharacterDeletionChunkInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<
      ProcessCharacterDeletionChunkInput,
      ProcessCharacterDeletionChunkResult
    >({
      request,
      operation: "process-character-deletion-chunk",
      allowedFields: ["jobId"],
      requiredFields: ["jobId"],
      fieldShapes: { jobId: "string" },
      rateLimits: [
        {
          key: `process-character-deletion-chunk:${callerUid}`,
          limit: 300,
          windowMs: 60 * 60 * 1000,
        },
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
      handler: ({ uid, data, idempotency }) =>
        runStartCampaignDeletionJob(
          data,
          uid,
          idempotencyKey,
          recoveryCodeHmacSecret.value(),
          idempotency
        ),
    });
  }
);

export const processCampaignDeletionChunk = onCall<ProcessCampaignDeletionChunkInput>(
  { secrets: [recoveryCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ProcessCampaignDeletionChunkInput, ProcessCampaignDeletionChunkResult>(
      {
        request,
        operation: "process-campaign-deletion-chunk",
        allowedFields: ["jobId"],
        requiredFields: ["jobId"],
        fieldShapes: { jobId: "string" },
        rateLimits: [
          {
            key: `process-campaign-deletion-chunk:${callerUid}`,
            limit: 300,
            windowMs: 60 * 60 * 1000,
          },
        ],
        handler: ({ uid, data }) =>
          runProcessCampaignDeletionChunk(data, uid, recoveryCodeHmacSecret.value()),
      }
    );
  }
);

export const startCustomItemMutationJob = onCall<StartCustomItemMutationJobInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    const idempotencyKey = `start-custom-item-mutation-job:${callerUid}:${request.data?.campaignId ?? ""}:${request.data?.customItemId ?? ""}:${request.data?.mode ?? ""}`;
    return protectedCallable<
      StartCustomItemMutationJobInput,
      { jobId: string; totalCount: number }
    >({
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
      handler: ({ uid, data, idempotency }) =>
        runStartCustomItemMutationJob(data, uid, idempotencyKey, idempotency),
    });
  }
);

export const processCustomItemMutationChunk = onCall<ProcessCustomItemMutationChunkInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<
      ProcessCustomItemMutationChunkInput,
      ProcessCustomItemMutationChunkResult
    >({
      request,
      operation: "process-custom-item-mutation-chunk",
      allowedFields: ["jobId"],
      requiredFields: ["jobId"],
      fieldShapes: { jobId: "string" },
      rateLimits: [
        {
          key: `process-custom-item-mutation-chunk:${callerUid}`,
          limit: 300,
          windowMs: 60 * 60 * 1000,
        },
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

export const createAccount = onCall(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<Record<string, never>, CreateAccountResult>({
      request,
      operation: "create-account",
      allowedFields: [],
      rateLimits: [{ key: `create-account:${callerUid}`, limit: 5, windowMs: 60 * 60 * 1000 }],
      handler: ({ uid }) => runCreateAccount(uid, identityCodeHmacSecret.value()),
    });
  }
);

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

export const discardOnboardingSetup = onCall(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<Record<string, never>, void>({
      request,
      operation: "discard-onboarding-setup",
      allowedFields: [],
      rateLimits: [
        { key: `discard-onboarding-setup:${callerUid}`, limit: 10, windowMs: 60 * 60 * 1000 },
      ],
      handler: ({ uid }) => runDiscardOnboardingSetup(uid, identityCodeHmacSecret.value()),
    });
  }
);

export const completeOnboarding = onCall({ timeoutSeconds: 30 }, (request) => {
  const callerUid = request.auth?.uid ?? "anonymous";
  return protectedCallable<Record<string, never>, void>({
    request,
    operation: "complete-onboarding",
    allowedFields: [],
    rateLimits: [{ key: `complete-onboarding:${callerUid}`, limit: 10, windowMs: 60 * 60 * 1000 }],
    handler: ({ uid }) => runCompleteOnboarding(uid),
  });
});

export const deleteAccount = onCall(
  { secrets: [identityCodeHmacSecret], timeoutSeconds: 60 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<Record<string, never>, DeleteAccountResult>({
      request,
      operation: "delete-account",
      allowedFields: [],
      rateLimits: [{ key: `delete-account:${callerUid}`, limit: 3, windowMs: 24 * 60 * 60 * 1000 }],
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
            "experience",
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
      handler: ({ uid, data, idempotency }) => runPatchCharacterField(data, uid, idempotency),
    });
  }
);

export const adjustCharacterNumber = onCall<AdjustCharacterNumberInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<AdjustCharacterNumberInput, void>({
      request,
      operation: "adjust-character-number",
      allowedFields: [
        "campaignId",
        "characterId",
        "field",
        "itemId",
        "property",
        "nestedCollection",
        "nestedItemId",
        "delta",
        "fallbackValue",
        "operationId",
      ],
      requiredFields: [
        "campaignId",
        "characterId",
        "field",
        "itemId",
        "property",
        "delta",
        "fallbackValue",
        "operationId",
      ],
      fieldShapes: {
        campaignId: "string",
        characterId: "string",
        field: {
          enum: ["consumables", "drugs", "grenades", "rangedWeapons", "meleeWeapons", "armour"],
        },
        itemId: "string",
        property: { enum: ["quantity", "spareCells", "clips", "rounds"] },
        nestedCollection: { enum: ["ammoEntries", "magazineSlots"] },
        nestedItemId: "string",
        operationId: "string",
      },
      payloadBounds: { maxBytes: 2_000, maxStringCharacters: 200 },
      rateLimits: [
        { key: `patch-character-field:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: buildOperationIdempotencyKey(
        "adjust-character-number",
        callerUid,
        (request.data as AdjustCharacterNumberInput | undefined)?.operationId
      ),
      handler: ({ uid, data, idempotency }) => runAdjustCharacterNumber(data, uid, idempotency),
    });
  }
);

export const reconcileCharacterSpentXp = onCall<ReconcileCharacterSpentXpInput>(
  { timeoutSeconds: 30 },
  (request) => {
    const callerUid = request.auth?.uid ?? "anonymous";
    return protectedCallable<ReconcileCharacterSpentXpInput, { updated: boolean }>({
      request,
      operation: "reconcile-character-spent-xp",
      allowedFields: ["campaignId", "characterId", "spent", "operationId"],
      requiredFields: ["campaignId", "characterId", "spent"],
      fieldShapes: { campaignId: "string", characterId: "string", operationId: "string" },
      rateLimits: [
        { key: `reconcile-character-spent-xp:${callerUid}`, limit: 300, windowMs: 60 * 60 * 1000 },
      ],
      idempotencyKey: buildOperationIdempotencyKey(
        "reconcile-character-spent-xp",
        callerUid,
        (request.data as ReconcileCharacterSpentXpInput | undefined)?.operationId
      ),
      handler: ({ uid, data, idempotency }) => runReconcileCharacterSpentXp(data, uid, idempotency),
    });
  }
);
