import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deferredDashboard = vi.hoisted(() => {
  let resolve!: () => void;
  const ready = new Promise<void>((done) => {
    resolve = done;
  });
  return { ready, resolve };
});

vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => ({
    currentUser: { uid: "user-1" },
    loading: false,
    onboarded: true,
    setOnboarded: vi.fn(),
  }),
}));
vi.mock("../../src/hooks/useDeviceLink", () => ({
  useDeviceLink: () => ({
    isLinked: false,
    effectiveUserId: "user-1",
    unlink: vi.fn(),
    loading: false,
    error: null,
  }),
}));
vi.mock("../../src/hooks/useUserProfile", () => ({
  useUserProfile: () => ({ firstName: "Iris", loading: false, error: null }),
}));

vi.mock("../../src/components/AppHeader", () => ({
  AppHeader: () => <header>Application header</header>,
}));
vi.mock("../../src/components/MessageDrawer", () => ({ MessageDrawer: () => null }));
vi.mock("../../src/components/OfflineIndicator", () => ({ OfflineIndicator: () => null }));
vi.mock("../../src/context/CampaignsContext", () => ({
  CampaignsProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../src/context/HeaderExtensionContext", () => ({
  HeaderExtensionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../src/components/Toast", () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
  ToastContainer: () => null,
  useToast: () => ({ warning: vi.fn() }),
}));

vi.mock("../../src/pages/Dashboard", async () => {
  await deferredDashboard.ready;
  return { default: () => <div>Deferred dashboard</div> };
});
vi.mock("../../src/pages/CharacterSheet", () => ({ default: () => null }));
vi.mock("../../src/pages/CampaignOverview", () => ({ default: () => null }));
vi.mock("../../src/pages/Onboarding", () => ({ default: () => null }));
vi.mock("../../src/pages/Settings", () => ({ default: () => null }));
vi.mock("../../src/pages/MissingProfileRecovery", () => ({ default: () => null }));

import App from "../../src/App";

describe("App loading boundaries", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("keeps the application shell visible while a direct route loads", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Application header")).toBeInTheDocument();
    expect(screen.getByText("Loading page…")).toBeInTheDocument();

    deferredDashboard.resolve();

    expect(await screen.findByText("Deferred dashboard")).toBeInTheDocument();
  });
});
