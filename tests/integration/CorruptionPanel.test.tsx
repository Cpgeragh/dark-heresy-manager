import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CorruptionPanel } from "../../src/mechanics/corruption/CorruptionPanel";
import type { CorruptionBlock } from "../../src/types/Character";

function CorruptionWiring({ initial, editable = true }: { initial: CorruptionBlock; editable?: boolean }) {
  const [corruption, setCorruption] = useState<CorruptionBlock>(initial);
  return <CorruptionPanel corruption={corruption} editable={editable} onUpdate={setCorruption} sectionClassName="" />;
}

function findButtonNear(labelText: string, buttonName: string): HTMLElement {
  return screen
    .getAllByRole("button", { name: buttonName })
    .find((btn) => btn.parentElement?.textContent?.includes(labelText))!;
}

describe("CorruptionPanel points wiring", () => {
  it("updates the degree shown when the stepper crosses into a new band", async () => {
    const user = userEvent.setup();
    render(<CorruptionWiring initial={{ points: 29, malignancies: [] }} />);

    expect(screen.getByText("Tainted")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase" }));
    await user.click(screen.getByRole("button", { name: "Increase" }));

    expect(screen.getByText("Soiled")).toBeInTheDocument();
    expect(screen.queryByText("Tainted")).not.toBeInTheDocument();
  });

  it("shows the terminal message instead of thresholds at 100+ points", () => {
    render(<CorruptionWiring initial={{ points: 100, malignancies: [] }} />);
    expect(screen.getByText("Character removed from play")).toBeInTheDocument();
  });
});

describe("CorruptionPanel tab switching", () => {
  it("switches the active tab across all three entry groups", async () => {
    const user = userEvent.setup();
    render(<CorruptionWiring initial={{ points: 0, malignancies: [] }} />);

    const malignanciesTab = screen.getByRole("tab", { name: "Malignancies" });
    const minorTab = screen.getByRole("tab", { name: "Minor Mutations" });
    const majorTab = screen.getByRole("tab", { name: "Major Mutations" });
    expect(malignanciesTab).toHaveAttribute("aria-selected", "true");

    await user.click(minorTab);
    expect(minorTab).toHaveAttribute("aria-selected", "true");
    expect(malignanciesTab).toHaveAttribute("aria-selected", "false");

    await user.click(majorTab);
    expect(majorTab).toHaveAttribute("aria-selected", "true");
    expect(minorTab).toHaveAttribute("aria-selected", "false");
  });
});

describe("CorruptionPanel picker wiring", () => {
  it("opens the Malignancy picker from the Malignancies Add button", async () => {
    const user = userEvent.setup();
    render(<CorruptionWiring initial={{ points: 0, malignancies: [] }} />);

    await user.click(findButtonNear("Malignancies", "Add Malignancy"));

    expect(screen.getByRole("dialog", { name: "Add Malignancy" })).toBeInTheDocument();
  });

  it("opens the Minor Mutation picker from the Minor Mutations Add button", async () => {
    const user = userEvent.setup();
    render(<CorruptionWiring initial={{ points: 0, malignancies: [] }} />);

    await user.click(findButtonNear("Minor Mutations", "Add Minor Mutation"));

    expect(screen.getByRole("dialog", { name: "Add Minor Mutation" })).toBeInTheDocument();
  });

  it("opens the Major Mutation picker from the Major Mutations Add button", async () => {
    const user = userEvent.setup();
    render(<CorruptionWiring initial={{ points: 0, malignancies: [] }} />);

    await user.click(findButtonNear("Major Mutations", "Add Major Mutation"));

    expect(screen.getByRole("dialog", { name: "Add Major Mutation" })).toBeInTheDocument();
  });
});

describe("CorruptionPanel editable=false", () => {
  it("hides Remove actions and disables the stepper", () => {
    render(
      <CorruptionWiring
        initial={{ points: 20, malignancies: [{ id: "m1", referenceId: "witch-mark", name: "Witch-mark" }] }}
        editable={false}
      />
    );

    expect(screen.queryByRole("button", { name: "Add Malignancy" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Decrease" })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows a View Malignancies button that opens the picker in read-only mode", async () => {
    const user = userEvent.setup();
    render(
      <CorruptionWiring
        initial={{ points: 0, malignancies: [] }}
        editable={false}
      />
    );

    await user.click(findButtonNear("Malignancies", "View Malignancies"));

    expect(screen.getByRole("dialog", { name: "View Malignancies" })).toBeInTheDocument();
  });
});

describe("CorruptionPanel legacy free-text fallback", () => {
  it("shows legacy malignancy notes as a text field when malignancies is still the old string format", () => {
    render(<CorruptionWiring initial={{ points: 0, malignancies: "Some old malignancy notes" }} />);

    expect(screen.getAllByText("Legacy Malignancy Notes").length).toBeGreaterThanOrEqual(1);
  });
});
