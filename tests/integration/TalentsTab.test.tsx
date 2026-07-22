// tests/integration/TalentsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { MOCK_TALENT_LIST } = vi.hoisted(() => {
  const talents = [
    { id: "plain-talent", name: "Plain Talent", source: "CR", hasSpecialisation: false },
    {
      id: "spec-talent",
      name: "Spec Talent",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Skill",
    },
    {
      id: "faith-talent",
      name: "Faith Talent",
      source: "BoM",
      hasSpecialisation: false,
      faithGroup: "mercy",
    },
  ];
  return { MOCK_TALENT_LIST: talents };
});

vi.mock("../../src/data/talentData", () => ({
  TALENT_LIST: MOCK_TALENT_LIST,
}));

import { TalentsTab } from "../../src/pages/characterSheet/TalentsTab";
import type { TalentEntry, TalentsAndTraitsBlock } from "../../src/types/Character";

function makeTalents(over: Partial<TalentsAndTraitsBlock> = {}): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [], ...over };
}

function renderTab(props: Partial<React.ComponentProps<typeof TalentsTab>> = {}) {
  const onUpdateTalents = vi.fn();
  render(
    <TalentsTab
      talents={makeTalents()}
      editable={true}
      onUpdateTalents={onUpdateTalents}
      {...props}
    />
  );
  return { onUpdateTalents };
}

describe("TalentsTab", () => {
  it("renders the header and an existing talent entry", () => {
    const entry: TalentEntry = { uid: "t1", talentId: "plain-talent", name: "Plain Talent" };
    renderTab({ talents: makeTalents({ talents: [entry] }) });
    expect(screen.getAllByText("Talents").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plain Talent").length).toBeGreaterThan(0);
  });

  it("shows the add affordance when editable", () => {
    renderTab();
    expect(screen.getAllByText("+ Add Talent").length).toBeGreaterThan(0);
  });

  it("shows 'View Talents' and no add button in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getAllByText("View Talents").length).toBeGreaterThan(0);
    expect(screen.queryByText("+ Add Talent")).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no talents", () => {
    renderTab();
    expect(screen.getAllByText("None added yet.").length).toBeGreaterThan(0);
  });

  it("adds a talent without specialisation through onUpdateTalents", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getAllByText("+ Add Talent")[0]);
    await user.click(await screen.findByText("Plain Talent"));

    expect(onUpdateTalents).toHaveBeenCalledTimes(1);
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.talents.some((t) => t.name === "Plain Talent")).toBe(true);
  });

  it("requires a specialisation value before allowing add", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getAllByText("+ Add Talent")[0]);
    await user.click(await screen.findByText("Spec Talent"));

    const addButton = screen.getByRole("button", { name: "Add Spec Talent" });
    expect(addButton).toBeDisabled();

    const specialisationDialog = screen.getByRole("dialog", { name: "Skill" });
    await user.type(within(specialisationDialog).getByRole("textbox"), "Something");
    expect(addButton).toBeEnabled();

    await user.click(addButton);
    expect(onUpdateTalents).toHaveBeenCalledTimes(1);
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.talents[0].name).toBe("Spec Talent (Something)");
  });

  it("removes a talent through onUpdateTalents", async () => {
    const user = userEvent.setup();
    const entry: TalentEntry = { uid: "t1", talentId: "plain-talent", name: "Plain Talent" };
    const { onUpdateTalents } = renderTab({ talents: makeTalents({ talents: [entry] }) });

    await user.click(screen.getAllByLabelText("Remove Plain Talent")[0]);
    expect(onUpdateTalents).toHaveBeenCalledTimes(1);
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.talents).toHaveLength(0);
  });

  it("hides the Faith Talents section in read-only mode when none are present", () => {
    renderTab({ editable: false });
    expect(screen.queryByText("Faith Talents")).not.toBeInTheDocument();
  });

  it("shows the Faith Talents section in read-only mode when one is present", () => {
    const entry: TalentEntry = { uid: "f1", talentId: "faith-talent", name: "Faith Talent" };
    renderTab({ editable: false, talents: makeTalents({ talents: [entry] }) });
    expect(screen.getAllByText("Faith Talents").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Faith Talent").length).toBeGreaterThan(0);
  });
});
