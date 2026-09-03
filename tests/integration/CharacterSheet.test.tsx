// tests/integration/CharacterSheet.test.tsx
//
// useCharacterSheet is mocked entirely (already has its own dedicated unit
// test). All 20 tab components, AdminTab, CompleteBackgroundSetupModal,
// SectionDrawer, and CharacterKebabContent are mocked too — each already has,
// or is separately queued for, its own coverage. This file is scoped to
// CharacterSheet's own orchestration: loading/error/not-found states, the
// mandatory Background-setup gate, tab switching via the URL, the DM
// override bar, the kebab-content wiring, and the XP-reconciliation effect.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import type { Character } from "../../src/types/Character";

const useCharacterSheetMock = vi.fn();
vi.mock("../../src/pages/CharacterSheet/useCharacterSheet", () => ({
  useCharacterSheet: (...args: unknown[]) => useCharacterSheetMock(...args),
}));

const setBackHrefMock = vi.fn();
const clearBackHrefMock = vi.fn();
const setKebabContentMock = vi.fn();
const clearKebabContentMock = vi.fn();
vi.mock("../../src/context/useHeaderExtension", () => ({
  useHeaderExtensionSetters: () => ({
    setBackHref: setBackHrefMock,
    clearBackHref: clearBackHrefMock,
    setKebabContent: setKebabContentMock,
    clearKebabContent: clearKebabContentMock,
  }),
}));

const useUserProfileMock = vi.fn();
vi.mock("../../src/hooks/useUserProfile", () => ({
  useUserProfile: (...args: unknown[]) => useUserProfileMock(...args),
}));

const getSpentXpMock = vi.fn();
const reconcileCharacterSpentXpMock = vi.fn();
const registerRecoveryCodeMock = vi.fn();
const revokeRecoveryCodeMock = vi.fn();
vi.mock("../../src/mechanics/experience/xpSpent", () => ({
  getSpentXp: (...args: unknown[]) => getSpentXpMock(...args),
}));
vi.mock("../../src/services/characterService", () => ({
  reconcileCharacterSpentXp: (...args: unknown[]) => reconcileCharacterSpentXpMock(...args),
  registerRecoveryCode: (...args: unknown[]) => registerRecoveryCodeMock(...args),
  revokeRecoveryCode: (...args: unknown[]) => revokeRecoveryCodeMock(...args),
}));

vi.mock("../../src/pages/CharacterSheet/CharacterKebabContent", () => ({
  CharacterKebabContent: (props: Record<string, unknown>) => (
    <div>
      Mock CharacterKebabContent
      <button onClick={() => (props.onGenerateRecoveryCode as () => void)()}>Mock Generate</button>
      <button onClick={() => (props.onRevokeRecoveryCode as () => void)()}>Mock Revoke</button>
      <button onClick={() => (props.onPlayerRelease as () => void)()}>Mock Release</button>
    </div>
  ),
}));

vi.mock("../../src/pages/CharacterSheet/BackgroundTab/CompleteBackgroundSetupModal", () => ({
  CompleteBackgroundSetupModal: () => <div>Mock CompleteBackgroundSetupModal</div>,
}));

vi.mock("../../src/components/SectionDrawer", () => ({
  SectionDrawer: ({ onTabChange }: { onTabChange: (tab: string) => void }) => (
    <button onClick={() => onTabChange("skills")}>Mock Switch To Skills</button>
  ),
}));

// One mock per tab, each rendering a distinguishable marker. vi.mock calls
// are hoisted by static analysis, so these must be literal top-level calls,
// not generated in a loop (a loop compiles fine but breaks at runtime since
// the hoist happens before the loop variable exists).
vi.mock("../../src/pages/CharacterSheet/VitalsTab", () => ({ VitalsTab: () => <div>Mock VitalsTab</div> }));
vi.mock("../../src/pages/CharacterSheet/InsanityTab", () => ({ InsanityTab: () => <div>Mock InsanityTab</div> }));
vi.mock("../../src/pages/CharacterSheet/CorruptionTab", () => ({ CorruptionTab: () => <div>Mock CorruptionTab</div> }));
vi.mock("../../src/pages/CharacterSheet/CharacteristicsTab", () => ({ CharacteristicsTab: () => <div>Mock CharacteristicsTab</div> }));
vi.mock("../../src/pages/CharacterSheet/SkillsTab", () => ({ SkillsTab: () => <div>Mock SkillsTab</div> }));
vi.mock("../../src/mechanics/talents/TalentsTab", () => ({ TalentsTab: () => <div>Mock TalentsTab</div> }));
vi.mock("../../src/mechanics/traits/TraitsTab", () => ({ TraitsTab: () => <div>Mock TraitsTab</div> }));
vi.mock("../../src/pages/CharacterSheet/WeaponsTab", () => ({ WeaponsTab: () => <div>Mock WeaponsTab</div> }));
vi.mock("../../src/pages/CharacterSheet/ArmourTab", () => ({ ArmourTab: () => <div>Mock ArmourTab</div> }));
vi.mock("../../src/pages/CharacterSheet/CyberneticsTab", () => ({ CyberneticsTab: () => <div>Mock CyberneticsTab</div> }));
vi.mock("../../src/pages/CharacterSheet/PsychicTab", () => ({ PsychicTab: () => <div>Mock PsychicTab</div> }));
vi.mock("../../src/pages/CharacterSheet/GearTab", () => ({ GearTab: () => <div>Mock GearTab</div> }));
vi.mock("../../src/pages/CharacterSheet/DrugsTab", () => ({ DrugsTab: () => <div>Mock DrugsTab</div> }));
vi.mock("../../src/pages/CharacterSheet/ExperienceTab", () => ({ ExperienceTab: () => <div>Mock ExperienceTab</div> }));
vi.mock("../../src/pages/CharacterSheet/NotesTab", () => ({ NotesTab: () => <div>Mock NotesTab</div> }));
vi.mock("../../src/pages/CharacterSheet/AdminTab", () => ({ AdminTab: () => <div>Mock AdminTab</div> }));
vi.mock("../../src/pages/CharacterSheet/ArcheotechTab", () => ({ ArcheotechTab: () => <div>Mock ArcheotechTab</div> }));
vi.mock("../../src/pages/CharacterSheet/BackgroundTab", () => ({ BackgroundTab: () => <div>Mock BackgroundTab</div> }));
vi.mock("../../src/pages/CharacterSheet/WeaponTrainingTab", () => ({ WeaponTrainingTab: () => <div>Mock WeaponTrainingTab</div> }));
vi.mock("../../src/pages/CharacterSheet/CompanionsTab", () => ({ CompanionsTab: () => <div>Mock CompanionsTab</div> }));

import CharacterSheet from "../../src/pages/CharacterSheet";

function character(over: Partial<Character> = {}): Character {
  return {
    id: "char-1",
    campaignId: "campaign-1",
    userId: "player-1",
    recoveryCode: "DH-AAAA-BBBB",
    backgroundComplete: true,
    header: { characterName: "Vex", career: "Guardsman", rank: "Trooper" },
    talentsAndTraits: { homeworld: "", talents: [], traits: [] },
    experience: { total: 500, spent: 200 },
    ...over,
  } as Character;
}

function baseSheetResult(overrides: Record<string, unknown> = {}) {
  return {
    path: { campaignId: "campaign-1", characterId: "char-1" },
    character: character(),
    characterLoading: false,
    characterError: null,
    isDM: false,
    isDMLoading: false,
    memberIds: [],
    dmReadOnly: true,
    toggleDmReadOnly: vi.fn(),
    getCharField: vi.fn(() => ({ base: 30, advances: 0 })),
    getEffectiveCharTotal: vi.fn(() => 30),
    getCharBonus: vi.fn(() => 3),
    updateCharacteristic: vi.fn(),
    updateField: vi.fn(),
    updateFields: vi.fn(),
    releaseCharacter: vi.fn(),
    dmForceRelease: vi.fn(),
    dmForceAssign: vi.fn(),
    dmToggleEdit: vi.fn(),
    allowedToEdit: true,
    isOwner: true,
    canPlayerRelease: false,
    isReleasing: false,
    isDmForceReleasing: false,
    isDmForceAssigning: false,
    isDmTogglingEdit: false,
    isUpdating: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.scrollTo = vi.fn();
  useUserProfileMock.mockReturnValue({ firstName: null, error: null });
  getSpentXpMock.mockReturnValue(200);
  reconcileCharacterSpentXpMock.mockResolvedValue(undefined);
  useCharacterSheetMock.mockReturnValue(baseSheetResult());
});

function renderSheet(initialPath = "/campaign/campaign-1/character/char-1?tab=stats") {
  const onOpenMessages = vi.fn();
  const renderRoutes = () => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/campaign/:campaignId/character/:characterId"
          element={<CharacterSheet effectiveUserId="player-1" onOpenMessages={onOpenMessages} />}
        />
        <Route path="/" element={<div>Mock Shared Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
  const view = render(renderRoutes());
  return {
    ...view,
    onOpenMessages,
    rerenderSheet: () => view.rerender(renderRoutes()),
  };
}

describe("CharacterSheet loading/error states", () => {
  it("shows Invalid character route when path is null", () => {
    useCharacterSheetMock.mockReturnValue(baseSheetResult({ path: null }));
    renderSheet();
    expect(screen.getByText("Invalid character route.")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useCharacterSheetMock.mockReturnValue(baseSheetResult({ characterLoading: true }));
    renderSheet();
    expect(screen.getByText("Loading character…")).toBeInTheDocument();
  });

  it("keeps the release transition neutral if access is revoked before navigation completes", () => {
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({
        character: undefined,
        characterError: new Error("permission-denied"),
        isReleasing: true,
      })
    );
    renderSheet();

    expect(screen.getByText("Releasing character…")).toBeInTheDocument();
    expect(screen.queryByText(/Unable to load this character/)).not.toBeInTheDocument();
  });

  it("shows an error state", () => {
    const initialAccessError = Object.assign(new Error("permission-denied"), {
      code: "permission-denied",
    });
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ character: null, characterError: initialAccessError })
    );
    renderSheet();
    expect(
      screen.getByText(
        "Unable to load this character. You may no longer have access, or there may be a temporary connection problem."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to Dashboard" })).toBeInTheDocument();
  });

  it("returns to the dashboard when access is revoked after the character loaded", async () => {
    let sheetResult = baseSheetResult();
    useCharacterSheetMock.mockImplementation(() => sheetResult);
    const { rerenderSheet } = renderSheet();

    expect(screen.getByText("Mock CharacteristicsTab")).toBeInTheDocument();
    await waitFor(() => expect(setKebabContentMock).toHaveBeenCalled());

    const revokedError = Object.assign(new Error("permission-denied"), {
      code: "permission-denied",
    });
    sheetResult = baseSheetResult({ character: null, characterError: revokedError });
    rerenderSheet();

    expect(await screen.findByText("Mock Shared Dashboard")).toBeInTheDocument();
    expect(screen.queryByText(/Unable to load this character/)).not.toBeInTheDocument();
  });

  it("shows Character not found when there is no character", () => {
    useCharacterSheetMock.mockReturnValue(baseSheetResult({ character: undefined }));
    renderSheet();
    expect(screen.getByText("Character not found.")).toBeInTheDocument();
  });
});

describe("CharacterSheet Background setup gate", () => {
  it("shows the mandatory setup modal for a player with an incomplete Background", () => {
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ character: character({ backgroundComplete: false }), isDM: false })
    );
    renderSheet();
    expect(screen.getByText("Mock CompleteBackgroundSetupModal")).toBeInTheDocument();
  });

  it("never gates the DM, even with an incomplete Background", () => {
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ character: character({ backgroundComplete: false }), isDM: true })
    );
    renderSheet();
    expect(screen.queryByText("Mock CompleteBackgroundSetupModal")).not.toBeInTheDocument();
  });
});

describe("CharacterSheet tabs", () => {
  it("defaults to the stats tab", () => {
    renderSheet("/campaign/campaign-1/character/char-1");
    expect(screen.getByText("Mock CharacteristicsTab")).toBeInTheDocument();
  });

  it("renders whichever tab the ?tab= URL param names", () => {
    renderSheet("/campaign/campaign-1/character/char-1?tab=skills");
    expect(screen.getByText("Mock SkillsTab")).toBeInTheDocument();
    expect(screen.queryByText("Mock CharacteristicsTab")).not.toBeInTheDocument();
  });

  it("switches tabs when the drawer requests a change", async () => {
    const user = userEvent.setup();
    renderSheet("/campaign/campaign-1/character/char-1?tab=stats");

    await user.click(screen.getByRole("button", { name: "Mock Switch To Skills" }));

    expect(screen.getByText("Mock SkillsTab")).toBeInTheDocument();
  });

  it("only renders the Admin tab for the DM", () => {
    useCharacterSheetMock.mockReturnValue(baseSheetResult({ isDM: true }));
    renderSheet("/campaign/campaign-1/character/char-1?tab=admin");
    expect(screen.getByText("Mock AdminTab")).toBeInTheDocument();
  });

  it("returns a player who enters the Admin URL to Characteristics", async () => {
    renderSheet("/campaign/campaign-1/character/char-1?tab=admin");

    expect(await screen.findByText("Mock CharacteristicsTab")).toBeInTheDocument();
    expect(screen.queryByText("Mock AdminTab")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("returns an unknown tab URL to Characteristics", async () => {
    renderSheet("/campaign/campaign-1/character/char-1?tab=not-a-real-tab");

    expect(await screen.findByText("Mock CharacteristicsTab")).toBeInTheDocument();
  });

  it("calls onOpenMessages from the Messages button", async () => {
    const user = userEvent.setup();
    const { onOpenMessages } = renderSheet();

    await user.click(screen.getByRole("button", { name: "Messages" }));
    expect(onOpenMessages).toHaveBeenCalled();
  });
});

describe("CharacterSheet DM override bar", () => {
  it("hides the DM bar for a player", () => {
    renderSheet();
    expect(screen.queryByText("DM View")).not.toBeInTheDocument();
  });

  it("shows the DM bar and toggles read-only for the DM", async () => {
    const user = userEvent.setup();
    const toggleDmReadOnly = vi.fn();
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ isDM: true, dmReadOnly: true, toggleDmReadOnly })
    );
    renderSheet();

    expect(screen.getByText("DM View")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enable editing mode" }));
    expect(toggleDmReadOnly).toHaveBeenCalled();
  });
});

describe("CharacterSheet kebab content", () => {
  it("wires the generate/revoke recovery-code callbacks", async () => {
    const user = userEvent.setup();
    renderSheet();

    await waitFor(() => expect(setKebabContentMock).toHaveBeenCalled());
    const kebabContent = setKebabContentMock.mock.calls.at(-1)?.[0];
    render(kebabContent);

    await user.click(screen.getByText("Mock Generate"));
    expect(registerRecoveryCodeMock).toHaveBeenCalledWith("campaign-1", "char-1");

    await user.click(screen.getByText("Mock Revoke"));
    expect(revokeRecoveryCodeMock).toHaveBeenCalledWith("campaign-1", "char-1");
  });

  it("returns to the player dashboard after a successful release", async () => {
    const user = userEvent.setup();
    const releaseCharacter = vi.fn().mockResolvedValue(true);
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ canPlayerRelease: true, releaseCharacter })
    );
    renderSheet();

    await waitFor(() => expect(setKebabContentMock).toHaveBeenCalled());
    render(setKebabContentMock.mock.calls.at(-1)?.[0]);
    await user.click(screen.getByText("Mock Release"));

    expect(releaseCharacter).toHaveBeenCalledOnce();
    expect(await screen.findByText("Mock Shared Dashboard")).toBeInTheDocument();
  });

  it("stays on the character sheet when release fails", async () => {
    const user = userEvent.setup();
    const releaseCharacter = vi.fn().mockResolvedValue(false);
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ canPlayerRelease: true, releaseCharacter })
    );
    renderSheet();

    await waitFor(() => expect(setKebabContentMock).toHaveBeenCalled());
    render(setKebabContentMock.mock.calls.at(-1)?.[0]);
    await user.click(screen.getByText("Mock Release"));

    expect(releaseCharacter).toHaveBeenCalledOnce();
    expect(screen.queryByText("Mock Shared Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Mock CharacteristicsTab")).toBeInTheDocument();
  });
});

describe("CharacterSheet XP reconciliation", () => {
  it("reconciles spent XP when the computed value differs from what's stored", async () => {
    getSpentXpMock.mockReturnValue(999);
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ character: character({ experience: { total: 500, spent: 200 } }) })
    );
    renderSheet();

    await waitFor(() =>
      expect(reconcileCharacterSpentXpMock).toHaveBeenCalledWith("campaign-1", "char-1", 999)
    );
  });

  it("does not reconcile when the computed value already matches", async () => {
    getSpentXpMock.mockReturnValue(200);
    useCharacterSheetMock.mockReturnValue(
      baseSheetResult({ character: character({ experience: { total: 500, spent: 200 } }) })
    );
    renderSheet();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reconcileCharacterSpentXpMock).not.toHaveBeenCalled();
  });

  it("does not reconcile when the viewer isn't allowed to edit", async () => {
    getSpentXpMock.mockReturnValue(999);
    useCharacterSheetMock.mockReturnValue(baseSheetResult({ allowedToEdit: false }));
    renderSheet();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reconcileCharacterSpentXpMock).not.toHaveBeenCalled();
  });
});
