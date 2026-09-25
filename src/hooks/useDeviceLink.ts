// src/hooks/useDeviceLink.ts
// Resolves the permanent account id connected to this device.
//
// Uses an onSnapshot listener so the state updates automatically when
// Server connection operations write to (or delete from) userLinks/{myUid} —
// no page reload required.

import { doc, type DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { disconnectDevice } from "../services/deviceLinkService";
import { useDocumentSubscription } from "./useFirestoreSubscription";

interface DeviceLinkState {
  loading: boolean;
  error: Error | null;
  effectiveUserId: string;
  disconnect: (confirmLastDevice?: boolean) => Promise<void>;
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

  async function disconnect(confirmLastDevice = false) {
    await disconnectDevice(myUid, confirmLastDevice);
    // onSnapshot fires and sets primaryUid → null automatically
  }

  return {
    loading,
    error,
    effectiveUserId: primaryUid ?? myUid,
    disconnect,
  };
}
