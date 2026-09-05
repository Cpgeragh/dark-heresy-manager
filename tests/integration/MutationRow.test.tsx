import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MutationRow } from "../../src/mechanics/corruption/MutationRow";
import type { CorruptionMutationEntry } from "../../src/types/Character";

function palsyLikeEntry(overrides: Partial<CorruptionMutationEntry> = {}): CorruptionMutationEntry {
  return { id: "m1", referenceId: "misshapen", name: "Misshapen", ...overrides };
}

describe("MutationRow", () => {
  it("shows a filled-in roll value and no Edit Rolls button when not editable", () => {
    render(
      <MutationRow
        mutation={palsyLikeEntry({ rolledModifiers: { ag: 6 } })}
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
      <MutationRow
        mutation={palsyLikeEntry()}
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

  it("shows no Edit Rolls button for a flat-only mutation", () => {
    render(
      <MutationRow
        mutation={{ id: "m2", referenceId: "brute", name: "Brute" }}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Edit Rolls" })).not.toBeInTheDocument();
  });

  it("shows a source chip for a custom mutation with an origin", () => {
    render(
      <MutationRow
        mutation={{
          id: "m3",
          name: "Extra Toes",
          effect: "Just weird toes.",
          source: "2nd Ed",
          custom: true,
        }}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.getByText("2nd Ed")).toBeInTheDocument();
  });

  it("arms a confirm step on Remove instead of deleting immediately", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <MutationRow
        mutation={palsyLikeEntry()}
        editable
        onRemove={onRemove}
        onUpdateRolls={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Delete Mutation" })).toBeInTheDocument();
    expect(screen.getByText("Delete Misshapen from this character?")).toBeInTheDocument();
  });

  it("deletes only after confirming", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <MutationRow
        mutation={palsyLikeEntry()}
        editable
        onRemove={onRemove}
        onUpdateRolls={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onRemove).toHaveBeenCalled();
  });

  it("cancels without deleting", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <MutationRow
        mutation={palsyLikeEntry()}
        editable
        onRemove={onRemove}
        onUpdateRolls={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Delete Mutation" })).not.toBeInTheDocument();
  });
});
