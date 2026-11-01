import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { OwnedEntryRow } from "../../src/ui/OwnedEntryRow";
import { entryNotesLine } from "../../src/ui/entryNotesLine";
import {
  PersonalNotesContext,
  type SavePersonalNotes,
} from "../../src/context/PersonalNotesContext";

interface LineOptions {
  itemNotes?: string;
  personalNotes?: string;
  editable?: boolean;
  save?: SavePersonalNotes;
}

function renderLine({ itemNotes, personalNotes, editable = true, save }: LineOptions = {}) {
  const row = (
    <OwnedEntryRow
      name="Grapnel"
      editable={editable}
      lines={{
        notes: entryNotesLine("Grapnel", itemNotes, {
          collection: "gear",
          id: "gear-1",
          notes: personalNotes,
          editable,
        }),
      }}
    />
  );
  return render(
    save ? <PersonalNotesContext.Provider value={save}>{row}</PersonalNotesContext.Provider> : row
  );
}

const notesIcon = () =>
  screen.queryByRole("button", { name: "Show information about Grapnel Notes" });
const pencil = () => screen.queryByRole("button", { name: "Edit personal notes for Grapnel" });
const form = () => screen.queryByRole("dialog", { name: "Edit Personal Notes" });

describe("entryNotesLine", () => {
  it("shows a dash on a read-only sheet when there is nothing to read", () => {
    renderLine({ editable: false });

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(notesIcon()).not.toBeInTheDocument();
  });

  it("treats blank notes as no notes", () => {
    renderLine({ editable: false, itemNotes: "   ", personalNotes: "  " });

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("shows the icon on an editable sheet so the first note can be written", () => {
    renderLine({ editable: true });

    expect(notesIcon()).toBeInTheDocument();
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });

  it("opens both parts of the notes in one window", async () => {
    const user = userEvent.setup();
    renderLine({
      editable: false,
      itemNotes: "Only the GM may use it.",
      personalNotes: "Found on the hive ship.",
    });

    await user.click(notesIcon()!);

    const dialog = screen.getByRole("dialog", { name: "Grapnel Notes" });
    expect(dialog).toHaveTextContent("Item Note");
    expect(dialog).toHaveTextContent("Only the GM may use it.");
    expect(dialog).toHaveTextContent("Personal Notes");
    expect(dialog).toHaveTextContent("Found on the hive ship.");
  });

  it("leaves out the item note heading when the entry has no item note", async () => {
    const user = userEvent.setup();
    renderLine({ personalNotes: "Mine." });

    await user.click(notesIcon()!);

    expect(screen.getByRole("dialog", { name: "Grapnel Notes" })).not.toHaveTextContent(
      "Item Note"
    );
  });

  it("says no personal notes were recorded when there are none", async () => {
    const user = userEvent.setup();
    renderLine({ editable: false, itemNotes: "Only the GM may use it." });

    await user.click(notesIcon()!);

    expect(screen.getByText("No personal notes recorded.")).toBeInTheDocument();
  });

  it("draws no pencil on a read-only sheet", async () => {
    const user = userEvent.setup();
    renderLine({ editable: false, itemNotes: "A note.", save: vi.fn() });

    await user.click(notesIcon()!);

    expect(pencil()).not.toBeInTheDocument();
  });

  it("draws no pencil when nothing can save the note", async () => {
    const user = userEvent.setup();
    renderLine({ editable: true });

    await user.click(notesIcon()!);

    expect(pencil()).not.toBeInTheDocument();
  });

  it("saves the typed note from the Edit Personal Notes pop-up and closes it", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(true);
    renderLine({ save });

    await user.click(notesIcon()!);
    await user.click(pencil()!);
    await user.type(screen.getByRole("textbox", { name: "Personal Notes" }), "Keep it dry");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(save).toHaveBeenCalledWith("gear", "gear-1", "Keep it dry");
    await waitFor(() => expect(form()).not.toBeInTheDocument());
  });

  it("starts the pop-up with the current note and keeps Save off until it changes", async () => {
    const user = userEvent.setup();
    renderLine({ personalNotes: "Found on the hive ship.", save: vi.fn() });

    await user.click(notesIcon()!);
    await user.click(pencil()!);

    expect(screen.getByRole("textbox", { name: "Personal Notes" })).toHaveValue(
      "Found on the hive ship."
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps the pop-up open when the save fails", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(false);
    renderLine({ save });

    await user.click(notesIcon()!);
    await user.click(pencil()!);
    await user.type(screen.getByRole("textbox", { name: "Personal Notes" }), "Keep it dry");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(form()).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Personal Notes" })).toHaveValue("Keep it dry");
  });

  it("closes the pop-up without saving on Cancel", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    renderLine({ save });

    await user.click(notesIcon()!);
    await user.click(pencil()!);
    await user.type(screen.getByRole("textbox", { name: "Personal Notes" }), "Keep it dry");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(save).not.toHaveBeenCalled();
    expect(form()).not.toBeInTheDocument();
  });
});
