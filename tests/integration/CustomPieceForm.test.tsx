// tests/integration/CustomPieceForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CustomPieceForm } from "../../src/pages/characterSheet/ArmourTab/CustomPieceForm";

function renderForm(props: Partial<React.ComponentProps<typeof CustomPieceForm>> = {}) {
  const onAdd = vi.fn();
  const onCancel = vi.fn();
  render(<CustomPieceForm onAdd={onAdd} onCancel={onCancel} {...props} />);
  return { onAdd, onCancel };
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  const textboxes = () => screen.getAllByRole("textbox");
  await user.type(textboxes()[0], "Test Armour"); // Name
  await user.click(screen.getByRole("button", { name: "Body" })); // Locations
  await user.type(textboxes()[1], "3"); // AP
  await user.type(textboxes()[3], "5"); // Weight
  await user.type(textboxes()[4], "80"); // Cost
  await user.selectOptions(screen.getByRole("combobox"), "Average"); // Availability
}

describe("CustomPieceForm validation", () => {
  it("disables submit and shows a Required hint when required fields are missing", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("enables submit once every required field is filled", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
  });
});

describe("CustomPieceForm submission shape", () => {
  it("submits the expected shape including location, quality, craftsmanship and rules", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Flak" })); // Quality
    await user.click(screen.getByRole("button", { name: "Good" })); // Craftsmanship
    await user.type(screen.getAllByRole("textbox")[2], "Some special rules."); // Rules

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Armour",
        locations: ["body"],
        ap: 3,
        craftsmanship: "Good",
        qualities: ["Flak"],
        notes: "Some special rules.",
        weight: "5 kg",
        value: "80 Thrones",
        availability: "Average",
        custom: true,
      })
    );
  });

  it("submits notes as undefined when the Rules field is left blank", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ notes: undefined }));
  });

  it("excludes a quality from the submission once toggled back off", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Flak" }));
    await user.click(screen.getByRole("button", { name: "Flak" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ qualities: undefined }));
  });

  it("defaults craftsmanship to Common when not changed", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ craftsmanship: "Common" }));
  });
});

describe("CustomPieceForm editing", () => {
  it("pre-fills fields, including notes, from an initial piece", () => {
    renderForm({
      initialPiece: {
        id: "e1",
        name: "Old Armour",
        locations: ["head"],
        ap: 2,
        craftsmanship: "Good",
        notes: "Existing notes",
        qualities: ["Mesh"],
        weight: "2 kg",
        value: "10 Thrones",
        availability: "Rare",
        worn: true,
      },
    });
    const textboxes = screen.getAllByRole("textbox");
    expect(textboxes[0]).toHaveValue("Old Armour");
    expect(textboxes[1]).toHaveValue("2");
    expect(textboxes[2]).toHaveValue("Existing notes");
    expect(textboxes[3]).toHaveValue("2 kg");
    expect(textboxes[4]).toHaveValue("10 Thrones");
  });
});

describe("CustomPieceForm cancel", () => {
  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
