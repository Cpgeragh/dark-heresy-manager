// tests/integration/SkillPickerRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { SkillPickerRow } from "../../src/pages/CharacterSheet/SkillsTab/SkillPickerRow";
import type { SkillWithComputed } from "../../src/pages/CharacterSheet/SkillsTab/skillsConstants";

const baseSkill: SkillWithComputed = {
  id: "s1",
  name: "Awareness",
  characteristic: "per",
  level: "untrained",
  category: "General",
  advanced: false,
  source: "CR",
  total: 20,
};

describe("SkillPickerRow", () => {
  it("draws the name once, with the information icon, the chips and the total", () => {
    render(<SkillPickerRow skill={baseSkill} onSelect={vi.fn()} />);

    expect(screen.getAllByText("Awareness")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Show information about Awareness" })
    ).toBeInTheDocument();
    expect(screen.getByText("CR")).toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Untrained")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("selects the skill when the row is pressed and is named after the skill", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SkillPickerRow skill={baseSkill} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Select Awareness" }));

    expect(onSelect).toHaveBeenCalledWith("s1");
  });

  it("shows the XP cost chip and can hide the level chip", () => {
    render(<SkillPickerRow skill={baseSkill} onSelect={vi.fn()} cost={150} hideLevelChip />);

    expect(screen.getByText("150 XP")).toBeInTheDocument();
    expect(screen.queryByText("Untrained")).not.toBeInTheDocument();
  });

  it("shows only the part of the name after the category when indented", () => {
    render(
      <SkillPickerRow
        skill={{ ...baseSkill, id: "s2", name: "Trade (Cook)", category: "Trade", advanced: true }}
        onSelect={vi.fn()}
        indented
      />
    );

    expect(screen.getByText("Cook")).toBeInTheDocument();
    expect(screen.queryByText("Trade (Cook)")).not.toBeInTheDocument();
  });

  it("shows Gained from and Talent effects as labelled lines in the standard colours", () => {
    const skill = {
      ...baseSkill,
      level: "trained",
      baseLevel: "trained",
      eliteAdvancePurchases: {
        trained: { source: "elite-package", cost: 100, sourceName: "Encarta Maleficarum" },
      },
      talentSources: [{ name: "Talented (Awareness)", type: "Talent", amount: 10 }],
    } as unknown as SkillWithComputed;
    render(<SkillPickerRow skill={skill} onSelect={vi.fn()} />);

    expect(screen.getByText("Gained from")).toBeInTheDocument();
    expect(screen.getByText("Encarta Maleficarum (Elite Advance)")).toHaveClass("text-slate-300");
    expect(screen.getByText("Talent effects")).toBeInTheDocument();
    expect(screen.getByText("Talented (Awareness) (Talent): +10")).not.toHaveClass(
      "text-amber-300"
    );
  });

  it("does not respond to a press when there is no way to select it", () => {
    render(<SkillPickerRow skill={baseSkill} />);

    expect(screen.queryByRole("button", { name: "Select Awareness" })).not.toBeInTheDocument();
  });
});
