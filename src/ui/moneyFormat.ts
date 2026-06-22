const EMPTY_MONEY_VALUES = new Set([
  "",
  "-",
  "—",
  "â€”",
  "Ã¢â‚¬â€",
  "n/a",
  "na",
  "none",
  "variable",
  "varies",
]);

export const MONEY_NUMBER_INPUT_RE = /^\d*$/;

function formatInteger(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return Math.floor(value).toLocaleString("en-US");
}

function parseMoneyNumber(value?: string | number | null): number {
  if (typeof value === "number") return value;

  const trimmed = value?.trim() ?? "";
  if (EMPTY_MONEY_VALUES.has(trimmed.toLowerCase())) return 0;

  const normalized = trimmed.replace(/₮/g, "").replace(/,/g, "").replace(/thrones?/gi, "");
  const match = normalized.match(/\d+/);
  if (!match) return 0;

  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function sanitizeMoneyInput(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatMoneyInput(value: string): string {
  return `${formatInteger(parseMoneyNumber(value))} Thrones`;
}

export function formatMoneyForDisplay(value?: string | number | null): string {
  return `₮ ${formatInteger(parseMoneyNumber(value))} Thrones`;
}
