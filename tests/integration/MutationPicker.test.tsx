import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MutationPicker } from "../../src/features/corruption/MutationPicker";

function setup(tier: "minor" | "major" = "minor") {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <MutationPicker tier={tier} existingReferenceIds={new Set()} onAdd={onAdd} onClose={onClose} />
  );
  return { onAdd, onClose };
}

describe("MutationPicker roll-capture sub-screen", () => {
  it("adds a flat-only mutation immediately, with no sub-screen", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Tough Hide", { selector: "span" }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ referenceId: "tough-hide" }));
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  });

  it("shows a roll-capture sub-screen for a mutation with a roll1d10 modifier, disabled until filled", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Misshapen", { selector: "span" }));

    const addButton = screen.getByRole("button", { name: "Add Minor Mutation" });
    expect(addButton).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();

    await user.type(screen.getByRole("spinbutton"), "6");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "misshapen", rolledModifiers: { ag: 6 } })
    );
  });

  it("requires both independent rolls for Tox Blood before the Add button enables", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Tox Blood", { selector: "span" }));

    const addButton = screen.getByRole("button", { name: "Add Minor Mutation" });
    const [intInput, felInput] = screen.getAllByRole("spinbutton");

    await user.type(intInput, "3");
    expect(addButton).toBeDisabled();

    await user.type(felInput, "8");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "tox-blood", rolledModifiers: { int: 3, fel: 8 } })
    );
  });

  it("rejects an out-of-range roll — Add stays disabled", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Misshapen", { selector: "span" }));
    const addButton = screen.getByRole("button", { name: "Add Minor Mutation" });

    await user.type(screen.getByRole("spinbutton"), "11");
    expect(addButton).toBeDisabled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows only the roll1d10 input for a mixed flat+roll major mutation (Aberration)", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup("major");

    await user.click(screen.getByText("Aberration", { selector: "span" }));

    // Strength/Agility/Fellowship are flat and need no input — only Intelligence rolls.
    expect(screen.getAllByRole("spinbutton")).toHaveLength(1);

    const addButton = screen.getByRole("button", { name: "Add Major Mutation" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByRole("spinbutton"), "4");
    await user.click(addButton);

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "aberration", rolledModifiers: { int: 4 } })
    );
  });

  it("excludes a mutation already on the character from the list", () => {
    render(
      <MutationPicker
        tier="minor"
        existingReferenceIds={new Set(["tough-hide"])}
        onAdd={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Tough Hide", { selector: "span" })).not.toBeInTheDocument();
  });

  it("adds a custom mutation with a name and details", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByRole("button", { name: "+ Add custom minor mutation" }));
    const addButton = screen.getByRole("button", { name: "Add Minor Mutation" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Name the mutation..."), "Extra Toes");
    await user.type(screen.getByPlaceholderText("Optional details..."), "Just weird toes.");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Extra Toes", effect: "Just weird toes.", custom: true })
    );
  });
});
