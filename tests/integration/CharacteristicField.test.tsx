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
});