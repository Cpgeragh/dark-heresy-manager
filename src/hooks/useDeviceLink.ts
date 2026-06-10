// src/hooks/useDeviceLink.ts
// Resolves whether the current device is secondary (linked) and provides the
// effective user ID to use for Firestore queries.
//
// Uses an onSnapshot listener so the state updates automatically when
// useLinkDevice writes to (or unlink deletes from) userLinks/{myUid} —
// no page reload required.

import { useState, useEffect } from "react";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
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
    // Called before auth is ready (myUid is ""); skip and mark as not linked.
    if (!myUid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, "userLinks", myUid),
      (snap) => {
        setPrimaryUid(snap.exists() ? (snap.data().primaryUid as string) : null);
        setLoading(false);
      },
      () => {
        // Treat lookup failure as not linked
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [myUid]);

  async function unlink() {
    await deleteDoc(doc(db, "userLinks", myUid));
    // onSnapshot fires and sets primaryUid → null automatically
  }

  return {
    loading,
    isLinked: primaryUid !== null,
    effectiveUserId: primaryUid ?? myUid,
    unlink,
  };
}
