// tests/integration/BeginSessionForm.test.tsx
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

import { BeginSessionForm } from "../../src/pages/CampaignOverview/BeginSessionForm";

const characters = [
  { id: "c1", characterName: "Vex" },
  { id: "c2", characterName: "Thrun" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

function renderForm(onBegin = vi.fn().mockResolvedValue(undefined)) {
  const onClose = vi.fn();
  render(<BeginSessionForm characters={characters} onBegin={onBegin} onClose={onClose} />);
  return { onBegin, onClose };
}

describe("BeginSessionForm", () => {
  it("opens as a pop-up titled Begin Session with a required date and the attendee picker", () => {
    renderForm();

    expect(screen.getByRole("dialog", { name: "Begin Session" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Date/)).toHaveAttribute("type", "date");
    expect(screen.getByRole("button", { name: "Attendees" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/XP Awarded/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Summary/)).not.toBeInTheDocument();
  });

  it("begins the session with the date and the added attendees, then closes", async () => {
    const user = userEvent.setup();
    const { onBegin, onClose } = renderForm();

    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: "2026-10-17" } });
    await addAttendee(user, "Thrun");
    await user.click(screen.getByRole("button", { name: "Begin Session" }));

    expect(onBegin).toHaveBeenCalledWith("2026-10-17", ["c2"]);
    expect(mockToastSuccess).toHaveBeenCalledWith("Session begun");
    expect(onClose).toHaveBeenCalled();
  });

  it("requires at least one attendee, shown by the required note", async () => {
    const user = userEvent.setup();
    const { onBegin } = renderForm();
    const begin = screen.getByRole("button", { name: "Begin Session" });

    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(begin).toBeDisabled();
    await addAttendee(user, "Vex");
    expect(begin).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Remove Vex" }));
    expect(begin).toBeDisabled();
    await user.click(begin);

    expect(onBegin).not.toHaveBeenCalled();
  });

  it("disables Begin Session while the date is empty", async () => {
    const user = userEvent.setup();
    const { onBegin } = renderForm();
    await addAttendee(user, "Vex");
    fireEvent.change(screen.getByLabelText(/^Date/), { target: { value: "" } });

    const begin = screen.getByRole("button", { name: "Begin Session" });
    expect(begin).toBeDisabled();
    await user.click(begin);

    expect(onBegin).not.toHaveBeenCalled();
  });

  it("shows the server's message and stays open when another session is already open", async () => {
    const user = userEvent.setup();
    const { onClose } = renderForm(
      vi
        .fn()
        .mockRejectedValue(
          new Error("A session is already open. Close it before starting another.")
        )
    );

    await addAttendee(user, "Vex");
    await user.click(screen.getByRole("button", { name: "Begin Session" }));

    expect(mockToastError).toHaveBeenCalledWith(
      "A session is already open. Close it before starting another."
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from Cancel without beginning a session", async () => {
    const user = userEvent.setup();
    const { onBegin, onClose } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onBegin).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
