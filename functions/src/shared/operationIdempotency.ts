import { hashForKey } from "./recoveryCode.js";

/**
 * Builds a retry key for one explicit client operation. A caller that omits
 * the operation ID gets no persistent idempotency key — its calls stay
 * transactional but aren't deduplicated across retries, rather than being
 * given a stale or reused key.
 */
export function buildOperationIdempotencyKey(
  operation: string,
  callerUid: string,
  operationId: unknown
): string | undefined {
  if (typeof operationId !== "string") return undefined;
  return `${operation}:${callerUid}:${hashForKey(operationId)}`;
}
