import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeps typing local and coalesces it into one persistence callback after the
 * user pauses. Pending text is also flushed on blur or unmount so navigation
 * cannot silently discard the final edit.
 */
export function useDebouncedDraft(
  value: string,
  onCommit: (value: string) => void,
  delayMs: number
) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(value);
  const sourceValueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  const timerRef = useRef<number | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    sourceValueRef.current = value;
    if (!dirtyRef.current) {
      draftRef.current = value;
      // Suppressed deliberately: this syncs local draft state to an external
      // value (the persisted/remote source), gated on dirtyRef, a ref that
      // render logic must not read — so the sync can't be computed inline
      // during render and has to happen here instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(value);
    }
  }, [value]);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return;

    dirtyRef.current = false;
    onCommitRef.current(draftRef.current);
  }, []);

  const updateDraft = useCallback(
    (next: string) => {
      draftRef.current = next;
      setDraft(next);
      dirtyRef.current = next !== sourceValueRef.current;

      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = dirtyRef.current ? window.setTimeout(flush, delayMs) : null;
    },
    [delayMs, flush]
  );

  useEffect(
    () => () => {
      flush();
    },
    [flush]
  );

  return { draft, updateDraft, flush };
}
