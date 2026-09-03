// tests/integration/CustomGrenadeForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomGrenadeForm } from "../../src/pages/CharacterSheet/weapons/CustomGrenadeForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomGrenadeForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomGrenadeForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

// The submit button shares its default "Add" label with the Qualities selector's
// own "Add" button, so it can't be located by accessible name alone.
function submitButton(): HTMLElement {
  const cancelBtn = screen.getByRole("button", { name: "Cancel" });
  const buttons = Array.from(cancelBtn.parentElement!.querySelectorAll("button"));
  return buttons.find((b) => b !== cancelBtn)!;
}

describe("CustomGrenadeForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills every required field (default no-damage mode) and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    const textboxes = () => screen.getAllByRole("textbox");

    await user.type(textboxes()[0], "Custom Grenade"); // Name
    await user.click(screen.getByText("Choose type")); // Type
    await user.click(screen.getByText("Grenade"));
    await user.type(textboxes()[1], "3"); // Quantity
    await user.click(screen.getByRole("radio", { name: "Custom" })); // Origin
    // damageMode stays at its default "none"
    await user.type(textboxes()[2], "0"); // Pen
    await user.type(textboxes()[3], "0.5"); // Weight
    await user.type(textboxes()[4], "10"); // Cost
    await user.click(screen.getByText("Choose availability")); // Availability
    await user.click(screen.getByText("Common"));

    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        custom: true,
        name: "Custom Grenade",
        quantity: 3,
        type: "Grenade",
        class: "Thrown",
        damage: "—",
        pen: "0",
        weight: "0.5 kg",
        value: "10 Thrones",
        availability: "Common",
        source: "Custom",
        specialRules: undefined,
      })
    );
  });

  it("sets class to Mine (not Thrown) when the type is Mine", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    const textboxes = () => screen.getAllByRole("textbox");

    await user.type(textboxes()[0], "Custom Mine");
    await user.click(screen.getByText("Choose type"));
    await user.click(screen.getByText("Mine"));
    await user.type(textboxes()[1], "1");
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    await user.type(textboxes()[2], "0");
    await user.type(textboxes()[3], "1");
    await user.type(textboxes()[4], "50");
    await user.click(screen.getByText("Choose availability"));
    await user.click(screen.getByText("Rare"));
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ type: "Mine", class: "Mine" }));
  });

  it("submits Special damage mode with damage: 'Special'", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    const textboxes = () => screen.getAllByRole("textbox");

    await user.type(textboxes()[0], "Weird Device");
    await user.click(screen.getByText("Choose type"));
    await user.click(screen.getByText("Grenade"));
    await user.type(textboxes()[1], "1");
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    await user.click(screen.getByRole("button", { name: "special" }));
    await user.type(textboxes()[2], "0");
    await user.type(textboxes()[3], "1");
    await user.type(textboxes()[4], "20");
    await user.click(screen.getByText("Choose availability"));
    await user.click(screen.getByText("Rare"));
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ damage: "Special" }));
  });

  it("submits a numeric damage roll when damage mode is selected", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(screen.getAllByRole("textbox")[0], "Timed Charge"); // Name
    await user.click(screen.getByText("Choose type")); // Type
    await user.click(screen.getByText("Grenade"));
    await user.type(screen.getAllByRole("textbox")[1], "2"); // Quantity
    await user.click(screen.getByRole("radio", { name: "Custom" })); // Origin
    await user.click(screen.getByRole("button", { name: "damage" })); // switch to numeric damage mode

    // Field layout shifts once the damage-mode inputs appear: Name(0), Quantity(1),
    // Damage base(2), Damage plus(3), Pen(4), Weight(5), Cost(6).
    // Both default to non-empty values ("1d10"/"0"), and type() appends rather
    // than replacing, so clear them first.
    await user.clear(screen.getAllByRole("textbox")[2]);
    await user.type(screen.getAllByRole("textbox")[2], "2d10");
    await user.clear(screen.getAllByRole("textbox")[3]);
    await user.type(screen.getAllByRole("textbox")[3], "3");
    await user.click(screen.getByText("Explosive")); // damage type (already defaults to Explosive/X)
    await user.click(screen.getByText("Explosive"));
    await user.type(screen.getAllByRole("textbox")[4], "2"); // Pen
    await user.type(screen.getAllByRole("textbox")[5], "0.5"); // Weight
    await user.type(screen.getAllByRole("textbox")[6], "15"); // Cost
    await user.click(screen.getByText("Choose availability")); // Availability
    await user.click(screen.getByText("Common"));
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ damage: "2d10+3 X" }));
  }, 15_000);

  it("parses an existing grenade's Special damage for editing", () => {
    renderForm({ initialGrenade: { id: "g1", name: "Old Device", quantity: 1, damage: "Special" } });
    expect(screen.getByRole("button", { name: "special" })).toHaveClass("border-slate-400");
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
