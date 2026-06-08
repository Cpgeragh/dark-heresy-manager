// src/hooks/useIsDM.ts

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export function useIsDM(campaignId: string | undefined): boolean {
  const [isDM, setIsDM] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setIsDM(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setIsDM(false);
      return;
    }

    let ignore = false;
    const userUid = user.uid;

    async function checkDM() {
      try {
        const campRef = doc(db, "campaigns", campaignId!);
        const campSnap = await getDoc(campRef);

        if (ignore) return;

        if (campSnap.exists()) {
          const data = campSnap.data();
          setIsDM(data.dmId === userUid);
        } else {
          setIsDM(false);
        }
      } catch (error) {
        console.error("Failed to check DM status:", error);
        if (!ignore) setIsDM(false);
      }
    }

    checkDM();
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  return isDM;
}
