// tests/integration/CareerStartingChoiceModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CareerStartingChoiceModal } from "../../src/pages/CharacterSheet/CareerStartingChoiceModal";
import { CAREER_LIST } from "../../src/data/reference/careerData";

// Real career with genuine "or" starting choices (2 skill grants, 3 talent
// grants, each with 2 options) — not fabricated, read directly from
// src/data/reference/careerData.ts.
const ADEPT = CAREER_LIST.find((c) => c.id === "adept")!;

describe("CareerStartingChoiceModal", () => {
  it("shows the career name in the title", () => {
    render(<CareerStartingChoiceModal career={ADEPT} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Adept Starting Choices" })).toBeInTheDocument();
  });

  it("disables Confirm until every choice is made", async () => {
    const user = userEvent.setup();
    render(<CareerStartingChoiceModal career={ADEPT} onComplete={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();

    // Adept has 2 skill choices and 3 talent choices, each a pair of options.
    // Options render in adjacent pairs, so the first button of each pair is
    // every even index.
    const allOptionButtons = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));
    expect(allOptionButtons).toHaveLength(2 * 2 + 3 * 2); // 2 skill pairs + 3 talent pairs

    // Pick the first button of each pair (indices 0, 2, 4, 6, 8).
    for (let i = 0; i < allOptionButtons.length; i += 2) {
      await user.click(allOptionButtons[i]);
    }

    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("marks a clicked option as pressed", async () => {
    const user = userEvent.setup();
    render(<CareerStartingChoiceModal career={ADEPT} onComplete={vi.fn()} onClose={vi.fn()} />);
    const allOptionButtons = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));

    await user.click(allOptionButtons[0]);

    expect(allOptionButtons[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onComplete with the chosen option index per grant once everything is resolved", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<CareerStartingChoiceModal career={ADEPT} onComplete={onComplete} onClose={vi.fn()} />);
    const allOptionButtons = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-pressed"));

    // Pick the second option (index 1) of every pair this time.
    for (let i = 1; i < allOptionButtons.length; i += 2) {
      await user.click(allOptionButtons[i]);
    }
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Indices are the option's *original* position in the career's full
    // startingSkillGrants array (filtered after mapping, not renumbered) —
    // Adept's two multi-option skill grants sit at raw indices 2 and 4.
    expect(onComplete).toHaveBeenCalledWith({
      skillChoices: { 2: 1, 4: 1 },
      talentChoices: { 0: 1, 1: 1, 2: 1 },
    });
  });

  it("closes via the header close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CareerStartingChoiceModal career={ADEPT} onComplete={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
