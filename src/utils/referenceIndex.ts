/** Keep the first match, like Array.find, and retain the original objects. */
export function indexReferences<T extends { id: string }>(
  references: readonly T[]
): Map<string, T> {
  const index = new Map<string, T>();
  for (const reference of references) {
    if (!index.has(reference.id)) index.set(reference.id, reference);
  }
  return index;
}
