import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { InsanityTraumaPicker } from "../../src/mechanics/insanity/InsanityTraumaPicker";

function setup(editable = true) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <InsanityTraumaPicker existingReferenceIds={new Set()} editable={editable} onAdd={onAdd} onClose={onClose} />
  );
  return { onAdd, onClose };
}

describe("InsanityTraumaPicker", () => {
  it("adds a trauma with no options immediately", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Withdrawn and Quiet", { selector: "span" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "01-40", name: "Withdrawn and Quiet" })
    );
  });

  it("shows a choice sub-screen for Hysterically Blind or Deaf instead of adding immediately", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Hysterically Blind or Deaf", { selector: "span" }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Hysterically Blind or Deaf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blind" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deaf" })).toBeInTheDocument();
  });

  it("adds the Blind variant with its own name, not the raw reference name", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Hysterically Blind or Deaf", { selector: "span" }));
    await user.click(screen.getByRole("button", { name: "Blind" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "161-170", name: "Hysterically Blind" })
    );
  });

  it("adds the Deaf variant with its own name", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Hysterically Blind or Deaf", { selector: "span" }));
    await user.click(screen.getByRole("button", { name: "Deaf" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "161-170", name: "Hysterically Deaf" })
    );
  });
});

describe("InsanityTraumaPicker custom trauma", () => {
  it("adds a custom trauma with a name, origin, and rules text", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByRole("button", { name: "Add custom trauma" }));
    const addButton = screen.getByRole("button", { name: "Add Trauma" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Name the trauma..."), "Frozen in Place");
    expect(addButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "2nd Ed" }));
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("What this trauma does..."), "The character freezes for 1 round.");
    expect(addButton).not.toBeDisabled();

    await user.click(addButton);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Frozen in Place",
        effect: "The character freezes for 1 round.",
        source: "2nd Ed",
        custom: true,
      })
    );
  });
});

describe("InsanityTraumaPicker editable=false", () => {
  it("shows a View title, ignores row clicks, and hides the custom-add action", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup(false);

    expect(screen.getByRole("dialog", { name: "View Temporary Trauma" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add custom trauma" })).not.toBeInTheDocument();

    await user.click(screen.getByText("Withdrawn and Quiet", { selector: "span" }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
