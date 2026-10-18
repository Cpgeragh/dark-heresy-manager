// src/App.tsx

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { useDeviceLink } from "./hooks/useDeviceLink";
import { useLinkedDevices } from "./hooks/useLinkedDevices";
import { useUserProfile } from "./hooks/useUserProfile";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { ChatInboxModal } from "./components/chat/ChatInboxModal";
import { CloseChatInboxOnNavigation } from "./components/chat/CloseChatInboxOnNavigation";
import { SplashScreen } from "./components/SplashScreen";
import { StartupErrorModal } from "./components/StartupErrorModal";
import { StartupGate } from "./components/StartupGate";
import { CampaignsProvider } from "./context/CampaignsContext";
import { ChatInboxProvider } from "./context/ChatInboxProvider";
import { ChatsProvider } from "./context/ChatsContext";
import { HeaderExtensionProvider } from "./context/HeaderExtensionContext";
import { ToastProvider, ToastContainer, useToast } from "./components/Toast";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ROUTES, ROUTE_PATTERNS } from "./constants/routes";
import { consumeUpdateStalled, consumePostUpgrade } from "./pwaUpdateState";
import { RouteHolder } from "./components/RouteHolder";
import { RouteLoadingHold } from "./components/RouteLoadingHold";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import { colourTextPrimary, colourPageBackground } from "./ui/styles/colourTokens";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shownPath, setShownPath] = useState<string | null>(null);

  // -------------------------------------------------
  // AUTH & USER STATE
  // -------------------------------------------------
  const { currentUser, loading, error: authError, onboarded, setOnboarded } = useAuth();

  // -------------------------------------------------
  // DEVICE CONNECTION: must be called unconditionally before any early returns
  // -------------------------------------------------
  const {
    effectiveUserId,
    disconnect,
    loading: linkLoading,
    error: linkError,
  } = useDeviceLink(currentUser?.uid ?? "");
  const {
    devices,
    loading: devicesLoading,
    error: devicesError,
  } = useLinkedDevices(effectiveUserId, currentUser?.uid ?? null);

  // First name lives on the shared account profile, read live so it syncs
  // across linked devices.
  const {
    firstName,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile(effectiveUserId);

  // Keep the same providers mounted through the existing splash and route changes.
  // Once the device link resolves, campaign and chat reads can run beside the remaining
  // account work rather than waiting for Dashboard to mount.
  const listsAccountId = currentUser && !linkLoading ? effectiveUserId : "";
  const withAccountLists = (content: ReactNode) => (
    <CampaignsProvider uid={listsAccountId}>
      <ChatsProvider accountId={listsAccountId}>{content}</ChatsProvider>
    </CampaignsProvider>
  );

  // -------------------------------------------------
  // LOADING STATES
  // -------------------------------------------------
  if (loading || linkLoading || (onboarded && devicesLoading)) {
    return withAccountLists(<SplashScreen label={isPostUpgrade ? "Updating…" : "Loading…"} />);
  }

  if (authError || linkError || (onboarded && devicesError)) {
    return withAccountLists(
      <>
        <SplashScreen label="Loading…" />
        <StartupErrorModal />
      </>
    );
  }

  if (!currentUser) {
    return withAccountLists(<SplashScreen label={isPostUpgrade ? "Updating…" : "Loading…"} />);
  }

  // First-launch: user hasn't completed onboarding yet.
  if (!onboarded) {
    return withAccountLists(
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
    return withAccountLists(<SplashScreen label={isPostUpgrade ? "Updating…" : "Loading…"} />);
  }

  if (profileError) {
    return withAccountLists(
      <>
        <SplashScreen label="Loading…" />
        <StartupErrorModal />
      </>
    );
  }

  // A completed account must always have a profile. If this device somehow
  // has none (a remote disconnect, or a session from before an account had
  // its own permanent id), send it back through the same onboarding flow any
  // other unconnected device uses, rather than a separate recovery screen.
  if (!firstName) {
    return withAccountLists(
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
  return withAccountLists(
    <StartupGate ownUid={currentUser.uid} splashLabel={isPostUpgrade ? "Updating…" : "Loading…"}>
      <HeaderExtensionProvider>
        <ChatInboxProvider>
          <UpdateStallNotice />
          <CloseChatInboxOnNavigation />
          <div className={`min-h-screen ${colourPageBackground} ${colourTextPrimary}`}>
            {/* HEADER */}
            <AppHeader
              currentPath={shownPath ?? location.pathname}
              onOpenSettings={() => setSettingsOpen(true)}
            />

            {/* ROUTES */}
            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
              <ErrorBoundary>
                <RouteHolder
                  splashLabel={isPostUpgrade ? "Updating…" : "Loading…"}
                  onShownChange={setShownPath}
                  routes={(routeLocation) => (
                    <Suspense fallback={<RouteLoadingHold />}>
                      <Routes location={routeLocation}>
                        <Route
                          path={ROUTES.DASHBOARD}
                          element={
                            <Dashboard
                              user={currentUser}
                              effectiveUserId={effectiveUserId}
                              firstName={firstName}
                            />
                          }
                        />

                        <Route
                          path={ROUTE_PATTERNS.CHARACTER_SHEET}
                          element={
                            <CharacterSheet
                              effectiveUserId={effectiveUserId}
                              effectiveUserFirstName={firstName}
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
                  )}
                />
              </ErrorBoundary>
            </main>

            <ChatInboxModal accountId={effectiveUserId} />

            {settingsOpen && (
              <Settings
                effectiveUserId={effectiveUserId}
                firstName={firstName}
                devices={devices}
                deviceListError={devicesError}
                disconnect={handleDeviceDisconnect}
                onClose={() => setSettingsOpen(false)}
              />
            )}

            <OfflineIndicator />
          </div>
        </ChatInboxProvider>
      </HeaderExtensionProvider>
    </StartupGate>
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
