// src/App.tsx

import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import type { User } from "firebase/auth";

import { auth, db } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { UserDocument } from "./types/Firestore";

import DMDashboard from "./pages/DMDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClaimCharacterPage from "./pages/ClaimCharacter/ClaimCharacterPage";
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
          const newUserDoc: UserDocument = {
            role: "player",
            activeCampaignId: null,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
          };

          await setDoc(ref, newUserDoc);

          setUserRole("player");
          setActiveCampaignId(null);
        } else {
          const data = snap.data() as UserDocument;
          const role: Role = data.role === "dm" ? "dm" : "player";
          setUserRole(role);
          setActiveCampaignId(data.activeCampaignId ?? null);
        }

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
  // DEV-ONLY ROLE SWITCHER
  // -------------------------------------------------
  async function switchToDM() {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      { role: "dm" },
      { merge: true }
    );
    setUserRole("dm");

    if (activeCampaignId) {
      const campRef = doc(db, "campaigns", activeCampaignId);
      await setDoc(campRef, { dmId: currentUser.uid }, { merge: true });
    }
  }

  async function switchToPlayer() {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      { role: "player" },
      { merge: true }
    );
    setUserRole("player");

    if (activeCampaignId) {
      const campRef = doc(db, "campaigns", activeCampaignId);
      await setDoc(campRef, { dmId: null }, { merge: true });
    }
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
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <nav
          className="
            max-w-5xl mx-auto px-4 py-3
            flex flex-col gap-3
            sm:flex-row sm:items-center sm:justify-between
          "
        >
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
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

          {/* Navigation */}
          <div className="flex flex-wrap items-center gap-2">
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

            {import.meta.env.DEV && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={switchToPlayer}
                  className="px-3 py-1 text-xs rounded-full bg-blue-600 text-white border border-blue-500 hover:bg-blue-500"
                >
                  Switch to Player
                </button>
                <button
                  onClick={switchToDM}
                  className="px-3 py-1 text-xs rounded-full bg-green-600 text-white border border-green-500 hover:bg-green-500"
                >
                  Switch to DM
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ================= BREADCRUMBS ================= */}
      <Breadcrumbs isDM={isDM} pathname={location.pathname} />

      {/* ================= ROUTES ================= */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
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
              <Route path="/claim" element={<ClaimCharacterPage />} />
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

          <Route
            path="/campaign/:campaignId/character/:characterId"
            element={<CharacterSheet />}
          />

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
// BREADCRUMBS (STRUCTURE ONLY)
// -------------------------------------------------
function Breadcrumbs(props: { isDM: boolean; pathname: string }) {
  const segments = props.pathname.split("/").filter(Boolean);

  // No breadcrumbs on root dashboards
  if (segments.length === 0) return null;

  const crumbs: { label: string; to?: string }[] = [];

  // Root
  if (props.isDM) {
    crumbs.push({ label: "DM Dashboard", to: "/dm" });
  } else {
    crumbs.push({ label: "My Characters", to: "/player" });
  }

  // Campaign context
  if (segments.includes("campaign")) {
    crumbs.push({
      label: "Campaign",
      to: props.isDM ? "/dm" : "/player",
    });
  }

  // Character context
  if (segments.includes("character")) {
    crumbs.push({ label: "Character" });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav
      className="
        max-w-5xl mx-auto px-4
        text-sm text-slate-400
        flex flex-wrap items-center gap-2
        mt-3
      "
      aria-label="Breadcrumb"
    >
      {crumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-2">
          {crumb.to ? (
            <Link to={crumb.to} className="hover:text-slate-200 transition">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-200">{crumb.label}</span>
          )}
          {index < crumbs.length - 1 && <span>→</span>}
        </span>
      ))}
    </nav>
  );
}

// -------------------------------------------------
// NAV LINK BUTTON
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