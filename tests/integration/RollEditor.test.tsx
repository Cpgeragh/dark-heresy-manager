import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { RollEditor } from "../../src/features/corruption/RollEditor";
import type { CharacteristicModifier } from "../../src/features/corruption/characteristicModifiers";

const TOX_BLOOD_MODIFIERS: CharacteristicModifier[] = [
  { characteristic: "int", kind: "roll1d10", sign: -1 },
  { characteristic: "fel", kind: "roll1d10", sign: -1 },
];

describe("RollEditor", () => {
  it("pre-fills inputs from the existing rolled values and enables Save immediately if all are valid", () => {
    const onSave = vi.fn();
    render(
      <RollEditor
        title="Tox Blood"
        modifiers={TOX_BLOOD_MODIFIERS}
        initialRolledModifiers={{ int: 3, fel: 8 }}
        onSave={onSave}
        onCancel={() => {}}
      />
    );

    const [intInput, felInput] = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(intInput.value).toBe("3");
    expect(felInput.value).toBe("8");
    expect(screen.getByRole("button", { name: "Save Rolls" })).not.toBeDisabled();
  });

  it("starts blank and disabled when there's no existing rolled value, and saves the edited values", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <RollEditor
        title="Tox Blood"
        modifiers={TOX_BLOOD_MODIFIERS}
        initialRolledModifiers={undefined}
        onSave={onSave}
        onCancel={() => {}}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save Rolls" });
    expect(saveButton).toBeDisabled();

    const [intInput, felInput] = screen.getAllByRole("spinbutton");
    await user.type(intInput, "4");
    await user.type(felInput, "9");
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);
    expect(onSave).toHaveBeenCalledWith({ int: 4, fel: 9 });
  });

  it("calls onCancel from the close button without saving", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <RollEditor
        title="Palsy"
        modifiers={[{ characteristic: "ag", kind: "roll1d10", sign: -1 }]}
        initialRolledModifiers={{ ag: 6 }}
        onSave={vi.fn()}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByLabelText("Close"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
