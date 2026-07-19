// tests/integration/ArcheotechCustomItemForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomItemForm } from "../../src/pages/characterSheet/ArcheotechTab/CustomItemForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomItemForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomItemForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

describe("ArcheotechTab CustomItemForm", () => {
  it("shows the type picker first and moves to the details form on selecting a type", async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.getByText("Device")).toBeInTheDocument();
    await user.click(screen.getByText("Device"));
    expect(screen.getByPlaceholderText("Item name…")).toBeInTheDocument();
  });

  it("disables submit until a name is entered", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByText("Device"));
    expect(screen.getByRole("button", { name: "Add Item" })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Item name…"), "Strange Orb");
    expect(screen.getByRole("button", { name: "Add Item" })).toBeEnabled();
  });

  it("picks a rarity via its picker and submits the expected shape", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();

    await user.click(screen.getByText("Device"));
    await user.type(screen.getByPlaceholderText("Item name…"), "Strange Orb");
    await user.click(screen.getByText("— Select availability —"));
    await user.click(screen.getByText("Scarce"));

    await user.click(screen.getByRole("button", { name: "Add Item" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Strange Orb",
        type: "Device",
        availability: "Scarce",
      })
    );
  });

  it("does not show a Craftsmanship field for non-Cybernetic items", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByText("Device"));
    expect(screen.queryByText("Craftsmanship")).not.toBeInTheDocument();
  });

  it("shows and sets Craftsmanship via its picker for Cybernetic items", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm({ initialItem: { type: "Cybernetic" } });

    await user.type(screen.getByPlaceholderText("Item name…"), "Auto-Sanguine");
    await user.click(screen.getByText("— Select —"));
    await user.click(screen.getByText("Good"));

    await user.click(screen.getByRole("button", { name: "Add Item" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Auto-Sanguine",
        type: "Cybernetic",
        craftsmanship: "Good",
      })
    );
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByText("Device"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
