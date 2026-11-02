const EMPTY_MONEY_VALUES = new Set(["", "-", "—", "n/a", "na", "none", "variable", "varies"]);
const OPEN_ENDED_COST = /\+\s*(?:thrones?)?\s*$/i;

function formatInteger(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return Math.floor(value).toLocaleString("en-US");
}

function parseMoneyNumber(value?: string | number | null): number {
  if (typeof value === "number") return value;

  const trimmed = value?.trim() ?? "";
  if (EMPTY_MONEY_VALUES.has(trimmed.toLowerCase())) return 0;

  const normalized = trimmed
    .replace(/₮/g, "")
    .replace(/,/g, "")
    .replace(/thrones?/gi, "");
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

/** The lowest cost of a price written with a plus sign, such as "10,000+", or undefined for any other cost. */
export function openEndedCostMinimum(value?: string | null): number | undefined {
  if (typeof value !== "string" || !OPEN_ENDED_COST.test(value)) return undefined;
  return parseMoneyNumber(value);
}

export function formatMoneyForDisplay(value?: string | number | null): string {
  const unknown =
    value === undefined ||
    value === null ||
    (typeof value === "string" && EMPTY_MONEY_VALUES.has(value.trim().toLowerCase()));
  if (unknown) return "₮ —";
  const hasOpenEndedCost = typeof value === "string" && OPEN_ENDED_COST.test(value);
  return `₮ ${formatInteger(parseMoneyNumber(value))}${hasOpenEndedCost ? "+" : ""}`;
}
