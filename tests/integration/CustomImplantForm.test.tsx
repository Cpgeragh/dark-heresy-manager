// tests/integration/CustomImplantForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomImplantForm } from "../../src/pages/characterSheet/CyberneticsTab/CustomImplantForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomImplantForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomImplantForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

describe("CustomImplantForm", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("fills every required field via the pickers and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.type(screen.getByPlaceholderText("Cybernetic name..."), "Auto-Sanguine");
    await user.click(screen.getByRole("button", { name: "Good" })); // Craftsmanship
    await user.click(screen.getByRole("radio", { name: "Custom" })); // Origin
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[1], "500"); // Cost
    await user.click(screen.getByText("Choose availability"));
    await user.click(screen.getByText("Scarce"));

    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Auto-Sanguine",
        craftsmanship: "Good",
        source: "Custom",
        value: "500 Thrones",
        availability: "Scarce",
      })
    );
  });

  it("switches the installation location via its picker", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByText("Not specified")).toBeInTheDocument();
    await user.click(screen.getByText("Not specified"));
    await user.click(screen.getByText("Head"));

    expect(screen.getByText("Head")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
