// src/hooks/useDeviceLink.ts

import { useState, useEffect } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface DeviceLinkState {
  loading: boolean;
  isLinked: boolean;
  effectiveUserId: string;
  unlink: () => Promise<void>;
}

export function useDeviceLink(myUid: string): DeviceLinkState {
  const [loading, setLoading] = useState(true);
  const [primaryUid, setPrimaryUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const snap = await getDoc(doc(db, "userLinks", myUid));
        if (!cancelled) {
          setPrimaryUid(snap.exists() ? (snap.data().primaryUid as string) : null);
        }
      } catch {
        // treat lookup failure as not linked
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [myUid]);

  async function unlink() {
    await deleteDoc(doc(db, "userLinks", myUid));
    setPrimaryUid(null);
  }

  return {
    loading,
    isLinked: primaryUid !== null,
    effectiveUserId: primaryUid ?? myUid,
    unlink,
  };
}
