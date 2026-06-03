// src/context/HeaderExtensionContext.tsx

import { createContext, useContext, useState, useCallback } from "react";

interface HeaderExtensionContextValue {
  backHref: string | null;
  secondRow: React.ReactNode;
  kebabContent: React.ReactNode;
  setBackHref: (href: string) => void;
  setSecondRow: (content: React.ReactNode) => void;
  setKebabContent: (content: React.ReactNode) => void;
  clearBackHref: () => void;
  clearSecondRow: () => void;
  clearKebabContent: () => void;
}

const HeaderExtensionContext = createContext<HeaderExtensionContextValue>({
  backHref: null,
  secondRow: null,
  kebabContent: null,
  setBackHref: () => {},
  setSecondRow: () => {},
  setKebabContent: () => {},
  clearBackHref: () => {},
  clearSecondRow: () => {},
  clearKebabContent: () => {},
});

export function HeaderExtensionProvider({ children }: { children: React.ReactNode }) {
  const [backHref, setBackHrefState] = useState<string | null>(null);
  const [secondRow, setSecondRowState] = useState<React.ReactNode>(null);
  const [kebabContent, setKebabContentState] = useState<React.ReactNode>(null);

  const setBackHref = useCallback((href: string) => setBackHrefState(href), []);
  const setSecondRow = useCallback((c: React.ReactNode) => setSecondRowState(c), []);
  const setKebabContent = useCallback((c: React.ReactNode) => setKebabContentState(c), []);
  const clearBackHref = useCallback(() => setBackHrefState(null), []);
  const clearSecondRow = useCallback(() => setSecondRowState(null), []);
  const clearKebabContent = useCallback(() => setKebabContentState(null), []);

  return (
    <HeaderExtensionContext.Provider value={{
      backHref, secondRow, kebabContent,
      setBackHref, setSecondRow, setKebabContent,
      clearBackHref, clearSecondRow, clearKebabContent,
    }}>
      {children}
    </HeaderExtensionContext.Provider>
  );
}

export function useHeaderExtension() {
  return useContext(HeaderExtensionContext);
}
