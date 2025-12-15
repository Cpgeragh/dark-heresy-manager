// src/hooks/useSkillGroupCollapse.ts

import { useState, useCallback } from "react";

interface CollapsedState {
  [key: string]: boolean;
}

export function useSkillGroupCollapse(initialKeys: string[]) {
  const [collapsed, setCollapsed] = useState<CollapsedState>(() =>
    Object.fromEntries(initialKeys.map((k) => [k, true]))
  );

  const toggleGroup = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setGroupCollapsed = useCallback((key: string, value: boolean) => {
    setCollapsed((prev) => ({ ...prev, [key]: value }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsed((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, false]))
    );
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsed((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, true]))
    );
  }, []);

  return {
    collapsed,
    toggleGroup,
    setGroupCollapsed,
    expandAll,
    collapseAll,
  };
}