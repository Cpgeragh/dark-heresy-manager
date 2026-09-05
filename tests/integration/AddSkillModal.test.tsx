// tests/integration/AddSkillModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { AddSkillModal } from "../../src/pages/CharacterSheet/SkillsTab/AddSkillModal";
import type { SkillWithComputed } from "../../src/pages/CharacterSheet/SkillsTab/skillsConstants";

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
  const rendered = render(
    <AddSkillModal
      isOpen
      editable
      onClose={onClose}
      untrainedSkills={untrainedSkills}
      onAdd={onAdd}
      {...props}
    />
  );
  return { onAdd, onClose, ...rendered };
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

  it("returns to the list when the open category no longer has skills", async () => {
    const user = userEvent.setup();
    const groupedSkills = [
      { ...untrainedSkills[0], category: "Trade", name: "Trade (Agri)", advanced: true },
      { ...untrainedSkills[0], id: "s2", category: "Trade", name: "Trade (Cook)", advanced: true },
    ];
    const { onAdd, onClose, rerender } = setup({ untrainedSkills: groupedSkills });
    await user.click(screen.getByRole("button", { name: /Trade/ }));
    expect(screen.getByRole("dialog", { name: "Trade" })).toBeInTheDocument();

    rerender(
      <AddSkillModal isOpen editable onClose={onClose} untrainedSkills={[]} onAdd={onAdd} />
    );

    expect(screen.queryByRole("dialog", { name: "Trade" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Add Skill" })).toBeInTheDocument();
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

  it("reveals every skill on a separate overflow screen, reached via Show all skills", async () => {
    const user = userEvent.setup();
    setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]), isDM: true });
    expect(screen.queryByRole("button", { name: "Select Dodge" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    expect(screen.getByRole("button", { name: "Select Dodge" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.queryByRole("button", { name: "Select Dodge" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Awareness" })).toBeInTheDocument();
  });

  it("selecting a skill with no known cost opens a manual cost entry step instead of calling onAdd directly", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({
      untrainedSkills: twoSkills,
      unlockedCosts: new Map([["s1", 100]]),
      isDM: true,
    });
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    await user.click(screen.getByRole("button", { name: "Select Dodge" }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Train Dodge" })).toBeInTheDocument();

    const costInput = screen.getByRole("textbox");
    await user.type(costInput, "250");
    await user.click(screen.getByRole("button", { name: "Train Dodge" }));

    expect(onAdd).toHaveBeenCalledWith("s2", 250);
  });

  it("accepts 0 as a valid manual cost, blocking only a blank field", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({
      untrainedSkills: twoSkills,
      unlockedCosts: new Map([["s1", 100]]),
      isDM: true,
    });
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    await user.click(screen.getByRole("button", { name: "Select Dodge" }));

    const confirmButton = screen.getByRole("button", { name: "Train Dodge" });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByRole("textbox"), "0");
    expect(confirmButton).toBeEnabled();
    await user.click(confirmButton);

    expect(onAdd).toHaveBeenCalledWith("s2", 0);
  });

  it("shows a category's full skill list on the overflow screen, always going to manual entry even for a skill with a real known cost", async () => {
    const user = userEvent.setup();
    const tradeSkills: SkillWithComputed[] = [
      {
        ...untrainedSkills[0],
        id: "trade-agri",
        name: "Trade (Agri)",
        category: "Trade",
        advanced: true,
      },
      {
        ...untrainedSkills[0],
        id: "trade-cook",
        name: "Trade (Cook)",
        category: "Trade",
        advanced: true,
      },
    ];
    const { onAdd } = setup({
      untrainedSkills: tradeSkills,
      unlockedCosts: new Map([["trade-agri", 100]]),
      isDM: true,
    });

    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    await user.click(screen.getByRole("button", { name: /Trade/ }));
    expect(screen.getByRole("button", { name: "Select Trade (Agri)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select Trade (Cook)" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Select Trade (Agri)" }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Train Trade (Agri)" })).toBeInTheDocument();
  });

  it("does not let a non-DM select a skill on the overflow screen, since manual-cost purchases are DM only", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]) });
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    expect(screen.queryByRole("button", { name: "Select Dodge" })).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("always opens manual cost entry from the overflow screen, even for a skill that also has a real known cost", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({
      untrainedSkills: twoSkills,
      unlockedCosts: new Map([["s1", 100]]),
      isDM: true,
    });
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    await user.click(screen.getByRole("button", { name: "Select Awareness" }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Train Awareness" })).toBeInTheDocument();
  });

  it("returns to the overflow screen, not the main list, when Back is pressed from manual cost entry reached that way", async () => {
    const user = userEvent.setup();
    setup({ untrainedSkills: twoSkills, unlockedCosts: new Map([["s1", 100]]), isDM: true });
    await user.click(screen.getByRole("button", { name: "Show all skills" }));
    await user.click(screen.getByRole("button", { name: "Select Dodge" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("button", { name: "Select Dodge" })).toBeInTheDocument();
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
