// src/hooks/useQuantityEdit.ts
// Shared state logic for inline quantity editing (− / display / + with click-to-type).

import { useState, useCallback } from "react";

/**
 * Manages the three-state quantity editor: decrement button, clickable
 * display that becomes a text input on click, and increment button.
 *
 * @param quantity  The current numeric value (read from the item).
 * @param onUpdate  Called with the new value on commit.
 */
export function useQuantityEdit(
  quantity: number,
  onUpdate: (qty: number) => void,
) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const start = useCallback(() => {
    setDraft(String(quantity));
    setEditing(true);
  }, [quantity]);

  const commit = useCallback(() => {
    const val = parseInt(draft, 10);
    onUpdate(!isNaN(val) && val >= 0 ? val : quantity);
    setEditing(false);
  }, [draft, quantity, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") setEditing(false);
    },
    [commit],
  );

  return { editing, draft, setDraft, start, commit, handleKeyDown };
}
