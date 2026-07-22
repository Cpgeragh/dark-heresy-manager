import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CorruptionMalignancyPicker } from "../../src/features/corruption/CorruptionMalignancyPicker";

function setup() {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <CorruptionMalignancyPicker existingReferenceIds={new Set()} onAdd={onAdd} onClose={onClose} />
  );
  return { onAdd, onClose };
}

describe("CorruptionMalignancyPicker roll-capture sub-screen", () => {
  it("adds a malignancy with no characteristic modifier immediately, with no sub-screen", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Witch-mark", { selector: "span" }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ referenceId: "witch-mark" }));
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("shows a roll-capture sub-screen for Palsy (-1d10 Agility), disabled until filled", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Palsy", { selector: "span" }));

    const addButton = screen.getByRole("button", { name: "Add Malignancy" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByRole("spinbutton"), "6");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "palsy", rolledModifiers: { ag: 6 } })
    );
  });

  it("rejects an out-of-range roll — Add stays disabled", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Palsy", { selector: "span" }));
    const addButton = screen.getByRole("button", { name: "Add Malignancy" });

    await user.type(screen.getByRole("spinbutton"), "11");
    expect(addButton).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("excludes a malignancy already on the character from the list", () => {
    render(
      <CorruptionMalignancyPicker
        existingReferenceIds={new Set(["witch-mark"])}
        onAdd={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Witch-mark", { selector: "span" })).not.toBeInTheDocument();
  });

  it("adds a custom malignancy with a name and details", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByRole("button", { name: "+ Add custom malignancy" }));
    const addButton = screen.getByRole("button", { name: "Add Malignancy" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Name the malignancy..."), "Weeping Eyes");
    await user.type(screen.getByPlaceholderText("Optional details..."), "Eyes that weep blood.");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Weeping Eyes",
        effect: "Eyes that weep blood.",
        custom: true,
      })
    );
  });
});
