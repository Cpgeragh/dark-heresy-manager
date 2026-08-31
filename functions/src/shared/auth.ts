// functions/src/shared/auth.ts
//
// Shared auth + App Check gate for every protected callable. Every
// callable requires a signed-in caller. App Check is verified and
// recorded, not yet enforced — it needs a period of clean App Check
// monitoring in production before it's allowed to block a real call.

import { HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

export interface CallerContext {
  uid: string;
  appCheckVerified: boolean;
}

export function requireAuth(request: CallableRequest): CallerContext {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  const appCheckVerified = request.app !== undefined;
  if (!appCheckVerified) {
    logger.warn("Callable invoked without a verified App Check token");
  }

  return { uid: request.auth.uid, appCheckVerified };
}
