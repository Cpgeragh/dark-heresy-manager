import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { InsanityPanel } from "../../src/features/insanity/InsanityPanel";
import type { InsanityBlock } from "../../src/types/Character";

function InsanityWiring({ initial, editable = true }: { initial: InsanityBlock; editable?: boolean }) {
  const [insanity, setInsanity] = useState<InsanityBlock>(initial);
  return <InsanityPanel insanity={insanity} editable={editable} onUpdate={setInsanity} sectionClassName="" />;
}

function findButtonNear(labelText: string, buttonName: string): HTMLElement {
  return screen
    .getAllByRole("button", { name: buttonName })
    .find((btn) => btn.parentElement?.textContent?.includes(labelText))!;
}

describe("InsanityPanel points wiring", () => {
  it("updates the degree shown when the stepper crosses into a new band", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 9, disorders: [] }} />);

    expect(screen.getByText("Stable")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase" }));

    expect(screen.getByText("Unsettled")).toBeInTheDocument();
    expect(screen.queryByText("Stable")).not.toBeInTheDocument();
  });

  it("shows the terminal message instead of thresholds at 100+ points", () => {
    render(<InsanityWiring initial={{ points: 100, disorders: [] }} />);
    expect(screen.getByText("Character retires from play")).toBeInTheDocument();
  });

  it("shows Chem Geld's acquisition point with its Talent source", () => {
    render(
      <InsanityPanel
        insanity={{ points: 4, disorders: [] }}
        editable
        onUpdate={() => undefined}
        sectionClassName=""
        talents={{
          homeworld: "",
          talents: [{ uid: "c1", talentId: "chem-geld", name: "Chem Geld" }],
          traits: [],
        }}
      />
    );
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Show information about Insanity Point Adjustments" })).toBeInTheDocument();
  });
});

describe("InsanityPanel tab switching", () => {
  it("switches the active tab between Temporary Trauma and Disorders", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 0, disorders: [] }} />);

    const traumaTab = screen.getByRole("tab", { name: "Temporary Trauma" });
    const disordersTab = screen.getByRole("tab", { name: "Disorders" });
    expect(traumaTab).toHaveAttribute("aria-selected", "true");

    await user.click(disordersTab);

    expect(disordersTab).toHaveAttribute("aria-selected", "true");
    expect(traumaTab).toHaveAttribute("aria-selected", "false");
  });
});

describe("InsanityPanel picker wiring", () => {
  it("opens the Disorder picker from the Disorders + Add button", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 0, disorders: [] }} />);

    await user.click(findButtonNear("Disorders", "+ Add"));

    expect(screen.getByText("Add Disorder")).toBeInTheDocument();
  });

  it("opens the Trauma picker from the Temporary Trauma + Add button", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 0, disorders: [] }} />);

    await user.click(findButtonNear("Temporary Trauma", "+ Add"));

    expect(screen.getByText("Add Trauma")).toBeInTheDocument();
  });
});

describe("InsanityPanel editable=false", () => {
  it("hides Add/Remove actions and disables the stepper", () => {
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severity: "Minor" },
          ],
        }}
        editable={false}
      />
    );

    expect(screen.queryByRole("button", { name: "+ Add" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Decrease" })).toHaveAttribute("aria-disabled", "true");
  });
});

describe("InsanityPanel legacy free-text fallback", () => {
  it("shows legacy disorder notes as a text field when disorders is still the old string format", () => {
    render(<InsanityWiring initial={{ points: 0, disorders: "Some old disorder notes" }} />);

    expect(screen.getAllByText("Legacy Disorder Notes").length).toBeGreaterThanOrEqual(1);
  });
});
