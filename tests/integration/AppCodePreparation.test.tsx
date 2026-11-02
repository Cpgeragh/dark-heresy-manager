import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppCodePreparation } from "../../src/components/AppCodePreparation";

const { prepare, cancel, character, settings, chat } = vi.hoisted(() => ({
  prepare: vi.fn(),
  cancel: vi.fn(),
  character: vi.fn(),
  settings: vi.fn(),
  chat: vi.fn(),
}));
vi.mock("../../src/utils/prepareCode", () => ({ prepareCode: prepare }));
vi.mock("../../src/loading/appModules", () => ({
  loadCharacterSheet: character,
  loadSettings: settings,
  loadChatInbox: chat,
}));
beforeEach(() => {
  vi.clearAllMocks();
  prepare.mockReturnValue(cancel);
});

describe("application code preparation", () => {
  it("waits until the destination is shown, prioritises character code on campaigns, and cancels on navigation", () => {
    const { rerender, unmount } = render(
      <AppCodePreparation shownPath={null} pathname="/campaign/one" />
    );
    expect(prepare).not.toHaveBeenCalled();
    rerender(<AppCodePreparation shownPath="/campaign/one" pathname="/campaign/one" />);
    expect(prepare).toHaveBeenLastCalledWith([character, settings, chat]);
    rerender(
      <AppCodePreparation shownPath="/campaign/one" pathname="/campaign/one/character/two" />
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(prepare).toHaveBeenCalledTimes(1);
    rerender(
      <AppCodePreparation
        shownPath="/campaign/one/character/two"
        pathname="/campaign/one/character/two"
      />
    );
    expect(prepare).toHaveBeenLastCalledWith([settings, chat]);
    unmount();
    expect(cancel).toHaveBeenCalledTimes(2);
  });
});
