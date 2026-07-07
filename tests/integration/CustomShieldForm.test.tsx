// tests/integration/CustomShieldForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomShieldForm } from "../../src/pages/characterSheet/weapons/CustomShieldForm";

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

describe("CustomShieldForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills every required field and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    const textboxes = () => screen.getAllByRole("textbox");
    const comboboxes = () => screen.getAllByRole("combobox");

    await user.type(textboxes()[0], "Custom Buckler"); // Name
    await user.type(textboxes()[1], "Arm"); // Locations
    await user.click(screen.getByRole("button", { name: "Custom" })); // Origin
    await user.type(textboxes()[2], "2"); // AP
    // Pen (index 3) defaults to "0", already valid
    // Damage base (index 4) defaults to "1d10", already valid
    // Damage plus (index 5) defaults to "0", already valid
    await user.selectOptions(comboboxes()[0], "R"); // Damage type
    await user.type(textboxes()[6], "2"); // Weight
    await user.type(textboxes()[7], "30"); // Cost
    await user.selectOptions(comboboxes()[1], "Scarce"); // Availability

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

  it("parses an existing shield's damage for editing", () => {
    renderForm({ initialShield: { id: "s1", name: "Old Shield", ap: 3, damage: "2d10+2 E" } });
    const textboxes = screen.getAllByRole("textbox");
    // Damage base (index 4) and damage plus (index 5) reflect the parsed values.
    expect(textboxes[4]).toHaveValue("2d10");
    expect(textboxes[5]).toHaveValue("2");
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("E");
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
