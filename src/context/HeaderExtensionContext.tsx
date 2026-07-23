import { useCallback, useState, type ReactNode } from "react";
import {
  HeaderExtensionSettersContext,
  HeaderExtensionStateContext,
} from "./HeaderExtensionContexts";

export function HeaderExtensionProvider({ children }: { children: ReactNode }) {
  const [backHref, setBackHrefState] = useState<string | null>(null);
  const [kebabContent, setKebabContentState] = useState<ReactNode>(null);

  const setBackHref = useCallback((href: string) => setBackHrefState(href), []);
  const clearBackHref = useCallback(() => setBackHrefState(null), []);
  const setKebabContent = useCallback(
    (content: ReactNode) => setKebabContentState(content),
    []
  );
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
