import type { SegmentedTabOption } from "../SegmentedTabs";
import { colourToggleSelectedFuchsia, colourToggleSelectedViolet } from "../styles/colourTokens";

export type UnlockedAllTab = "unlocked" | "all";

export const UNLOCKED_ALL_TABS = ["unlocked", "all"] as const satisfies readonly UnlockedAllTab[];

export const UNLOCKED_ALL_TAB_OPTIONS = [
  { value: "unlocked", label: "Unlocked", activeClassName: colourToggleSelectedViolet },
  { value: "all", label: "All", activeClassName: colourToggleSelectedFuchsia },
] as const satisfies readonly SegmentedTabOption<UnlockedAllTab>[];

export const UNLOCKED_ALL_TABS_ID = "unlocked-all";
