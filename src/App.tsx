// src/App.tsx

import { useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { updateActiveCampaign } from "./services/userService";
import { useUserRole } from "./hooks/useUserRole";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { AppBreadcrumbs } from "./components/AppBreadcrumbs";
import { ToastProvider, ToastContainer } from "./components/Toast";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ToastTester } from "./components/ToastTester";
import { ROUTES, ROUTE_PATTERNS } from "./constants/routes";

import DMDashboard from "./pages/DMDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ClaimCharacterPage from "./pages/ClaimCharacter/ClaimCharacterPage";
import SelectCampaign from "./pages/SelectCampaign";
import CharacterSheet from "./pages/CharacterSheet";
import CampaignOverview from "./pages/CampaignOverview";

export default function App() {
  const location = useLocation();

  // -------------------------------------------------
  // AUTH & USER STATE
  // -------------------------------------------------
  const {
    currentUser,
    userRole,
    activeCampaignId,
    loading,
    setUserRole,
    setActiveCampaignId,
  } = useAuth();

  // -------------------------------------------------
  // ROLE SWITCHING (DEV ONLY)
  // -------------------------------------------------
  const { switchToDM, switchToPlayer } = useUserRole({
    currentUser,
    activeCampaignId,
    onRoleChange: setUserRole,
  });

  // -------------------------------------------------
  // ACTIVE CAMPAIGN HANDLER
  // -------------------------------------------------
  const handleActiveCampaignChange = useCallback(
    (id: string | null) => {
      setActiveCampaignId(id);
      if (!currentUser) return;
      void updateActiveCampaign(currentUser.uid, id); // intentional fire-and-forget
    },
    [currentUser, setActiveCampaignId]
  );

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
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {/* HEADER */}
        <AppHeader
          isDM={isDM}
          currentPath={location.pathname}
          onSwitchToDM={switchToDM}
          onSwitchToPlayer={switchToPlayer}
        />

        {/* BREADCRUMBS */}
        <AppBreadcrumbs isDM={isDM} pathname={location.pathname} />

        {/* ROUTES */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          <ErrorBoundary>
            <Routes>
              {isDM && (
                <>
                  <Route
                    path={ROUTES.DM_DASHBOARD}
                    element={
                      <DMDashboard
                        user={currentUser}
                        activeCampaignId={activeCampaignId}
                        onActiveCampaignChange={handleActiveCampaignChange}
                      />
                    }
                  />
                  <Route
                    path={ROUTES.SELECT_CAMPAIGN}
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
                    path={ROUTES.PLAYER_DASHBOARD}
                    element={
                      <PlayerDashboard
                        user={currentUser}
                        activeCampaignId={activeCampaignId}
                      />
                    }
                  />
                  <Route path={ROUTES.CLAIM_CHARACTER} element={<ClaimCharacterPage />} />
                  <Route
                    path={ROUTES.SELECT_CAMPAIGN}
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
                path={ROUTE_PATTERNS.CHARACTER_SHEET}
                element={<CharacterSheet />}
              />

              <Route
                path={ROUTE_PATTERNS.CAMPAIGN_OVERVIEW}
                element={<CampaignOverview />}
              />

              <Route
                path="*"
                element={
                  <Navigate 
                    to={isDM ? ROUTES.DM_DASHBOARD : ROUTES.PLAYER_DASHBOARD} 
                    replace 
                  />
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>

        <ToastContainer />
        <OfflineIndicator />
      {import.meta.env.DEV && <ToastTester />}
    </div>
    </ToastProvider>
  );
}