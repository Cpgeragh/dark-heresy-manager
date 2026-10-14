import { createContext, type ReactNode } from "react";
import type { ChatTarget } from "../components/chat/chatTarget";

export interface HeaderExtensionSetters {
  setBackHref: (href: string) => void;
  clearBackHref: () => void;
  setKebabContent: (content: ReactNode) => void;
  clearKebabContent: () => void;
  setChatTarget: (target: ChatTarget) => void;
  clearChatTarget: () => void;
}

export interface HeaderExtensionState {
  backHref: string | null;
  kebabContent: ReactNode;
  chatTarget: ChatTarget | null;
}

export const HeaderExtensionSettersContext = createContext<HeaderExtensionSetters>({
  setBackHref: () => undefined,
  clearBackHref: () => undefined,
  setKebabContent: () => undefined,
  clearKebabContent: () => undefined,
  setChatTarget: () => undefined,
  clearChatTarget: () => undefined,
});

export const HeaderExtensionStateContext = createContext<HeaderExtensionState>({
  backHref: null,
  kebabContent: null,
  chatTarget: null,
});
