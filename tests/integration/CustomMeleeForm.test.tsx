// tests/integration/CustomMeleeForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomMeleeForm } from "../../src/pages/characterSheet/weapons/CustomMeleeForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomMeleeForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomMeleeForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

// Text inputs in DOM order: Name(0), Damage base(1), Damage plus(2), Pen(3), Weight(4), Cost(5).
function textboxAt(index: number): HTMLElement {
  return screen.getAllByRole("textbox")[index];
}

// The submit button shares its default "Add" label with the Qualities selector's
// own "Add" button, so it can't be located by accessible name alone.
function submitButton(): HTMLElement {
  const cancelBtn = screen.getByRole("button", { name: "Cancel" });
  const buttons = Array.from(cancelBtn.parentElement!.querySelectorAll("button"));
  return buttons.find((b) => b !== cancelBtn)!;
}

describe("CustomMeleeForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills out every required field and submits the expected weapon shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(textboxAt(0), "Custom Axe"); // Name
    await user.click(screen.getByText("Choose class")); // Class
    await user.click(screen.getByText("Melee"));
    await user.click(screen.getByRole("button", { name: "Good" })); // Craftsmanship
    await user.click(screen.getByRole("button", { name: "Custom" })); // Origin
    await user.type(textboxAt(3), "2"); // Pen
    await user.type(textboxAt(4), "3"); // Weight
    await user.type(textboxAt(5), "50"); // Cost
    await user.click(screen.getByText("Choose availability")); // Availability
    await user.click(screen.getByText("Common"));

    expect(submitButton()).toBeEnabled();
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        custom: true,
        name: "Custom Axe",
        class: "Melee",
        craftsmanship: "Good",
        source: "Custom",
        damage: "1d10 R",
        pen: "2",
        weight: "3 kg",
        value: "50 Thrones",
        availability: "Common",
        specialRules: undefined,
        integrated: false,
        quantity: undefined,
      })
    );
  });

  it("sets a starting quantity of 1 for a thrown melee weapon class", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(textboxAt(0), "Custom Knife");
    await user.click(screen.getByText("Choose class"));
    await user.click(screen.getByText("Melee / Thrown"));
    await user.click(screen.getByRole("button", { name: "Common" }));
    await user.click(screen.getByRole("button", { name: "Custom" }));
    await user.type(textboxAt(3), "0");
    await user.type(textboxAt(4), "0.5");
    await user.type(textboxAt(5), "10");
    await user.click(screen.getByText("Choose availability"));
    await user.click(screen.getByText("Common"));
    await user.click(submitButton());

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }));
  });

  it("parses an existing weapon's damage for editing", () => {
    renderForm({ initialWeapon: { damage: "1d10+3 I" } });
    expect(textboxAt(1)).toHaveValue("1d10"); // damage base
    expect(textboxAt(2)).toHaveValue("3"); // damage plus
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
