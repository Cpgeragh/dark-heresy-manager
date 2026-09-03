import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MalignancyRow } from "../../src/mechanics/corruption/MalignancyRow";
import type { CorruptionMalignancyEntry } from "../../src/types/Character";

function palsyLikeEntry(overrides: Partial<CorruptionMalignancyEntry> = {}): CorruptionMalignancyEntry {
  return { id: "m1", referenceId: "palsy", name: "Palsy", ...overrides };
}

describe("MalignancyRow", () => {
  it("shows a filled-in roll value and no Edit Rolls button when not editable", () => {
    render(
      <MalignancyRow
        malignancy={palsyLikeEntry({ rolledModifiers: { ag: 6 } })}
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
    render(<MalignancyRow malignancy={palsyLikeEntry()} editable onRemove={vi.fn()} onUpdateRolls={onUpdateRolls} />);

    expect(screen.getByText("Agility: not recorded")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Rolls" }));
    await user.type(screen.getByRole("spinbutton"), "7");
    await user.click(screen.getByRole("button", { name: "Save Rolls" }));

    expect(onUpdateRolls).toHaveBeenCalledWith({ ag: 7 });
  });

  it("shows no Edit Rolls button for a malignancy with no characteristic modifier", () => {
    render(
      <MalignancyRow
        malignancy={{ id: "m2", referenceId: "witch-mark", name: "Witch-mark" }}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Edit Rolls" })).not.toBeInTheDocument();
  });

  it("shows a source chip for a custom malignancy with an origin", () => {
    render(
      <MalignancyRow
        malignancy={{ id: "m3", name: "Weeping Eyes", effect: "Eyes that weep blood.", source: "Custom", custom: true }}
        editable
        onRemove={vi.fn()}
        onUpdateRolls={vi.fn()}
      />
    );

    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("arms a confirm step on Remove instead of deleting immediately", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<MalignancyRow malignancy={palsyLikeEntry()} editable onRemove={onRemove} onUpdateRolls={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Delete Malignancy" })).toBeInTheDocument();
    expect(screen.getByText("Delete Palsy from this character?")).toBeInTheDocument();
  });

  it("deletes only after confirming", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<MalignancyRow malignancy={palsyLikeEntry()} editable onRemove={onRemove} onUpdateRolls={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onRemove).toHaveBeenCalled();
  });

  it("cancels without deleting", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<MalignancyRow malignancy={palsyLikeEntry()} editable onRemove={onRemove} onUpdateRolls={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Delete Malignancy" })).not.toBeInTheDocument();
  });
});
