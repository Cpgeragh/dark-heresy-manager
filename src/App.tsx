// src/App.tsx

import { useState } from "react";
import { Routes, Route, Navigate, useLocation, useMatch } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import { useAuth } from "./hooks/useAuth";
import { useUserRole } from "./hooks/useUserRole";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { MessageDrawer } from "./components/MessageDrawer";
import { CampaignsProvider } from "./context/CampaignsContext";
import { HeaderExtensionProvider } from "./context/HeaderExtensionContext";
import { ToastProvider, ToastContainer } from "./components/Toast";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ToastTester } from "./components/ToastTester";
import { ROUTES, ROUTE_PATTERNS } from "./constants/routes";

import DMDashboard from "./pages/DMDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClaimCharacterPage from "./pages/ClaimCharacter/ClaimCharacterPage";
import CharacterSheet from "./pages/CharacterSheet";
import CampaignOverview from "./pages/CampaignOverview";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";

export default function App() {
  const location = useLocation();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const characterSheetMatch = useMatch(ROUTE_PATTERNS.CHARACTER_SHEET);
  const contextCampaignId = characterSheetMatch?.params?.campaignId ?? null;
  const contextCharacterId = characterSheetMatch?.params?.characterId ?? null;

  // -------------------------------------------------
  // AUTH & USER STATE
  // -------------------------------------------------
  const {
    currentUser,
    userRole,
    loading,
    onboarded,
    setUserRole,
    setOnboarded,
  } = useAuth();

  // -------------------------------------------------
  // ROLE SWITCHING
  // -------------------------------------------------
  const { switchToDM, switchToPlayer } = useUserRole({
    currentUser,
    onRoleChange: setUserRole,
  });

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

  // First-launch: user hasn't chosen a role or saved their recovery code yet.
  if (!onboarded) {
    return (
      <Onboarding
        user={currentUser}
        onComplete={(role) => {
          setUserRole(role);
          setOnboarded(true);
        }}
      />
    );
  }

  const isDM = userRole === "dm";

  // -------------------------------------------------
  // MAIN APP UI
  // -------------------------------------------------
  return (
    <HeaderExtensionProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          {/* HEADER */}
          <AppHeader
            isDM={isDM}
            currentPath={location.pathname}
            onOpenMessages={!isDM ? () => setMessagesOpen(true) : undefined}
            onPlayerInstall={isDM ? () => setShowQR((v) => !v) : undefined}
          />

          {/* QR modal */}
          {showQR && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowQR(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-3 pointer-events-auto">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowQR(false)}
                      aria-label="Close"
                      className="w-7 h-7 flex items-center justify-center rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300 text-lg leading-none transition"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value="https://dark-heresy-manager.web.app" size={260} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ROUTES */}
          <CampaignsProvider uid={currentUser.uid} role={isDM ? "dm" : "player"}>
            <main className="max-w-5xl mx-auto px-4 py-6">
              <ErrorBoundary>
                <Routes>
                  {isDM && (
                    <Route
                      path={ROUTES.DM_DASHBOARD}
                      element={<DMDashboard user={currentUser} />}
                    />
                  )}

                  {!isDM && (
                    <>
                      <Route
                        path={ROUTES.PLAYER_DASHBOARD}
                        element={<PlayerDashboard user={currentUser} />}
                      />
                      <Route path={ROUTES.CLAIM_CHARACTER} element={<ClaimCharacterPage />} />
                    </>
                  )}

                  <Route path={ROUTE_PATTERNS.CHARACTER_SHEET} element={<CharacterSheet />} />

                  <Route path={ROUTE_PATTERNS.CAMPAIGN_OVERVIEW} element={<CampaignOverview />} />

                  <Route
                    path={ROUTES.SETTINGS}
                    element={
                      <Settings
                        user={currentUser}
                        currentRole={isDM ? "dm" : "player"}
                        onSwitchToDM={switchToDM}
                        onSwitchToPlayer={switchToPlayer}
                      />
                    }
                  />

                  <Route
                    path="*"
                    element={
                      <Navigate to={isDM ? ROUTES.DM_DASHBOARD : ROUTES.PLAYER_DASHBOARD} replace />
                    }
                  />
                </Routes>
              </ErrorBoundary>
            </main>

          {!isDM && (
            <MessageDrawer
              user={currentUser}
              isOpen={messagesOpen}
              onClose={() => setMessagesOpen(false)}
              campaignId={contextCampaignId}
              characterId={contextCharacterId}
            />
          )}
          </CampaignsProvider>

          <ToastContainer />
          <OfflineIndicator />
          {import.meta.env.DEV && <ToastTester />}
        </div>
      </ToastProvider>
    </HeaderExtensionProvider>
  );
}
