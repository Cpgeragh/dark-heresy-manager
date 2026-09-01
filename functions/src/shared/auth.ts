// functions/src/shared/auth.ts
//
// Shared auth + App Check gate for every protected callable. Every
// callable requires a signed-in caller. App Check verification result
// is checked and recorded on every call, but a failed or missing
// check never blocks the request by itself, only signed-in-caller
// status does. Recording without blocking is what makes it possible
// to catch a false positive without ever locking out a real user
// over it.

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
