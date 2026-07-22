// src/hooks/useDeviceLink.ts
// Resolves whether the current device is secondary (linked) and provides the
// effective user ID to use for Firestore queries.
//
// Uses an onSnapshot listener so the state updates automatically when
// useLinkDevice writes to (or unlink deletes from) userLinks/{myUid} —
// no page reload required.

import { doc, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { unlinkDevice } from "../services/deviceLinkService";
import { useDocumentSubscription } from "./useFirestoreSubscription";

interface DeviceLinkState {
  loading: boolean;
  error: Error | null;
  isLinked: boolean;
  effectiveUserId: string;
  unlink: () => Promise<void>;
}

export function useDeviceLink(myUid: string): DeviceLinkState {
  const {
    data: primaryUid,
    loading,
    error,
  } = useDocumentSubscription<DocumentData, string>(
    myUid ? doc(db, "userLinks", myUid) : null,
    (snapshot) => (snapshot.exists() ? (snapshot.data().primaryUid as string) : null)
  );

  async function unlink() {
    await unlinkDevice(myUid);
    // onSnapshot fires and sets primaryUid → null automatically
  }

  return {
    loading,
    error,
    isLinked: primaryUid !== null,
    effectiveUserId: primaryUid ?? myUid,
    unlink,
  };
}
