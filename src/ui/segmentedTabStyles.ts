export const uiSwipeableTabPanel =
  "min-h-[45vh] lg:min-h-0 transition-all duration-150 ease-out motion-reduce:transition-none";

function idPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function segmentedTabId(groupId: string, value: string) {
  return `${groupId}-${idPart(value)}-tab`;
}

export function segmentedTabPanelId(groupId: string, value: string) {
  return `${groupId}-${idPart(value)}-panel`;
}
