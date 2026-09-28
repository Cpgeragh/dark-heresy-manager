import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  currentUser: { uid: "user-1" } as { uid: string } | null,
  loading: false,
  error: null as Error | null,
  onboarded: true,
  setOnboarded: vi.fn(),
}));

const campaignProviderRenderMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/hooks/useAuth", () => ({
  useAuth: () => authState,
}));
vi.mock("../../src/hooks/useDeviceLink", () => ({
  useDeviceLink: () => ({
    effectiveUserId: "user-1",
    disconnect: vi.fn(),
    loading: false,
    error: null,
  }),
}));
vi.mock("../../src/hooks/useLinkedDevices", () => ({
  useLinkedDevices: () => ({ devices: [], loading: false, error: null }),
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
  CampaignsProvider: ({ children }: { children: ReactNode }) => {
    campaignProviderRenderMock();
    return children;
  },
}));
vi.mock("../../src/context/HeaderExtensionContext", () => ({
  HeaderExtensionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../src/components/Toast", () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
  ToastContainer: () => null,
  useToast: () => ({ warning: vi.fn() }),
}));

vi.mock("../../src/pages/Dashboard", () => ({ default: () => <div>Dashboard</div> }));
vi.mock("../../src/pages/CharacterSheet", () => ({ default: () => null }));
vi.mock("../../src/pages/CampaignOverview", () => ({ default: () => null }));
vi.mock("../../src/pages/Onboarding", () => ({ default: () => null }));
vi.mock("../../src/pages/Settings", () => ({ default: () => null }));

import App from "../../src/App";

describe("App loading boundaries", () => {
  beforeEach(() => {
    sessionStorage.clear();
    authState.currentUser = { uid: "user-1" };
    authState.loading = false;
    authState.error = null;
    authState.onboarded = true;
    campaignProviderRenderMock.mockClear();
  });

  it("renders the dashboard without an intermediate page-loading state", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Application header")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Loading page…")).not.toBeInTheDocument();
  });

  it("shows an explicit account error instead of an indefinite loading state", () => {
    authState.currentUser = null;
    authState.error = new Error("sign-in failed");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Unable to load your account. Please refresh.")).toBeInTheDocument();
  });

  it("starts campaign-list subscriptions before rendering dashboard routes", () => {
    const campaignView = render(
      <MemoryRouter initialEntries={["/campaign/campaign-1"]}>
        <App />
      </MemoryRouter>
    );

    expect(campaignProviderRenderMock).toHaveBeenCalled();
    campaignView.unmount();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(campaignProviderRenderMock).toHaveBeenCalled();
  });
});
