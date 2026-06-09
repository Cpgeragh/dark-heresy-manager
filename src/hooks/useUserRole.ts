// src/hooks/useUserRole.ts

import { useCallback } from "react";
import { doc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "../firebase";

type Role = "player" | "dm";

interface UseUserRoleArgs {
  currentUser: User | null;
  onRoleChange: (role: Role) => void;
}

export function useUserRole({ currentUser, onRoleChange }: UseUserRoleArgs) {
  const switchToDM = useCallback(async () => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), { role: "dm" }, { merge: true });
      onRoleChange("dm");
    } catch (err) {
      console.error("Failed to switch to DM:", err);
    }
  }, [currentUser, onRoleChange]);

  const switchToPlayer = useCallback(async () => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), { role: "player" }, { merge: true });
      onRoleChange("player");
    } catch (err) {
      console.error("Failed to switch to player:", err);
    }
  }, [currentUser, onRoleChange]);

  return { switchToDM, switchToPlayer };
}
