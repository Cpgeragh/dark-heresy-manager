import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={false}
      />
    );
    expect(screen.getByText(/march/i)).toBeInTheDocument();
  });

  it("shows XP badge when xpAwarded is greater than zero", () => {
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={false}
      />
    );
    expect(screen.getByText("+200 XP")).toBeInTheDocument();
  });

  it("hides XP badge when xpAwarded is zero", () => {
    const session = { ...baseSession, xpAwarded: 0 };
    renderWithToast(
      <SessionCard campaignId="campaign-1" session={session} characters={characters} isDM={false} />
    );
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it("resolves attendee IDs to character names", () => {
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={false}
      />
    );
    expect(screen.getByText(/Brother Corvus/)).toBeInTheDocument();
    expect(screen.getByText(/Sister Mira/)).toBeInTheDocument();
  });

  it("falls back to raw ID when character not found", () => {
    const session = { ...baseSession, attendees: ["char-unknown"] };
    renderWithToast(
      <SessionCard campaignId="campaign-1" session={session} characters={characters} isDM={false} />
    );
    expect(screen.getByText(/char-unknown/)).toBeInTheDocument();
  });

  it("shows summary text", () => {
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={false}
      />
    );
    expect(screen.getByText("The acolytes investigated the underhive.")).toBeInTheDocument();
  });

  it("shows DM notes when isDM is true", () => {
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={true}
      />
    );
    expect(screen.getByText(/Player missed the hidden door clue/)).toBeInTheDocument();
  });

  it("hides DM notes when isDM is false", () => {
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={false}
      />
    );
    expect(screen.queryByText(/Player missed the hidden door clue/)).not.toBeInTheDocument();
  });

  it("hides attendees section when attendees list is empty", () => {
    const session = { ...baseSession, attendees: [] };
    renderWithToast(
      <SessionCard campaignId="campaign-1" session={session} characters={characters} isDM={false} />
    );
    expect(screen.queryByText(/Attendees/)).not.toBeInTheDocument();
  });

  it("hides summary when summary is empty", () => {
    const session = { ...baseSession, summary: "" };
    renderWithToast(
      <SessionCard campaignId="campaign-1" session={session} characters={characters} isDM={false} />
    );
    expect(screen.queryByText("The acolytes investigated the underhive.")).not.toBeInTheDocument();
  });

  it("shows the total documents affected by applying XP", () => {
    const session = { ...baseSession, xpApplied: false };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onApplyXp={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Apply XP" })).toBeInTheDocument();
  });
});

function confirmDialog() {
  return within(screen.getByRole("dialog", { name: "Delete Session" }));
}

describe("SessionCard delete pop-up", () => {
  it("opens the Delete Session pop-up and calls onDelete(false) when XP was never applied", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: undefined };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByRole("dialog", { name: "Delete Session" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirmDialog().getByText(/Delete the session on/)).toBeInTheDocument();
    expect(screen.queryByText(/won't remove that XP/)).not.toBeInTheDocument();

    await user.click(confirmDialog().getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Delete Session" })).not.toBeInTheDocument()
    );
  });

  it("shows the reversal warning and checkbox once XP has been applied", async () => {
    const user = userEvent.setup();
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(confirmDialog().getByText(/already applied/)).toBeInTheDocument();
    expect(confirmDialog().getByText(/Also remove 200 XP from attendees/)).toBeInTheDocument();
    expect(confirmDialog().getByText("This will affect 2 documents.")).toBeInTheDocument();

    await user.click(confirmDialog().getByRole("checkbox"));
    expect(confirmDialog().getByText("This will affect 8 documents.")).toBeInTheDocument();
  });

  it("shows the reversal checkbox as ticked after it is clicked, and unticked after a second click", async () => {
    const user = userEvent.setup();
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(confirmDialog().getByRole("checkbox"));
    expect(confirmDialog().getByRole("checkbox")).toBeChecked();

    await user.click(confirmDialog().getByRole("checkbox"));
    expect(confirmDialog().getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onDelete(false) when confirmed without checking the reversal box", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(confirmDialog().getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(false);
  });

  it("calls onDelete(true) when the reversal checkbox is checked before confirming", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(confirmDialog().getByRole("checkbox"));
    await user.click(confirmDialog().getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(true);
  });

  it("cancelling the pop-up discards the checked state", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={true}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(confirmDialog().getByRole("checkbox"));
    await user.click(confirmDialog().getByRole("button", { name: "Cancel" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Delete Session" })).not.toBeInTheDocument();

    // Reopening should start unchecked again, not remember the discarded state.
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(confirmDialog().getByRole("checkbox")).not.toBeChecked();
  });

  it("does not show any delete control for a non-DM viewer", () => {
    const onDelete = vi.fn();
    const session = { ...baseSession, xpApplied: true };
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={session}
        characters={characters}
        isDM={false}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});

describe("SessionCard edit pop-up", () => {
  it("opens the Edit Session pop-up filled in and saves through onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={true}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const dialog = within(screen.getByRole("dialog", { name: "Edit Session" }));
    expect(dialog.getByLabelText(/^Date/)).toHaveValue("2026-03-15");
    expect(dialog.getByLabelText(/^Summary/)).toHaveValue(baseSession.summary);
    expect(dialog.getByLabelText(/^XP Awarded/)).toHaveValue("200");

    const xp = dialog.getByLabelText(/^XP Awarded/);
    await user.clear(xp);
    await user.type(xp, "250");
    await user.click(dialog.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: baseSession.summary,
        xpAwarded: 250,
        attendees: ["char-1", "char-2"],
      })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Edit Session" })).not.toBeInTheDocument()
    );
  });

  it("closes the Edit Session pop-up from Cancel without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={true}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Edit Session" })).getByRole("button", {
        name: "Cancel",
      })
    );

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Edit Session" })).not.toBeInTheDocument();
  });

  it("shows no Edit button for a non-DM viewer", () => {
    renderWithToast(
      <SessionCard
        campaignId="campaign-1"
        session={baseSession}
        characters={characters}
        isDM={false}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });
});
