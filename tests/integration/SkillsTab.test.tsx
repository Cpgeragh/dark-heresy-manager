// tests/integration/SkillsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { SkillsTab } from "../../src/pages/characterSheet/SkillsTab";
import type { SkillEntry, Characteristics } from "../../src/types/Character";
import type { CharField } from "../../src/utils/characterFactory";

const getCharField = (_k: keyof Characteristics): CharField => ({ base: 30, advances: 0 });

function skill(over: Partial<SkillEntry> = {}): SkillEntry {
  return {
    id: "s1",
    name: "Awareness",
    characteristic: "per",
    level: "trained",
    category: "General",
    advanced: false,
    ...over,
  };
}

function renderTab(props: Partial<React.ComponentProps<typeof SkillsTab>> = {}) {
  const onUpdate = vi.fn();
  render(
    <SkillsTab
      skills={[skill()]}
      editable={true}
      onUpdate={onUpdate}
      getCharField={getCharField}
      {...props}
    />
  );
  return { onUpdate };
}

describe("SkillsTab", () => {
  it("renders the header and a trained skill", () => {
    renderTab();
    expect(screen.getAllByText("Basic Skills").length).toBeGreaterThan(0);
    // Name also appears in the (closed) InfoModal dialog title, so match either.
    expect(screen.getAllByText("Awareness").length).toBeGreaterThan(0);
  });

  it("shows the add affordance when editable", () => {
    renderTab();
    expect(screen.getByText("+ Add Skill")).toBeInTheDocument();
  });

  it("shows 'View Skills' and no add button in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getAllByText("View").length).toBeGreaterThan(0);
    expect(screen.queryByText("+ Add Skill")).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no trained skills", () => {
    renderTab({ skills: [skill({ level: "untrained" })] });
    expect(screen.getAllByText("No advanced skills trained yet.").length).toBeGreaterThan(0);
  });

  it("updates a skill's level through onUpdate", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderTab();
    // Expand the row, then set its level to +20.
    await user.click(screen.getAllByText("Awareness")[0]);
    await user.click(screen.getByLabelText("Set skill level to +20"));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const next = onUpdate.mock.calls[0][0] as SkillEntry[];
    expect(next.find((s) => s.id === "s1")?.level).toBe("+20");
  });
});
