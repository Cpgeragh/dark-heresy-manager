// tests/integration/TraitsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { MOCK_TRAIT_LIST } = vi.hoisted(() => {
  const traits = [
    { id: "plain-trait", name: "Plain Trait", source: "CR", hasSpecialisation: false },
    {
      id: "spec-trait",
      name: "Spec Trait",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Sense",
    },
  ];
  return { MOCK_TRAIT_LIST: traits };
});

vi.mock("../../src/data/traitData", () => ({
  TRAIT_LIST: MOCK_TRAIT_LIST,
}));

import { TraitsTab } from "../../src/pages/characterSheet/TraitsTab";
import type { TalentEntry, TalentsAndTraitsBlock } from "../../src/types/Character";

function makeTalents(over: Partial<TalentsAndTraitsBlock> = {}): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [], ...over };
}

function renderTab(props: Partial<React.ComponentProps<typeof TraitsTab>> = {}) {
  const onUpdateTalents = vi.fn();
  render(
    <TraitsTab
      talents={makeTalents()}
      editable={true}
      onUpdateTalents={onUpdateTalents}
      {...props}
    />
  );
  return { onUpdateTalents };
}

describe("TraitsTab", () => {
  it("renders the header and an existing trait entry", () => {
    const entry: TalentEntry = { uid: "t1", talentId: "plain-trait", name: "Plain Trait" };
    renderTab({ talents: makeTalents({ traits: [entry] }) });
    expect(screen.getByText("Traits")).toBeInTheDocument();
    expect(screen.getByText("Plain Trait")).toBeInTheDocument();
  });

  it("shows the add affordance when editable", () => {
    renderTab();
    expect(screen.getByText("+ Add Trait")).toBeInTheDocument();
  });

  it("shows 'View Traits' and no add button in read-only mode", () => {
    renderTab({ editable: false });
    expect(screen.getByText("View Traits")).toBeInTheDocument();
    expect(screen.queryByText("+ Add Trait")).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no traits", () => {
    renderTab();
    expect(screen.getByText("None added yet.")).toBeInTheDocument();
  });

  it("adds a trait into the traits array (not talents) through onUpdateTalents", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByText("+ Add Trait"));
    await user.click(await screen.findByText("Plain Trait"));

    expect(onUpdateTalents).toHaveBeenCalledTimes(1);
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits.some((t) => t.name === "Plain Trait")).toBe(true);
    expect(next.talents).toHaveLength(0);
  });

  it("requires a specialisation value before allowing add", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByText("+ Add Trait"));
    await user.click(await screen.findByText("Spec Trait"));

    const addButton = screen.getByRole("button", { name: "Add Spec Trait" });
    expect(addButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Sense"), "Something");
    expect(addButton).toBeEnabled();

    await user.click(addButton);
    expect(onUpdateTalents).toHaveBeenCalledTimes(1);
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits[0].name).toBe("Spec Trait (Something)");
  });

  it("removes a trait through onUpdateTalents", async () => {
    const user = userEvent.setup();
    const entry: TalentEntry = { uid: "t1", talentId: "plain-trait", name: "Plain Trait" };
    const { onUpdateTalents } = renderTab({ talents: makeTalents({ traits: [entry] }) });

    await user.click(screen.getByLabelText("Remove Plain Trait"));
    expect(onUpdateTalents).toHaveBeenCalledTimes(1);
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits).toHaveLength(0);
  });
});
