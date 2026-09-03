// tests/integration/TraitsTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";

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
    {
      id: "fear",
      name: "Fear",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Fear Rating",
      specialisationOptions: [
        { value: "1", label: "1 — Disturbing (0)" },
        { value: "2", label: "2 — Frightening (−10)" },
        { value: "3", label: "3 — Horrifying (−20)" },
        { value: "4", label: "4 — Terrifying (−30)" },
      ],
    },
    {
      id: "machine",
      name: "Machine",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Armour Value",
      positiveIntegerInput: true,
      specialisationMin: 1,
    },
    {
      id: "natural-armour",
      name: "Natural Armour",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Armour Points",
      specialisationPlaceholder: "1+",
      hideSpecialisationHelp: true,
      positiveIntegerInput: true,
      specialisationMin: 1,
    },
    {
      id: "size",
      name: "Size",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Size Category",
      specialisationOptions: [
        "Minuscule", "Puny", "Scrawny", "Average", "Hulking", "Enormous", "Massive",
      ],
    },
    {
      id: "unnatural-characteristic",
      name: "Unnatural Characteristic",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Characteristic",
      specialisationOptions: ["Weapon Skill", "Toughness", "Perception"],
      repeatable: true,
      repeatableSpecialisation: true,
    },
    {
      id: "skin-of-iron",
      name: "Skin of Iron",
      source: "LW",
      hasSpecialisation: false,
      repeatable: true,
      maxPurchases: 4,
      acquisition: "skin-of-iron",
    },
  ];
  return { MOCK_TRAIT_LIST: traits };
});

vi.mock("../../src/data/reference/traitData", () => ({ TRAIT_LIST: MOCK_TRAIT_LIST }));

import { TraitsTab } from "../../src/mechanics/traits/TraitsTab";
import { ToastProvider } from "../../src/components/Toast";
import type { TalentEntry, TalentsAndTraitsBlock } from "../../src/types/Character";

function makeTalents(over: Partial<TalentsAndTraitsBlock> = {}): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [], ...over };
}

function renderTab(props: Partial<React.ComponentProps<typeof TraitsTab>> = {}) {
  const onUpdateTalents = vi.fn();
  render(
    <ToastProvider>
      <TraitsTab
        talents={makeTalents()}
        editable={true}
        onUpdateTalents={onUpdateTalents}
        {...props}
      />
    </ToastProvider>
  );
  return { onUpdateTalents };
}

function StatefulTraitsTab() {
  const [talents, setTalents] = useState(makeTalents());
  return (
    <ToastProvider>
      <TraitsTab talents={talents} editable onUpdateTalents={setTalents} />
    </ToastProvider>
  );
}

describe("TraitsTab", () => {
  it("renders the header and an existing trait entry", () => {
    const entry: TalentEntry = { uid: "t1", talentId: "plain-trait", name: "Plain Trait" };
    renderTab({ talents: makeTalents({ traits: [entry] }) });
    expect(screen.getByText("Traits")).toBeInTheDocument();
    expect(screen.getByText("Plain Trait")).toBeInTheDocument();
  });

  it("uses the shared Add and View controls", () => {
    const { unmount } = render(
      <ToastProvider>
        <TraitsTab talents={makeTalents()} editable onUpdateTalents={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.getByRole("button", { name: "Add Trait" })).toBeInTheDocument();
    expect(screen.queryByText("+ Add Trait")).not.toBeInTheDocument();
    unmount();

    render(
      <ToastProvider>
        <TraitsTab talents={makeTalents()} editable={false} onUpdateTalents={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.getByRole("button", { name: "View Traits" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Trait" })).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no traits", () => {
    renderTab();
    expect(screen.getByText("None added yet.")).toBeInTheDocument();
  });

  it("aggregates Skin of Iron grants and restores an upgraded cybernetic when the latest grant is deleted", async () => {
    const user = userEvent.setup();
    const onUpdateCybernetics = vi.fn();
    const entries: TalentEntry[] = [
      { uid: "skin-1", talentId: "skin-of-iron", name: "Skin of Iron" },
      {
        uid: "skin-3",
        talentId: "skin-of-iron",
        name: "Skin of Iron",
        acquisition: { trait: { skinOfIronGrants: [{ rank: 3, kind: "upgrade", cyberneticId: "lungs", previousCraftsmanship: "Common" }] } },
      },
    ];
    renderTab({
      talents: makeTalents({ traits: entries }),
      cybernetics: [{ id: "lungs", name: "Bionic Respiratory System", craftsmanship: "Good" }],
      onUpdateCybernetics,
    });
    expect(screen.getByText("Owned: 2/4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete Skin of Iron" }));
    await user.click(within(screen.getByRole("dialog", { name: "Delete Trait" })).getByRole("button", { name: "Delete" }));
    expect(onUpdateCybernetics).toHaveBeenCalledWith([
      expect.objectContaining({ id: "lungs", craftsmanship: "Common" }),
    ]);
  });

  it("adds a trait into the traits array rather than talents", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(await screen.findByText("Plain Trait"));

    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits.some((trait) => trait.name === "Plain Trait")).toBe(true);
    expect(next.talents).toHaveLength(0);
  });

  it("requires a free-text specialisation value before allowing add", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(await screen.findByText("Spec Trait"));

    const addButton = screen.getByRole("button", { name: "Add Spec Trait" });
    expect(addButton).toBeDisabled();
    const dialog = screen.getByRole("dialog", { name: "Sense" });
    await user.type(within(dialog).getByRole("textbox"), "Something");
    await user.click(addButton);

    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits[0].name).toBe("Spec Trait (Something)");
  });

  it("confirms deletion using Trait wording and supports cancellation", async () => {
    const user = userEvent.setup();
    const entry: TalentEntry = { uid: "t1", talentId: "plain-trait", name: "Plain Trait" };
    const { onUpdateTalents } = renderTab({ talents: makeTalents({ traits: [entry] }) });

    await user.click(screen.getByRole("button", { name: "Delete Plain Trait" }));
    expect(screen.getByRole("dialog", { name: "Delete Trait" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onUpdateTalents).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete Plain Trait" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits).toHaveLength(0);
  });

  it("shows repeated Unnatural Characteristics once with an Owned count", () => {
    renderTab({
      talents: makeTalents({
        traits: [
          { uid: "u1", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Weapon Skill)", specialisation: "Weapon Skill" },
          { uid: "u2", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Weapon Skill)", specialisation: "Weapon Skill" },
        ],
      }),
    });
    expect(screen.getAllByText("Unnatural Characteristic (Weapon Skill)")).toHaveLength(1);
    expect(screen.getByText("Owned: 2")).toBeInTheDocument();
  });

  it("groups different Unnatural Characteristics into expandable children", async () => {
    const user = userEvent.setup();
    renderTab({
      talents: makeTalents({
        traits: [
          { uid: "u1", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Weapon Skill)", specialisation: "Weapon Skill" },
          { uid: "u2", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Weapon Skill)", specialisation: "Weapon Skill" },
          { uid: "u3", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Perception)", specialisation: "Perception" },
        ],
      }),
    });

    expect(screen.queryByText("Unnatural Characteristic (Weapon Skill)")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Expand Unnatural Characteristic" }));
    expect(screen.getByText("Unnatural Characteristic (Weapon Skill)")).toBeInTheDocument();
    expect(screen.getByText("Unnatural Characteristic (Perception)")).toBeInTheDocument();
    expect(screen.getByText("Owned: 2")).toBeInTheDocument();
    expect(screen.getByText("Owned: 1")).toBeInTheDocument();
  });

  it("allows an owned Unnatural Characteristic choice to be acquired again", async () => {
    const user = userEvent.setup();
    const existing: TalentEntry = {
      uid: "u1",
      talentId: "unnatural-characteristic",
      name: "Unnatural Characteristic (Weapon Skill)",
      specialisation: "Weapon Skill",
    };
    const { onUpdateTalents } = renderTab({ talents: makeTalents({ traits: [existing] }) });

    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    const picker = screen.getByTestId("talent-picker-card-list");
    await user.click(within(picker).getByText("Unnatural Characteristic"));
    const characteristicPicker = screen.getByRole("dialog", { name: "Characteristic" });
    expect(within(characteristicPicker).getByText("Owned: 1")).toBeInTheDocument();
    await user.click(within(characteristicPicker).getByText("Weapon Skill"));

    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits).toHaveLength(2);
    expect(next.traits[1].specialisation).toBe("Weapon Skill");
  });

  it("deletes only one acquisition from a repeated Unnatural Characteristic", async () => {
    const user = userEvent.setup();
    const traits: TalentEntry[] = [
      { uid: "u1", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Weapon Skill)", specialisation: "Weapon Skill" },
      { uid: "u2", talentId: "unnatural-characteristic", name: "Unnatural Characteristic (Weapon Skill)", specialisation: "Weapon Skill" },
    ];
    const { onUpdateTalents } = renderTab({ talents: makeTalents({ traits }) });

    await user.click(screen.getByRole("button", { name: "Delete Unnatural Characteristic (Weapon Skill)" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits).toHaveLength(1);
    expect(next.traits[0].uid).toBe("u1");
  });

  it("uses the exact Fear Rating choices and stores only the rating", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(screen.getByText("Fear"));

    for (const label of [
      "1 — Disturbing (0)",
      "2 — Frightening (−10)",
      "3 — Horrifying (−20)",
      "4 — Terrifying (−30)",
    ]) expect(screen.getByText(label)).toBeInTheDocument();

    await user.click(screen.getByText("2 — Frightening (−10)"));
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits[0]).toEqual(expect.objectContaining({ name: "Fear (2)", specialisation: "2" }));
  });

  it("returns to the Trait list after a non-repeatable choice is added", async () => {
    const user = userEvent.setup();
    render(<StatefulTraitsTab />);
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(screen.getByText("Fear"));
    await user.click(screen.getByText("2 — Frightening (−10)"));

    expect(await screen.findByRole("dialog", { name: "Add Trait" })).toBeInTheDocument();
    expect(screen.queryByText("Fear Rating")).not.toBeInTheDocument();
    expect(screen.queryByText("Fear")).not.toBeInTheDocument();
  });

  it("keeps a repeatable Trait choice screen open and refreshes its Owned count", async () => {
    const user = userEvent.setup();
    render(<StatefulTraitsTab />);
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(screen.getByText("Unnatural Characteristic"));

    let dialog = screen.getByRole("dialog", { name: "Characteristic" });
    await user.click(within(dialog).getByText("Weapon Skill"));

    dialog = screen.getByRole("dialog", { name: "Characteristic" });
    expect(within(dialog).getByText("Weapon Skill")).toBeInTheDocument();
    expect(within(dialog).getByText("Owned: 1")).toBeInTheDocument();
  });

  it("labels Natural Armour as Armour Points and accepts only positive whole numbers", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(screen.getByText("Natural Armour"));

    const dialog = screen.getByRole("dialog", { name: "Armour Points" });
    const input = within(dialog).getByRole("textbox");
    const addButton = within(dialog).getByRole("button", { name: "Add Natural Armour" });
    expect(input).toHaveAttribute("placeholder", "1+");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("type", "text");
    expect(within(dialog).queryByText("Whole number, 1 or higher.")).not.toBeInTheDocument();
    expect(addButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "0" } });
    expect(input).toHaveValue("");
    expect(addButton).toBeDisabled();
    fireEvent.change(input, { target: { value: "-." } });
    expect(input).toHaveValue("");
    expect(addButton).toBeDisabled();
    fireEvent.change(input, { target: { value: "001" } });
    expect(input).toHaveValue("1");
    fireEvent.change(input, { target: { value: "3" } });
    await user.click(addButton);

    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits[0]).toEqual(expect.objectContaining({ name: "Natural Armour (3)", specialisation: "3" }));
  });

  it("uses the same strict positive-integer entry for Machine", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(screen.getByText("Machine"));

    const dialog = screen.getByRole("dialog", { name: "Armour Value" });
    const input = within(dialog).getByRole("textbox");
    const addButton = within(dialog).getByRole("button", { name: "Add Machine" });
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("type", "text");

    fireEvent.change(input, { target: { value: "0-." } });
    expect(input).toHaveValue("");
    expect(addButton).toBeDisabled();
    fireEvent.change(input, { target: { value: "4" } });
    await user.click(addButton);

    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits[0]).toEqual(expect.objectContaining({ name: "Machine (4)", specialisation: "4" }));
  });

  it("uses the exact seven Size choices", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getByRole("button", { name: "Add Trait" }));
    await user.click(screen.getByText("Size"));

    for (const size of ["Minuscule", "Puny", "Scrawny", "Average", "Hulking", "Enormous", "Massive"]) {
      expect(screen.getByText(size)).toBeInTheDocument();
    }
    await user.click(screen.getByText("Hulking"));
    const next = onUpdateTalents.mock.calls[0][0] as TalentsAndTraitsBlock;
    expect(next.traits[0]).toEqual(expect.objectContaining({ name: "Size (Hulking)", specialisation: "Hulking" }));
  });

  it("flows cards into natural-height columns without reserving row space", () => {
    renderTab({
      talents: makeTalents({
        traits: [{ uid: "t1", talentId: "plain-trait", name: "Plain Trait" }],
      }),
    });
    const list = screen.getByTestId("trait-card-list");
    expect(list).toHaveClass("grid-cols-1", "lg:grid-cols-2", "items-start");
    const columns = screen.getAllByTestId("trait-card-column");
    expect(columns).toHaveLength(2);
    expect(columns[0]).toHaveClass("space-y-2");
    expect(columns[1]).toHaveClass("space-y-2");
  });

  it("shows The Flesh is Weak's Machine Trait as a read-only grant", () => {
    renderTab({
      talents: makeTalents({
        talents: [
          { uid: "f1", talentId: "the-flesh-is-weak", name: "The Flesh is Weak" },
          { uid: "f2", talentId: "the-flesh-is-weak", name: "The Flesh is Weak" },
        ],
      }),
    });
    expect(screen.getByText("Machine (2)")).toBeInTheDocument();
    expect(screen.getByText("The Flesh is Weak (Talent): Granted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete Machine (2)" })).not.toBeInTheDocument();
  });
});
