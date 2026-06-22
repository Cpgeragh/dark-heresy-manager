const EMPTY_WEIGHT_VALUES = new Set(["", "-", "—", "â€”", "n/a", "na", "none", "variable", "varies"]);

export const WEIGHT_NUMBER_INPUT_RE = /^$|^\d+(?:\.\d*)?$/;

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

export function formatWeightForDisplay(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (EMPTY_WEIGHT_VALUES.has(trimmed.toLowerCase())) return "0 kg";

  const numeric = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:kg)?$/i);
  if (!numeric) return "0 kg";

  const parsed = Number(numeric[1]);
  if (!Number.isFinite(parsed)) return "0 kg";
  if (parsed < 0) return "0 kg";
  return `${numeric[1].startsWith("+") ? "+" : ""}${formatNumber(parsed)} kg`;
}
