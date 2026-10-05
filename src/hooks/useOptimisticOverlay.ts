import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHARACTER_NUMBER_COALESCE_MS } from "../constants/saveTiming";
import { isDeepEqual } from "../utils/isDeepEqual";

export const OPTIMISTIC_SETTLE_MS = 10_000;

interface OverlayEntry {
  value: unknown;
  version: number;
  confirmed: boolean;
}

type OverlayEntries = Record<string, OverlayEntry>;

export interface OptimisticOverlayControls {
  apply: (field: string, value: unknown) => number;
  confirm: (field: string, version: number) => void;
  revert: (field: string, version: number) => void;
}

export interface PatchOptions {
  optimistic?: boolean;
  coalesceMs?: number;
}

export const COUNTER_PATCH_OPTIONS: PatchOptions = {
  optimistic: true,
  coalesceMs: CHARACTER_NUMBER_COALESCE_MS,
};

function withoutField(entries: OverlayEntries, field: string): OverlayEntries {
  const next = { ...entries };
  delete next[field];
  return next;
}

function pruneCaughtUp(entries: OverlayEntries, serverValue: object | null): OverlayEntries {
  if (!serverValue) return entries;
  const server = serverValue as Record<string, unknown>;
  let next = entries;
  for (const [field, entry] of Object.entries(entries)) {
    if (entry.confirmed && isDeepEqual(server[field], entry.value)) {
      if (next === entries) next = { ...entries };
      delete next[field];
    }
  }
  return next;
}

export function useOptimisticOverlay<T extends object>(
  serverValue: T | null
): OptimisticOverlayControls & { value: T | null } {
  const [entries, setEntries] = useState<OverlayEntries>({});
  const versionRef = useRef(0);
  const serverRef = useRef<T | null>(serverValue);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    serverRef.current = serverValue;
  }, [serverValue]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const apply = useCallback((field: string, value: unknown) => {
    versionRef.current += 1;
    const version = versionRef.current;
    setEntries((current) => ({ ...current, [field]: { value, version, confirmed: false } }));
    return version;
  }, []);

  const revert = useCallback((field: string, version: number) => {
    setEntries((current) =>
      current[field]?.version === version ? withoutField(current, field) : current
    );
  }, []);

  const confirm = useCallback(
    (field: string, version: number) => {
      const server = serverRef.current as Record<string, unknown> | null;
      setEntries((current) => {
        const entry = current[field];
        if (!entry || entry.version !== version) return current;
        if (server && isDeepEqual(server[field], entry.value)) return withoutField(current, field);
        return { ...current, [field]: { ...entry, confirmed: true } };
      });
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        revert(field, version);
      }, OPTIMISTIC_SETTLE_MS);
      timers.current.add(timer);
    },
    [revert]
  );

  const [seenServerValue, setSeenServerValue] = useState(serverValue);
  if (serverValue !== seenServerValue) {
    setSeenServerValue(serverValue);
    const pruned = pruneCaughtUp(entries, serverValue);
    if (pruned !== entries) setEntries(pruned);
  }

  const value = useMemo(() => {
    const fields = Object.keys(entries);
    if (!serverValue || fields.length === 0) return serverValue;
    return {
      ...serverValue,
      ...Object.fromEntries(fields.map((field) => [field, entries[field].value])),
    } as T;
  }, [serverValue, entries]);

  return { value, apply, confirm, revert };
}
