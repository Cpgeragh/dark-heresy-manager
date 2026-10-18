// tests/integration/AttendeePicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { AttendeePicker } from "../../src/pages/CampaignOverview/AttendeePicker";
import { addAttendee } from "../utils/attendeePicker";

const characters = [
  { id: "c3", characterName: "Zara" },
  { id: "c1", characterName: "Cormac" },
  { id: "c2", characterName: "Libby" },
];

function renderPicker(selected: string[] = [], onChange = vi.fn()) {
  render(<AttendeePicker characters={characters} selected={selected} onChange={onChange} />);
  return { onChange };
}

describe("AttendeePicker", () => {
  it("shows a field and a disabled Add button, and no chips when nobody is chosen", () => {
    renderPicker();

    expect(screen.getByRole("button", { name: "Attendees" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
  });

  it("lists the characters alphabetically and leaves out the ones already chosen", async () => {
    const user = userEvent.setup();
    renderPicker(["c2"]);

    await user.click(screen.getByRole("button", { name: "Attendees" }));

    const names = within(screen.getByRole("dialog", { name: "Attendees" }))
      .getAllByRole("button")
      .map((button) => button.textContent)
      .filter((text) => text === "Cormac" || text === "Libby" || text === "Zara");
    expect(names).toEqual(["Cormac", "Zara"]);
  });

  it("adds the chosen character only after Add is pressed", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker(["c1"]);

    await user.click(screen.getByRole("button", { name: "Attendees" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Attendees" })).getByRole("button", {
        name: "Zara",
      })
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenCalledWith(["c1", "c3"]);
  });

  it("shows the chosen attendees as chips in alphabetical order and removes one with its button", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker(["c3", "c1", "c2"]);

    const removeButtons = screen.getAllByRole("button", { name: /^Remove / });
    expect(removeButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Remove Cormac",
      "Remove Libby",
      "Remove Zara",
    ]);

    await user.click(screen.getByRole("button", { name: "Remove Libby" }));

    expect(onChange).toHaveBeenCalledWith(["c3", "c1"]);
  });

  it("is used through the test helper to add a character", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    await addAttendee(user, "Libby");

    expect(onChange).toHaveBeenCalledWith(["c2"]);
  });
});
