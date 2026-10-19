import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { EntryDetailLine } from "../../src/ui/EntryDetailLine";

describe("EntryDetailLine", () => {
  it("shows the label and the value", () => {
    render(<EntryDetailLine label="Craftsmanship" value="Common" />);

    expect(screen.getByText("Craftsmanship")).toBeInTheDocument();
    expect(screen.getByText("Common")).toBeInTheDocument();
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });

  it("puts the information control after the value", () => {
    render(
      <EntryDetailLine
        label="Qualities"
        value="Tearing"
        info={<button type="button">Show information</button>}
      />
    );

    const line = screen.getByText("Qualities").parentElement as HTMLElement;
    const children = Array.from(line.children).map((child) => child.textContent);
    expect(children).toEqual(["Qualities", "Tearing", "Show information"]);
  });

  it("shows a dash when there is neither a value nor information", () => {
    render(<EntryDetailLine label="Rules" />);

    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("shows no dash when only information is given", () => {
    render(
      <EntryDetailLine label="Rules" info={<button type="button">Show information</button>} />
    );

    expect(screen.getByRole("button", { name: "Show information" })).toBeInTheDocument();
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });
});
