// tests/integration/AdminTab.test.tsx
//
// Focused on the Force Assign wiring added to AdminTab (button + PlayerPicker).
// Not a full retrofit of AdminTab's pre-existing behaviour (ownership display,
// claim history), which had no prior test coverage.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { mockGetFirstName } = vi.hoisted(() => ({
  mockGetFirstName: vi.fn(),
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
        character={character}
        ownerName="Alice"
        claimLog={[]}
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
