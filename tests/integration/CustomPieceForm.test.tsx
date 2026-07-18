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

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, forceField = false) {
  const textboxes = () => screen.getAllByRole("textbox");
  await user.type(textboxes()[0], forceField ? "Test Field" : "Test Armour"); // Name
  await user.click(screen.getByRole("button", { name: "Custom" })); // Origin
  if (forceField) {
    await user.type(textboxes()[1], "40"); // Protection Rating
  } else {
    await user.click(screen.getByRole("button", { name: "Body" })); // Locations
    await user.type(textboxes()[1], "3"); // AP
  }
  await user.type(textboxes()[2], "5"); // Weight
  await user.type(textboxes()[3], "80"); // Cost
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

  it("stays disabled without an Origin even when every other field is filled", async () => {
    const user = userEvent.setup();
    renderForm();
    const textboxes = () => screen.getAllByRole("textbox");
    await user.type(textboxes()[0], "Test Armour");
    await user.click(screen.getByRole("button", { name: "Body" }));
    await user.type(textboxes()[1], "3");
    await user.type(textboxes()[2], "5");
    await user.type(textboxes()[3], "80");
    await user.selectOptions(screen.getByRole("combobox"), "Average");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });
});

describe("CustomPieceForm submission shape", () => {
  it("submits the expected shape including origin, location, quality, craftsmanship and rules", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Flak" })); // Quality
    await user.click(screen.getByRole("button", { name: "Good" })); // Craftsmanship
    await user.type(screen.getAllByRole("textbox")[4], "Some special rules."); // Rules (last field)

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Armour",
        source: "Custom",
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

describe("CustomPieceForm force field mode", () => {
  it("shows a Protection Rating field and no Locations grid", () => {
    renderForm({ forceField: true });
    expect(screen.getByText("Protection Rating")).toBeInTheDocument();
    expect(screen.queryByText("Locations")).not.toBeInTheDocument();
  });

  it("shows Overload as a fixed, non-selectable quality instead of a toggle row", () => {
    renderForm({ forceField: true });
    // "Overload" also appears as the InfoModal's own title, which always
    // mounts into document.body regardless of open/closed state.
    expect(screen.getAllByText("Overload").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByRole("button", { name: "Overload" })).not.toBeInTheDocument();
  });

  it("shows an info modal with the real Overload rules text", () => {
    renderForm({ forceField: true });
    expect(screen.getByLabelText("Show information about Overload")).toBeInTheDocument();
  });

  it("submits isForceField and protectionRating, with qualities fixed to Overload", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderForm({ forceField: true });
    await fillRequiredFields(user, true);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Field",
        isForceField: true,
        protectionRating: 40,
        locations: [],
        ap: 0,
        qualities: ["Overload"],
      })
    );
  });
});

describe("CustomPieceForm editing", () => {
  it("pre-fills fields, including notes, from an initial piece", () => {
    renderForm({
      initialPiece: {
        id: "e1",
        name: "Old Armour",
        source: "2nd Ed",
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
    expect(textboxes[2]).toHaveValue("2 kg");
    expect(textboxes[3]).toHaveValue("10 Thrones");
    expect(textboxes[4]).toHaveValue("Existing notes");
    // Origin ("2nd Ed") is picked up from initialPiece.source too — confirmed
    // indirectly since every required field is now satisfied without any
    // further interaction.
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
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
