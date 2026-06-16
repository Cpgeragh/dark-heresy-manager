// src/components/TabButton.tsx

import { useCallback } from "react";
import type { TabId } from "../pages/characterSheet/types";

interface TabButtonProps {
  label: string;
  active: boolean;
  tabId: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function TabButton({ label, active, tabId, onTabChange }: TabButtonProps) {
  const handleClick = useCallback(() => {
    onTabChange(tabId);
  }, [tabId, onTabChange]);

  return (
    <button
      onClick={handleClick}
      role="tab"
      aria-selected={active}
      aria-label={`${label} tab`}
      className={`shrink-0 whitespace-nowrap px-3 py-1 rounded text-sm border transition ${
        active
          ? "bg-red-500/20 text-red-400 border-red-500 font-semibold"
          : "border-slate-600 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
