export function isInstalled(item: { installed?: boolean }): boolean {
  return item.installed !== false;
}
