import { useCallback, useState, type ReactNode } from "react";
import type { ChatTarget } from "../components/chat/chatTarget";
import {
  HeaderExtensionSettersContext,
  HeaderExtensionStateContext,
} from "./HeaderExtensionContexts";

export function HeaderExtensionProvider({ children }: { children: ReactNode }) {
  const [backHref, setBackHrefState] = useState<string | null>(null);
  const [kebabContent, setKebabContentState] = useState<ReactNode>(null);
  const [chatTarget, setChatTargetState] = useState<ChatTarget | null>(null);

  const setBackHref = useCallback((href: string) => setBackHrefState(href), []);
  const clearBackHref = useCallback(() => setBackHrefState(null), []);
  const setKebabContent = useCallback((content: ReactNode) => setKebabContentState(content), []);
  const clearKebabContent = useCallback(() => setKebabContentState(null), []);
  const setChatTarget = useCallback((target: ChatTarget) => setChatTargetState(target), []);
  const clearChatTarget = useCallback(() => setChatTargetState(null), []);

  return (
    <HeaderExtensionSettersContext.Provider
      value={{
        setBackHref,
        clearBackHref,
        setKebabContent,
        clearKebabContent,
        setChatTarget,
        clearChatTarget,
      }}
    >
      <HeaderExtensionStateContext.Provider value={{ backHref, kebabContent, chatTarget }}>
        {children}
      </HeaderExtensionStateContext.Provider>
    </HeaderExtensionSettersContext.Provider>
  );
}
