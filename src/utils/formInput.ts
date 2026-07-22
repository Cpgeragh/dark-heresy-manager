export function sanitizeNonNegativeIntegerInput(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

export function sanitizePositiveIntegerInput(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+/, "");
}

export function sanitizeDiceInput(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^0-9d]/g, "");
  const [first = "", ...rest] = cleaned.split("d");
  return rest.length === 0 ? first : `${first}d${rest.join("")}`;
}
