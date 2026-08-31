import { PRODUCT_LIMITS } from "../constants/productLimits";

export type ClientCodeAttemptKind = "recovery" | "device-link";

const STORAGE_KEY_PREFIX = "dh-manager:code-attempts:v1";

export class ClientCodeAttemptLimitError extends Error {
  readonly retryAt: number;

  constructor(kind: ClientCodeAttemptKind, retryAt: number, now: number) {
    const remainingMinutes = Math.max(1, Math.ceil((retryAt - now) / 60_000));
    const label = kind === "device-link" ? "device-link code" : "recovery-code";
    super(
      `Too many ${label} attempts. Try again in ${remainingMinutes} ${
        remainingMinutes === 1 ? "minute" : "minutes"
      }.`
    );
    this.name = "ClientCodeAttemptLimitError";
    this.retryAt = retryAt;
  }
}

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function getLimit(kind: ClientCodeAttemptKind): number {
  return kind === "device-link"
    ? PRODUCT_LIMITS.linkCodeAttemptsPerWindow
    : PRODUCT_LIMITS.recoveryCodeAttemptsPerWindow;
}

/**
 * Records one valid code-entry attempt for this browser profile. The counter
 * is a cost/UI guard rather than the security boundary; server-side limits
 * still apply if browser storage is unavailable or altered.
 */
export function recordClientCodeAttempt(
  kind: ClientCodeAttemptKind,
  now = Date.now()
): void {
  const storage = getStorage();
  if (!storage) return;

  const key = `${STORAGE_KEY_PREFIX}:${kind}`;
  let stored: unknown = [];
  try {
    stored = JSON.parse(storage.getItem(key) ?? "[]");
  } catch {
    stored = [];
  }

  const attempts = Array.isArray(stored)
    ? stored.filter(
        (timestamp): timestamp is number =>
          typeof timestamp === "number" &&
          Number.isFinite(timestamp) &&
          timestamp <= now &&
          now - timestamp < PRODUCT_LIMITS.codeAttemptWindowMs
      )
    : [];

  const limit = getLimit(kind);
  if (attempts.length >= limit) {
    const retryAt = Math.min(...attempts) + PRODUCT_LIMITS.codeAttemptWindowMs;
    throw new ClientCodeAttemptLimitError(kind, retryAt, now);
  }

  attempts.push(now);
  try {
    storage.setItem(key, JSON.stringify(attempts));
  } catch {
    // Server-side throttling remains active when browser storage cannot write.
  }
}
