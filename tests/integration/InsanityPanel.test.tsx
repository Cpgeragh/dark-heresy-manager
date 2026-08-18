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

    await user.click(findButtonNear("Disorders", "Add Disorder"));

    expect(screen.getByRole("dialog", { name: "Add Disorder" })).toBeInTheDocument();
  });

  it("opens the Trauma picker from the Temporary Trauma + Add button", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 0, disorders: [] }} />);

    await user.click(findButtonNear("Temporary Trauma", "Add Trauma"));

    expect(screen.getByRole("dialog", { name: "Add Trauma" })).toBeInTheDocument();
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

    expect(screen.queryByRole("button", { name: "Add Disorder" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Trauma" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Decrease" })).toHaveAttribute("aria-disabled", "true");
  });

  it("shows a View Disorders button that opens the picker in read-only mode", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 0, disorders: [] }} editable={false} />);

    await user.click(findButtonNear("Disorders", "View Disorders"));

    expect(screen.getByRole("dialog", { name: "View Disorders" })).toBeInTheDocument();
  });

  it("shows a View Temporary Trauma button that opens the picker in read-only mode", async () => {
    const user = userEvent.setup();
    render(<InsanityWiring initial={{ points: 0, disorders: [] }} editable={false} />);

    await user.click(findButtonNear("Temporary Trauma", "View Temporary Trauma"));

    expect(screen.getByRole("dialog", { name: "View Temporary Trauma" })).toBeInTheDocument();
  });
});

describe("InsanityPanel disorder severity escalation", () => {
  it("escalates a disorder to the next severity tier", async () => {
    const user = userEvent.setup();
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severity: "Minor" },
          ],
        }}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Escalate to Severe" })[0]);

    expect(screen.getByRole("dialog", { name: "Escalate to Severe" })).toBeInTheDocument();
    expect(screen.getByText("Escalate Fear of the Dead to Severe?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Escalate" }));

    expect(screen.getAllByText("Severe").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Escalate to Acute" }).length).toBeGreaterThan(0);
  });

  it("cancels an escalation without changing severity", async () => {
    const user = userEvent.setup();
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severity: "Minor" },
          ],
        }}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Escalate to Severe" })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Escalate to Severe" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Escalate to Severe" }).length).toBeGreaterThan(0);
  });

  it("hides the escalate button once a disorder is at its highest severity", () => {
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severity: "Acute" },
          ],
        }}
      />
    );

    expect(screen.queryByRole("button", { name: /Escalate/ })).not.toBeInTheDocument();
  });

  it("caps a disorder type with no Acute tier at Severe", () => {
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", type: "Horrific Nightmares", name: "Recurring Dream", severity: "Severe", custom: true },
          ],
        }}
      />
    );

    expect(screen.queryByRole("button", { name: /Escalate/ })).not.toBeInTheDocument();
  });

  it("offers only an escalate to Acute for The Flesh is Weak, which has no Minor tier", () => {
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "flesh-is-weak", type: "The Flesh is Weak", name: "The Flesh is Weak", severity: "Severe" },
          ],
        }}
      />
    );

    expect(screen.getAllByRole("button", { name: "Escalate to Acute" }).length).toBeGreaterThan(0);
  });

  it("hides the escalate button in read-only mode", () => {
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

    expect(screen.queryByRole("button", { name: /Escalate/ })).not.toBeInTheDocument();
  });
});

describe("InsanityPanel delete confirmation", () => {
  it("arms a confirm step on a disorder's Remove instead of deleting immediately", async () => {
    const user = userEvent.setup();
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severity: "Minor" },
          ],
        }}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(screen.getByRole("dialog", { name: "Delete Disorder" })).toBeInTheDocument();
    expect(screen.getByText("Delete Fear of the Dead from this character?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Fear of the Dead", { selector: "span" })).not.toBeInTheDocument();
  });

  it("cancels a disorder deletion without removing it", async () => {
    const user = userEvent.setup();
    render(
      <InsanityWiring
        initial={{
          points: 20,
          disorders: [
            { id: "d1", referenceId: "phobia-fear-of-the-dead", type: "Phobia", name: "Fear of the Dead", severity: "Minor" },
          ],
        }}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Delete Disorder" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Fear of the Dead", { selector: "span" }).length).toBeGreaterThan(0);
  });

  it("arms a confirm step on a trauma's Remove and deletes only after confirming", async () => {
    const user = userEvent.setup();
    render(
      <InsanityWiring
        initial={{
          points: 0,
          disorders: [],
          currentTrauma: [{ id: "t1", referenceId: "01-40", roll: "01-40", name: "Withdrawn and Quiet" }],
        }}
      />
    );

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]);

    expect(screen.getByRole("dialog", { name: "Delete Trauma" })).toBeInTheDocument();
    expect(screen.getByText("Delete Withdrawn and Quiet from this character?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.queryByText("Withdrawn and Quiet", { selector: "span" })).not.toBeInTheDocument();
  });
});

describe("InsanityPanel legacy free-text fallback", () => {
  it("shows legacy disorder notes as a text field when disorders is still the old string format", () => {
    render(<InsanityWiring initial={{ points: 0, disorders: "Some old disorder notes" }} />);

    expect(screen.getAllByText("Legacy Disorder Notes").length).toBeGreaterThanOrEqual(1);
  });
});
