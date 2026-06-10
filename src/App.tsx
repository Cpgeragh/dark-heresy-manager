// src/App.tsx

import { useState } from "react";
import { Routes, Route, Navigate, useLocation, useMatch } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { useDeviceLink } from "./hooks/useDeviceLink";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { MessageDrawer } from "./components/MessageDrawer";
import { CampaignsProvider } from "./context/CampaignsContext";
import { HeaderExtensionProvider } from "./context/HeaderExtensionContext";
import { ToastProvider, ToastContainer } from "./components/Toast";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ToastTester } from "./components/ToastTester";
import { ROUTES, ROUTE_PATTERNS } from "./constants/routes";

import Dashboard from "./pages/Dashboard";
import ClaimCharacterPage from "./pages/ClaimCharacter/ClaimCharacterPage";
import CharacterSheet from "./pages/CharacterSheet";
import CampaignOverview from "./pages/CampaignOverview";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";

export default function App() {
  const location = useLocation();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const characterSheetMatch = useMatch(ROUTE_PATTERNS.CHARACTER_SHEET);
  const contextCampaignId = characterSheetMatch?.params?.campaignId ?? null;
  const contextCharacterId = characterSheetMatch?.params?.characterId ?? null;

  // -------------------------------------------------
  // AUTH & USER STATE
  // -------------------------------------------------
  const { currentUser, loading, onboarded, setOnboarded } = useAuth();

  // -------------------------------------------------
  // DEVICE LINK — must be called unconditionally before any early returns
  // -------------------------------------------------
  const {
    isLinked,
    effectiveUserId,
    unlink,
    loading: linkLoading,
  } = useDeviceLink(currentUser?.uid ?? "");

  // -------------------------------------------------
  // LOADING STATES
  // -------------------------------------------------
  if (loading || linkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        Initialising user…
      </div>
    );
  }

  // First-launch: user hasn't completed onboarding yet.
  if (!onboarded) {
    return (
      <Onboarding
        user={currentUser}
        onComplete={() => setOnboarded(true)}
      />
    );
  }

  // -------------------------------------------------
  // MAIN APP UI
  // -------------------------------------------------
  return (
    <HeaderExtensionProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          {/* HEADER */}
          <AppHeader
            currentPath={location.pathname}
            onOpenMessages={() => setMessagesOpen(true)}
          />

          {/* ROUTES */}
          <CampaignsProvider key={effectiveUserId} uid={effectiveUserId}>
            <main className="max-w-5xl mx-auto px-4 py-6">
              <ErrorBoundary>
                <Routes>
                  <Route
                    path={ROUTES.DASHBOARD}
                    element={
                      <Dashboard
                        user={currentUser}
                        effectiveUserId={effectiveUserId}
                        isLinked={isLinked}
                        unlink={unlink}
                      />
                    }
                  />

                  <Route path={ROUTES.CLAIM_CHARACTER} element={<ClaimCharacterPage />} />

                  <Route path={ROUTE_PATTERNS.CHARACTER_SHEET} element={<CharacterSheet />} />

                  <Route path={ROUTE_PATTERNS.CAMPAIGN_OVERVIEW} element={<CampaignOverview />} />

                  <Route
                    path={ROUTES.SETTINGS}
                    element={
                      <Settings
                        user={currentUser}
                        isLinked={isLinked}
                        unlink={unlink}
                      />
                    }
                  />

                  <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                </Routes>
              </ErrorBoundary>
            </main>

            <MessageDrawer
              user={currentUser}
              isOpen={messagesOpen}
              onClose={() => setMessagesOpen(false)}
              campaignId={contextCampaignId}
              characterId={contextCharacterId}
            />
          </CampaignsProvider>

          <ToastContainer />
          <OfflineIndicator />
          {import.meta.env.DEV && <ToastTester />}
        </div>
      </ToastProvider>
    </HeaderExtensionProvider>
  );
}
