import { createContext, type ReactNode } from "react";

export interface HeaderExtensionSetters {
  setBackHref: (href: string) => void;
  clearBackHref: () => void;
  setKebabContent: (content: ReactNode) => void;
  clearKebabContent: () => void;
}

export interface HeaderExtensionState {
  backHref: string | null;
  kebabContent: ReactNode;
}

export const HeaderExtensionSettersContext = createContext<HeaderExtensionSetters>({
  setBackHref: () => undefined,
  clearBackHref: () => undefined,
  setKebabContent: () => undefined,
  clearKebabContent: () => undefined,
});

export const HeaderExtensionStateContext = createContext<HeaderExtensionState>({
  backHref: null,
  kebabContent: null,
});
