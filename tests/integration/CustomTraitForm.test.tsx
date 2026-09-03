// tests/integration/CustomTraitForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CustomTraitForm } from "../../src/mechanics/traits/CustomTraitForm";

describe("CustomTraitForm", () => {
  it("disables submit until name, origin, and rules text are all filled", async () => {
    const user = userEvent.setup();
    render(<CustomTraitForm onAdd={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();

    await user.type(screen.getByLabelText(/Name/), "Iron Will");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Custom" }));
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();

    await user.type(screen.getByLabelText(/Rules Text/), "Immune to Fear.");
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });

  it("submits the trimmed name/description/source", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<CustomTraitForm onAdd={onAdd} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText(/Name/), "  Iron Will  ");
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    await user.type(screen.getByLabelText(/Rules Text/), "  Immune to Fear.  ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith({
      name: "Iron Will",
      description: "Immune to Fear.",
      source: "Custom",
    });
  });

  it("pre-fills fields from initialTrait when editing", () => {
    render(
      <CustomTraitForm
        title="Edit Custom Trait"
        submitLabel="Save"
        initialTrait={{ name: "Iron Will", description: "Immune to Fear.", source: "Custom" }}
        onAdd={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Edit Custom Trait" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toHaveValue("Iron Will");
    expect(screen.getByLabelText(/Rules Text/)).toHaveValue("Immune to Fear.");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("calls onCancel from the close button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<CustomTraitForm onAdd={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
