import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CharacterEntryRow, CharacterEntryRowContent } from "../../src/ui/CharacterEntryRow";

describe("CharacterEntryRow actions", () => {
  it("puts the remove action first and the expand control last", () => {
    render(
      <CharacterEntryRow
        name="Bionic Arm"
        removeAction={<button type="button">Remove</button>}
        actions={<button type="button">Edit</button>}
        expandControl={<button type="button">Expand</button>}
      />
    );

    const labels = screen.getAllByRole("button").map((button) => button.textContent);
    expect(labels).toEqual(["Remove", "Edit", "Expand"]);
  });

  it("leaves extra room before the expand control", () => {
    render(
      <CharacterEntryRow
        name="Bionic Arm"
        removeAction={<button type="button">Remove</button>}
        expandControl={<button type="button">Expand</button>}
      />
    );

    expect(screen.getByRole("button", { name: "Expand" }).parentElement).toHaveClass(
      "ml-2",
      "lg:ml-3"
    );
  });

  it("renders no action area when there are no actions", () => {
    const { container } = render(<CharacterEntryRow name="Bionic Arm" />);

    expect(container.querySelector(".justify-end")).toBeNull();
  });

  it("lifts the remove action above the card overlay when the row is interactive", () => {
    render(
      <CharacterEntryRowContent
        interactive
        name="Lasgun"
        removeAction={<button type="button">Remove</button>}
      />
    );

    expect(screen.getByRole("button", { name: "Remove" }).parentElement).toHaveClass(
      "pointer-events-auto"
    );
  });

  it("adds no wrapper class to the remove action in a flat row", () => {
    render(
      <CharacterEntryRow name="Bionic Arm" removeAction={<button type="button">Remove</button>} />
    );

    expect(screen.getByRole("button", { name: "Remove" }).parentElement).not.toHaveClass(
      "pointer-events-auto"
    );
  });
});
