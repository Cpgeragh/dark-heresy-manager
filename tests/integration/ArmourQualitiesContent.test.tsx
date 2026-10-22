// tests/integration/ArmourQualitiesContent.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import {
  ArmourQualitiesContent,
  ArmourQualitiesLine,
} from "../../src/pages/CharacterSheet/ArmourTab/ArmourQualitiesContent";

describe("ArmourQualitiesLine", () => {
  it("shows nothing when there are no qualities", () => {
    const { container } = render(<ArmourQualitiesLine name="Flak Jacket" qualities={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the qualities with an information icon that explains each one", async () => {
    const user = userEvent.setup();
    render(<ArmourQualitiesLine name="Flak Jacket" qualities={["Flak", "Mesh"]} />);

    expect(screen.getByText("Qualities")).toBeInTheDocument();
    expect(screen.getByText("Flak, Mesh")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show information about Flak Jacket Qualities" })
    );

    expect(screen.getByText(/Counts as AP 5 against any hit/)).toBeInTheDocument();
  });
});

describe("ArmourQualitiesContent", () => {
  it("skips a quality that has no recorded description", () => {
    render(<ArmourQualitiesContent qualities={["Flak", "Not A Real Quality"]} />);

    expect(screen.getByText("Flak")).toBeInTheDocument();
    expect(screen.queryByText("Not A Real Quality")).not.toBeInTheDocument();
  });
});
