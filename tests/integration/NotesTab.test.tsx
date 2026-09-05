import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { NotesTab } from "../../src/pages/CharacterSheet/NotesTab";
import type { NoteEntry } from "../../src/types/Character";

function NotesWiring({
  initial,
  editable = true,
}: {
  initial: string | NoteEntry[];
  editable?: boolean;
}) {
  const [notes, setNotes] = useState<string | NoteEntry[]>(initial);
  return <NotesTab notes={notes} editable={editable} onSave={setNotes} />;
}

describe("NotesTab legacy plain-text notes", () => {
  it("shows legacy text in an editable textarea and saves keystrokes live", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial="Old campaign notes." />);

    const textarea = screen.getByPlaceholderText(
      "Campaign notes, reminders, character details, or anything else…"
    );
    expect(textarea).toHaveValue("Old campaign notes.");

    await user.type(textarea, "!");
    expect(textarea).toHaveValue("Old campaign notes.!");
  });

  it("shows legacy text as read-only plain text when not editable", () => {
    render(<NotesWiring initial="Old campaign notes." editable={false} />);

    expect(screen.getByText("Old campaign notes.")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(
        "Campaign notes, reminders, character details, or anything else…"
      )
    ).not.toBeInTheDocument();
  });

  it("coalesces legacy note typing into one save after the user pauses", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    render(<NotesTab notes="Old" editable onSave={onSave} />);
    const textarea = screen.getByPlaceholderText(
      "Campaign notes, reminders, character details, or anything else…"
    );

    fireEvent.change(textarea, { target: { value: "Old notes" } });
    fireEvent.change(textarea, { target: { value: "Old notes updated" } });
    expect(onSave).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(600));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("Old notes updated");
    vi.useRealTimers();
  });

  it("flushes a pending legacy note when the field loses focus", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    render(<NotesTab notes="Old" editable onSave={onSave} />);
    const textarea = screen.getByPlaceholderText(
      "Campaign notes, reminders, character details, or anything else…"
    );

    fireEvent.change(textarea, { target: { value: "Final draft" } });
    fireEvent.blur(textarea);

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("Final draft");
    vi.useRealTimers();
  });

  it("shows an empty state with no legacy text and no entries", () => {
    render(<NotesWiring initial="" />);
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });
});

describe("NotesTab adding notes", () => {
  it("converts legacy text into an entry when the first new note is added", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial="Old campaign notes." />);

    await user.click(screen.getByRole("button", { name: "Add Note" }));
    const dialog = screen.getByRole("dialog", { name: "Add Note" });
    await user.type(screen.getByPlaceholderText("e.g. Session 12, Inquisitor Varn…"), "Session 12");
    await user.type(
      screen.getByPlaceholderText("What do you want to remember…"),
      "Found the relic."
    );
    await user.click(within(dialog).getByRole("button", { name: "Add Note" }));

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Old campaign notes.")).toBeInTheDocument();
    expect(screen.getByText("Session 12")).toBeInTheDocument();
    expect(screen.getByText("Found the relic.")).toBeInTheDocument();
  });

  it("adds a note directly when there's no legacy text", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={[]} />);

    await user.click(screen.getByRole("button", { name: "Add Note" }));
    const dialog = screen.getByRole("dialog", { name: "Add Note" });
    const addButton = within(dialog).getByRole("button", { name: "Add Note" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("e.g. Session 12, Inquisitor Varn…"), "General");
    expect(addButton).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("What do you want to remember…"),
      "Some reminders."
    );
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Some reminders.")).toBeInTheDocument();
  });

  it("sorts entries newest-first", async () => {
    const entries: NoteEntry[] = [
      { id: "n1", title: "Older", text: "First one.", updatedAt: "2026-01-01T00:00:00.000Z" },
      { id: "n2", title: "Newer", text: "Second one.", updatedAt: "2026-06-01T00:00:00.000Z" },
    ];
    render(<NotesWiring initial={entries} />);

    const titles = screen.getAllByText(/Older|Newer/).map((el) => el.textContent);
    expect(titles).toEqual(["Newer", "Older"]);
  });
});

describe("NotesTab search", () => {
  function twoEntries(): NoteEntry[] {
    return [
      {
        id: "n1",
        title: "Session 12",
        text: "Found the relic in the vault.",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "n2",
        title: "Inquisitor Varn",
        text: "Suspicious of the cult.",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
  }

  it("filters by title match, case-insensitively", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={twoEntries()} />);

    await user.type(screen.getByPlaceholderText("Search notes…"), "varn");

    expect(screen.getByText("Inquisitor Varn")).toBeInTheDocument();
    expect(screen.queryByText("Session 12")).not.toBeInTheDocument();
  });

  it("filters by body text match", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={twoEntries()} />);

    await user.type(screen.getByPlaceholderText("Search notes…"), "relic");

    expect(screen.getByText("Session 12")).toBeInTheDocument();
    expect(screen.queryByText("Inquisitor Varn")).not.toBeInTheDocument();
  });

  it("shows a no-match message distinct from the empty state when a query matches nothing", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={twoEntries()} />);

    await user.type(screen.getByPlaceholderText("Search notes…"), "xyz");

    expect(screen.getByText("No notes match your search.")).toBeInTheDocument();
    expect(screen.queryByText("No notes yet.")).not.toBeInTheDocument();
  });

  it("shows the search box to read-only viewers too, but not the Add button", () => {
    render(<NotesWiring initial={twoEntries()} editable={false} />);

    expect(screen.getByPlaceholderText("Search notes…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Note" })).not.toBeInTheDocument();
  });

  it("hides the search box entirely when there are no entries", () => {
    render(<NotesWiring initial={[]} />);
    expect(screen.queryByPlaceholderText("Search notes…")).not.toBeInTheDocument();
  });
});

describe("NotesTab editing and deleting", () => {
  function oneEntry(): NoteEntry[] {
    return [
      {
        id: "n1",
        title: "Session 12",
        text: "Found the relic.",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
  }

  it("tapping the card itself opens a read view, not an editable form, even when editable", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={oneEntry()} />);

    await user.click(screen.getByText("Session 12"));

    const dialog = screen.getByRole("dialog", { name: "Session 12" });
    expect(within(dialog).getByText("Found the relic.")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("e.g. Session 12, Inquisitor Varn…")
    ).not.toBeInTheDocument();
  });

  it("opens an entry for editing, pre-filled, and saves changes", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={oneEntry()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const titleInput = screen.getByPlaceholderText("e.g. Session 12, Inquisitor Varn…");
    expect(titleInput).toHaveValue("Session 12");

    await user.clear(titleInput);
    await user.type(titleInput, "Session 12 (updated)");
    await user.click(screen.getByRole("button", { name: "Save Note" }));

    expect(screen.getByText("Session 12 (updated)")).toBeInTheDocument();
  });

  it("opens a read-only view with no Save or Delete when not editable", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={oneEntry()} editable={false} />);

    await user.click(screen.getByText("Session 12"));

    const dialog = screen.getByRole("dialog", { name: "Session 12" });
    expect(within(dialog).getByText("Found the relic.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Note" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Note" })).not.toBeInTheDocument();
  });

  it("arms a confirm step on Remove and only deletes after confirming", async () => {
    const user = userEvent.setup();
    render(<NotesWiring initial={oneEntry()} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("dialog", { name: "Delete Note" })).toBeInTheDocument();
    expect(screen.getByText("Delete Session 12 from this character?")).toBeInTheDocument();
    expect(screen.getByText("Session 12")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Session 12")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByText("Session 12")).not.toBeInTheDocument();
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });
});
