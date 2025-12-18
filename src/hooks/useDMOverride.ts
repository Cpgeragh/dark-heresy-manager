// src/hooks/useDMOverride.ts

import { useState, useCallback } from "react";

/**
 * Hook to manage DM override/read-only mode.
 * When dmReadOnly is true, the DM views the character in read-only mode.
 * When false, the DM can edit the character.
 * 
 * @returns Object with dmReadOnly state and toggle function
 */
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