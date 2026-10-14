// tests/integration/HeaderExtensionContext.test.tsx
import { describe, it, expect } from "vitest";
import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { HeaderExtensionProvider } from "../../src/context/HeaderExtensionContext";
import {
  useHeaderExtension,
  useHeaderExtensionSetters,
} from "../../src/context/useHeaderExtension";

const TARGET = { campaignId: "c1", characterId: "char-1", playerAccountId: "player-1" };

function Controls() {
  const { setChatTarget, clearChatTarget } = useHeaderExtensionSetters();
  return (
    <>
      <button onClick={() => setChatTarget(TARGET)}>publish</button>
      <button onClick={clearChatTarget}>clear</button>
    </>
  );
}

function StateView() {
  const { chatTarget } = useHeaderExtension();
  return <p>Target: {chatTarget ? chatTarget.characterId : "none"}</p>;
}

describe("HeaderExtensionProvider chat target", () => {
  it("starts with no chat target", () => {
    render(
      <HeaderExtensionProvider>
        <StateView />
      </HeaderExtensionProvider>
    );

    expect(screen.getByText("Target: none")).toBeInTheDocument();
  });

  it("gives a published chat target to header consumers, and clears it again", async () => {
    const user = userEvent.setup();
    render(
      <HeaderExtensionProvider>
        <Controls />
        <StateView />
      </HeaderExtensionProvider>
    );

    await user.click(screen.getByRole("button", { name: "publish" }));
    expect(screen.getByText("Target: char-1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByText("Target: none")).toBeInTheDocument();
  });

  it("keeps the setters the same functions across renders", async () => {
    const user = userEvent.setup();
    const seen: unknown[] = [];
    function Recorder() {
      const setters = useHeaderExtensionSetters();
      useEffect(() => {
        seen.push(setters.setChatTarget, setters.clearChatTarget);
      });
      return null;
    }
    render(
      <HeaderExtensionProvider>
        <Controls />
        <StateView />
        <Recorder />
      </HeaderExtensionProvider>
    );

    await user.click(screen.getByRole("button", { name: "publish" }));

    expect(new Set(seen).size).toBe(2);
  });
});
