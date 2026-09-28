import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "../../src/components/FormField";

describe("FormField", () => {
  it("asks the browser not to autofill single-line fields", () => {
    render(<FormField label="Character Name" value="" onChange={() => undefined} />);
    const input = screen.getByRole("textbox", { name: "Character Name" });
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("name", "field-character-name");
  });

  it("asks the browser not to autofill multi-line fields", () => {
    render(<FormField label="Notes" type="textarea" value="" onChange={() => undefined} />);
    const input = screen.getByRole("textbox", { name: "Notes" });
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("name", "field-notes");
  });
});
