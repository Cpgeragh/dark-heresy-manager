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
      className={`px-3 py-1 rounded text-sm border transition ${
        active
          ? "bg-amber-500 text-slate-900 border-amber-400 font-semibold"
          : "border-slate-600 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}