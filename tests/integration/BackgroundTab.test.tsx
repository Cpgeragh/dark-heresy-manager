// tests/integration/BackgroundTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { BackgroundTab } from "../../src/pages/characterSheet/BackgroundTab";
import type { CharacterHeader, TalentsAndTraitsBlock } from "../../src/types/Character";

function renderTab(props: Partial<React.ComponentProps<typeof BackgroundTab>> = {}) {
  const onUpdateHeader = vi.fn();
  const onUpdateTalents = vi.fn();
  const header: CharacterHeader = { characterName: "Brother Corvus" };
  const talents: TalentsAndTraitsBlock = { homeworld: "", talents: [], traits: [] };
  render(
    <BackgroundTab
      header={header}
      talents={talents}
      editable
      playerName="Cormac"
      onUpdateHeader={onUpdateHeader}
      onUpdateTalents={onUpdateTalents}
      {...props}
    />
  );
  return { onUpdateHeader, onUpdateTalents };
}

describe("BackgroundTab", () => {
  it("shows a placeholder when no homeworld is selected", () => {
    renderTab();
    expect(screen.getByText("— Select homeworld —")).toBeInTheDocument();
  });

  it("selects a homeworld via its picker", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();

    await user.click(screen.getByText("— Select homeworld —"));
    await user.click(screen.getByText("Hive World (CR)"));

    expect(onUpdateTalents).toHaveBeenCalledWith(
      expect.objectContaining({ homeworld: "hive-world" })
    );
  });

  it("shows the current homeworld and its description", () => {
    renderTab({ talents: { homeworld: "hive-world", talents: [], traits: [] } });
    expect(screen.getByText("Hive World (CR)")).toBeInTheDocument();
    expect(screen.getByText(/streetwise, quick, and resourceful/)).toBeInTheDocument();
  });

  it("disables the homeworld field when not editable", () => {
    renderTab({ editable: false });
    expect(screen.getByText("— Select homeworld —").closest("button")).toBeDisabled();
  });
});
