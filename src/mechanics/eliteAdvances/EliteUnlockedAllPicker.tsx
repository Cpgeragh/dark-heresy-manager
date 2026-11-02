import { useState, type ReactNode } from "react";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import { PickerModal } from "../../ui/pickers/PickerModal";
import { SegmentedTabs, type SegmentedTabOption } from "../../ui/SegmentedTabs";
import {
  colourToggleSelectedFuchsia,
  colourToggleSelectedViolet,
} from "../../ui/styles/colourTokens";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/styles/segmentedTabStyles";

export type EliteListTab = "unlocked" | "all";

const ELITE_LIST_TABS = ["unlocked", "all"] as const satisfies readonly EliteListTab[];
const ELITE_LIST_TAB_OPTIONS = [
  { value: "unlocked", label: "Unlocked", activeClassName: colourToggleSelectedViolet },
  { value: "all", label: "All", activeClassName: colourToggleSelectedFuchsia },
] as const satisfies readonly SegmentedTabOption<EliteListTab>[];
const ELITE_LIST_TABS_ID = "elite-list";

interface EliteUnlockedAllPickerProps {
  title: string;
  onClose: () => void;
  /** The rows of one tab for the current search text, and whether that list is empty. */
  renderTab: (tab: EliteListTab, query: string) => { rows: ReactNode; isEmpty: boolean };
  emptyMessage?: string;
  /** Keeps the pop-up, its tab and its search text while another pop-up opened from it is showing. */
  suspended?: boolean;
}

/** The pop-up every Elite page opens to buy from: an "Unlocked" list and an "All" list, swiped or tapped between. */
export function EliteUnlockedAllPicker({
  title,
  onClose,
  renderTab,
  emptyMessage = "Nothing available.",
  suspended = false,
}: EliteUnlockedAllPickerProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<EliteListTab>("unlocked");
  const { containerRef, transitionClass, switchTo } = useSwipeableTabs(
    ELITE_LIST_TABS,
    tab,
    setTab
  );
  const { rows, isEmpty } = renderTab(tab, query);

  return (
    <PickerModal
      title={title}
      query={query}
      onQueryChange={setQuery}
      onClose={onClose}
      isEmpty={isEmpty}
      emptyMessage={emptyMessage}
      suspended={suspended}
      filterRow={
        <SegmentedTabs
          id={ELITE_LIST_TABS_ID}
          ariaLabel="Elite list"
          options={ELITE_LIST_TAB_OPTIONS}
          value={tab}
          onChange={switchTo}
          className="w-full"
        />
      }
    >
      <div
        ref={containerRef}
        id={segmentedTabPanelId(ELITE_LIST_TABS_ID, tab)}
        role="tabpanel"
        aria-labelledby={segmentedTabId(ELITE_LIST_TABS_ID, tab)}
        className={`min-h-[40vh] ${[uiSwipeableTabPanel, transitionClass].join(" ")}`}
      >
        {rows}
      </div>
    </PickerModal>
  );
}
