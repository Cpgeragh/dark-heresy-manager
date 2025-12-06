import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { auth, db } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import DMDashboard from "./pages/DMDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClaimCharacter from "./pages/ClaimCharacter";
import SelectCampaign from "./pages/SelectCampaign";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"player" | "dm" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }

      setCurrentUser(user);

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          role: "player",
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        });
        setUserRole("player");
      } else {
        const data = snap.data() as any;
        const role = data.role === "dm" ? "dm" : "player";
        setUserRole(role);

        await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <div>Loading…</div>;
  if (!userRole) return <div>Verifying user…</div>;

  return (
    <Routes>
      {/* DM view */}
      {userRole === "dm" && (
        <>
          <Route path="/dm" element={<DMDashboard user={currentUser} />} />
          <Route path="/select" element={<SelectCampaign user={currentUser} />} />
        </>
      )}

      {/* Player View */}
      {userRole === "player" && (
        <>
          <Route path="/player" element={<PlayerDashboard user={currentUser} />} />
          <Route path="/claim" element={<ClaimCharacter user={currentUser} />} />
          <Route path="/select" element={<SelectCampaign user={currentUser} />} />
        </>
      )}

      {/* Default Route → redirect based on role */}
      <Route
        path="*"
        element={
          userRole === "dm"
            ? <Navigate to="/dm" />
            : <Navigate to="/player" />
        }
      />
    </Routes>
  );
}
