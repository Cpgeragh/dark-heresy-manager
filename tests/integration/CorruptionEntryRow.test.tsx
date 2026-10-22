import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { CorruptionEntryRow } from "../../src/mechanics/corruption/CorruptionEntryRow";
import type { CorruptionMalignancyEntry, CorruptionMutationEntry } from "../../src/types/Character";

type Entry = CorruptionMutationEntry | CorruptionMalignancyEntry;

interface Fixture {
  kind: "Mutation" | "Malignancy";
  withRolls: Entry;
  flatOnly: Entry;
  custom: Entry;
  customSource: string;
}

const fixtures: Fixture[] = [
  {
    kind: "Mutation",
    withRolls: { id: "m1", referenceId: "misshapen", name: "Misshapen" },
    flatOnly: { id: "m2", referenceId: "brute", name: "Brute" },
    custom: {
      id: "m3",
      name: "Extra Toes",
      effect: "Just weird toes.",
      source: "2nd Ed",
      custom: true,
    },
    customSource: "2nd Ed",
  },
  {
    kind: "Malignancy",
    withRolls: { id: "m1", referenceId: "palsy", name: "Palsy" },
    flatOnly: { id: "m2", referenceId: "witch-mark", name: "Witch-mark" },
    custom: {
      id: "m3",
      name: "Weeping Eyes",
      effect: "Eyes that weep blood.",
      source: "Custom",
      custom: true,
    },
    customSource: "Custom",
  },
];

describe.each(fixtures)("CorruptionEntryRow for a $kind", (fixture) => {
  const { kind, withRolls, flatOnly, custom, customSource } = fixture;

  it("shows a filled-in roll value and no Edit Rolls button when not editable", () => {
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={{ ...withRolls, rolledModifiers: { ag: 6 } }}
        editable={false}
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.getByText("Agility: 6")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit Rolls" })).not.toBeInTheDocument();
  });

  it("flags a missing roll as not recorded, and edits it via the Edit Rolls button", async () => {
    const user = userEvent.setup();
    const onUpdateRolls = vi.fn();
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={withRolls}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={onUpdateRolls}
      />
    );

    expect(screen.getByText("Agility: not recorded")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Rolls" }));
    await user.type(screen.getByRole("spinbutton"), "7");
    await user.click(screen.getByRole("button", { name: "Save Rolls" }));

    expect(onUpdateRolls).toHaveBeenCalledWith({ ag: 7 });
  });

  it("gives the Edit Rolls button the three responsive sizes", () => {
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={withRolls}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Edit Rolls" })).toHaveClass(
      "text-xs",
      "sm:h-7",
      "md:h-8"
    );
  });

  it("draws the roll chips in the one chip row with the other chips", () => {
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={{ ...withRolls, rolledModifiers: { ag: 6 } }}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    const chipRow = screen.getByText("Agility: 6").parentElement;
    expect(chipRow).toHaveClass("items-center");
    expect(chipRow?.querySelectorAll("span").length).toBeGreaterThanOrEqual(1);
  });

  it("shows no Edit Rolls button when the entry has no characteristic roll", () => {
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={flatOnly}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Edit Rolls" })).not.toBeInTheDocument();
  });

  it("shows a source chip for a custom entry with an origin", () => {
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={custom}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.getByText(customSource)).toBeInTheDocument();
  });

  it("arms a confirm step on Remove instead of deleting immediately", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={withRolls}
        editable
        onRemove={onRemove}
        onUpdateRolls={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: `Remove ${withRolls.name}` }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: `Remove ${kind}` })).toBeInTheDocument();
    expect(screen.getByText(`Remove ${withRolls.name} from this character?`)).toBeInTheDocument();
  });

  it("removes only after confirming", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={withRolls}
        editable
        onRemove={onRemove}
        onUpdateRolls={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: `Remove ${withRolls.name}` }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalled();
  });

  it("cancels without removing", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={withRolls}
        editable
        onRemove={onRemove}
        onUpdateRolls={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: `Remove ${withRolls.name}` }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: `Remove ${kind}` })).not.toBeInTheDocument();
  });
});
