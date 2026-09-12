// src/App.tsx

import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useMatch } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { useDeviceLink } from "./hooks/useDeviceLink";
import { useUserProfile } from "./hooks/useUserProfile";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { MessageDrawer } from "./components/MessageDrawer";
import { SplashScreen } from "./components/SplashScreen";
import { CampaignsProvider } from "./context/CampaignsContext";
import { HeaderExtensionProvider } from "./context/HeaderExtensionContext";
import { ToastProvider, ToastContainer, useToast } from "./components/Toast";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ROUTES, ROUTE_PATTERNS } from "./constants/routes";
import { consumeUpdateStalled, consumePostUpgrade } from "./pwaUpdateState";
import { LoadingState } from "./ui/LoadingState";
import Settings from "./pages/Settings";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const CharacterSheet = lazy(() => import("./pages/CharacterSheet"));
const CampaignOverview = lazy(() => import("./pages/CampaignOverview"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

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

function AppContent() {
  const [isPostUpgrade] = useState(() => consumePostUpgrade());
  const location = useLocation();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const characterSheetMatch = useMatch(ROUTE_PATTERNS.CHARACTER_SHEET);
  const contextCampaignId = characterSheetMatch?.params?.campaignId ?? null;
  const contextCharacterId = characterSheetMatch?.params?.characterId ?? null;

  // -------------------------------------------------
  // AUTH & USER STATE
  // -------------------------------------------------
  const { currentUser, loading, error: authError, onboarded, setOnboarded } = useAuth();

  // -------------------------------------------------
  // DEVICE CONNECTION — must be called unconditionally before any early returns
  // -------------------------------------------------
  const {
    effectiveUserId,
    disconnect,
    loading: linkLoading,
    error: linkError,
  } = useDeviceLink(currentUser?.uid ?? "");

  // First name lives on the shared account profile, read live so it syncs
  // across linked devices.
  const {
    firstName,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(effectiveUserId);

  // -------------------------------------------------
  // LOADING STATES
  // -------------------------------------------------
  if (loading || linkLoading) {
    return <SplashScreen label={isPostUpgrade ? "Updating…" : "Loading…"} />;
  }

  if (authError || linkError) {
    return <SplashScreen label="Unable to load your account. Please refresh." />;
  }

  if (!currentUser) {
    return <SplashScreen label={isPostUpgrade ? "Updating…" : "Loading…"} />;
  }

  // First-launch: user hasn't completed onboarding yet.
  if (!onboarded) {
    return (
      <Suspense fallback={<SplashScreen label="Loading…" />}>
        <Onboarding
          user={currentUser}
          onComplete={() => setOnboarded(true)}
          effectiveUserId={effectiveUserId}
          firstName={firstName}
        />
      </Suspense>
    );
  }

  if (profileLoading) {
    return <SplashScreen label={isPostUpgrade ? "Updating…" : "Loading…"} />;
  }

  if (profileError) {
    return <SplashScreen label="Unable to load your account. Please refresh." />;
  }

  // A completed account must always have a profile. If this device somehow
  // has none (a remote disconnect, or a session from before an account had
  // its own permanent id), send it back through the same onboarding flow any
  // other unconnected device uses, rather than a separate recovery screen.
  if (!firstName) {
    return (
      <Suspense fallback={<SplashScreen label="Loading…" />}>
        <Onboarding
          user={currentUser}
          onComplete={() => setOnboarded(true)}
          effectiveUserId={effectiveUserId}
          firstName={firstName}
        />
      </Suspense>
    );
  }

  async function handleDeviceDisconnect(confirmLastDevice = false) {
    await disconnect(confirmLastDevice);
    setOnboarded(false);
  }

  // -------------------------------------------------
  // MAIN APP UI
  // -------------------------------------------------
  return (
    <HeaderExtensionProvider>
      <UpdateStallNotice />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* HEADER */}
        <AppHeader
          currentPath={location.pathname}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* ROUTES */}
        <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <ErrorBoundary>
            <Suspense
              fallback={<LoadingState className="py-10 text-center">Loading page…</LoadingState>}
            >
              <Routes>
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <CampaignsProvider key={effectiveUserId} uid={effectiveUserId}>
                      <Dashboard
                        user={currentUser}
                        effectiveUserId={effectiveUserId}
                        firstName={firstName}
                      />
                    </CampaignsProvider>
                  }
                />

                <Route
                  path={ROUTE_PATTERNS.CHARACTER_SHEET}
                  element={
                    <CharacterSheet
                      effectiveUserId={effectiveUserId}
                      effectiveUserFirstName={firstName}
                      onOpenMessages={() => setMessagesOpen(true)}
                    />
                  }
                />

                <Route
                  path={ROUTE_PATTERNS.CAMPAIGN_OVERVIEW}
                  element={<CampaignOverview effectiveUserId={effectiveUserId} />}
                />

                <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>

        <MessageDrawer
          accountId={effectiveUserId}
          isOpen={messagesOpen}
          onClose={() => setMessagesOpen(false)}
          campaignId={contextCampaignId}
          characterId={contextCharacterId}
        />

        {settingsOpen && (
          <Settings
            effectiveUserId={effectiveUserId}
            firstName={firstName}
            disconnect={handleDeviceDisconnect}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        <OfflineIndicator />
      </div>
    </HeaderExtensionProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      <ToastContainer />
    </ToastProvider>
  );
}
