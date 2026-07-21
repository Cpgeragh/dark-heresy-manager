// tests/integration/CustomDrugForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomDrugForm } from "../../src/pages/characterSheet/DrugsTab/CustomDrugForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomDrugForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomDrugForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

describe("CustomDrugForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills every required field and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(screen.getByPlaceholderText("Drug name..."), "Obscura");
    await user.type(screen.getByPlaceholderText("1+"), "2");
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[2], "0.1"); // Weight
    await user.type(textboxes[3], "25"); // Cost
    await user.click(screen.getByText("Choose availability"));
    await user.click(screen.getByText("Rare"));

    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Obscura",
        quantity: 2,
        source: "Custom",
        weight: "0.1 kg",
        value: "25 Thrones",
        availability: "Rare",
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
