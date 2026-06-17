// src/hooks/useIsDM.ts

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useIsDM(campaignId: string | undefined, userId: string | null): boolean | null {
  const [isDM, setIsDM] = useState<boolean | null>(null);

  useEffect(() => {
    if (!campaignId || !userId) {
      setIsDM(false);
      return;
    }

    let ignore = false;

    async function checkDM() {
      try {
        const campRef = doc(db, "campaigns", campaignId!);
        const campSnap = await getDoc(campRef);

        if (ignore) return;

        if (campSnap.exists()) {
          const data = campSnap.data();
          setIsDM(data.dmId === userId);
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
  }, [campaignId, userId]);

  return isDM;
}
