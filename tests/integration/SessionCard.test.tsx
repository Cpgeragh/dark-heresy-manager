import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SessionCard } from "../../src/pages/CampaignOverview/SessionCard";
import { ToastProvider } from "../../src/components/Toast";
import type { SessionDocument } from "../../src/types/Firestore";

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const characters = [
  { id: "char-1", characterName: "Brother Corvus" },
  { id: "char-2", characterName: "Sister Mira" },
];

const baseSession: SessionDocument & { id: string } = {
  id: "session-1",
  date: new Date("2026-03-15"),
  summary: "The acolytes investigated the underhive.",
  dmNotes: "Player missed the hidden door clue.",
  xpAwarded: 200,
  attendees: ["char-1", "char-2"],
  createdAt: new Date(),
};

describe("SessionCard", () => {
  it("renders the session date", () => {
    renderWithToast(<SessionCard session={baseSession} characters={characters} isDM={false} />);
    expect(screen.getByText(/march/i)).toBeInTheDocument();
  });

  it("shows XP badge when xpAwarded is greater than zero", () => {
    renderWithToast(<SessionCard session={baseSession} characters={characters} isDM={false} />);
    expect(screen.getByText("+200 XP")).toBeInTheDocument();
  });

  it("hides XP badge when xpAwarded is zero", () => {
    const session = { ...baseSession, xpAwarded: 0 };
    renderWithToast(<SessionCard session={session} characters={characters} isDM={false} />);
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it("resolves attendee IDs to character names", () => {
    renderWithToast(<SessionCard session={baseSession} characters={characters} isDM={false} />);
    expect(screen.getByText(/Brother Corvus/)).toBeInTheDocument();
    expect(screen.getByText(/Sister Mira/)).toBeInTheDocument();
  });

  it("falls back to raw ID when character not found", () => {
    const session = { ...baseSession, attendees: ["char-unknown"] };
    renderWithToast(<SessionCard session={session} characters={characters} isDM={false} />);
    expect(screen.getByText(/char-unknown/)).toBeInTheDocument();
  });

  it("shows summary text", () => {
    renderWithToast(<SessionCard session={baseSession} characters={characters} isDM={false} />);
    expect(screen.getByText("The acolytes investigated the underhive.")).toBeInTheDocument();
  });

  it("shows DM notes when isDM is true", () => {
    renderWithToast(<SessionCard session={baseSession} characters={characters} isDM={true} />);
    expect(screen.getByText(/Player missed the hidden door clue/)).toBeInTheDocument();
  });

  it("hides DM notes when isDM is false", () => {
    renderWithToast(<SessionCard session={baseSession} characters={characters} isDM={false} />);
    expect(screen.queryByText(/Player missed the hidden door clue/)).not.toBeInTheDocument();
  });

  it("hides attendees section when attendees list is empty", () => {
    const session = { ...baseSession, attendees: [] };
    renderWithToast(<SessionCard session={session} characters={characters} isDM={false} />);
    expect(screen.queryByText(/Attendees/)).not.toBeInTheDocument();
  });

  it("hides summary when summary is empty", () => {
    const session = { ...baseSession, summary: "" };
    renderWithToast(<SessionCard session={session} characters={characters} isDM={false} />);
    expect(screen.queryByText("The acolytes investigated the underhive.")).not.toBeInTheDocument();
  });
});

describe("SessionCard delete confirmation", () => {
  it("uses the plain Delete? confirm and calls onDelete(false) when XP was never applied", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: undefined };
    renderWithToast(
      <SessionCard session={session} characters={characters} isDM={true} onDelete={onDelete} />
    );

    expect(screen.queryByText(/won't remove that XP/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(onDelete).toHaveBeenCalledWith(false);
  });

  it("shows the reversal warning and checkbox once XP has been applied", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard session={session} characters={characters} isDM={true} onDelete={onDelete} />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText(/already applied/)).toBeInTheDocument();
    expect(screen.getByText(/Also remove 200 XP from attendees/)).toBeInTheDocument();
  });

  it("calls onDelete(false) when confirmed without checking the reversal box", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard session={session} characters={characters} isDM={true} onDelete={onDelete} />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(onDelete).toHaveBeenCalledWith(false);
  });

  it("calls onDelete(true) when the reversal checkbox is checked before confirming", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard session={session} characters={characters} isDM={true} onDelete={onDelete} />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    expect(onDelete).toHaveBeenCalledWith(true);
  });

  it("cancelling the reversal confirm discards the checked state", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard session={session} characters={characters} isDM={true} onDelete={onDelete} />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "No" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText(/already applied/)).not.toBeInTheDocument();

    // Reopening should start unchecked again, not remember the discarded state.
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("does not show any delete control for a non-DM viewer", () => {
    const onDelete = vi.fn();
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard session={session} characters={characters} isDM={false} onDelete={onDelete} />
    );

    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
