// tests/integration/CharacteristicField.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import CharacteristicField from "../../src/components/CharacteristicField";

describe("CharacteristicField", () => {
  it("renders with correct initial value", () => {
    const value = { base: 30, advances: 3 };

    render(
      <CharacteristicField
        label="Weapon Skill"
        value={value}
        editable={false}
        onChange={() => {}}
      />
    );

    expect(screen.getByText("Weapon Skill")).toBeInTheDocument();

    // Component uses type="text" + inputMode="numeric" — role is textbox, not spinbutton
    const baseInput = screen.getByRole("textbox", { name: /weapon skill base value/i });
    expect(baseInput).toHaveValue("30");

    const pressed = screen.getAllByRole("button").filter(
      (btn) => btn.getAttribute("aria-pressed") === "true"
    );
    expect(pressed).toHaveLength(3);

    // total = 30 + 3 * 5 = 45
    expect(screen.getByText("45")).toBeInTheDocument();
  });

  it("calls onChange when values change", () => {
    const value = { base: 30, advances: 3 };
    const onChange = vi.fn();

    render(
      <CharacteristicField
        label="WS"
        value={value}
        editable={true}
        onChange={onChange}
      />
    );

    const baseInput = screen.getByRole("textbox", { name: /ws base value/i });

    // Component commits on blur, not on every keystroke
    fireEvent.change(baseInput, { target: { value: "40" } });
    fireEvent.blur(baseInput);

    expect(onChange).toHaveBeenCalled();
  });

  it("shows a cost label under each advance square when tierCosts are given", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={() => {}}
        tierCosts={[100, 250, 500, 750]}
      />
    );

    for (const cost of ["100", "250", "500", "750"]) {
      expect(screen.getByText(cost)).toBeInTheDocument();
    }
  });

  it("shows no cost labels when tierCosts is omitted", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={() => {}}
      />
    );

    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("disables a null-cost tier even when editable, and blocks the click", () => {
    const onChange = vi.fn();
    render(
      <CharacteristicField
        label="Fellowship"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={onChange}
        tierCosts={[null, null, null, null]}
      />
    );

    const firstAdvance = screen.getByRole("button", { name: /fellowship advance 1 of 4/i });
    expect(firstAdvance).toBeDisabled();
    expect(firstAdvance).toHaveAccessibleName(/not available for this career/i);

    fireEvent.click(firstAdvance);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("distinguishes a locked (null) tier from an uncosted (undefined) tier in the accessible name", () => {
    render(
      <CharacteristicField
        label="Weapon Skill"
        value={{ base: 30, advances: 0 }}
        editable
        onChange={() => {}}
        tierCosts={[100, null, undefined, undefined]}
      />
    );

    expect(screen.getByRole("button", { name: /weapon skill advance 1 of 4, 100 xp/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /weapon skill advance 2 of 4, not available for this career/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^weapon skill advance 3 of 4$/i })).toBeInTheDocument();
  });
});