// tests/integration/CustomShieldForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomShieldForm } from "../../src/pages/CharacterSheet/weapons/CustomShieldForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomShieldForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomShieldForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

// The submit button shares its default "Add" label with the Qualities selector's
// own "Add" button, so it can't be located by accessible name alone.
function submitButton(): HTMLElement {
  const cancelBtn = screen.getByRole("button", { name: "Cancel" });
  const buttons = Array.from(cancelBtn.parentElement!.querySelectorAll("button"));
  return buttons.find((b) => b !== cancelBtn)!;
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  const textboxes = () => screen.getAllByRole("textbox");

  await user.type(textboxes()[0], "Custom Buckler"); // Name
  await user.type(textboxes()[1], "Arm"); // Locations
  await user.click(screen.getByRole("radio", { name: "Custom" })); // Origin
  await user.type(textboxes()[2], "2"); // AP
  // Pen (index 3) defaults to "0", already valid
  // Damage base (index 4) defaults to "1d10", already valid
  // Damage plus (index 5) defaults to "0", already valid
  await user.click(screen.getByText("Impact")); // Damage type (defaults to Impact)
  await user.click(screen.getByText("Rending"));
  await user.type(textboxes()[6], "2"); // Weight
  await user.type(textboxes()[7], "30"); // Cost
  await user.click(screen.getByText("Choose availability")); // Availability
  await user.click(screen.getByText("Scarce"));
}

describe("CustomShieldForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills every required field and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await fillRequiredFields(user);

    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        custom: true,
        name: "Custom Buckler",
        ap: 2,
        locations: "Arm",
        damage: "1d10 R",
        pen: "0",
        weight: "2 kg",
        value: "30 Thrones",
        availability: "Scarce",
        source: "Custom",
        specialRules: undefined,
      })
    );
  });

  it("adds and removes a quality via the Qualities selector", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByText("Choose quality…"));
    await user.click(screen.getByText("Accurate"));
    const addButtons = screen.getAllByRole("button", { name: "Add" });
    const qualityAddButton = addButtons.find((b) => b !== submitButton())!;
    await user.click(qualityAddButton);
    expect(screen.getByText("Accurate")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Accurate" }));
    // Removing returns it to the dropdown's available options, so the text
    // itself still exists, check the chip's dismiss button is gone instead.
    expect(screen.queryByRole("button", { name: "Remove Accurate" })).not.toBeInTheDocument();
  });

  it("parses an existing shield's damage for editing", () => {
    renderForm({ initialShield: { id: "s1", name: "Old Shield", ap: 3, damage: "2d10+2 E" } });
    const textboxes = screen.getAllByRole("textbox");
    // Damage base (index 4) and damage plus (index 5) reflect the parsed values.
    expect(textboxes[4]).toHaveValue("2d10");
    expect(textboxes[5]).toHaveValue("2");
    expect(screen.getByText("Energy")).toBeInTheDocument();
  });

  it("shows a Saving button and ignores a second press until onAdd settles", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onAdd = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    renderForm({ onAdd });

    await fillRequiredFields(user);
    await user.click(submitButton());

    expect(submitButton()).toHaveTextContent("Saving");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await user.click(submitButton());
    expect(onAdd).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() => expect(submitButton()).not.toHaveTextContent("Saving"));
    expect(submitButton()).toHaveTextContent("Add");
  }, 15_000);

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
