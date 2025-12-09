// src/App.tsx

import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import type { User } from "firebase/auth";

import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import DMDashboard from "./pages/DMDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClaimCharacter from "./pages/ClaimCharacter";
import SelectCampaign from "./pages/SelectCampaign";
import CharacterSheet from "./pages/CharacterSheet";

type Role = "player" | "dm";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // -------------------------------------------------
  // AUTH + USER DOCUMENT SETUP
  // -------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          const cred = await signInAnonymously(auth);
          user = cred.user;
        }

        setCurrentUser(user);

        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          // First-time user creation
          await setDoc(ref, {
            role: "player",
            activeCampaignId: null,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
          });

          setUserRole("player");
          setActiveCampaignId(null);
        } else {
          const data = snap.data() as any;
          const role: Role = data.role === "dm" ? "dm" : "player";
          setUserRole(role);
          setActiveCampaignId(data.activeCampaignId ?? null);
        }

        // always update lastSeen
        await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // -------------------------------------------------
  // ACTIVE CAMPAIGN HANDLER
  // -------------------------------------------------
  function handleActiveCampaignChange(id: string | null) {
    setActiveCampaignId(id);
    if (!currentUser) return;

    const ref = doc(db, "users", currentUser.uid);
    setDoc(ref, { activeCampaignId: id }, { merge: true });
  }

  // -------------------------------------------------
  // DEV-ONLY DM / PLAYER SWITCHER (Option 1)
  // -------------------------------------------------
  async function switchToDM() {
    if (!currentUser) return;

    console.log("Switching to DM (dev)…");

    // 1. Update user's role
    await setDoc(
      doc(db, "users", currentUser.uid),
      { role: "dm" },
      { merge: true }
    );
    setUserRole("dm");

    // 2. Make current campaign belong to this DM (if any)
    if (activeCampaignId) {
      const campRef = doc(db, "campaigns", activeCampaignId);
      await setDoc(
        campRef,
        { dmId: currentUser.uid },
        { merge: true }
      );
    }

    console.log("Now acting as DM");
  }

  async function switchToPlayer() {
    if (!currentUser) return;

    console.log("Switching to Player (dev)…");

    // 1. Update user's role
    await setDoc(
      doc(db, "users", currentUser.uid),
      { role: "player" },
      { merge: true }
    );
    setUserRole("player");

    // 2. Remove them from DM ownership for active campaign (if any)
    if (activeCampaignId) {
      const campRef = doc(db, "campaigns", activeCampaignId);
      await setDoc(
        campRef,
        { dmId: null },
        { merge: true }
      );
    }

    console.log("Now acting as Player");
  }

  // -------------------------------------------------
  // LOADING STATES
  // -------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        Loading…
      </div>
    );
  }

  if (!currentUser || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        Initialising user…
      </div>
    );
  }

  const isDM = userRole === "dm";

  // -------------------------------------------------
  // MAIN APP UI
  // -------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* TOP NAVIGATION */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-900 font-bold">
              DH
            </span>
            <div>
              <div className="font-semibold">Dark Heresy Manager</div>
              <div className="text-xs text-slate-400">
                {isDM ? "DM View" : "Player View"}
              </div>
            </div>
          </div>

          {/* Navigation + DEV Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {isDM ? (
                <>
                  <NavLinkButton
                    to="/dm"
                    label="DM Dashboard"
                    current={location.pathname === "/dm"}
                  />
                  <NavLinkButton
                    to="/select"
                    label="Select Campaign"
                    current={location.pathname === "/select"}
                  />
                </>
              ) : (
                <>
                  <NavLinkButton
                    to="/player"
                    label="My Characters"
                    current={location.pathname === "/player"}
                  />
                  <NavLinkButton
                    to="/claim"
                    label="Claim"
                    current={location.pathname === "/claim"}
                  />
                  <NavLinkButton
                    to="/select"
                    label="Select Campaign"
                    current={location.pathname === "/select"}
                  />
                </>
              )}
            </div>

            {/* DEV SWITCHER BUTTONS */}
            {import.meta.env.DEV && (
              <div className="flex gap-2">
                <button
                  onClick={switchToPlayer}
                  className="px-3 py-1 text-xs rounded-full bg-blue-600 text-white border border-blue-500 hover:bg-blue-500 transition"
                >
                  Switch to Player
                </button>

                <button
                  onClick={switchToDM}
                  className="px-3 py-1 text-xs rounded-full bg-green-600 text-white border border-green-500 hover:bg-green-500 transition"
                >
                  Switch to DM
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ROUTES */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          {/* DM ROUTES */}
          {isDM && (
            <>
              <Route
                path="/dm"
                element={
                  <DMDashboard
                    user={currentUser}
                    activeCampaignId={activeCampaignId}
                    onActiveCampaignChange={handleActiveCampaignChange}
                  />
                }
              />

              <Route
                path="/select"
                element={
                  <SelectCampaign
                    user={currentUser}
                    role="dm"
                    activeCampaignId={activeCampaignId}
                    onActiveCampaignChange={handleActiveCampaignChange}
                  />
                }
              />
            </>
          )}

          {/* PLAYER ROUTES */}
          {!isDM && (
            <>
              <Route
                path="/player"
                element={
                  <PlayerDashboard
                    user={currentUser}
                    activeCampaignId={activeCampaignId}
                  />
                }
              />

              <Route path="/claim" element={<ClaimCharacter />} />

              <Route
                path="/select"
                element={
                  <SelectCampaign
                    user={currentUser}
                    role="player"
                    activeCampaignId={activeCampaignId}
                    onActiveCampaignChange={handleActiveCampaignChange}
                  />
                }
              />
            </>
          )}

          {/* SHARED CHARACTER SHEET */}
          <Route
            path="/campaign/:campaignId/character/:characterId"
            element={<CharacterSheet />}
          />

          {/* FALLBACK */}
          <Route
            path="*"
            element={<Navigate to={isDM ? "/dm" : "/player"} replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

// -------------------------------------------------
// NAV LINK BUTTON COMPONENT
// -------------------------------------------------

function NavLinkButton(props: {
  to: string;
  label: string;
  current?: boolean;
}) {
  return (
    <Link
      to={props.to}
      className={`px-3 py-1 rounded-full text-sm border transition
        ${
          props.current
            ? "bg-amber-500 text-slate-900 border-amber-400 shadow"
            : "border-slate-600 text-slate-200 hover:bg-slate-800"
        }`}
    >
      {props.label}
    </Link>
  );
}