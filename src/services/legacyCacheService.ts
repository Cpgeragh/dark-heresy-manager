const CLEAR_REQUEST_KEY = "dhm-clear-legacy-secret-cache";
const CLEAR_RESULT_KEY = "dhm-legacy-secret-cache-result";
const CLEARED_KEY = "dhm-legacy-secret-cache-cleared-v1";

export function legacySecretCacheNeedsClearing(): boolean {
  return localStorage.getItem(CLEARED_KEY) !== "1";
}

export function legacySecretCacheClearFailed(): boolean {
  return sessionStorage.getItem(CLEAR_RESULT_KEY) === "failed";
}

export function requestLegacySecretCacheClear(): void {
  sessionStorage.setItem(CLEAR_REQUEST_KEY, "1");
  sessionStorage.removeItem(CLEAR_RESULT_KEY);
  window.location.reload();
}

export function isLegacySecretCacheClearRequested(): boolean {
  return sessionStorage.getItem(CLEAR_REQUEST_KEY) === "1";
}

export function finishLegacySecretCacheClear(succeeded: boolean): void {
  sessionStorage.removeItem(CLEAR_REQUEST_KEY);
  sessionStorage.setItem(CLEAR_RESULT_KEY, succeeded ? "cleared" : "failed");
  if (succeeded) localStorage.setItem(CLEARED_KEY, "1");
}
