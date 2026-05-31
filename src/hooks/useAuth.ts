// src/hooks/useAuth.ts

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "../firebase";
import type { UserDocument } from "../types/Firestore";

type Role = "player" | "dm";

interface UseAuthResult {
    currentUser: User | null;
    userRole: Role | null;
    activeCampaignId: string | null;
    loading: boolean;
    setUserRole: (role: Role) => void;
    setActiveCampaignId: (id: string | null) => void;
}

export function useAuth(): UseAuthResult {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

                const ref = doc(db, "users", user.uid);
                const snap = await getDoc(ref);

                if (ignore) return;

                if (!snap.exists()) {
                    const newUserDoc: UserDocument = {
                        role: "player",
                        activeCampaignId: null,
                        createdAt: serverTimestamp(),
                        lastSeen: serverTimestamp(),
                    };

                    await setDoc(ref, newUserDoc);

                    if (ignore) return;

                    setUserRole("player");
                    setActiveCampaignId(null);
                } else {
                    const data = snap.data() as UserDocument;
                    const role: Role = data.role === "dm" ? "dm" : "player";

                    if (ignore) return;

                    setUserRole(role);
                    setActiveCampaignId(data.activeCampaignId ?? null);
                }

                await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });
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
        setUserRole,
        setActiveCampaignId,
    };
}