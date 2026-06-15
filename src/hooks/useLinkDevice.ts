// src/hooks/useLinkDevice.ts
// Links this device to another account using that account's identity recovery code.
// Looks up identityRecovery/{code}, validates the cap (max 3), then writes
// userLinks/{currentUid} = { primaryUid, linkedAt }.

import { useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";

export function useLinkDevice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function linkDevice(recoveryCode: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not signed in.");

    setLoading(true);
    setError(null);

    try {
      // 1. Look up the identity recovery code
      const code = recoveryCode.trim();
      const snap = await getDoc(doc(db, "identityRecovery", code));
      if (!snap.exists()) {
        throw new Error("No account found with that recovery code.");
      }

      const primaryUid = snap.data().uid as string;

      // 2. Can't link to yourself
      if (primaryUid === user.uid) {
        throw new Error("This recovery code belongs to this device.");
      }

      // 3. Enforce max 3 linked devices per primary account
      const q = query(collection(db, "userLinks"), where("primaryUid", "==", primaryUid));
      const existing = await getDocs(q);
      if (existing.size >= 3) {
        throw new Error("This account already has 3 linked devices — the maximum allowed.");
      }

      // 4. Prove we know the account's recovery code (the rule verifies it
      //    against identitySecret), create the link, then delete the proof.
      const proofRef = doc(db, "linkProofs", user.uid);
      await setDoc(proofRef, { primaryUid, code });
      try {
        await setDoc(doc(db, "userLinks", user.uid), {
          primaryUid,
          linkedAt: serverTimestamp(),
        });
      } finally {
        await deleteDoc(proofRef);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to link device.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { linkDevice, loading, error };
}
