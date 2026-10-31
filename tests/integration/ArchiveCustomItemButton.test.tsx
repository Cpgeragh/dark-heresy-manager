// tests/integration/ArchiveCustomItemButton.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ArchiveCustomItemButton } from "../../src/ui/forms/ArchiveCustomItemButton";

describe("ArchiveCustomItemButton", () => {
  it("asks before archiving, naming the item, and archives nothing until confirmed", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn().mockResolvedValue(true);
    render(
      <ArchiveCustomItemButton
        name="Custom Auspex"
        busy={false}
        archiving={false}
        onArchive={onArchive}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archive" }));

    const dialog = screen.getByRole("dialog", { name: "Archive Custom Item" });
    expect(
      within(dialog).getByText(
        "This archives Custom Auspex and removes it from every character in this campaign."
      )
    ).toBeInTheDocument();
    expect(onArchive).not.toHaveBeenCalled();
  });

  it("does nothing when the pop-up is cancelled", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn().mockResolvedValue(true);
    render(
      <ArchiveCustomItemButton
        name="Custom Auspex"
        busy={false}
        archiving={false}
        onArchive={onArchive}
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onArchive).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the pop-up once the archive succeeds", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn().mockResolvedValue(true);
    render(
      <ArchiveCustomItemButton
        name="Custom Auspex"
        busy={false}
        archiving={false}
        onArchive={onArchive}
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    const dialog = screen.getByRole("dialog", { name: "Archive Custom Item" });
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    expect(onArchive).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the pop-up open when the archive returns false", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn().mockResolvedValue(false);
    render(
      <ArchiveCustomItemButton
        name="Custom Auspex"
        busy={false}
        archiving={false}
        onArchive={onArchive}
      />
    );

    await user.click(screen.getByRole("button", { name: "Archive" }));
    const dialog = screen.getByRole("dialog", { name: "Archive Custom Item" });
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(onArchive).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Archive" })).toBeEnabled()
    );
    expect(screen.getByRole("dialog", { name: "Archive Custom Item" })).toBeInTheDocument();
  });

  it("disables the Archive button while another action is running for the item", () => {
    render(
      <ArchiveCustomItemButton
        name="Custom Auspex"
        busy={true}
        archiving={false}
        onArchive={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Archive" })).toBeDisabled();
  });
});
