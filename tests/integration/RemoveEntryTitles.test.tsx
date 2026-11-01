import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ConsumableRow } from "../../src/pages/CharacterSheet/GearTab/ConsumableRow";
import { ImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ImplantRow";
import { CorruptionEntryRow } from "../../src/mechanics/corruption/CorruptionEntryRow";

const none = () => undefined;

describe("Remove pop-up titles", () => {
  it("names a Consumable", async () => {
    const user = userEvent.setup();
    render(
      <ConsumableRow
        item={{ id: "c1", name: "Ration Pack", quantity: 1 }}
        editable
        onUpdateQty={none}
        onRemove={none}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Ration Pack" }));

    expect(screen.getByRole("dialog", { name: "Remove Consumable" })).toBeInTheDocument();
  });

  it("names an Implant", async () => {
    const user = userEvent.setup();
    render(
      <ImplantRow
        item={{ id: "y1", name: "Auto-Quill" }}
        editable
        onToggleInstalled={none}
        onRemove={none}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));

    expect(screen.getByRole("dialog", { name: "Remove Implant" })).toBeInTheDocument();
  });

  it.each(["Mutation", "Malignancy"] as const)("names a %s", async (kind) => {
    const user = userEvent.setup();
    render(
      <CorruptionEntryRow
        kind={kind}
        entry={{ id: "e1", name: "Extra Toes", custom: true }}
        editable
        onRemove={none}
        onUpdateRolls={none}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove Extra Toes" }));

    expect(screen.getByRole("dialog", { name: `Remove ${kind}` })).toBeInTheDocument();
  });
});
