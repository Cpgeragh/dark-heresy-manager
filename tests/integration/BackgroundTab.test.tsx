// tests/integration/BackgroundTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
    const { onUpdateHeader } = renderTab({
      talents: { homeworld: "feral-world", talents: [], traits: [] },
    });

    await user.click(screen.getByRole("button", { name: "Select Career" }));
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
      talents: { homeworld: "feral-world", talents: [], traits: [] },
    });

    await user.click(screen.getByRole("button", { name: "Change Rank" }));
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
    const rankModal = screen.getByRole("dialog", { name: "Conscript" });
    expect(within(rankModal).getByText("Rank 1")).toBeInTheDocument();
    expect(within(rankModal).getByText("0–499")).toBeInTheDocument();
  });

  it("adds the selected homeworld's career text to the existing career modal", async () => {
    const user = userEvent.setup();
    renderTab({
      header: { characterName: "Brother Corvus", career: "Adept" },
      talents: { homeworld: "forge-world", talents: [], traits: [] },
    });

    await user.click(screen.getByRole("button", { name: "Show information about Adept" }));

    const modal = screen.getByRole("dialog", { name: "Adept" });
    expect(within(modal).getByText("Forge World Adepts")).toBeInTheDocument();
    expect(within(modal).getByText(/Forge world Adepts toil among the gathered wisdom/)).toBeInTheDocument();
  });

  it("keeps the career and rank selectors unavailable until a homeworld is selected", () => {
    renderTab();
    expect(screen.getByRole("button", { name: "Select Career" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select Rank" })).toBeDisabled();
  });

  it("selects a divination from the reference list", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();

    await user.click(screen.getByRole("button", { name: "Select Divination" }));
    await user.click(screen.getByText("“Trust in your fear.”"));

    expect(onUpdateHeader).toHaveBeenCalledWith(
      expect.objectContaining({ divination: "Trust in your fear." })
    );
  });

  it("shows the selected divination effect", async () => {
    const user = userEvent.setup();
    renderTab({
      header: {
        characterName: "Brother Corvus",
        divination: "Trust in your fear.",
      },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Show information about Trust in your fear.",
      })
    );
    expect(screen.getByText("Increase Agility by +2 and gain 1 Fate Point.")).toBeInTheDocument();
  });

  it("shows a placeholder when no homeworld is selected", () => {
    renderTab();
    expect(screen.getByText("— Select homeworld —")).toBeInTheDocument();
  });

  it("selects a homeworld via its picker", async () => {
    const user = userEvent.setup();
    const { onUpdateTalents } = renderTab();

    await user.click(screen.getByRole("button", { name: "Select Homeworld" }));
    await user.click(screen.getByText("Hive World"));

    expect(onUpdateTalents).toHaveBeenCalledWith(
      expect.objectContaining({ homeworld: "hive-world" })
    );
  });

  it("shows the current homeworld with its source chip", () => {
    renderTab({ talents: { homeworld: "hive-world", talents: [], traits: [] } });
    expect(screen.getByText("Hive World")).toBeInTheDocument();
    expect(screen.getByText("CR")).toBeInTheDocument();
  });

  it("lists homeworld skills and traits with their existing information modals", async () => {
    const user = userEvent.setup();
    renderTab({ talents: { homeworld: "feral-world", talents: [], traits: [] } });

    await user.click(screen.getByRole("button", { name: "Show information about Feral World" }));

    const modal = screen.getByRole("dialog", { name: "Feral World" });
    expect(within(modal).getByText("Speak Language (Tribal Dialect)")).toBeInTheDocument();
    expect(within(modal).getByText("Iron Stomach")).toBeInTheDocument();
    expect(
      within(modal).getByRole("button", {
        name: "Show information about Speak Language (Tribal Dialect)",
      })
    ).toBeInTheDocument();
    expect(
      within(modal).getByRole("button", { name: "Show information about Iron Stomach" })
    ).toBeInTheDocument();
    expect(within(modal).queryByText("01–15")).not.toBeInTheDocument();
  });

  it("filters careers to the selected homeworld", async () => {
    const user = userEvent.setup();
    renderTab({ talents: { homeworld: "feral-world", talents: [], traits: [] } });

    await user.click(screen.getByRole("button", { name: "Select Career" }));

    expect(screen.getByText("Assassin")).toBeInTheDocument();
    expect(screen.queryByText("Arbitrator")).not.toBeInTheDocument();
  });

  it("disables the homeworld field when not editable", () => {
    renderTab({ editable: false });
    expect(screen.queryByRole("button", { name: "Select Homeworld" })).not.toBeInTheDocument();
  });
});
