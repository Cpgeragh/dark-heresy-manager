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
  it("selects a career and assigns its starting rank", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();

    await user.click(screen.getByText("— Select career —"));
    await user.click(screen.getByText("Guardsman"));

    expect(onUpdateHeader).toHaveBeenCalledWith(
      expect.objectContaining({ career: "Guardsman", rank: "Conscript" })
    );
  });

  it("selects a rank from the selected career progression", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab({
      header: {
        characterName: "Brother Corvus",
        career: "Guardsman",
        rank: "Conscript",
      },
    });

    await user.click(screen.getByRole("button", { name: "Conscript" }));
    await user.click(screen.getByText("Storm Trooper"));

    expect(onUpdateHeader).toHaveBeenCalledWith(
      expect.objectContaining({ career: "Guardsman", rank: "Storm Trooper" })
    );
  });

  it("shows career and rank reference information", async () => {
    const user = userEvent.setup();
    renderTab({
      header: {
        characterName: "Brother Corvus",
        career: "Guardsman",
        rank: "Conscript",
      },
    });

    await user.click(screen.getByRole("button", { name: "Show information about Guardsman" }));
    expect(
      screen.getByText(/Guardsmen are the fighters, killers and warriors/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Show information about Conscript" }));
    expect(screen.getByText("Rank 1")).toBeInTheDocument();
    expect(screen.getByText("0–499")).toBeInTheDocument();
  });

  it("keeps the rank selector unavailable until a recognised career is selected", () => {
    renderTab();
    expect(screen.getByRole("button", { name: "Select a career first" })).toBeDisabled();
  });

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
