import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { DeleteConfirmModal } from "../../src/ui/modals/DeleteConfirmModal";
import { ManageActionRow } from "../../src/ui/modals/ManageActionRow";
import { ManageModal } from "../../src/ui/modals/ManageModal";

describe("ManageModal and ManageActionRow", () => {
  it("shows a titled window with one row per action, each with an info icon and its button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ManageModal title="Manage Thing" ariaLabel="Manage Thing window" onClose={onClose}>
        <ManageActionRow label="First Action" info="Does the first thing.">
          <button type="button">Run first</button>
        </ManageActionRow>
        <ManageActionRow
          label="Second Action"
          info="Does the second thing."
          detail={<p>Extra detail</p>}
        >
          <button type="button">Run second</button>
        </ManageActionRow>
      </ManageModal>
    );

    const dialog = await screen.findByRole("dialog", { name: "Manage Thing window" });
    expect(within(dialog).getByText("Manage Thing")).toBeInTheDocument();
    expect(within(dialog).getByText("First Action")).toBeInTheDocument();
    expect(within(dialog).getByText("Second Action")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Show information about First Action" })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Run first" })).toBeInTheDocument();
    expect(within(dialog).getByText("Extra detail")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("DeleteConfirmModal", () => {
  function renderModal(over: Partial<React.ComponentProps<typeof DeleteConfirmModal>> = {}) {
    const props = {
      title: "Delete Thing",
      message: "This permanently deletes this thing: Vex. This cannot be undone.",
      typedLabel: "Type DELETE to permanently delete this thing",
      ready: true,
      deleting: false,
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      ...over,
    };
    render(<DeleteConfirmModal {...props} />);
    return props;
  }

  it("says what will be deleted and keeps Delete permanently disabled until DELETE is typed", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    const dialog = await screen.findByRole("dialog", { name: "Delete Thing" });
    const button = within(dialog).getByRole("button", { name: "Delete permanently" });
    expect(within(dialog).getByText(props.message)).toBeInTheDocument();
    expect(within(dialog).getByText(props.typedLabel)).toBeInTheDocument();
    expect(button).toBeDisabled();

    await user.type(within(dialog).getByPlaceholderText("DELETE"), "delete");
    expect(button).toBeDisabled();

    await user.clear(within(dialog).getByPlaceholderText("DELETE"));
    await user.type(within(dialog).getByPlaceholderText("DELETE"), "DELETE");
    expect(button).toBeEnabled();

    await user.click(button);
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it("stays disabled while the count is not ready, even with DELETE typed", async () => {
    const user = userEvent.setup();
    renderModal({ ready: false, error: "Unable to check this deletion." });

    const dialog = await screen.findByRole("dialog", { name: "Delete Thing" });
    await user.type(within(dialog).getByPlaceholderText("DELETE"), "DELETE");

    expect(within(dialog).getByText("Unable to check this deletion.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Delete permanently" })).toBeDisabled();
  });

  it("calls onCancel from Cancel, and blocks Cancel while deleting", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    const dialog = await screen.findByRole("dialog", { name: "Delete Thing" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it("disables Cancel and the box while deleting", async () => {
    renderModal({ deleting: true });

    const dialog = await screen.findByRole("dialog", { name: "Delete Thing" });

    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(within(dialog).getByPlaceholderText("DELETE")).toBeDisabled();
  });
});
