// tests/integration/SessionForm.test.tsx
//
// Date/XP inputs and the Summary/DM Notes textareas have no htmlFor/id
// association with their labels in the real component, so this file queries
// them directly rather than via getByLabelText.
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
  const utils = render(
    <SessionForm campaignId="campaign-1" characters={characters} onClose={onClose} />
  );
  const dateInput = utils.container.querySelector('input[type="date"]') as HTMLInputElement;
  const xpInput = utils.container.querySelector('input[type="number"]') as HTMLInputElement;
  const [summaryInput, dmNotesInput] = screen.getAllByRole("textbox") as HTMLTextAreaElement[];
  return { onClose, dateInput, xpInput, summaryInput, dmNotesInput };
}

describe("SessionForm", () => {
  it("shows a warning and does not save when the date is cleared", async () => {
    const user = userEvent.setup();
    const { onClose, dateInput } = renderForm();
    fireEvent.change(dateInput, { target: { value: "" } });

    await user.click(screen.getByRole("button", { name: "Save Session" }));

    expect(createSessionMock).not.toHaveBeenCalled();
    expect(mockToastWarning).toHaveBeenCalledWith("Please enter a session date");
    expect(onClose).not.toHaveBeenCalled();
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
    renderForm();

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
    const { onClose } = renderForm();

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
