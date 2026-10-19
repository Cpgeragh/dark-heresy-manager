import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RemoveEntryButton } from "../../src/ui/RemoveEntryButton";

describe("RemoveEntryButton", () => {
  it("asks before removing an entry and closes after success", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<RemoveEntryButton kind="Implant" name="Auto-Quill" onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));

    const dialog = screen.getByRole("dialog", { name: "Remove Implant" });
    expect(within(dialog).getByText("Remove Auto-Quill from this character?")).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog", { name: "Remove Implant" })).not.toBeInTheDocument();
  });

  it("cancels without running the removal", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<RemoveEntryButton kind="Drug" name="Obscura" onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove Obscura" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Remove Drug" })).not.toBeInTheDocument();
  });

  it("keeps the confirmation open when the removal returns false", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(false);
    render(<RemoveEntryButton kind="Talent" name="Resistance" onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Remove Resistance" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Remove Talent" })).toBeInTheDocument();
  });

  it("shows only the explanation and Close when removal is blocked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <RemoveEntryButton
        kind="Talent"
        name="Minor Psychic Power"
        onRemove={onRemove}
        blockedMessage="Remove the linked Psychic power first."
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Minor Psychic Power" }));

    const dialog = screen.getByRole("dialog", { name: "Cannot Remove Talent" });
    expect(within(dialog).getByText("Remove the linked Psychic power first.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    await user.click(within(dialog).getByText("Close"));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("offers an alternate action alongside complete removal", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onDowngrade = vi.fn();
    render(
      <RemoveEntryButton
        kind="Skill"
        name="Awareness"
        onRemove={onRemove}
        extra={{
          label: "Downgrade to +10",
          message: "Downgrade one level, or remove every independent purchase?",
          onClick: onDowngrade,
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Awareness" }));

    const dialog = screen.getByRole("dialog", { name: "Manage Skill" });
    expect(within(dialog).getByRole("button", { name: "Remove Skill" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Downgrade to +10" }));
    expect(onDowngrade).toHaveBeenCalledOnce();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("uses permanent Delete wording and a custom source", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <RemoveEntryButton
        kind="Note"
        name="Session 12"
        verb="Delete"
        from="the archive"
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByRole("button", { name: "Delete Session 12" }));

    const dialog = screen.getByRole("dialog", { name: "Delete Note" });
    expect(within(dialog).getByText("Delete Session 12 from the archive?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
