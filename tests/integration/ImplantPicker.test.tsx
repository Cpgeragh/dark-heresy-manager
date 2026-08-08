// tests/integration/ImplantPicker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ImplantPicker } from "../../src/pages/characterSheet/CyberneticsTab/ImplantPicker";
import { CYBERNETICS_REFERENCE } from "../../src/data/reference/cyberneticsReference";
import { SkillSource } from "../../src/types/SkillSource";
import { craftsmanshipValue } from "../../src/pages/characterSheet/CyberneticsTab/cyberneticsHelpers";

// "Auger Arrays" is a real reference entry with no requiresLocation and a
// fixed (non-variable) cost, so clicking it goes straight to the
// craftsmanship step with no location sub-step in between.
const IMPLANT_NAME = "Auger Arrays";
const VARIABLE_LOCATION_IMPLANT_NAME = "Karrikian Lock-Arm";

function row(name: string): HTMLButtonElement {
  const match = screen
    .getAllByText(name)
    .map((el) => el.closest("button"))
    .find((el): el is HTMLButtonElement => el !== null);
  if (!match) throw new Error(`No button row found for: ${name}`);
  return match;
}

function renderPicker(editable = true) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  render(<ImplantPicker editable={editable} onSelect={onSelect} onClose={onClose} />);
  return { onSelect, onClose };
}

describe("ImplantPicker", () => {
  it("contains the complete IH implant set with its quality-specific costs", () => {
    const ihImplants = CYBERNETICS_REFERENCE.filter((item) => item.source === SkillSource.IH);
    const concealedWeaponBionic = ihImplants.find(
      (item) => item.id === "ih-concealed-weapon-bionic"
    );
    const hermeticInfusion = ihImplants.find((item) => item.id === "ih-hermetic-infusion");

    expect(ihImplants).toHaveLength(7);
    expect(concealedWeaponBionic).toBeDefined();
    expect(hermeticInfusion).toBeDefined();
    expect(craftsmanshipValue(concealedWeaponBionic!, "Poor")).toBe("150 Thrones");
    expect(craftsmanshipValue(concealedWeaponBionic!, "Common")).toBe("300 Thrones");
    expect(craftsmanshipValue(concealedWeaponBionic!, "Good")).toBe("750 Thrones");
    expect(craftsmanshipValue(hermeticInfusion!, "Good")).toBe("17,000 Thrones");
  });

  it("renders implants from reference data", () => {
    renderPicker();
    expect(screen.getAllByText(IMPLANT_NAME).length).toBeGreaterThan(0);
  });

  it("opens the craftsmanship step and calls onSelect with the chosen grade", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(row(IMPLANT_NAME));
    expect(screen.getByText("Select craftsmanship quality:")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Good" }));
    await user.click(screen.getByRole("button", { name: "Install" }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: IMPLANT_NAME }),
      "Good",
      undefined,
      undefined,
      undefined
    );
  });

  it("does not open the craftsmanship step in read-only mode", async () => {
    const user = userEvent.setup();
    renderPicker(false);
    await user.click(row(IMPLANT_NAME));
    expect(screen.queryByText("Select craftsmanship quality:")).not.toBeInTheDocument();
  });

  it("carries assigned metadata through location and craftsmanship", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();

    await user.click(row(VARIABLE_LOCATION_IMPLANT_NAME));

    const continueButton = screen.getByRole("button", { name: "Continue" });
    await user.type(screen.getByLabelText(/Cost \(Thrones\)/), "2500");
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByLabelText(/Rarity/));
    await user.click(screen.getByRole("button", { name: "Near Unique" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Select installation side:")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Left Arm" }));
    expect(screen.getByText("Select craftsmanship quality:")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Install" }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: VARIABLE_LOCATION_IMPLANT_NAME }),
      "Common",
      ["leftArm"],
      "2,500 Thrones",
      "Near Unique"
    );
  });
});
