import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
