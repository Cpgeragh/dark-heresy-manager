const VARIABLE_META_VALUES = new Set(["\u2014", "variable", "varies"]);

export function isVariableMeta(value?: string | null): boolean {
  const normalized = value?.trim().toLowerCase();
  return !normalized || VARIABLE_META_VALUES.has(normalized);
}
