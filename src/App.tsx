// src/App.tsx

import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useMatch } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { useDeviceLink } from "./hooks/useDeviceLink";
import { useUserProfile } from "./hooks/useUserProfile";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { MessageDrawer } from "./components/MessageDrawer";
import { CampaignsProvider } from "./context/CampaignsContext";
import { HeaderExtensionProvider } from "./context/HeaderExtensionContext";
import { ToastProvider, ToastContainer, useToast } from "./components/Toast";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ToastTester } from "./components/ToastTester";
import { ROUTES, ROUTE_PATTERNS } from "./constants/routes";
import { consumeUpdateStalled } from "./pwaUpdateState";

import Dashboard from "./pages/Dashboard";
import CharacterSheet from "./pages/CharacterSheet";
import CampaignOverview from "./pages/CampaignOverview";
import Onboarding from "./pages/Onboarding";
import NameGate from "./pages/NameGate";
import Settings from "./pages/Settings";

// Shows a one-off toast if a service-worker update started downloading but
// stalled (flag set in main.tsx). Must live inside ToastProvider.
function UpdateStallNotice() {
  const toast = useToast();
  useEffect(() => {
    if (consumeUpdateStalled()) {
      toast.warning("Couldn't download the latest update");
    }
  }, [toast]);
  return null;
}

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

  // First name lives on the shared account profile, read live so it syncs
  // across linked devices.
  const { firstName, loading: profileLoading } = useUserProfile(effectiveUserId);

  // -------------------------------------------------
  // LOADING STATES
  // -------------------------------------------------
  if (loading || linkLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-red-600 animate-spin" />
        <span className="text-sm text-slate-400">Loading…</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
        <div className="w-8 h-8 rounded-full border-4 border-slate-700 border-t-red-600 animate-spin" />
        <span className="text-sm text-slate-400">Loading…</span>
      </div>
    );
  }

  // First-launch: user hasn't completed onboarding yet.
  if (!onboarded) {
    return (
      <Onboarding
        user={currentUser}
        onComplete={() => setOnboarded(true)}
        effectiveUserId={effectiveUserId}
      />
    );
  }

  // Existing users who onboarded before first names existed must add one
  // before using the app again.
  if (!firstName) {
    return <NameGate effectiveUserId={effectiveUserId} />;
  }

  // -------------------------------------------------
  // MAIN APP UI
  // -------------------------------------------------
  return (
    <HeaderExtensionProvider>
      <ToastProvider>
        <UpdateStallNotice />
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
                        firstName={firstName}
                      />
                    }
                  />

                  <Route
                    path={ROUTE_PATTERNS.CHARACTER_SHEET}
                    element={<CharacterSheet effectiveUserId={effectiveUserId} />}
                  />

                  <Route
                    path={ROUTE_PATTERNS.CAMPAIGN_OVERVIEW}
                    element={<CampaignOverview effectiveUserId={effectiveUserId} />}
                  />

                  <Route
                    path={ROUTES.SETTINGS}
                    element={
                      <Settings
                        user={currentUser}
                        effectiveUserId={effectiveUserId}
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
