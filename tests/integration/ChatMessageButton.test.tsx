// tests/integration/ChatMessageButton.test.tsx
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ChatMessageButton } from "../../src/components/chat/ChatMessageButton";
import type { ChatTarget } from "../../src/components/chat/chatTarget";
import { ChatInboxProvider } from "../../src/context/ChatInboxProvider";
import { useChatInbox } from "../../src/context/useChatInbox";

function ViewProbe() {
  const { view } = useChatInbox();
  return <p data-testid="view">{JSON.stringify(view)}</p>;
}

function renderButton(target: ChatTarget) {
  return render(
    <ChatInboxProvider>
      <ChatMessageButton target={target} />
      <ViewProbe />
    </ChatInboxProvider>
  );
}

const claimed: ChatTarget = {
  campaignId: "c1",
  characterId: "char-1",
  playerAccountId: "player-1",
  characterName: "Brother Kael",
};

describe("ChatMessageButton", () => {
  it("opens that character's chat", async () => {
    const user = userEvent.setup();
    renderButton(claimed);

    await user.click(screen.getByRole("button", { name: "Message" }));

    expect(JSON.parse(screen.getByTestId("view").textContent ?? "{}")).toEqual({
      kind: "chat",
      target: claimed,
    });
  });

  it("stops the card link around it from being followed", () => {
    renderButton(claimed);

    const notCancelled = fireEvent.click(screen.getByRole("button", { name: "Message" }));

    expect(notCancelled).toBe(false);
  });

  it("shows nothing when nobody has claimed the character", () => {
    renderButton({ ...claimed, playerAccountId: null });

    expect(screen.queryByRole("button", { name: "Message" })).not.toBeInTheDocument();
  });
});
