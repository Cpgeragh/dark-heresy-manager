// tests/integration/NameGate.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const saveFirstNameMock = vi.fn();
vi.mock("../../src/services/profileService", () => ({
  saveFirstName: (...args: unknown[]) => saveFirstNameMock(...args),
}));

import NameGate from "../../src/pages/NameGate";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NameGate", () => {
  it("disables Continue until a name is entered", () => {
    render(<NameGate effectiveUserId="user-1" />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("strips whitespace as it's typed", async () => {
    const user = userEvent.setup();
    render(<NameGate effectiveUserId="user-1" />);

    await user.type(screen.getByPlaceholderText("e.g. David"), "Da vid");

    expect(screen.getByPlaceholderText("e.g. David")).toHaveValue("David");
  });

  it("saves the trimmed name on Continue", async () => {
    const user = userEvent.setup();
    saveFirstNameMock.mockResolvedValue(undefined);
    render(<NameGate effectiveUserId="user-1" />);

    await user.type(screen.getByPlaceholderText("e.g. David"), "David");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(saveFirstNameMock).toHaveBeenCalledWith("user-1", "David");
  });

  it("shows an error message when saving fails", async () => {
    const user = userEvent.setup();
    saveFirstNameMock.mockRejectedValue(new Error("network error"));
    render(<NameGate effectiveUserId="user-1" />);

    await user.type(screen.getByPlaceholderText("e.g. David"), "David");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument()
    );
  });
});
