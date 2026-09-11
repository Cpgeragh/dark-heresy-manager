import { PRODUCT_LIMITS } from "../constants/productLimits";

export type ClientCodeAttemptKind = "recovery" | "device-link";

const STORAGE_KEY_PREFIX = "dh-manager:code-attempts:v1";

interface StoredCodeAttempts {
  attempts: number[];
  lockoutUntil?: number;
}

export class ClientCodeAttemptLimitError extends Error {
  readonly retryAt: number;

  constructor(kind: ClientCodeAttemptKind, retryAt: number, now: number) {
    const remainingMinutes = Math.max(1, Math.ceil((retryAt - now) / 60_000));
    const label = kind === "device-link" ? "device-link" : "recovery-code";
    const limit = getLimit(kind);
    super(
      `${limit}-attempt ${label} limit reached. Try again in ${remainingMinutes} ${
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
export function recordClientCodeAttempt(kind: ClientCodeAttemptKind, now = Date.now()): void {
  const storage = getStorage();
  if (!storage) return;

  const key = `${STORAGE_KEY_PREFIX}:${kind}`;
  let stored: unknown = [];
  try {
    stored = JSON.parse(storage.getItem(key) ?? "[]");
  } catch {
    stored = [];
  }

  const storedAttempts = Array.isArray(stored)
    ? stored
    : stored && typeof stored === "object" && Array.isArray((stored as StoredCodeAttempts).attempts)
      ? (stored as StoredCodeAttempts).attempts
      : [];
  const storedLockoutUntil =
    !Array.isArray(stored) &&
    stored &&
    typeof stored === "object" &&
    typeof (stored as StoredCodeAttempts).lockoutUntil === "number" &&
    Number.isFinite((stored as StoredCodeAttempts).lockoutUntil)
      ? (stored as StoredCodeAttempts).lockoutUntil
      : undefined;

  if (storedLockoutUntil && storedLockoutUntil > now) {
    throw new ClientCodeAttemptLimitError(kind, storedLockoutUntil, now);
  }

  const attempts = storedAttempts.filter(
    (timestamp): timestamp is number =>
      typeof timestamp === "number" &&
      Number.isFinite(timestamp) &&
      timestamp <= now &&
      now - timestamp < PRODUCT_LIMITS.codeAttemptWindowMs
  );

  const limit = getLimit(kind);
  if (attempts.length >= limit) {
    // Wait until every attempt in the full window has expired. Using the
    // oldest attempt here briefly restored one slot, then a retry could make
    // the displayed wait jump upward again.
    const retryAt = Math.max(...attempts) + PRODUCT_LIMITS.codeAttemptWindowMs;
    try {
      storage.setItem(key, JSON.stringify({ attempts, lockoutUntil: retryAt }));
    } catch {
      // Server-side throttling remains active when browser storage cannot write.
    }
    throw new ClientCodeAttemptLimitError(kind, retryAt, now);
  }

  attempts.push(now);
  try {
    storage.setItem(key, JSON.stringify({ attempts }));
  } catch {
    // Server-side throttling remains active when browser storage cannot write.
  }
}
