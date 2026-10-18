// tests/integration/SessionForm.test.tsx
//
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const createSessionMock = vi.fn();
vi.mock("../../src/services/sessionService", () => ({
  createSession: (...args: unknown[]) => createSessionMock(...args),
}));

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastWarning = vi.fn();
vi.mock("../../src/components/Toast", () => ({
  useToast: () => ({ error: mockToastError, success: mockToastSuccess, warning: mockToastWarning }),
}));

import { SessionForm } from "../../src/pages/CampaignOverview/SessionForm";

const characters = [
  { id: "c1", characterName: "Vex" },
  { id: "c2", characterName: "Thrun" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

function renderForm() {
  const onClose = vi.fn();
  render(<SessionForm campaignId="campaign-1" characters={characters} onClose={onClose} />);
  const dateInput = screen.getByLabelText(/^Date/) as HTMLInputElement;
  const xpInput = screen.getByLabelText(/^XP Awarded/) as HTMLInputElement;
  const summaryInput = screen.getByLabelText(/^Summary/) as HTMLTextAreaElement;
  const dmNotesInput = screen.getByLabelText("DM Notes (private)") as HTMLTextAreaElement;
  return { onClose, dateInput, xpInput, summaryInput, dmNotesInput };
}

describe("SessionForm", () => {
  it("opens as a pop-up titled New Session with a required Date", () => {
    renderForm();

    expect(screen.getByRole("dialog", { name: "New Session" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Date/)).toHaveAttribute("type", "date");
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Session" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Attendees" })).toBeInTheDocument();
  });

  it("explains the XP adjustment only when editing a session whose XP was applied", () => {
    const stored = {
      date: new Date("2026-03-15"),
      summary: "Recap",
      dmNotes: "",
      xpAwarded: 100,
      attendees: ["c1"],
      createdAt: new Date(),
    };
    const { unmount } = render(
      <SessionForm
        campaignId="campaign-1"
        characters={characters}
        onClose={vi.fn()}
        session={{ ...stored, xpApplied: true }}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText(/XP was already applied/)).toBeInTheDocument();
    unmount();

    render(
      <SessionForm
        campaignId="campaign-1"
        characters={characters}
        onClose={vi.fn()}
        session={{ ...stored, xpApplied: false }}
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByText(/XP was already applied/)).not.toBeInTheDocument();
  });

  it("shows the server's message when an edit is refused", async () => {
    const user = userEvent.setup();
    const onSave = vi
      .fn()
      .mockRejectedValue(new Error("Session XP cannot be adjusted below the Spent XP of Vex."));
    render(
      <SessionForm
        campaignId="campaign-1"
        characters={characters}
        onClose={vi.fn()}
        session={{
          date: new Date("2026-03-15"),
          summary: "Recap",
          dmNotes: "",
          xpAwarded: 100,
          attendees: ["c1"],
          createdAt: new Date(),
          xpApplied: true,
        }}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mockToastError).toHaveBeenCalledWith(
      "Session XP cannot be adjusted below the Spent XP of Vex."
    );
  });

  it("disables Save Session and does not save when the date is cleared", async () => {
    const user = userEvent.setup();
    const { onClose, dateInput } = renderForm();
    fireEvent.change(dateInput, { target: { value: "" } });

    const save = screen.getByRole("button", { name: "Save Session" });
    expect(save).toBeDisabled();
    await user.click(save);

    expect(createSessionMock).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps Save Session disabled until XP Awarded and Summary are filled in", async () => {
    const user = userEvent.setup();
    const { xpInput, summaryInput } = renderForm();
    const save = screen.getByRole("button", { name: "Save Session" });

    expect(xpInput).toHaveValue("");
    expect(save).toBeDisabled();

    await user.type(xpInput, "0");
    expect(save).toBeDisabled();

    await user.type(summaryInput, "A quiet night.");
    expect(save).toBeEnabled();
  });

  it("accepts only whole numbers in XP Awarded and refuses more than the limit", async () => {
    const user = userEvent.setup();
    const { xpInput } = renderForm();

    await user.type(xpInput, "2.1a-0");
    expect(xpInput).toHaveValue("210");

    await user.clear(xpInput);
    await user.type(xpInput, "100000");
    expect(xpInput).toHaveValue("100000");
    await user.type(xpInput, "1");
    expect(xpInput).toHaveValue("100000");
  });

  it("saves the session with attendees, summary, notes, and XP, then closes", async () => {
    const user = userEvent.setup();
    createSessionMock.mockResolvedValue(undefined);
    const { onClose, xpInput, summaryInput, dmNotesInput } = renderForm();

    await user.type(summaryInput, "Fought off a cult ambush.");
    await user.type(dmNotesInput, "Foreshadow the informant.");
    await user.clear(xpInput);
    await user.type(xpInput, "150");
    await user.click(screen.getByRole("checkbox", { name: "Vex" }));

    await user.click(screen.getByRole("button", { name: "Save Session" }));

    expect(createSessionMock).toHaveBeenCalledWith(
      "campaign-1",
      expect.objectContaining({
        summary: "Fought off a cult ambush.",
        dmNotes: "Foreshadow the informant.",
        xpAwarded: 150,
        attendees: ["c1"],
      })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Session saved");
    expect(onClose).toHaveBeenCalled();
  });

  it("toggles an attendee off again on a second click", async () => {
    const user = userEvent.setup();
    createSessionMock.mockResolvedValue(undefined);
    const { xpInput, summaryInput } = renderForm();
    await user.type(xpInput, "0");
    await user.type(summaryInput, "Recap");

    const vexCheckbox = screen.getByRole("checkbox", { name: "Vex" });
    await user.click(vexCheckbox);
    await user.click(vexCheckbox);
    await user.click(screen.getByRole("button", { name: "Save Session" }));

    expect(createSessionMock).toHaveBeenCalledWith(
      "campaign-1",
      expect.objectContaining({ attendees: [] })
    );
  });

  it("shows an error toast and does not close when saving fails", async () => {
    const user = userEvent.setup();
    createSessionMock.mockRejectedValue(new Error("network error"));
    const { onClose, xpInput, summaryInput } = renderForm();
    await user.type(xpInput, "0");
    await user.type(summaryInput, "Recap");

    await user.click(screen.getByRole("button", { name: "Save Session" }));

    expect(mockToastError).toHaveBeenCalledWith("Failed to save session");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose from Cancel without saving", async () => {
    const user = userEvent.setup();
    const { onClose } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(createSessionMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
