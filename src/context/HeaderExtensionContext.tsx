// src/context/HeaderExtensionContext.tsx

import { createContext, useContext, useState, useCallback } from "react";

// ================================================================
// SETTERS CONTEXT
// Stable — callbacks never change reference.
// Consumers (e.g. CharacterSheet) do NOT re-render when state changes.
// ================================================================
interface HeaderExtensionSetters {
  setBackHref: (href: string) => void;
  clearBackHref: () => void;
  setKebabContent: (content: React.ReactNode) => void;
  clearKebabContent: () => void;
}

const HeaderExtensionSettersContext = createContext<HeaderExtensionSetters>({
  setBackHref: () => {},
  clearBackHref: () => {},
  setKebabContent: () => {},
  clearKebabContent: () => {},
});

// ================================================================
// STATE CONTEXT
// Re-renders consumers (e.g. AppHeader) when values change.
// ================================================================
interface HeaderExtensionState {
  backHref: string | null;
  kebabContent: React.ReactNode;
}

const HeaderExtensionStateContext = createContext<HeaderExtensionState>({
  backHref: null,
  kebabContent: null,
});

// ================================================================
// PROVIDER
// ================================================================
export function HeaderExtensionProvider({ children }: { children: React.ReactNode }) {
  const [backHref, setBackHrefState] = useState<string | null>(null);
  const [kebabContent, setKebabContentState] = useState<React.ReactNode>(null);

  const setBackHref = useCallback((href: string) => setBackHrefState(href), []);
  const clearBackHref = useCallback(() => setBackHrefState(null), []);
  const setKebabContent = useCallback((c: React.ReactNode) => setKebabContentState(c), []);
  const clearKebabContent = useCallback(() => setKebabContentState(null), []);

  return (
    <HeaderExtensionSettersContext.Provider
      value={{ setBackHref, clearBackHref, setKebabContent, clearKebabContent }}
    >
      <HeaderExtensionStateContext.Provider value={{ backHref, kebabContent }}>
        {children}
      </HeaderExtensionStateContext.Provider>
    </HeaderExtensionSettersContext.Provider>
  );
}

// ================================================================
// HOOKS
// ================================================================

/**
 * For components that SET header content (CharacterSheet etc).
 * Does NOT re-render when header state changes — loop-safe.
 */
export function useHeaderExtensionSetters(): HeaderExtensionSetters {
  return useContext(HeaderExtensionSettersContext);
}

/**
 * For components that READ header content (AppHeader).
 * Re-renders when backHref or kebabContent changes.
 */
export function useHeaderExtension(): HeaderExtensionState {
  return useContext(HeaderExtensionStateContext);
}
