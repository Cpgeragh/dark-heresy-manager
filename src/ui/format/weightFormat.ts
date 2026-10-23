const ZERO_WEIGHT_VALUES = new Set(["-", "—", "n/a", "na", "none"]);
const VARIABLE_WEIGHT_VALUES = new Set(["variable", "varies"]);

export const WEIGHT_NUMBER_INPUT_RE = /^$|^\d+(?:\.\d*)?$/;

const WEIGHT_RE = /^([+-]?\d+(?:\.\d+)?)\s*(kg\b.*)?$/i;

function formatNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return Number(value.toFixed(2)).toString();
}

export function sanitizeWeightInput(value: string): string {
  const next = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = next.split(".");
  const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : next;
  return WEIGHT_NUMBER_INPUT_RE.test(normalized) ? normalized : "";
}

export function formatWeightInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "0 kg";
  const parsed = Number(trimmed);
  return `${formatNumber(parsed)} kg`;
}

function cleanWeight(value?: string | null): string {
  return (value ?? "").replace(/†+$/, "").trim();
}

/** Reads a stored weight as kilograms, or null when it holds no usable number. */
export function readWeightKg(value?: string | null): number | null {
  const cleaned = cleanWeight(value);
  const lower = cleaned.toLowerCase();
  if (ZERO_WEIGHT_VALUES.has(lower)) return 0;
  if (!cleaned || VARIABLE_WEIGHT_VALUES.has(lower)) return null;
  const match = cleaned.match(WEIGHT_RE);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The weight as shown, or an empty string when it has no usable number. */
export function formatWeightForDisplay(value?: string | null): string {
  const cleaned = cleanWeight(value);
  if (VARIABLE_WEIGHT_VALUES.has(cleaned.toLowerCase())) return "Varies";
  const kg = readWeightKg(cleaned);
  if (kg === null) return "";
  const extra = cleaned
    .match(WEIGHT_RE)?.[2]
    ?.replace(/^kg\s*/i, "")
    .trim();
  const text = `${cleaned.startsWith("+") ? "+" : ""}${formatNumber(kg)} kg`;
  return extra ? `${text} ${extra}` : text;
}
