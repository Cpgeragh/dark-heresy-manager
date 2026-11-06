import { useState, type ReactNode } from "react";
import { useSwipeableTabs } from "../../hooks/useSwipeableTabs";
import { PickerModal } from "../../ui/pickers/PickerModal";
import {
  UNLOCKED_ALL_TAB_OPTIONS,
  UNLOCKED_ALL_TABS,
  UNLOCKED_ALL_TABS_ID,
  type UnlockedAllTab,
} from "../../ui/pickers/unlockedAllTabs";
import { SegmentedTabs } from "../../ui/SegmentedTabs";
import {
  segmentedTabId,
  segmentedTabPanelId,
  uiSwipeableTabPanel,
} from "../../ui/styles/segmentedTabStyles";

export type EliteListTab = UnlockedAllTab;

interface EliteUnlockedAllPickerProps {
  title: string;
  onClose: () => void;
  /** The rows of one tab for the current search text, and whether that list is empty. */
  renderTab: (tab: EliteListTab, query: string) => { rows: ReactNode; isEmpty: boolean };
  emptyMessage?: string;
  /** Keeps the pop-up, its tab and its search text while another pop-up opened from it is showing. */
  suspended?: boolean;
}

/** The pop-up the Elite pages open to buy from: an "Unlocked" list and an "All" list, swiped or tapped between. */
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
    UNLOCKED_ALL_TABS,
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
          id={UNLOCKED_ALL_TABS_ID}
          ariaLabel="Elite list"
          options={UNLOCKED_ALL_TAB_OPTIONS}
          value={tab}
          onChange={switchTo}
          className="w-full"
        />
      }
    >
      <div
        ref={containerRef}
        id={segmentedTabPanelId(UNLOCKED_ALL_TABS_ID, tab)}
        role="tabpanel"
        aria-labelledby={segmentedTabId(UNLOCKED_ALL_TABS_ID, tab)}
        className={`min-h-[40vh] ${[uiSwipeableTabPanel, transitionClass].join(" ")}`}
      >
        {rows}
      </div>
    </PickerModal>
  );
}
