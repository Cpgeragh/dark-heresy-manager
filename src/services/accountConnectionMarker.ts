const key = "dhm-previous-account-v1";
export const accountConnectionChanged = "dhm-account-connection-changed";

export function readAccountConnection(): { deviceUid: string; accountId: string } | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value && typeof value.deviceUid === "string" && typeof value.accountId === "string"
      ? { deviceUid: value.deviceUid, accountId: value.accountId }
      : null;
  } catch {
    return null;
  }
}

export function rememberAccountConnection(deviceUid: string, accountId: string) {
  if (!deviceUid || !accountId || deviceUid === accountId) return;
  try {
    const value = JSON.stringify({ deviceUid, accountId });
    if (localStorage.getItem(key) === value) return;
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event(accountConnectionChanged));
  } catch {
    /* Storage support must not block account access. */
  }
}

export function forgetAccountConnection(deviceUid: string) {
  if (readAccountConnection()?.deviceUid !== deviceUid) return;
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new Event(accountConnectionChanged));
  } catch {
    /* Storage support must not block unlinking. */
  }
}
