// functions/src/shared/protectedCallable.ts
//
// Stage 3.1: the composed protected-operation foundation. Every real
// callable built in 3.2+ goes through this once, rather than assembling
// the six independent pieces (errors, auth, validation, rate limiting,
// idempotency, audit/metrics) by hand each time.
//
// Order matters: cheapest, most decisive checks run first (auth, request
// shape) before anything that costs a Firestore read/write (rate limiting,
// the handler itself). Audit and metric recording never fail the call —
// they're observability, not a gate, so a logging failure never masks or
// blocks a real result.

import type { CallableRequest } from "firebase-functions/v2/https";
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
import { withIdempotency } from "./idempotency.js";
import { recordAuditEntry } from "./audit.js";
import { recordUsageMetric } from "./metrics.js";

export interface ProtectedCallableOptions<TData, TResult> {
  request: CallableRequest<TData>;
  operation: string;
  allowedFields: readonly string[];
  requiredFields?: readonly string[];
  fieldShapes?: Record<string, FieldShape>;
  rateLimits?: readonly { key: string; limit: number; windowMs: number }[];
  idempotencyKey?: string;
  handler: (context: { uid: string; appCheckVerified: boolean; data: TData }) => Promise<TResult>;
}

async function recordOutcome(
  operation: string,
  actorUid: string,
  outcome: "success" | "failure"
): Promise<void> {
  try {
    await recordAuditEntry({ operation, actorUid, outcome });
    await recordUsageMetric(operation);
  } catch {
    logger.warn(`Failed to record audit/metric for ${operation}`);
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
    assertRequestPayloadBounds(options.request.data, { maxBytes: 4_000, maxStringCharacters: 500 });

    if (options.rateLimits) {
      for (const rateLimit of options.rateLimits) {
        await enforceRateLimit(rateLimit);
      }
    }

    const run = () => options.handler({ uid, appCheckVerified, data: options.request.data });

    try {
      const result = options.idempotencyKey
        ? await withIdempotency(options.idempotencyKey, run)
        : await run();
      await recordOutcome(options.operation, uid, "success");
      return result;
    } catch (error) {
      await recordOutcome(options.operation, uid, "failure");
      throw error;
    }
  });
}
