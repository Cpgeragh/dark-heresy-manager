// src/hooks/useReturnFocusAfterEdit.ts
// Returns focus to a click-to-edit value after the keyboard closes its editor.

import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

/**
 * Attach `valueRef` to the button that opens the editor and call `markReturn` from the editor's
 * key handler. Enter or Escape closes the editor and puts focus back on the button; closing by
 * clicking or tabbing away leaves focus where the user put it. Focus moves one tick later, so the
 * Enter that closed the editor is finished before the button can receive it and reopen the editor.
 */
export function useReturnFocusAfterEdit(editing: boolean) {
  const valueRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (editing || !returnFocus.current) return;
    returnFocus.current = false;
    const timer = window.setTimeout(() => valueRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [editing]);

  const markReturn = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Escape") returnFocus.current = true;
  };

  return { valueRef, markReturn };
}
