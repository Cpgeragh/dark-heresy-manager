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
import { hashRecoveryCode } from "./shared/recoveryCode.js";
import {
  registerRecoveryCode as runRegisterRecoveryCode,
  type RegisterRecoveryCodeInput,
} from "./operations/registerRecoveryCode.js";
import {
  lookupRecoveryCode as runLookupRecoveryCode,
  type LookupRecoveryCodeInput,
  type LookupRecoveryCodeResult,
} from "./operations/lookupRecoveryCode.js";

export const ping = onCall(() => {
  return { ok: true };
});

export const protectedPing = onCall((request) =>
  protectedCallable({
    request,
    operation: "protected-ping",
    allowedFields: [],
    handler: async () => ({ ok: true }),
  })
);

export const registerRecoveryCode = onCall<RegisterRecoveryCodeInput>(
  { secrets: [recoveryCodeHmacSecret] },
  (request) =>
    protectedCallable<RegisterRecoveryCodeInput, { code: string }>({
      request,
      operation: "register-recovery-code",
      allowedFields: ["campaignId", "characterId"],
      requiredFields: ["campaignId", "characterId"],
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
  { secrets: [recoveryCodeHmacSecret] },
  (request) =>
    protectedCallable<LookupRecoveryCodeInput, LookupRecoveryCodeResult>({
      request,
      operation: "lookup-recovery-code",
      allowedFields: ["code"],
      requiredFields: ["code"],
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
