// functions/src/shared/errors.ts
//
// Stage 3.1: shared safe-error handling for every protected callable.
// A callable that throws HttpsError is throwing a deliberate, already-safe
// error — it passes through unchanged. Anything else is an unexpected
// failure: the real error is logged server-side only, and the client only
// ever sees a generic message, never internal details.

import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

const MAX_ERROR_LABEL_LENGTH = 100;

function safeErrorMetadata(error: unknown): { errorType: string; errorCode?: string } {
  const errorType = (error instanceof Error ? error.name : typeof error).slice(
    0,
    MAX_ERROR_LABEL_LENGTH
  );
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return { errorType };
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string"
    ? { errorType, errorCode: code.slice(0, MAX_ERROR_LABEL_LENGTH) }
    : { errorType };
}

export async function withSafeErrors<T>(operation: string, handler: () => Promise<T>): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error(`${operation} failed`, safeErrorMetadata(error));
    throw new HttpsError("internal", "Something went wrong. Please try again.");
  }
}
