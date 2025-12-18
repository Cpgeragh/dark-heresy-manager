// src/hooks/useIsDM.ts

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/**
 * Hook to check if the current user is the DM of a specific campaign.
 * 
 * @param campaignId - The campaign ID to check
 * @returns boolean indicating if current user is the DM
 */
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

    // Capture values to avoid null/undefined issues in async closure
    const userUid = user.uid;
    const campaignIdValue = campaignId; // Capture to ensure TypeScript knows it's defined
    let isMounted = true;

    async function checkDM() {
      try {
        const campRef = doc(db, "campaigns", campaignIdValue);
        const campSnap = await getDoc(campRef);
        
        if (campSnap.exists() && isMounted) {
          const data = campSnap.data();
          setIsDM(data.dmId === userUid);
        } else if (isMounted) {
          setIsDM(false);
        }
      } catch (error) {
        console.error("Failed to check DM status:", error);
        if (isMounted) {
          setIsDM(false);
        }
      }
    }

    checkDM();

    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  return isDM;
}