// src/hooks/useDMOverride.ts

import { useState, useCallback } from "react";

export function useDMOverride() {
  const [dmReadOnly, setDmReadOnly] = useState(true);

  const toggleDmReadOnly = useCallback(() => {
    setDmReadOnly((prev) => !prev);
  }, []);

  return {
    dmReadOnly,
    toggleDmReadOnly,
  };
}