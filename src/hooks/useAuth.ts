// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth } from "../firebase";
import { userDocRef } from "../firebase/converters";
import type { UserDocument } from "../types/Firestore";

type Role = "player" | "dm";

interface UseAuthResult {
  currentUser: User | null;
  userRole: Role | null;
  activeCampaignId: string | null;
  loading: boolean;
  onboarded: boolean;
  setUserRole: (role: Role) => void;
  setActiveCampaignId: (id: string | null) => void;
  setOnboarded: (value: boolean) => void;
}

export function useAuth(): UseAuthResult {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Default true so existing (legacy) users never see the onboarding screen.
  // Flipped to false only when a brand-new user doc is created.
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    let ignore = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }

        if (ignore) return;

        setCurrentUser(user);

        const ref = userDocRef(user.uid);
        const snap = await getDoc(ref);

        if (ignore) return;

        if (!snap.exists()) {
          const newUserDoc: UserDocument = {
            role: "player",
            activeCampaignId: null,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
            onboarded: false,
          };

          await setDoc(ref, newUserDoc);

          if (ignore) return;

          setUserRole("player");
          setActiveCampaignId(null);
          setOnboarded(false);
        } else {
          const data = snap.data();
          const role: Role = data.role === "dm" ? "dm" : "player";

          if (ignore) return;

          setUserRole(role);
          setActiveCampaignId(data.activeCampaignId ?? null);
          // undefined means a legacy user created before onboarding existed — treat as onboarded
          setOnboarded(data.onboarded !== false);
        }

        await updateDoc(ref, { lastSeen: serverTimestamp() });
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    });

    return () => {
      ignore = true;
      unsub();
    };
  }, []);

  return {
    currentUser,
    userRole,
    activeCampaignId,
    loading,
    onboarded,
    setUserRole,
    setActiveCampaignId,
    setOnboarded,
  };
}
