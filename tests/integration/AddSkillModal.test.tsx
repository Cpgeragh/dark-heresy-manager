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

  it("expands the row to preview it without selecting, when the expand icon is clicked", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    await user.click(screen.getAllByRole("button", { name: "Expand skill details" })[0]);
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Collapse skill details" }).length).toBeGreaterThan(0);
  });

  it("expands the row to preview it via keyboard (Enter) without selecting", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    const expandIcon = screen.getAllByRole("button", { name: "Expand skill details" })[0];
    expandIcon.focus();
    await user.keyboard("{Enter}");
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Collapse skill details" }).length).toBeGreaterThan(0);
  });

  it("expands the row to preview it via keyboard (Space) without selecting", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup();
    const expandIcon = screen.getAllByRole("button", { name: "Expand skill details" })[0];
    expandIcon.focus();
    await user.keyboard(" ");
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button", { name: "Collapse skill details" }).length).toBeGreaterThan(0);
  });

  it("shows the level options (read-only) when expanded in the picker", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Expand skill details" })[0]);
    expect(screen.getByLabelText("Set skill level to untrained")).toBeInTheDocument();
    expect(screen.getByLabelText("Set skill level to trained")).toBeInTheDocument();
  });
});

describe("AddSkillModal in read-only View Skills mode", () => {
  it("expands the row on click (no separate select action exists, so the row itself toggles)", async () => {
    const user = userEvent.setup();
    const { onAdd } = setup({ editable: false });
    await user.click(screen.getAllByRole("button", { name: /Awareness/ })[0]);
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Set skill level to untrained")).toBeInTheDocument();
  });
});
