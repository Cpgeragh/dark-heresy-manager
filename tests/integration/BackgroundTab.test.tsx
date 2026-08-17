// tests/integration/BackgroundTab.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
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

  it("removes a Career-granted Optical Rupture implant when a Homeworld change invalidates Imperial Psyker", async () => {
    const user = userEvent.setup();
    const onUpdateCybernetics = vi.fn();
    const { onUpdateHeader } = renderTab({
      header: { characterName: "Brother Corvus", career: "Imperial Psyker", rank: "Sanctionite" },
      talents: { homeworld: "feral-world", talents: [], traits: [], careerTraitAcquisition: { sanctioning: { resultId: "optical-rupture", resultName: "Optical Rupture" } } },
      cybernetics: [
        { id: "sanctioned-eyes", name: "Cybernetic Senses", craftsmanship: "Common", grantedByTalentEntryUid: "career:imperial-psyker:sanctioned-psyker" },
        { id: "independent", name: "Bionic Arm", craftsmanship: "Common" },
      ],
      onUpdateCybernetics,
    });
    await user.click(screen.getByRole("button", { name: "Change Homeworld" }));
    await user.click(screen.getByText("Forge World"));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ career: "", rank: "" }));
    expect(onUpdateCybernetics).toHaveBeenCalledWith([
      expect.objectContaining({ id: "independent" }),
    ]);
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
    expect(screen.getByRole("button", { name: "Select Homeworld" })).toBeDisabled();
  });

  it("selects a skin option", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Skin" })[0]);
    await user.click(screen.getByText("Tan"));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ skin: "Tan" }));
  });

  it("selects a hair option", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Hair" })[0]);
    await user.click(screen.getByText("Auburn"));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ hair: "Auburn" }));
  });

  it("selects an eyes option", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Eyes" })[0]);
    await user.click(screen.getByText("Violet"));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ eyes: "Violet" }));
  });

  it("adds a quirk", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Add Quirk" })[0]);
    await user.click(screen.getByText("Bald"));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ quirks: ["Bald"] }));
  });

  it("excludes already-added quirks from the picker", async () => {
    const user = userEvent.setup();
    renderTab({ header: { characterName: "Brother Corvus", quirks: ["Bald"] } });
    await user.click(screen.getAllByRole("button", { name: "Add Quirk" })[0]);
    const modal = screen.getByRole("dialog", { name: "Add Quirk" });
    expect(within(modal).queryByText("Bald")).not.toBeInTheDocument();
  });

  it("removes a quirk", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab({
      header: { characterName: "Brother Corvus", quirks: ["Bald", "Hairy"] },
    });
    await user.click(screen.getAllByRole("button", { name: "Remove Bald" })[0]);
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ quirks: ["Hairy"] }));
  });

  it("accepts a valid whole-number age and rejects zero", () => {
    const { onUpdateHeader } = renderTab();
    const ageInput = screen.getAllByLabelText("Age")[0];
    fireEvent.change(ageInput, { target: { value: "0" } });
    expect(onUpdateHeader).not.toHaveBeenCalled();
    fireEvent.change(ageInput, { target: { value: "25" } });
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ age: 25 }));
  });

  it("accepts a whole-number weight and rejects a decimal", () => {
    const { onUpdateHeader } = renderTab();
    const weightInput = screen.getAllByLabelText("Weight")[0];
    fireEvent.change(weightInput, { target: { value: "65.5" } });
    expect(onUpdateHeader).not.toHaveBeenCalled();
    fireEvent.change(weightInput, { target: { value: "65" } });
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ weight: 65 }));
  });

  it("accepts a height with up to 2 decimal places and rejects a third", () => {
    const { onUpdateHeader } = renderTab();
    const heightInput = screen.getAllByLabelText("Height")[0];
    fireEvent.change(heightInput, { target: { value: "1.905" } });
    expect(onUpdateHeader).not.toHaveBeenCalled();
    expect(heightInput).toHaveValue("");
    fireEvent.change(heightInput, { target: { value: "1.9" } });
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ height: 1.9 }));
  });

  it("sets gender directly for Male and Female", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Gender" })[0]);
    await user.click(screen.getByRole("button", { name: "Female" }));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ gender: "Female" }));
  });

  it("selects Other as a standalone value when left blank", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Gender" })[0]);
    await user.click(screen.getByRole("button", { name: "Other" }));
    await user.click(screen.getByRole("button", { name: "Use This" }));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ gender: "Other" }));
  });

  it("lets a custom name be typed for Other", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Gender" })[0]);
    await user.click(screen.getByRole("button", { name: "Other" }));
    fireEvent.change(screen.getByLabelText("Rename"), { target: { value: "Non-binary" } });
    await user.click(screen.getByRole("button", { name: "Use This" }));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ gender: "Non-binary" }));
  });

  it("pre-fills the custom name when re-editing an existing custom gender", async () => {
    const user = userEvent.setup();
    renderTab({ header: { characterName: "Brother Corvus", gender: "Ecclesiarchy-blessed" } });
    await user.click(screen.getAllByRole("button", { name: "Change Gender" })[0]);
    expect(screen.getByRole("button", { name: "Other" })).toHaveClass("bg-slate-800");
    await user.click(screen.getByRole("button", { name: "Other" }));
    expect(screen.getByLabelText("Rename")).toHaveValue("Ecclesiarchy-blessed");
  });

  it("shows the selected gender on the closed field", () => {
    renderTab({ header: { characterName: "Brother Corvus", gender: "Ecclesiarchy-blessed" } });
    expect(screen.getAllByText("Ecclesiarchy-blessed").length).toBeGreaterThan(0);
  });

  it("lists skin options alphabetically", async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Skin" })[0]);
    const modal = screen.getByRole("dialog", { name: "Skin" });
    const rows = within(modal).getAllByRole("button").map((el) => el.textContent);
    expect(rows).toEqual([...rows].sort((a, b) => (a ?? "").localeCompare(b ?? "")));
  });

  it("prompts for a colour when picking a '(any)' skin option and combines it", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Skin" })[0]);
    await user.click(screen.getByText("Stained (any)"));
    fireEvent.change(screen.getByLabelText("Colour"), { target: { value: "Blue" } });
    await user.click(screen.getByRole("button", { name: "Use This" }));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ skin: "Stained (Blue)" }));
  });

  it("uses the '(any)' option as-is when no colour is given", async () => {
    const user = userEvent.setup();
    const { onUpdateHeader } = renderTab();
    await user.click(screen.getAllByRole("button", { name: "Select Skin" })[0]);
    await user.click(screen.getByText("Stained (any)"));
    await user.click(screen.getByRole("button", { name: "Use This" }));
    expect(onUpdateHeader).toHaveBeenCalledWith(expect.objectContaining({ skin: "Stained (any)" }));
  });
});
