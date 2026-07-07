// tests/integration/CustomRangedForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomRangedForm } from "../../src/pages/characterSheet/weapons/CustomRangedForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomRangedForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomRangedForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

// Text inputs in DOM order: Name(0), Range(1), Semi(2), Full(3), Damage base(4),
// Damage plus(5), Pen(6), Clip(7), Reload amount(8), Weight(9), Cost(10).
function textboxAt(index: number): HTMLElement {
  return screen.getAllByRole("textbox")[index];
}

// Selects in DOM order: Class(0), Ammo Family(1), Damage type(2), Reload type(3),
// Ammo Tracking(4), Availability(5), Qualities(6).
function comboboxAt(index: number): HTMLElement {
  return screen.getAllByRole("combobox")[index];
}

// The submit button shares its default "Add" label with the Qualities selector's
// own "Add" button, so it can't be located by accessible name alone — find it by
// its fixed position next to the unambiguous Cancel button instead.
function submitButton(): HTMLElement {
  const cancelBtn = screen.getByRole("button", { name: "Cancel" });
  const buttons = Array.from(cancelBtn.parentElement!.querySelectorAll("button"));
  return buttons.find((b) => b !== cancelBtn)!;
}

describe("CustomRangedForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills out every required field and submits the expected weapon shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(textboxAt(0), "Custom Blaster"); // Name
    await user.selectOptions(comboboxAt(0), "Pistol"); // Class
    await user.click(screen.getByRole("button", { name: "Good" })); // Craftsmanship
    await user.click(screen.getByRole("button", { name: "Custom" })); // Origin
    await user.type(textboxAt(1), "40"); // Range
    await user.selectOptions(comboboxAt(1), "Las"); // Ammo Family
    await user.type(textboxAt(6), "2"); // Pen
    await user.type(textboxAt(7), "10"); // Clip
    await user.type(screen.getByPlaceholderText("Amount"), "4"); // Reload amount
    await user.selectOptions(comboboxAt(3), "Full"); // Reload type
    await user.selectOptions(comboboxAt(4), "clip"); // Ammo Tracking
    await user.type(textboxAt(9), "2"); // Weight
    await user.type(textboxAt(10), "100"); // Cost
    await user.selectOptions(comboboxAt(5), "Common"); // Availability

    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        custom: true,
        name: "Custom Blaster",
        class: "Pistol",
        craftsmanship: "Good",
        source: "Custom",
        range: "40m",
        ammoType: "Las",
        rof: "S/–/–",
        damage: "1d10 I",
        pen: "2",
        clip: "10",
        rld: "4 Full",
        ammoTracking: "clip",
        weight: "2 kg",
        value: "100 Thrones",
        availability: "Common",
        specialRules: undefined,
        integrated: false,
      })
    );
  });

  it("disables and clears the reload amount field when reload type is Special", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByPlaceholderText("Amount"), "4");
    await user.selectOptions(comboboxAt(3), "Special");
    expect(screen.getByPlaceholderText("Amount")).toBeDisabled();
    expect(screen.getByPlaceholderText("Amount")).toHaveValue("");
  });

  it("disables and clears the reload amount field when reload type is the em-dash placeholder", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByPlaceholderText("Amount"), "4");
    await user.selectOptions(comboboxAt(3), "—");
    expect(screen.getByPlaceholderText("Amount")).toBeDisabled();
    expect(screen.getByPlaceholderText("Amount")).toHaveValue("");
  });

  it("parses a plain-dash reload value into the real em-dash type, not the mojibake string (regression)", () => {
    renderForm({ initialWeapon: { rld: "-" } });
    expect(comboboxAt(3)).toHaveValue("—");
    expect(screen.getByPlaceholderText("Amount")).toHaveValue("");
  });

  it("parses a numbered reload value into amount and type when editing an existing weapon", () => {
    renderForm({ initialWeapon: { rld: "4 Full" } });
    expect(screen.getByPlaceholderText("Amount")).toHaveValue("4");
    expect(comboboxAt(3)).toHaveValue("Full");
  });

  it("parses an existing weapon's damage and rate of fire for editing", () => {
    renderForm({ initialWeapon: { damage: "1d10+3 R", rof: "S/3/6" } });
    expect(textboxAt(4)).toHaveValue("1d10"); // damage base
    expect(textboxAt(5)).toHaveValue("3"); // damage plus
    expect(textboxAt(2)).toHaveValue("3"); // semi-auto
    expect(textboxAt(3)).toHaveValue("6"); // full-auto
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
