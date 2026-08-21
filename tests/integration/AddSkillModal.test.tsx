// tests/integration/AddSkillModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { AddSkillModal } from "../../src/pages/characterSheet/SkillsTab/AddSkillModal";
import type { SkillWithComputed } from "../../src/pages/characterSheet/SkillsTab/skillsConstants";

const untrainedSkills: SkillWithComputed[] = [
  {
    id: "s1",
    name: "Awareness",
    characteristic: "per",
    level: "untrained",
    category: "General",
    advanced: false,
    source: "CR",
    total: 20,
  },
];

function setup(props: Partial<React.ComponentProps<typeof AddSkillModal>> = {}) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <AddSkillModal
      isOpen
      editable
      onClose={onClose}
      untrainedSkills={untrainedSkills}
      onAdd={onAdd}
      {...props}
    />
  );
  return { onAdd, onClose };
}

describe("AddSkillModal skill row", () => {
  it("selects the skill (calls onAdd) when the row itself is clicked", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.click(screen.getAllByRole("button", { name: /Awareness/ })[0]);
    expect(onAdd).toHaveBeenCalledWith("s1");
  });

  it("ignores leading and trailing spaces in search", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByRole("textbox"), " Awareness ");

    expect(screen.getAllByRole("button", { name: /Awareness/ }).length).toBeGreaterThan(0);
    expect(screen.queryByText("No skills found.")).not.toBeInTheDocument();
  });

  it("clears search when the picker closes", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    const search = screen.getByRole("textbox");

    await user.type(search, "Aware");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(search).toHaveValue("");
  });

  it("shows every characteristic used by a mixed-characteristic group", () => {
    setup({
      untrainedSkills: [
        {
          ...untrainedSkills[0],
          id: "trade-agri",
          name: "Trade (Agri)",
          characteristic: "s",
          category: "Trade",
          advanced: true,
        },
        {
          ...untrainedSkills[0],
          id: "trade-cook",
          name: "Trade (Cook)",
          characteristic: "int",
          category: "Trade",
          advanced: true,
        },
      ],
    });

    const groupButton = screen.getByRole("button", { name: /Trade/ });
    expect(groupButton).toHaveTextContent("S");
    expect(groupButton).toHaveTextContent("Int");
  });
});

describe("AddSkillModal with a career-restricted list", () => {
  const twoSkills: SkillWithComputed[] = [
    { ...untrainedSkills[0], id: "s1", name: "Awareness" },
    { ...untrainedSkills[0], id: "s2", name: "Dodge" },
  ];

  it("only shows skills with a known unlocked cost by default", () => {
    setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]) });
    expect(screen.getByRole("button", { name: "Select Awareness" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select Dodge" })).not.toBeInTheDocument();
  });

  it("shows the known cost as a chip", () => {
    setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]) });
    expect(screen.getAllByText("100 XP").length).toBeGreaterThan(0);
  });

  it("selecting a skill with a known cost calls onAdd with no manual cost", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]) });
    await user.click(screen.getByRole("button", { name: "Select Awareness" }));
    expect(onAdd).toHaveBeenCalledWith("s1");
  });

  it("reveals every skill via the show-all toggle", async () => {
    const user = userEvent.setup();
    setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]) });
    expect(screen.queryByRole("button", { name: "Select Dodge" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    expect(screen.getByRole("button", { name: "Select Dodge" })).toBeInTheDocument();
  });

  it("selecting a skill with no known cost opens a manual cost entry step instead of calling onAdd directly", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]) });
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    await user.click(screen.getByRole("button", { name: "Select Dodge" }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Train Dodge" })).toBeInTheDocument();

    const costInput = screen.getByRole("textbox");
    await user.type(costInput, "250");
    await user.click(screen.getByRole("button", { name: "Train Dodge" }));

    expect(onAdd).toHaveBeenCalledWith("s2", 250);
  });

  it("does not restrict or show cost chips when unlockedCosts isn't provided at all", () => {
    setup({ untrainedSkills: twoSkills });
    expect(screen.getByRole("button", { name: "Select Dodge" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show all skills" })).not.toBeInTheDocument();
    expect(screen.queryByText("100 XP")).not.toBeInTheDocument();
  });
});

describe("AddSkillModal in read-only View Skills mode", () => {
  it("renders skill rows with no click target, since there's nothing left to reveal", () => {
    const { onAdd } = setup({ editable: false });
    expect(screen.queryByRole("button", { name: "Select Awareness" })).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
