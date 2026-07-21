// tests/integration/CustomConsumableForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomConsumableForm } from "../../src/pages/characterSheet/GearTab/CustomConsumableForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomConsumableForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomConsumableForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

describe("CustomConsumableForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills every required field and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(screen.getByPlaceholderText("Consumable name..."), "Stimm Patch");
    await user.type(screen.getByPlaceholderText("1+"), "3");
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[2], "0.1"); // Weight
    await user.type(textboxes[3], "15"); // Cost
    await user.click(screen.getByText("Choose availability"));
    await user.click(screen.getByText("Average"));

    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Stimm Patch",
        quantity: 3,
        source: "Custom",
        weight: "0.1 kg",
        value: "15 Thrones",
        availability: "Average",
      })
    );
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
