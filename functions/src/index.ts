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
import {
  registerRecoveryCode as runRegisterRecoveryCode,
  type RegisterRecoveryCodeInput,
} from "./operations/registerRecoveryCode.js";

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
      rateLimit: {
        key: `register-recovery-code:${request.auth?.uid ?? "anonymous"}`,
        limit: 20,
        windowMs: 60 * 60 * 1000,
      },
      handler: ({ uid, data }) => runRegisterRecoveryCode(data, uid, recoveryCodeHmacSecret.value()),
    })
);
