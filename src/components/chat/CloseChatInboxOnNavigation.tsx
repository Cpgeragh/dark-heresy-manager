// src/components/chat/CloseChatInboxOnNavigation.tsx
//
// Closes the Messages modal when the page changes, so it never stays open over a new page.
// A change to the query string, such as switching a sheet tab, does not count.

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useChatInbox } from "../../context/useChatInbox";

export function CloseChatInboxOnNavigation() {
  const { pathname } = useLocation();
  const { close } = useChatInbox();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    close();
  }, [pathname, close]);

  return null;
}
