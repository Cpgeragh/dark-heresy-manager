import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { InsanityDisorderPicker } from "../../src/mechanics/insanity/InsanityDisorderPicker";

function setup(existingReferenceIds = new Set<string>(), editable = true) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <InsanityDisorderPicker
      existingReferenceIds={existingReferenceIds}
      editable={editable}
      onAdd={onAdd}
      onClose={onClose}
    />
  );
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

  it("restores the disorder list position after returning from the type filter", async () => {
    const user = userEvent.setup();
    setup();
    const list = screen
      .getByRole("dialog", { name: "Add Disorder" })
      .querySelector<HTMLElement>(".overflow-y-auto");
    if (!list) throw new Error("No Disorder picker scroll container found");
    list.scrollTop = 155;
    fireEvent.scroll(list);

    await user.click(screen.getByText("All Disorder Types"));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(
      screen
        .getByRole("dialog", { name: "Add Disorder" })
        .querySelector<HTMLElement>(".overflow-y-auto")?.scrollTop
    ).toBe(155);
  });

  it("adds a custom disorder with a type, name, origin, and rules text", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();

    await user.click(screen.getByRole("button", { name: "Add custom disorder" }));
    expect(screen.getByRole("button", { name: "Add Disorder" })).toBeDisabled();

    // Type defaults to "Delusion", the alphabetically-first real disorder type.
    await user.click(screen.getByText("Delusion"));
    await user.click(screen.getByText("Phobia"));
    await user.type(screen.getByPlaceholderText("Name the disorder…"), "Custom Fear");
    expect(screen.getByRole("button", { name: "Add Disorder" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "2nd Ed" }));
    expect(screen.getByRole("button", { name: "Add Disorder" })).toBeDisabled();

    await user.type(screen.getByPlaceholderText("What this disorder does…"), "Fear of something specific.");
    expect(screen.getByRole("button", { name: "Add Disorder" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add Disorder" }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "Phobia",
        name: "Custom Fear",
        notes: "Fear of something specific.",
        source: "2nd Ed",
        custom: true,
      })
    );
  });
});

describe("InsanityDisorderPicker editable=false", () => {
  it("shows a View title, ignores row clicks, and hides the custom-add action", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup(new Set(), false);

    expect(screen.getByRole("dialog", { name: "View Disorders" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add custom disorder" })).not.toBeInTheDocument();

    await user.click(screen.getByText("Fear of the Dead", { selector: "span" }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
