import { hashForKey } from "./recoveryCode.js";

/**
 * Builds a retry key for one explicit client operation. Older clients may omit
 * the operation ID during a staged rollout; those calls remain transactional
 * but deliberately skip persistent idempotency rather than reusing a stale key.
 */
export function buildOperationIdempotencyKey(
  operation: string,
  callerUid: string,
  operationId: unknown
): string | undefined {
  if (typeof operationId !== "string") return undefined;
  return `${operation}:${callerUid}:${hashForKey(operationId)}`;
}
