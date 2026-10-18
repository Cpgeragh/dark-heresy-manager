// tests/integration/SessionForm.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { addAttendee } from "../utils/attendeePicker";

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess, warning: vi.fn() }),
}));

import { SessionForm } from "../../src/pages/CampaignOverview/SessionForm";
import type { SessionListDocument } from "../../src/types/Firestore";

const characters = [
  { id: "c1", characterName: "Vex" },
  { id: "c2", characterName: "Thrun" },
];

function stored(overrides: Partial<SessionListDocument> = {}): SessionListDocument {
  return {
    date: new Date("2026-03-15"),
    summary: "Recap",
    dmNotes: "Notes",
    xpAwarded: 100,
    attendees: ["c1"],
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SessionForm open mode", () => {
  function renderOpen(onSave = vi.fn().mockResolvedValue(undefined)) {
    const onClose = vi.fn();
    render(
      <SessionForm
        mode="open"
        characters={characters}
        session={stored({ status: "open", xpAwarded: 0, summary: "", dmNotes: "" })}
        onClose={onClose}
        onSave={onSave}
      />
    );
    return { onSave, onClose };
  }

  it("is titled Session in Progress with only the Notes", () => {
    renderOpen();

    expect(screen.getByRole("dialog", { name: "Session in Progress" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/XP Awarded/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Date/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Session" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Attendees" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Attendees" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument();
  });

  it("requires a summary, so Save stays disabled while it is blank", async () => {
    const user = userEvent.setup();
    renderOpen();
    const save = screen.getByRole("button", { name: "Save" });

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText(/^Summary/), "They reached the hive.");
    expect(save).toBeEnabled();
    await user.clear(screen.getByLabelText(/^Summary/));
    expect(save).toBeDisabled();
  });

  it("saves only the notes, with no date, no attendees and no XP, then closes", async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderOpen();

    await user.type(screen.getByLabelText(/^Summary/), "They reached the hive.");
    await user.type(screen.getByLabelText(/DM Notes/), "Foreshadow the informant.");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith({
      summary: "They reached the hive.",
      dmNotes: "Foreshadow the informant.",
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Session saved");
    expect(onClose).toHaveBeenCalled();
  });

  it("has no Close Session button, because closing starts from the session card", () => {
    renderOpen();

    expect(screen.queryByRole("button", { name: "Close Session" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "End of Session" })).not.toBeInTheDocument();
  });
});

describe("SessionForm close mode", () => {
  function renderClose() {
    const onRequestCloseSession = vi.fn();
    const onSave = vi.fn();
    render(
      <SessionForm
        mode="close"
        characters={characters}
        session={stored({ status: "open", xpAwarded: 0 })}
        onClose={vi.fn()}
        onSave={onSave}
        onRequestCloseSession={onRequestCloseSession}
      />
    );
    return { onRequestCloseSession, onSave };
  }

  it("shows only the Session and Attendees boxes, with no Notes", () => {
    renderClose();

    expect(screen.getByRole("dialog", { name: "Close Session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Attendees" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Notes" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Summary/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/DM Notes/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Date/)).not.toBeInTheDocument();
  });

  it("requires XP Awarded, which starts empty, before Close Session", async () => {
    const user = userEvent.setup();
    renderClose();
    const close = screen.getByRole("button", { name: "Close Session" });

    expect(screen.getByLabelText(/^XP Awarded/)).toHaveValue("");
    expect(close).toBeDisabled();
    await user.type(screen.getByLabelText(/^XP Awarded/), "0");
    expect(close).toBeEnabled();
  });

  it("requires at least one attendee to close, shown by the required note", async () => {
    const user = userEvent.setup();
    renderClose();
    await user.type(screen.getByLabelText(/^XP Awarded/), "150");
    const close = screen.getByRole("button", { name: "Close Session" });

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(close).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Remove Vex" }));
    expect(close).toBeDisabled();
  });

  it("hands the XP and attendees to the confirmation instead of saving", async () => {
    const user = userEvent.setup();
    const { onRequestCloseSession, onSave } = renderClose();

    await user.type(screen.getByLabelText(/^XP Awarded/), "150");
    await addAttendee(user, "Thrun");
    await user.click(screen.getByRole("button", { name: "Close Session" }));

    expect(onRequestCloseSession).toHaveBeenCalledWith({
      xpAwarded: 150,
      attendees: ["c1", "c2"],
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("accepts only whole numbers in XP Awarded and refuses more than the limit", async () => {
    const user = userEvent.setup();
    renderClose();
    const xp = screen.getByLabelText(/^XP Awarded/);

    await user.type(xp, "2.1a-0");
    expect(xp).toHaveValue("210");

    await user.clear(xp);
    await user.type(xp, "100000");
    expect(xp).toHaveValue("100000");
    await user.type(xp, "1");
    expect(xp).toHaveValue("100000");
  });
});

describe("SessionForm edit mode", () => {
  function renderEdit(session = stored(), onSave = vi.fn().mockResolvedValue(undefined)) {
    const onClose = vi.fn();
    render(
      <SessionForm
        mode="edit"
        characters={characters}
        session={session}
        onClose={onClose}
        onSave={onSave}
      />
    );
    return { onSave, onClose };
  }

  it("opens as Edit Session filled in with a required date, XP Awarded and Summary", () => {
    renderEdit();

    expect(screen.getByRole("dialog", { name: "Edit Session" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Date/)).toHaveValue("2026-03-15");
    expect(screen.getByLabelText(/^XP Awarded/)).toHaveValue("100");
    expect(screen.getByLabelText(/^Summary/)).toHaveValue("Recap");
    expect(screen.getByRole("heading", { name: "Session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Attendees" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Vex" })).toBeInTheDocument();
  });

  it("disables Save when no attendee is left", async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.click(screen.getByRole("button", { name: "Remove Vex" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("disables Save when the date is cleared", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEdit();
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: "" } });

    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await user.click(save);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves the changed values including the XP, then closes", async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderEdit();
    const xp = screen.getByLabelText(/^XP Awarded/);

    await user.clear(xp);
    await user.type(xp, "150");
    await addAttendee(user, "Thrun");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ xpAwarded: 150, summary: "Recap", attendees: ["c1", "c2"] })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("explains the XP adjustment only when the session's XP was applied", () => {
    renderEdit(stored({ xpApplied: true }));
    expect(screen.getByText(/XP was already applied/)).toBeInTheDocument();
  });

  it("shows no adjustment note when the XP was not applied", () => {
    renderEdit(stored({ xpApplied: false }));
    expect(screen.queryByText(/XP was already applied/)).not.toBeInTheDocument();
  });

  it("shows the server's message when an edit is refused and stays open", async () => {
    const user = userEvent.setup();
    const { onClose } = renderEdit(
      stored({ xpApplied: true }),
      vi
        .fn()
        .mockRejectedValue(new Error("Session XP cannot be adjusted below the Spent XP of Vex."))
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mockToastError).toHaveBeenCalledWith(
      "Session XP cannot be adjusted below the Spent XP of Vex."
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
