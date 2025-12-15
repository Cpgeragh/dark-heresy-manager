// src/hooks/useUserRole.ts

import { useCallback } from "react";
import { doc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";

type Role = "player" | "dm";

interface UseUserRoleArgs {
  currentUser: User | null;
  activeCampaignId: string | null;
  onRoleChange: (role: Role) => void;
}

export function useUserRole({
  currentUser,
  activeCampaignId,
  onRoleChange,
}: UseUserRoleArgs) {
  const switchToDM = useCallback(async () => {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      { role: "dm" },
      { merge: true }
    );
    onRoleChange("dm");

    if (activeCampaignId) {
      const campRef = doc(db, "campaigns", activeCampaignId);
      await setDoc(campRef, { dmId: currentUser.uid }, { merge: true });
    }
  }, [currentUser, activeCampaignId, onRoleChange]);

  const switchToPlayer = useCallback(async () => {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      { role: "player" },
      { merge: true }
    );
    onRoleChange("player");

    if (activeCampaignId) {
      const campRef = doc(db, "campaigns", activeCampaignId);
      await setDoc(campRef, { dmId: null }, { merge: true });
    }
  }, [currentUser, activeCampaignId, onRoleChange]);

  return { switchToDM, switchToPlayer };
}