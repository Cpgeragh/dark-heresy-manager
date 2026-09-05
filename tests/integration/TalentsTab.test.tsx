import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useState } from "react";

const { MOCK_TALENT_LIST } = vi.hoisted(() => ({
  MOCK_TALENT_LIST: [
    {
      id: "plain-talent",
      name: "Plain Talent",
      source: "CR",
      prerequisites: "Fel 30",
      hasSpecialisation: false,
    },
    {
      id: "spec-talent",
      name: "Spec Talent",
      source: "CR",
      hasSpecialisation: true,
      specialisationLabel: "Skill",
    },
    {
      id: "sound-constitution",
      name: "Sound Constitution",
      source: "CR",
      hasSpecialisation: false,
      repeatable: true,
      behaviour: { kind: "ranked" },
    },
    {
      id: "the-flesh-is-weak",
      name: "The Flesh is Weak",
      source: "LW",
      hasSpecialisation: false,
      repeatable: true,
      behaviour: { kind: "ranked", maxPurchases: 4 },
    },
    {
      id: "resistance",
      name: "Resistance",
      source: "CR",
      hasSpecialisation: true,
      repeatable: true,
      behaviour: { kind: "fixed-repeatable", options: ["Cold", "Fear"] },
    },
    {
      id: "hatred",
      name: "Hatred",
      source: "CR",
      hasSpecialisation: true,
      repeatable: true,
      specialisationLabel: "Group",
      behaviour: {
        kind: "hybrid",
        options: [
          { label: "Criminals", value: "Criminals" },
          { label: "Cult (specific)", detailLabel: "Cult", displayPrefix: "Cult" },
          { label: "Xeno (specific)", detailLabel: "Xeno", displayPrefix: "Xeno" },
        ],
      },
    },
    {
      id: "reformed-skin",
      name: "Reformed Skin",
      source: "LW",
      hasSpecialisation: true,
      repeatable: true,
      specialisationLabel: "Replacement",
      behaviour: { kind: "repeatable-free-text", detailLabel: "Replacement" },
    },
    {
      id: "minor-psychic-power",
      name: "Minor Psychic Power",
      source: "CR",
      hasSpecialisation: false,
      repeatable: true,
      behaviour: { kind: "psychic-purchase", powerGroup: "minor" },
    },
    { id: "psy-rating-1", name: "Psy Rating 1", source: "CR", hasSpecialisation: false },
    { id: "psy-rating-3", name: "Psy Rating 3", source: "CR", hasSpecialisation: false },
    { id: "psy-rating-4", name: "Psy Rating 4", source: "CR", hasSpecialisation: false },
    { id: "psy-rating-5", name: "Psy Rating 5", source: "CR", hasSpecialisation: false },
    { id: "psy-rating-6", name: "Psy Rating 6", source: "CR", hasSpecialisation: false },
    {
      id: "touched-by-the-fates",
      name: "Touched by the Fates",
      source: "DotDG",
      hasSpecialisation: false,
    },
    { id: "purity-of-flesh", name: "Purity of Flesh", source: "LW", hasSpecialisation: false },
    {
      id: "cult-briefing",
      name: "Cult Briefing",
      source: "DH",
      hasSpecialisation: true,
      behaviour: { kind: "fixed-single", options: ["Blood", "Culture", "Heretek", "Pleasure"] },
    },
    {
      id: "sicarius-tutoring",
      name: "Sicarius Tutoring",
      source: "DH",
      hasSpecialisation: true,
      behaviour: { kind: "fixed-single", options: ["Scum"] },
    },
    {
      id: "peer",
      name: "Peer",
      source: "CR",
      hasSpecialisation: true,
      repeatable: true,
      behaviour: { kind: "fixed-repeatable", options: ["Academics", "Workers"] },
    },
    { id: "chem-geld", name: "Chem Geld", source: "CR", hasSpecialisation: false },
    { id: "decadence", name: "Decadence", source: "CR", hasSpecialisation: false },
    { id: "autosanguine", name: "Autosanguine", source: "IH", hasSpecialisation: false },
    { id: "logis-implant", name: "Logis Implant", source: "IH", hasSpecialisation: false },
    { id: "orthoproxy", name: "Orthoproxy", source: "IH", hasSpecialisation: false },
    { id: "technical-knock", name: "Technical Knock", source: "CR", hasSpecialisation: false },
    { id: "the-power-within", name: "The Power Within", source: "LW", hasSpecialisation: false },
    {
      id: "basic-weapon-training",
      name: "Basic Weapon Training",
      source: "CR",
      hasSpecialisation: true,
      repeatable: true,
      behaviour: { kind: "managed-elsewhere" },
    },
    {
      id: "faith-talent",
      name: "Faith Talent",
      source: "BoM",
      hasSpecialisation: false,
      faithGroup: "mercy",
    },
  ],
}));

vi.mock("../../src/data/reference/talentData", () => ({ TALENT_LIST: MOCK_TALENT_LIST }));

import { TalentsTab } from "../../src/mechanics/talents/TalentsTab";
import type { PsychicBlock, TalentEntry, TalentsAndTraitsBlock } from "../../src/types/Character";

const emptyPsychic: PsychicBlock = { psyRating: 0, minorPowers: [], majorPowers: [] };

function makeTalents(over: Partial<TalentsAndTraitsBlock> = {}): TalentsAndTraitsBlock {
  return { homeworld: "", talents: [], traits: [], ...over };
}

function entry(uid: string, talentId: string, name: string, specialisation?: string): TalentEntry {
  return { uid, talentId, name, ...(specialisation ? { specialisation } : {}) };
}

function renderTab(props: Partial<React.ComponentProps<typeof TalentsTab>> = {}) {
  const onUpdateTalents = vi.fn();
  render(
    <TalentsTab
      talents={makeTalents()}
      psychic={emptyPsychic}
      editable
      onUpdateTalents={onUpdateTalents}
      {...props}
    />
  );
  return { onUpdateTalents };
}

function modalScrollContainer(name: string): HTMLElement {
  const container = screen
    .getByRole("dialog", { name })
    .querySelector<HTMLElement>(".overflow-y-auto");
  if (!container) throw new Error(`No scroll container found in ${name}`);
  return container;
}

function StatefulTalentsTab() {
  const [talents, setTalents] = useState(makeTalents());
  return (
    <TalentsTab
      talents={talents}
      psychic={emptyPsychic}
      editable
      onUpdateTalents={setTalents}
      onUpdateCharacter={(partial) => {
        if (partial.talentsAndTraits) setTalents(partial.talentsAndTraits);
      }}
      willpowerBonus={5}
    />
  );
}

describe("TalentsTab", () => {
  it("uses the shared plus and eye controls", () => {
    const { unmount } = render(
      <TalentsTab
        talents={makeTalents()}
        psychic={emptyPsychic}
        editable
        onUpdateTalents={() => undefined}
      />
    );
    expect(screen.getAllByRole("button", { name: "Add Talent" }).length).toBeGreaterThan(0);
    unmount();
    render(
      <TalentsTab
        talents={makeTalents()}
        psychic={emptyPsychic}
        editable={false}
        onUpdateTalents={() => undefined}
      />
    );
    expect(screen.getAllByRole("button", { name: "View Talents" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add Talent" })).not.toBeInTheDocument();
  });

  it("does not show selection feedback on Talent cards in View mode", async () => {
    const user = userEvent.setup();
    render(
      <TalentsTab
        talents={makeTalents()}
        psychic={emptyPsychic}
        editable={false}
        onUpdateTalents={() => undefined}
      />
    );
    await user.click(screen.getAllByRole("button", { name: "View Talents" })[0]);

    const card = screen.getByText("Plain Talent").closest("button");
    expect(card).not.toHaveClass("active:!bg-slate-700", "active:!border-red-400");
    expect(card).toHaveAttribute("tabindex", "-1");
  });

  it("adds ordinary and specialised purchases", async () => {
    const user = userEvent.setup();
    const ordinary = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(await screen.findByText("Plain Talent"));
    expect(ordinary.onUpdateTalents.mock.calls[0][0].talents[0].name).toBe("Plain Talent");

    cleanup();
    const specialised = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(await screen.findByText("Spec Talent"));
    const dialog = screen.getByRole("dialog", { name: "Skill" });
    const add = within(dialog).getByRole("button", { name: "Add Spec Talent" });
    expect(add).toBeDisabled();
    await user.type(within(dialog).getByRole("textbox"), "Something");
    await user.click(add);
    expect(specialised.onUpdateTalents.mock.calls[0][0].talents[0].name).toBe(
      "Spec Talent (Something)"
    );
  });

  it("keeps the Talent picker open, removes finite choices, and retains repeatable Talents", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);

    let dialog = screen.getByRole("dialog", { name: "Add Talent" });
    await user.click(within(dialog).getByText("Plain Talent"));
    dialog = screen.getByRole("dialog", { name: "Add Talent" });
    expect(within(dialog).queryByText("Plain Talent")).not.toBeInTheDocument();

    await user.click(within(dialog).getByText("Sound Constitution"));
    dialog = screen.getByRole("dialog", { name: "Add Talent" });
    expect(within(dialog).getByText("Sound Constitution")).toBeInTheDocument();
    expect(within(dialog).getByText("Owned: 1")).toBeInTheDocument();

    await user.click(within(dialog).getByText("Sound Constitution"));
    expect(within(dialog).getByText("Owned: 2")).toBeInTheDocument();
  });

  it("restores the Talent list position after returning from a choice screen", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);

    const list = modalScrollContainer("Add Talent");
    list.scrollTop = 180;
    fireEvent.scroll(list);
    await user.click(
      within(screen.getByRole("dialog", { name: "Add Talent" })).getByText("Resistance")
    );
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(modalScrollContainer("Add Talent").scrollTop).toBe(180);
  });

  it("shows limited ranked ownership as a chip in the Talent picker", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [
        entry("f1", "the-flesh-is-weak", "The Flesh is Weak"),
        entry("f2", "the-flesh-is-weak", "The Flesh is Weak"),
      ],
    });
    renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    const card = screen.getByText("The Flesh is Weak").closest("button");
    expect(within(card!).getByText("Owned: 2/4")).toBeInTheDocument();
  });

  it("returns to the open Talent picker after completing an acquisition", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(
      within(screen.getByRole("dialog", { name: "Add Talent" })).getByText("Touched by the Fates")
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    const dialog = await screen.findByRole("dialog", { name: "Add Talent" });
    expect(within(dialog).queryByText("Touched by the Fates")).not.toBeInTheDocument();
  });

  it("returns to the open Talent picker after cancelling an acquisition", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(
      within(screen.getByRole("dialog", { name: "Add Talent" })).getByText("Touched by the Fates")
    );
    const acquisition = screen.getByRole("dialog", { name: "Touched by the Fates Acquisition" });
    expect(within(acquisition).getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(within(acquisition).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await user.click(within(acquisition).getByRole("button", { name: "Back" }));

    const dialog = await screen.findByRole("dialog", { name: "Add Talent" });
    expect(within(dialog).getByText("Touched by the Fates")).toBeInTheDocument();
  });

  it("keeps the Faith Talent picker open after adding", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Faith Talent" })[0]);
    let dialog = screen.getByRole("dialog", { name: "Add Faith Talent" });
    await user.click(within(dialog).getByText("Faith Talent"));
    dialog = screen.getByRole("dialog", { name: "Add Faith Talent" });
    expect(within(dialog).queryByText("Faith Talent")).not.toBeInTheDocument();
  });

  it("uses separated bordered cards with title, source, and prerequisites", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Add Talent" });
    const list = within(dialog).getByTestId("talent-picker-card-list");
    expect(list).toHaveClass("space-y-3", "p-3");
    const card = within(dialog).getByText("Plain Talent").closest("button");
    expect(card).toHaveClass("rounded-lg", "border-slate-500", "p-3");
    expect(within(card!).getByText("CR")).toBeInTheDocument();
    expect(within(card!).getByText("Fel 30")).toBeInTheDocument();
  });

  it("shows a right arrow only when selecting a Talent opens another step", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Add Talent" });
    const directCard = within(dialog).getByText("Sound Constitution").closest("button");
    const choiceCard = within(dialog).getByText("Resistance").closest("button");
    const acquisitionCard = within(dialog).getByText("Touched by the Fates").closest("button");

    expect(directCard).toHaveClass("flex", "items-center", "gap-3");
    expect(directCard!.querySelector('[data-picker-arrow="right"]')).toBeNull();
    expect(choiceCard!.querySelector('[data-picker-arrow="right"]')).not.toBeNull();
    expect(acquisitionCard!.querySelector('[data-picker-arrow="right"]')).not.toBeNull();
  });

  it("excludes managed Weapon Training from the picker", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    expect(screen.queryByText("Basic Weapon Training")).not.toBeInTheDocument();
  });

  it("hides owned fixed choices and adds an available choice", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [entry("r1", "resistance", "Resistance (Fear)", "Fear")],
    });
    const { onUpdateTalents } = renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Resistance"));
    expect(screen.queryByText("Fear")).not.toBeInTheDocument();
    await user.click(screen.getByText("Cold"));
    expect(onUpdateTalents.mock.calls[0][0].talents[1]).toEqual(
      expect.objectContaining({ name: "Resistance (Cold)", specialisation: "Cold" })
    );
  });

  it("keeps a fixed-choice Talent screen open until its final choice is added", async () => {
    const user = userEvent.setup();
    render(<StatefulTalentsTab />);
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Resistance"));

    let dialog = screen.getByRole("dialog", { name: "Choice" });
    await user.click(within(dialog).getByText("Cold"));

    dialog = screen.getByRole("dialog", { name: "Choice" });
    expect(within(dialog).queryByText("Cold")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Fear")).toBeInTheDocument();
    await user.click(within(dialog).getByText("Fear"));

    expect(await screen.findByRole("dialog", { name: "Add Talent" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Choice" })).not.toBeInTheDocument();
  });

  it("supports Hatred fixed, Cult-specific, and Xeno-specific choices", async () => {
    const user = userEvent.setup();
    const fixed = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Hatred"));
    await user.click(screen.getByText("Criminals"));
    expect(fixed.onUpdateTalents.mock.calls[0][0].talents[0].name).toBe("Hatred (Criminals)");

    cleanup();
    const cult = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Hatred"));
    await user.click(screen.getByText("Cult (specific)"));
    await user.type(screen.getByPlaceholderText("Enter cult…"), "Red Redemption");
    await user.click(screen.getByRole("button", { name: "Add Hatred" }));
    expect(cult.onUpdateTalents.mock.calls[0][0].talents[0].name).toBe(
      "Hatred (Cult: Red Redemption)"
    );

    cleanup();
    const xeno = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Hatred"));
    await user.click(screen.getByText("Xeno (specific)"));
    await user.type(screen.getByPlaceholderText("Enter xeno…"), "Orks");
    await user.click(screen.getByRole("button", { name: "Add Hatred" }));
    expect(xeno.onUpdateTalents.mock.calls[0][0].talents[0].name).toBe("Hatred (Xeno: Orks)");
  });

  it("requires a distinct Reformed Skin replacement case-insensitively", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [entry("rs1", "reformed-skin", "Reformed Skin (Left Arm)", "Left Arm")],
    });
    renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Reformed Skin"));
    await user.type(screen.getByPlaceholderText("Enter replacement…"), "left arm");
    expect(screen.getByText("That choice is already owned.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Reformed Skin" })).toBeDisabled();
  });

  it("creates Psychic purchases on Talents without selecting a power", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Minor Psychic Power"));
    expect(onUpdateTalents.mock.calls[0][0].talents[0]).toEqual(
      expect.objectContaining({ talentId: "minor-psychic-power", name: "Minor Psychic Power" })
    );
  });

  it("records the purchase-time Willpower Bonus for Psy Rating grants", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab({ willpowerBonus: 4 });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Psy Rating 1"));
    expect(onUpdateTalents.mock.calls[0][0].talents[0]).toEqual(
      expect.objectContaining({
        talentId: "psy-rating-1",
        acquisition: expect.objectContaining({
          psyRatingWillpowerBonus: 4,
          psyRatingMinorPowerGrants: 2,
        }),
      })
    );
  });

  it("confirms and records Touched by the Fates through the character update", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({ willpowerBonus: 5, onUpdateCharacter });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Touched by the Fates"));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: [expect.objectContaining({ acquisition: { touchedByFatesPoints: 3 } })],
        }),
      })
    );
  });

  it("requires and records the Cult Briefing Blood training choice", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({ onUpdateCharacter });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Blood"));
    expect(screen.getByText("Required")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Melee Weapon Training" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Melee Weapon Training" })).getByRole("button", {
        name: "Chain",
      })
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: [expect.objectContaining({ acquisition: { weaponTrainingId: "melee-chain" } })],
        }),
      })
    );
  });

  it("records the choices belonging to a Cult Briefing Culture Homeworld", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({ onUpdateCharacter });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Culture"));
    await user.click(screen.getByRole("button", { name: "Another Home World" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Another Home World" })).getByRole("button", {
        name: "Noble Born",
      })
    );
    await user.click(screen.getByRole("button", { name: /Additional Peer group/ }));
    await user.click(screen.getByText("Mercantile"));
    await user.click(screen.getByRole("button", { name: "Apply Homeworld" }));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: expect.arrayContaining([
            expect.objectContaining({
              acquisition: expect.objectContaining({
                homeworldId: "noble-born",
                homeworldTraitChoices: { peerGroup: "Mercantile" },
              }),
            }),
          ]),
        }),
      })
    );
  });

  it("allows an already-owned Cult Briefing Pleasure reward and records its source", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      talents: makeTalents({
        talents: [entry("chem", "chem-geld", "Chem Geld"), entry("dec", "decadence", "Decadence")],
      }),
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Pleasure"));
    await user.click(screen.getByRole("button", { name: "Granted Talent" }));

    const rewardPicker = screen.getByRole("dialog", { name: "Granted Talent" });
    expect(within(rewardPicker).getAllByText("Owned")).toHaveLength(2);
    await user.click(within(rewardPicker).getByRole("button", { name: /Chem Geld\s*Owned/ }));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: expect.arrayContaining([
            expect.objectContaining({
              talentId: "cult-briefing",
              acquisition: expect.objectContaining({ grantedTalentId: "chem-geld" }),
            }),
          ]),
        }),
      })
    );
  });

  it("allows an already-owned Cult Briefing Heretek reward", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      talents: makeTalents({
        talents: [
          entry("a", "autosanguine", "Autosanguine"),
          entry("l", "logis-implant", "Logis Implant"),
          entry("o", "orthoproxy", "Orthoproxy"),
          entry("t", "technical-knock", "Technical Knock"),
        ],
      }),
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Heretek"));
    await user.click(screen.getByRole("button", { name: "Granted Augmetic" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Granted Augmetic" })).getByRole("button", {
        name: "Optical Mechadendrite",
      })
    );
    await user.click(screen.getByRole("button", { name: "Granted Talent" }));

    const rewardPicker = screen.getByRole("dialog", { name: "Granted Talent" });
    expect(within(rewardPicker).getAllByText("Owned")).toHaveLength(4);
    await user.click(within(rewardPicker).getByRole("button", { name: /Technical Knock\s*Owned/ }));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: expect.arrayContaining([
            expect.objectContaining({
              acquisition: expect.objectContaining({ grantedTalentId: "technical-knock" }),
            }),
          ]),
        }),
      })
    );
  });

  it("allows already-owned Cult Briefing Blood training", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      weaponTraining: {
        trained: ["melee-chain", "melee-power", "melee-primitive", "melee-shock"],
        exoticWeapons: [],
      },
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Blood"));
    await user.click(screen.getByRole("button", { name: "Melee Weapon Training" }));

    const trainingPicker = screen.getByRole("dialog", { name: "Melee Weapon Training" });
    expect(within(trainingPicker).getAllByText("Owned")).toHaveLength(4);
    await user.click(within(trainingPicker).getByRole("button", { name: /Chain\s*Owned/ }));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: expect.arrayContaining([
            expect.objectContaining({ acquisition: { weaponTrainingId: "melee-chain" } }),
          ]),
        }),
      })
    );
  });

  it("allows an already-owned Sicarius Tutoring Scum Peer reward", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      talents: makeTalents({
        talents: [
          entry("pa", "peer", "Peer (Academics)", "Academics"),
          entry("pw", "peer", "Peer (Workers)", "Workers"),
        ],
      }),
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Sicarius Tutoring"));
    await user.click(screen.getByText("Scum"));
    await user.click(screen.getByRole("button", { name: "Peer Group" }));

    const peerPicker = screen.getByRole("dialog", { name: "Peer Group" });
    expect(within(peerPicker).getAllByText("Owned")).toHaveLength(2);
    await user.click(within(peerPicker).getByRole("button", { name: /Academics\s*Owned/ }));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: expect.arrayContaining([
            expect.objectContaining({
              acquisition: expect.objectContaining({
                grantedTalentId: "peer",
                grantedTalentSpecialisation: "Academics",
              }),
            }),
          ]),
        }),
      })
    );
  });

  it("installs and links the Cult Briefing Heretek concealed weapon augmetic", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      onUpdateCharacter,
      cybernetics: [
        {
          id: "arm-1",
          referenceId: "cr-bionic-arm",
          name: "Bionic Arm",
          craftsmanship: "Common",
        },
      ],
      rangedWeapons: [{ id: "pistol-1", name: "Autopistol", class: "Pistol" }],
    });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Heretek"));

    expect(screen.getByText("Tech-Use will also count as Trained.")).toHaveClass("text-slate-300");
    expect(screen.queryByText("Questionable augmetic")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Granted Augmetic" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Granted Augmetic" })).getByRole("button", {
        name: "Concealed Weapon Bionic",
      })
    );
    await user.click(screen.getByRole("button", { name: "Existing Bionic Arm" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Existing Bionic Arm" })).getByRole("button", {
        name: "Bionic Arm",
      })
    );
    await user.click(screen.getByRole("button", { name: "Eligible Weapon" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Eligible Weapon" })).getByRole("button", {
        name: "Autopistol (Ranged)",
      })
    );
    await user.click(screen.getByRole("button", { name: "Granted Talent" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Granted Talent" })).getByRole("button", {
        name: "Autosanguine",
      })
    );
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        cybernetics: expect.arrayContaining([
          expect.objectContaining({
            referenceId: "ih-concealed-weapon-bionic",
            grantedByTalentEntryUid: expect.any(String),
            concealedWeapon: { armId: "arm-1", weaponId: "pistol-1", weaponType: "ranged" },
          }),
        ]),
        rangedWeapons: [
          expect.objectContaining({
            id: "pistol-1",
            concealedBionic: expect.objectContaining({ craftsmanship: "Common" }),
          }),
        ],
      })
    );
  });

  it("shows blocking Heretek requirements as readable errors", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Cult Briefing"));
    await user.click(screen.getByText("Heretek"));
    await user.click(screen.getByRole("button", { name: "Granted Augmetic" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Granted Augmetic" })).getByRole("button", {
        name: "Concealed Weapon Bionic",
      })
    );

    expect(screen.getByText("Install a Bionic Arm first.")).toHaveClass("text-red-400");
    expect(
      screen.getByText("Add an unmodified pistol or one-handed melee weapon first.")
    ).toHaveClass("text-red-400");
    expect(screen.getByRole("button", { name: "Existing Bionic Arm" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Eligible Weapon" })).toBeDisabled();
  });

  it("shows Psy Rating acquisition consequences as readable result rows", async () => {
    const user = userEvent.setup();
    renderTab({ willpowerBonus: 5 });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Psy Rating 5"));

    expect(screen.getByText("Willpower Bonus Recorded:")).toBeInTheDocument();
    expect(screen.getByText("Minor Powers Granted:")).toBeInTheDocument();
    expect(
      within(screen.getByText("Minor Powers Granted:").parentElement!).getByText("0")
    ).toBeInTheDocument();
    expect(screen.getByText("Major Powers Granted:")).toBeInTheDocument();
    expect(screen.queryByText(/No Minor Powers are granted/)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("filters Known and New Psy Rating routes from the character's Disciplines", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      willpowerBonus: 5,
      psychic: { ...emptyPsychic, disciplines: ["Biomancy"] },
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Psy Rating 4"));
    expect(screen.getByRole("button", { name: "Discipline" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Power Grant" }));
    const routePicker = screen.getByRole("dialog", { name: "Power Grant" });
    await user.click(
      within(routePicker).getByRole("button", { name: "Known Discipline: 3 powers" })
    );
    await user.click(screen.getByRole("button", { name: "Discipline" }));
    const knownPicker = screen.getByRole("dialog", { name: "Discipline" });
    expect(within(knownPicker).getByRole("button", { name: "Biomancy" })).toBeInTheDocument();
    expect(
      within(knownPicker).queryByRole("button", { name: "Telepathy" })
    ).not.toBeInTheDocument();
    await user.click(within(knownPicker).getByRole("button", { name: "Biomancy" }));

    expect(
      within(screen.getByText("Minor Powers Granted:").parentElement!).getByText("3")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Major Powers Granted:").parentElement!).getByText("3")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: [
            expect.objectContaining({
              acquisition: expect.objectContaining({
                psyRatingDiscipline: "Biomancy",
                psyRatingNewDiscipline: false,
                psyRatingMinorPowerGrants: 3,
                psyRatingMajorPowerGrants: 3,
              }),
            }),
          ],
        }),
      })
    );
  });

  it("requires Psy Rating 3 to introduce an unknown Discipline", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      willpowerBonus: 5,
      psychic: { ...emptyPsychic, disciplines: ["Biomancy"] },
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Psy Rating 3"));
    expect(screen.queryByRole("button", { name: "Power Grant" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discipline" }));
    const disciplinePicker = screen.getByRole("dialog", { name: "Discipline" });
    expect(
      within(disciplinePicker).queryByRole("button", { name: "Biomancy" })
    ).not.toBeInTheDocument();
    await user.click(within(disciplinePicker).getByRole("button", { name: "Divination" }));
    expect(
      within(screen.getByText("Minor Powers Granted:").parentElement!).getByText("3")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Major Powers Granted:").parentElement!).getByText("1")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        psychic: expect.objectContaining({ disciplines: ["Biomancy", "Divination"] }),
      })
    );
  });

  it("excludes known Disciplines from the New route and grants only one major power", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      willpowerBonus: 5,
      psychic: { ...emptyPsychic, disciplines: ["Biomancy"] },
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Psy Rating 6"));
    await user.click(screen.getByRole("button", { name: "Power Grant" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Power Grant" })).getByRole("button", {
        name: "New Discipline: 1 power",
      })
    );
    await user.click(screen.getByRole("button", { name: "Discipline" }));
    const disciplinePicker = screen.getByRole("dialog", { name: "Discipline" });
    expect(
      within(disciplinePicker).queryByRole("button", { name: "Biomancy" })
    ).not.toBeInTheDocument();
    await user.click(within(disciplinePicker).getByRole("button", { name: "Telepathy" }));

    expect(
      within(screen.getByText("Minor Powers Granted:").parentElement!).getByText("0")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Major Powers Granted:").parentElement!).getByText("1")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        psychic: expect.objectContaining({ disciplines: ["Biomancy", "Telepathy"] }),
        talentsAndTraits: expect.objectContaining({
          talents: [
            expect.objectContaining({
              acquisition: expect.objectContaining({
                psyRatingNewDiscipline: true,
                psyRatingMinorPowerGrants: 0,
                psyRatingMajorPowerGrants: 1,
              }),
            }),
          ],
        }),
      })
    );
  });

  it("deactivates a Discipline when its introducing Psy Rating Talent is deleted", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    const psyRating = {
      ...entry("psy-3", "psy-rating-3", "Psy Rating 3"),
      acquisition: {
        psyRatingDiscipline: "Biomancy",
        psyRatingNewDiscipline: true,
        psyRatingMinorPowerGrants: 0,
        psyRatingMajorPowerGrants: 0,
      },
    };
    renderTab({
      talents: makeTalents({ talents: [psyRating] }),
      psychic: { ...emptyPsychic, disciplines: ["Biomancy"] },
      onUpdateCharacter,
    });

    await user.click(screen.getAllByRole("button", { name: "Delete Psy Rating 3" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({ talents: [] }),
        psychic: expect.objectContaining({ disciplines: [] }),
      })
    );
  });

  it("removes Purity cybernetics and their concealed-weapon links together", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      onUpdateCharacter,
      cybernetics: [{ id: "cyber-1", name: "Concealed Weapon Bionic", craftsmanship: "Common" }],
      rangedWeapons: [
        {
          id: "weapon-1",
          name: "Autopistol",
          concealedBionic: { cyberneticId: "cyber-1", craftsmanship: "Common" },
        },
      ],
    });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Purity of Flesh"));
    expect(
      screen.queryByRole("checkbox", { name: /reviewed the removals/i })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        cybernetics: [],
        rangedWeapons: [expect.objectContaining({ id: "weapon-1", concealedBionic: undefined })],
        talentsAndTraits: expect.objectContaining({
          talents: [
            expect.objectContaining({
              acquisition: expect.objectContaining({
                purity: expect.objectContaining({
                  removedCyberneticIds: ["cyber-1"],
                  removedConcealedWeaponLinks: [
                    expect.objectContaining({
                      weaponId: "weapon-1",
                      weaponType: "ranged",
                      cyberneticId: "cyber-1",
                    }),
                  ],
                }),
              }),
            }),
          ],
        }),
      })
    );
  });

  it("automatically counts and removes installed implants and a custom integrated weapon", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      onUpdateCharacter,
      cybernetics: [
        { id: "arm", referenceId: "cr-bionic-arm", name: "Bionic Arm", craftsmanship: "Common" },
        {
          id: "leg",
          referenceId: "cr-bionic-locomotion",
          name: "Bionic Locomotion",
          craftsmanship: "Common",
        },
      ],
      meleeWeapons: [
        { id: "claw", name: "Claw", integrated: true, custom: true },
        { id: "sword", name: "Sword" },
      ],
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Purity of Flesh"));

    expect(
      screen.getByText(
        "All 3 installed cybernetics, bionics, and integrated weapons will be removed."
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText("Qualifies for Fate")).toHaveLength(3);
    expect(screen.getByText("Fate Points Gained:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        cybernetics: [],
        meleeWeapons: [{ id: "sword", name: "Sword" }],
        talentsAndTraits: expect.objectContaining({
          talents: [
            expect.objectContaining({
              acquisition: expect.objectContaining({
                purity: expect.objectContaining({
                  qualifyingBionicsRemoved: 3,
                  fatePointsGained: 1,
                  removedIntegratedMeleeWeapons: [expect.objectContaining({ id: "claw" })],
                }),
              }),
            }),
          ],
        }),
      })
    );
  });

  it("selects life-critical removals from a large inventory and records separate Reformed Skin entries", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    const cybernetics = Array.from({ length: 10 }, (_, index) => ({
      id: `implant-${index + 1}`,
      name: `Implant ${index + 1}`,
      craftsmanship: "Common" as const,
    }));
    renderTab({ onUpdateCharacter, cybernetics });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Purity of Flesh"));
    const acquisitionList = modalScrollContainer("Purity of Flesh Acquisition");
    acquisitionList.scrollTop = 240;
    fireEvent.scroll(acquisitionList);
    await user.click(screen.getByRole("button", { name: "Life-Critical Removals" }));

    const fatalDialog = screen.getByRole("dialog", { name: "Life-Critical Removals" });
    expect(within(fatalDialog).getAllByText(/^Implant \d+$/)).toHaveLength(10);
    expect(within(fatalDialog).getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(within(fatalDialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await user.click(within(fatalDialog).getByRole("button", { name: /Implant 2/ }));
    await user.click(within(fatalDialog).getByRole("button", { name: "Back" }));
    expect(modalScrollContainer("Purity of Flesh Acquisition").scrollTop).toBe(240);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Life-Critical Removals" }));
    const reopenedFatalDialog = screen.getByRole("dialog", { name: "Life-Critical Removals" });
    await user.click(within(reopenedFatalDialog).getByRole("button", { name: /Implant 7/ }));
    await user.click(
      within(reopenedFatalDialog).getByRole("button", { name: "Done (2 selected)" })
    );

    expect(screen.getByText("Wounds Lost:")).toBeInTheDocument();
    expect(screen.queryByText(/Required replacements are recorded/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Permanent Toughness Loss (1d5)" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Permanent Toughness Loss" })).getByRole("button", {
        name: "4",
      })
    );
    await user.click(screen.getByRole("button", { name: "Continue to Reformed Skin" }));
    expect(onUpdateCharacter).not.toHaveBeenCalled();

    const reformedDialog = screen.getByRole("dialog", { name: "Reformed Skin Acquisition" });
    const replacements = within(reformedDialog).getAllByRole("textbox");
    expect(replacements).toHaveLength(2);
    expect(
      within(reformedDialog).getByRole("button", { name: "Apply and add Talent" })
    ).toBeDisabled();
    await user.type(replacements[0], "Respiratory System");
    await user.type(replacements[1], "Heart");
    await user.click(within(reformedDialog).getByRole("button", { name: "Apply and add Talent" }));

    const update = onUpdateCharacter.mock.calls[0][0];
    expect(update.talentsAndTraits.talents).toEqual([
      expect.objectContaining({
        talentId: "purity-of-flesh",
        acquisition: expect.objectContaining({
          purity: expect.objectContaining({ toughnessLoss: 4, woundsLoss: 1 }),
        }),
      }),
      expect.objectContaining({
        talentId: "reformed-skin",
        name: "Reformed Skin (Respiratory System)",
      }),
      expect.objectContaining({
        talentId: "reformed-skin",
        name: "Reformed Skin (Heart)",
      }),
    ]);
    const purityUid = update.talentsAndTraits.talents[0].uid;
    expect(update.talentsAndTraits.talents[1].acquisition.purityTalentEntryUid).toBe(purityUid);
    expect(update.talentsAndTraits.talents[2].acquisition.purityTalentEntryUid).toBe(purityUid);
  });

  it("records whether Reformed Skin was caused by Purity or Critical Damage", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    const purity = {
      ...entry("purity-1", "purity-of-flesh", "Purity of Flesh"),
      acquisition: {
        purity: {
          removedCyberneticIds: [],
          qualifyingBionicsRemoved: 4,
          fatePointsGained: 2,
        },
      },
    };
    renderTab({ talents: makeTalents({ talents: [purity] }), onUpdateCharacter });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Reformed Skin"));
    await user.type(screen.getByPlaceholderText("Enter replacement…"), "Left Arm");
    await user.click(screen.getByRole("button", { name: "Add Reformed Skin" }));
    await user.click(screen.getByRole("button", { name: "Cause of Replacement" }));
    const causePicker = screen.getByRole("dialog", { name: "Cause of Replacement" });
    await user.click(within(causePicker).getByRole("button", { name: "Critical Damage" }));
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        talentsAndTraits: expect.objectContaining({
          talents: expect.arrayContaining([
            expect.objectContaining({
              talentId: "reformed-skin",
              acquisition: expect.objectContaining({
                reformedSkinPurityReplacement: false,
              }),
            }),
          ]),
        }),
      })
    );
    const added = onUpdateCharacter.mock.calls[0][0].talentsAndTraits.talents[1];
    expect(added.acquisition.purityTalentEntryUid).toBeUndefined();
  });

  it("links a Purity-caused Reformed Skin to the single Purity purchase", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    const purity = {
      ...entry("purity-1", "purity-of-flesh", "Purity of Flesh"),
      acquisition: {
        purity: {
          removedCyberneticIds: [],
          qualifyingBionicsRemoved: 4,
          fatePointsGained: 2,
        },
      },
    };
    renderTab({ talents: makeTalents({ talents: [purity] }), onUpdateCharacter });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Reformed Skin"));
    await user.type(screen.getByPlaceholderText("Enter replacement…"), "Left Arm");
    await user.click(screen.getByRole("button", { name: "Add Reformed Skin" }));
    expect(
      screen.queryByRole("button", { name: "Purity of Flesh Purchase" })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cause of Replacement" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Cause of Replacement" })).getByRole("button", {
        name: "Purity of Flesh",
      })
    );
    expect(
      screen.getByText("All Fate Points gained from Purity of Flesh will be lost.")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    const added = onUpdateCharacter.mock.calls[0][0].talentsAndTraits.talents[1];
    expect(added.acquisition).toEqual(
      expect.objectContaining({
        reformedSkinPurityReplacement: true,
        purityTalentEntryUid: "purity-1",
      })
    );
  });

  it("removes Mechadendrites and archeotech but excludes Mechadendrites from Fate", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    renderTab({
      onUpdateCharacter,
      cybernetics: [
        { id: "arm", referenceId: "cr-bionic-arm", name: "Bionic Arm", craftsmanship: "Common" },
        {
          id: "mech",
          referenceId: "cr-optical-mechadendrite",
          name: "Optical Mechadendrite",
          craftsmanship: "Good",
        },
      ],
      rangedWeapons: [
        { id: "integrated", name: "Built-in Pistol", integrated: true },
        { id: "lasgun", name: "Lasgun" },
      ],
      archeotech: [
        { id: "eye", name: "Ancient Eye", type: "Cybernetic" },
        { id: "blade", name: "Ancient Blade", type: "Integrated Weapon" },
        { id: "relic", name: "Unrelated Relic", type: "Weapon" },
      ],
    });

    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    await user.click(screen.getByText("Purity of Flesh"));

    expect(screen.getByText("Fate Points Gained:")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Removed — no Fate")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply and add Talent" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        cybernetics: [],
        rangedWeapons: [{ id: "lasgun", name: "Lasgun" }],
        archeotech: [{ id: "relic", name: "Unrelated Relic", type: "Weapon" }],
      })
    );
  });

  it("can restore Purity cybernetics and concealed-weapon links when deleting", async () => {
    const user = userEvent.setup();
    const onUpdateCharacter = vi.fn();
    const purity = {
      ...entry("purity-1", "purity-of-flesh", "Purity of Flesh"),
      acquisition: {
        purity: {
          removedCyberneticIds: ["cyber-1"],
          removedCybernetics: [
            { id: "cyber-1", name: "Concealed Weapon Bionic", craftsmanship: "Common" as const },
          ],
          removedIntegratedMeleeWeapons: [{ id: "claw", name: "Claw", integrated: true }],
          removedArcheotech: [{ id: "eye", name: "Ancient Eye", type: "Cybernetic" }],
          removedConcealedWeaponLinks: [
            {
              weaponId: "weapon-1",
              weaponType: "ranged" as const,
              cyberneticId: "cyber-1",
              craftsmanship: "Common" as const,
            },
          ],
          qualifyingBionicsRemoved: 1,
          fatePointsGained: 0,
        },
      },
    };
    renderTab({
      talents: makeTalents({ talents: [purity] }),
      onUpdateCharacter,
      meleeWeapons: [{ id: "sword", name: "Sword" }],
      archeotech: [{ id: "relic", name: "Unrelated Relic", type: "Weapon" }],
      rangedWeapons: [{ id: "weapon-1", name: "Autopistol" }],
    });

    await user.click(screen.getAllByRole("button", { name: "Delete Purity of Flesh" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete and restore recorded changes" }));

    expect(onUpdateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        cybernetics: [expect.objectContaining({ id: "cyber-1" })],
        rangedWeapons: [
          expect.objectContaining({
            id: "weapon-1",
            concealedBionic: { cyberneticId: "cyber-1", craftsmanship: "Common" },
          }),
        ],
        meleeWeapons: [
          expect.objectContaining({ id: "sword" }),
          expect.objectContaining({ id: "claw", integrated: true }),
        ],
        archeotech: [
          expect.objectContaining({ id: "relic" }),
          expect.objectContaining({ id: "eye", type: "Cybernetic" }),
        ],
        talentsAndTraits: expect.objectContaining({ talents: [] }),
      })
    );
  });

  it("shows automatically granted Talents as read-only with their source", () => {
    const talents = makeTalents({ talents: [entry("pw", "the-power-within", "The Power Within")] });
    renderTab({ talents });
    expect(screen.getAllByText("Resistance (Psychic Powers)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("The Power Within (Talent): Granted").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Delete Resistance (Psychic Powers)" })
    ).not.toBeInTheDocument();
    for (const grantedText of screen.getAllByText("The Power Within (Talent): Granted")) {
      const cardContent = grantedText.parentElement;
      const sourceChip = within(cardContent!).getByText("CR");
      expect(
        sourceChip.compareDocumentPosition(grantedText) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it("aggregates ranked purchases and removes one only after confirmation", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [
        entry("s1", "sound-constitution", "Sound Constitution"),
        entry("s2", "sound-constitution", "Sound Constitution"),
        entry("s3", "sound-constitution", "Sound Constitution"),
      ],
    });
    const { onUpdateTalents } = renderTab({ talents });
    expect(screen.getAllByText("Sound Constitution (3)").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Delete Sound Constitution (3)" })[0]);
    expect(onUpdateTalents).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onUpdateTalents).not.toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: "Delete Sound Constitution (3)" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdateTalents.mock.calls[0][0].talents).toHaveLength(2);
  });

  it("groups multiple choices and deletes only the chosen child", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [
        entry("r1", "resistance", "Resistance (Fear)", "Fear"),
        entry("r2", "resistance", "Resistance (Cold)", "Cold"),
      ],
    });
    const { onUpdateTalents } = renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Expand Resistance" })[0]);
    expect(screen.getByText("Resistance (Fear)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete Resistance (Fear)" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdateTalents.mock.calls[0][0].talents).toEqual([talents.talents[1]]);
  });

  it("shows Psychic purchase ownership and warns before attempting to delete a linked purchase", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [
        entry("p1", "minor-psychic-power", "Minor Psychic Power"),
        entry("p2", "minor-psychic-power", "Minor Psychic Power"),
      ],
    });
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      minorPowers: [{ id: "power-1", name: "Power", known: true, talentEntryUid: "p1" }],
    };
    const { unmount } = render(
      <TalentsTab talents={talents} psychic={psychic} editable onUpdateTalents={() => undefined} />
    );
    expect(screen.getAllByText("Owned: 2").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Delete Minor Psychic Power" }).length
    ).toBeGreaterThan(0);
    unmount();
    render(
      <TalentsTab
        talents={makeTalents({ talents: [talents.talents[0]] })}
        psychic={psychic}
        editable
        onUpdateTalents={() => undefined}
      />
    );
    expect(screen.getAllByText("Owned: 1").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        "This Talent cannot be deleted until its linked Psychic powers are deleted."
      )
    ).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Delete Minor Psychic Power" })[0]);
    const blockedDialog = screen.getByRole("dialog", { name: "Cannot Delete Talent" });
    expect(blockedDialog).toBeInTheDocument();
    expect(
      screen.getByText("This Talent cannot be deleted until its linked Psychic powers are deleted.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(within(blockedDialog).getByText("Close")).toBeInTheDocument();
  });

  it("warns when deleting a Psy Rating Talent with linked powers", async () => {
    const user = userEvent.setup();
    const psyRating = entry("psy-3", "psy-rating-3", "Psy Rating 3");
    const psychic: PsychicBlock = {
      ...emptyPsychic,
      majorPowers: [
        {
          id: "power-1",
          name: "Power",
          known: true,
          psyRatingTalentEntryUid: psyRating.uid,
        },
      ],
    };

    render(
      <TalentsTab
        talents={makeTalents({ talents: [psyRating] })}
        psychic={psychic}
        editable
        onUpdateTalents={() => undefined}
      />
    );

    expect(
      screen.queryByText(
        "This Talent cannot be deleted until its linked Psychic powers are deleted."
      )
    ).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Delete Psy Rating 3" })[0]);
    expect(screen.getByRole("dialog", { name: "Cannot Delete Talent" })).toBeInTheDocument();
    expect(
      screen.getByText("This Talent cannot be deleted until its linked Psychic powers are deleted.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows Psychic purchase ownership in the Talent picker", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [
        entry("p1", "minor-psychic-power", "Minor Psychic Power"),
        entry("p2", "minor-psychic-power", "Minor Psychic Power"),
      ],
    });
    renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Add Talent" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Add Talent" });
    const card = within(dialog).getByText("Minor Psychic Power").closest("button");
    expect(within(card!).getByText("Owned: 2")).toBeInTheDocument();
  });

  it("allows an unused Psychic purchase to be deleted with confirmation", async () => {
    const user = userEvent.setup();
    const talents = makeTalents({
      talents: [entry("p1", "minor-psychic-power", "Minor Psychic Power")],
    });
    const { onUpdateTalents } = renderTab({ talents });
    await user.click(screen.getAllByRole("button", { name: "Delete Minor Psychic Power" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdateTalents.mock.calls[0][0].talents).toHaveLength(0);
  });

  it("confirms Faith Talent deletion and preserves read-only display", async () => {
    const user = userEvent.setup();
    const faith = entry("f1", "faith-talent", "Faith Talent");
    const { onUpdateTalents } = renderTab({ talents: makeTalents({ talents: [faith] }) });
    await user.click(screen.getAllByRole("button", { name: "Delete Faith Talent" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onUpdateTalents.mock.calls[0][0].talents).toHaveLength(0);

    cleanup();
    renderTab({ editable: false, talents: makeTalents({ talents: [faith] }) });
    expect(screen.getAllByText("Faith Talent").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Delete Faith Talent" })).not.toBeInTheDocument();
  });
});
