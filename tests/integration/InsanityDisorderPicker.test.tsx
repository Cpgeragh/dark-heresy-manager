import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { InsanityDisorderPicker } from "../../src/features/insanity/InsanityDisorderPicker";

function setup(existingReferenceIds = new Set<string>()) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(<InsanityDisorderPicker existingReferenceIds={existingReferenceIds} onAdd={onAdd} onClose={onClose} />);
  return { onAdd, onClose };
}

describe("InsanityDisorderPicker", () => {
  it("shows a severity sub-screen defaulting to the first option", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByText("Fear of the Dead", { selector: "span" }));

    expect(screen.getByText("Choose Severity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minor" })).toBeInTheDocument();
  });

  it("adds with the chosen severity, not just the default", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByText("Fear of the Dead", { selector: "span" }));
    await user.click(screen.getByRole("button", { name: "Severe" }));
    await user.click(screen.getByRole("button", { name: "Add Disorder" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: "phobia-fear-of-the-dead", severity: "Severe" })
    );
  });

  it("defaults to a restricted disorder's first available severity, not Minor", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    const rowButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("The Flesh is Weak"))!;
    await user.click(rowButton);
    await user.click(screen.getByRole("button", { name: "Add Disorder" }));

    // The Flesh is Weak only offers Severe/Acute — first option is Severe.
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: "Severe" }));
  });

  it("excludes a disorder already on the character from the list", () => {
    setup(new Set(["phobia-fear-of-the-dead"]));

    expect(screen.queryByText("Fear of the Dead", { selector: "span" })).not.toBeInTheDocument();
  });

  it("filters the list by disorder type", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByText("Fear of the Dead", { selector: "span" })).toBeInTheDocument();
    await user.click(screen.getByText("All Disorder Types"));
    await user.click(screen.getByText("Phobia"));
    expect(screen.getByText("Fear of the Dead", { selector: "span" })).toBeInTheDocument();
  });

  it("picks a Type for a custom disorder via the Type picker", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByRole("button", { name: "Add custom disorder" }));
    // Type defaults to "Delusion", the alphabetically-first real disorder type.
    await user.click(screen.getByText("Delusion"));
    await user.click(screen.getByText("Phobia"));
    await user.type(screen.getByPlaceholderText("Name the disorder…"), "Custom Fear");
    await user.click(screen.getByRole("button", { name: "Add Disorder" }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ type: "Phobia", name: "Custom Fear" }));
  });
});
