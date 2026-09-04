// tests/integration/PlayerPicker.test.tsx
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

import { PlayerPicker } from "../../src/pages/CharacterSheet/PlayerPicker";

function renderPicker(memberIds: string[]) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<PlayerPicker memberIds={memberIds} onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PlayerPicker", () => {
  it("shows a loading message before names resolve", () => {
    mockGetFirstName.mockReturnValue(new Promise(() => {}));
    renderPicker(["uid-1"]);
    expect(screen.getByText("Loading players…")).toBeInTheDocument();
  });

  it("shows an empty message when the campaign has no members", async () => {
    renderPicker([]);
    await waitFor(() =>
      expect(screen.getByText("No players in this campaign yet.")).toBeInTheDocument()
    );
  });

  it("returns to loading when the member list changes", async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    mockGetFirstName.mockResolvedValueOnce("Alice").mockResolvedValueOnce("Bob");
    const { rerender } = render(
      <PlayerPicker memberIds={["uid-1"]} onSelect={onSelect} onClose={onClose} />
    );

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    rerender(<PlayerPicker memberIds={["uid-2"]} onSelect={onSelect} onClose={onClose} />);

    expect(screen.getByText("Loading players…")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Bob")).toBeInTheDocument());
  });

  it("resolves and displays each member's first name, sorted alphabetically", async () => {
    mockGetFirstName.mockImplementation(async (uid: string) =>
      uid === "uid-1" ? "Zephyr" : "Alice"
    );
    renderPicker(["uid-1", "uid-2"]);

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    const names = screen.getAllByText(/Alice|Zephyr/).map((el) => el.textContent);
    expect(names).toEqual(["Alice", "Zephyr"]);
  });

  it("falls back to the raw uid when a member has no profile name", async () => {
    mockGetFirstName.mockResolvedValue(null);
    renderPicker(["uid-no-profile"]);
    // Name label and uid subtext both fall back to the same string, so both match.
    await waitFor(() => expect(screen.getAllByText("uid-no-profile")).toHaveLength(2));
  });

  it("falls back to the raw uid when the profile lookup fails", async () => {
    mockGetFirstName.mockRejectedValue(new Error("permission denied"));
    renderPicker(["uid-failed"]);
    await waitFor(() => expect(screen.getAllByText("uid-failed")).toHaveLength(2));
  });

  it("calls onSelect with the member's uid when a row is clicked", async () => {
    const user = userEvent.setup();
    mockGetFirstName.mockResolvedValue("Alice");
    const { onSelect } = renderPicker(["uid-1"]);

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    await user.click(screen.getByText("Alice"));

    expect(onSelect).toHaveBeenCalledWith("uid-1");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    mockGetFirstName.mockResolvedValue("Alice");
    const { onClose } = renderPicker(["uid-1"]);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });
});
