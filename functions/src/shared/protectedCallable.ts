// functions/src/shared/protectedCallable.ts
//
// The composed protected-operation foundation. Every real
// callable goes through this once, rather than assembling
// the six independent pieces (errors, auth, validation, rate limiting,
// idempotency, audit/metrics) by hand each time.
//
// Order matters: cheapest, most decisive checks run first (auth, request
// shape) before anything that costs a Firestore read/write (rate limiting,
// the handler itself). Audit and metric recording never fail the call —
// they're observability, not a gate, so a logging failure never masks or
// blocks a real result.

import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { withSafeErrors } from "./errors.js";
import { requireAuth } from "./auth.js";
import {
  assertRequestFields,
  assertFieldShapes,
  assertRequestPayloadBounds,
  type FieldShape,
} from "./validation.js";
import { enforceRateLimit } from "./rateLimit.js";
import { claimIdempotency } from "./idempotency.js";
import type { IdempotencyClaim, IdempotencyExecution } from "./idempotency.js";
import { recordCallableOutcome } from "./audit.js";

type RateLimitConfig = readonly { key: string; limit: number; windowMs: number }[];

export interface ProtectedCallableOptions<TData, TResult> {
  request: CallableRequest<TData>;
  operation: string;
  allowedFields: readonly string[];
  requiredFields?: readonly string[];
  fieldShapes?: Record<string, FieldShape>;
  payloadBounds?: { maxBytes: number; maxStringCharacters: number };
  rateLimits?: RateLimitConfig;
  idempotencyKey?: string;
  handler: (context: {
    uid: string;
    appCheckVerified: boolean;
    data: TData;
    idempotency: IdempotencyExecution<TResult> | null;
  }) => Promise<TResult>;
}

async function recordOutcome(
  operation: string,
  actorUid: string,
  outcome: "success" | "failure"
): Promise<void> {
  try {
    await recordCallableOutcome({ operation, actorUid, outcome });
  } catch {
    logger.warn(`Failed to record audit/metric for ${operation}`);
  }
}

async function enforceAllRateLimits(
  rateLimits: RateLimitConfig | undefined,
  operation: string
): Promise<void> {
  if (!rateLimits) return;
  for (const rateLimit of rateLimits) {
    try {
      await enforceRateLimit(rateLimit);
    } catch (error) {
      if (error instanceof HttpsError && error.code === "resource-exhausted") {
        // No raw key or account identifier is logged.
        logger.warn("rate-limit-rejected", { operation });
      }
      throw error;
    }
  }
}

export async function protectedCallable<TData, TResult>(
  options: ProtectedCallableOptions<TData, TResult>
): Promise<TResult> {
  return withSafeErrors(options.operation, async () => {
    const { uid, appCheckVerified } = requireAuth(options.request);
    assertRequestFields(options.request.data, options.allowedFields, options.requiredFields ?? []);
    if (options.fieldShapes) {
      assertFieldShapes(options.request.data, options.fieldShapes);
    }
    assertRequestPayloadBounds(
      options.request.data,
      options.payloadBounds ?? { maxBytes: 4_000, maxStringCharacters: 500 }
    );

    // The rate-limit check and the idempotency claim touch different
    // documents and don't depend on each other, so they run together
    // instead of one after the other. If the rate limit rejects the call
    // after the claim already succeeded, the claim is released rather
    // than left behind as an orphaned in-progress lease.
    let idempotencyClaim: IdempotencyClaim<TResult> | null = null;
    if (options.idempotencyKey) {
      const [rateLimitResult, claimResult] = await Promise.allSettled([
        enforceAllRateLimits(options.rateLimits, options.operation),
        claimIdempotency<TResult>(options.idempotencyKey),
      ]);
      if (claimResult.status === "fulfilled" && rateLimitResult.status === "rejected") {
        await claimResult.value.release?.();
      }
      if (rateLimitResult.status === "rejected") throw rateLimitResult.reason;
      if (claimResult.status === "rejected") throw claimResult.reason;
      idempotencyClaim = claimResult.value;
    } else {
      await enforceAllRateLimits(options.rateLimits, options.operation);
    }

    const run = (idempotency: IdempotencyExecution<TResult> | null) =>
      options.handler({ uid, appCheckVerified, data: options.request.data, idempotency });

    try {
      let result: TResult;
      if (idempotencyClaim?.kind === "replay") {
        result = idempotencyClaim.result as TResult;
      } else if (idempotencyClaim?.kind === "claimed") {
        try {
          result = await run(idempotencyClaim.execution!);
        } catch (error) {
          await idempotencyClaim.release?.();
          throw error;
        }
      } else {
        result = await run(null);
      }
      await recordOutcome(options.operation, uid, "success");
      return result;
    } catch (error) {
      await recordOutcome(options.operation, uid, "failure");
      throw error;
    }
  });
}
