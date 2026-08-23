// tests/integration/AdminTab.test.tsx
//
// Focused on Force Assign wiring and the on-demand claim-history lifecycle.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { mockGetFirstName, mockUseClaimLogs } = vi.hoisted(() => ({
  mockGetFirstName: vi.fn(),
  mockUseClaimLogs: vi.fn(() => ({ logs: [], loading: false, error: null })),
}));

vi.mock("../../src/hooks/useClaimLogs", () => ({
  useClaimLogs: (...args: unknown[]) => mockUseClaimLogs(...args),
}));

vi.mock("../../src/services/profileService", () => ({
  getFirstName: mockGetFirstName,
}));

import { AdminTab } from "../../src/pages/characterSheet/AdminTab";
import { ToastProvider } from "../../src/components/Toast";
import type { Character } from "../../src/types/Character";

const character = { id: "char-1", userId: "owner-1", isEditableByPlayer: true } as Character;

function renderAdminTab(overrides: Partial<React.ComponentProps<typeof AdminTab>> = {}) {
  const onDMForceRelease = vi.fn();
  const onDMForceAssign = vi.fn();
  const onDMToggleEdit = vi.fn();
  render(
    <ToastProvider>
      <AdminTab
        campaignId="campaign-1"
        character={character}
        ownerName="Alice"
        onDMForceRelease={onDMForceRelease}
        onDMForceAssign={onDMForceAssign}
        onDMToggleEdit={onDMToggleEdit}
        memberIds={["uid-1", "uid-2"]}
        {...overrides}
      />
    </ToastProvider>
  );
  return { onDMForceRelease, onDMForceAssign, onDMToggleEdit };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminTab Force Assign", () => {
  it("disables the Force Assign button when the campaign has no members", () => {
    renderAdminTab({ memberIds: [] });
    expect(screen.getByRole("button", { name: "Force Assign To…" })).toBeDisabled();
  });

  it("enables the Force Assign button when the campaign has members", () => {
    renderAdminTab();
    expect(screen.getByRole("button", { name: "Force Assign To…" })).toBeEnabled();
  });

  it("opens the player picker when Force Assign To… is clicked", async () => {
    const user = userEvent.setup();
    mockGetFirstName.mockResolvedValue("Bob");
    renderAdminTab();

    await user.click(screen.getByRole("button", { name: "Force Assign To…" }));

    expect(screen.getByText("Assign To")).toBeInTheDocument();
  });

  it("calls onDMForceAssign with the selected uid and closes the picker", async () => {
    const user = userEvent.setup();
    mockGetFirstName.mockResolvedValue("Bob");
    const { onDMForceAssign } = renderAdminTab();

    await user.click(screen.getByRole("button", { name: "Force Assign To…" }));
    await waitFor(() => expect(screen.getAllByText("Bob")).toHaveLength(2));
    await user.click(screen.getAllByText("Bob")[0]);

    expect(onDMForceAssign).toHaveBeenCalledWith("uid-1");
    expect(screen.queryByText("Assign To")).not.toBeInTheDocument();
  });

  it("closes the picker without calling onDMForceAssign when dismissed", async () => {
    const user = userEvent.setup();
    mockGetFirstName.mockResolvedValue("Bob");
    const { onDMForceAssign } = renderAdminTab();

    await user.click(screen.getByRole("button", { name: "Force Assign To…" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onDMForceAssign).not.toHaveBeenCalled();
    expect(screen.queryByText("Assign To")).not.toBeInTheDocument();
  });

  it("shows Assigning… and disables the button while isDmForceAssigning is true", () => {
    renderAdminTab({ isDmForceAssigning: true });
    const button = screen.getByRole("button", { name: "Assigning…" });
    expect(button).toBeDisabled();
  });
});

describe("AdminTab claim-history listener", () => {
  it("keeps claim history disabled until the DM opens History", async () => {
    const user = userEvent.setup();
    renderAdminTab();

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", false);

    await user.click(screen.getByRole("button", { name: "Open History" }));

    expect(mockUseClaimLogs).toHaveBeenLastCalledWith("campaign-1", "char-1", true);
  });
});
