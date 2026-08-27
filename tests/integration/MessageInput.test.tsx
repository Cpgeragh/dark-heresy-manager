// tests/integration/MessageInput.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MessageInput } from "../../src/components/MessageInput";

describe("MessageInput", () => {
  it("sends trimmed text and clears the input", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Message…"), "  Hello there  ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).toHaveBeenCalledWith("Hello there");
    expect(screen.getByPlaceholderText("Message…")).toHaveValue("");
  });

  it("does not send an empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Message…"), "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends on Enter but not on Shift+Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText("Message…");

    await user.type(input, "Hi");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("Hi");
  });

  it("disables the input and button while disabled", () => {
    render(<MessageInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText("Message…")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("uses a custom placeholder", () => {
    render(<MessageInput onSend={vi.fn()} placeholder="Reply to Vex…" />);
    expect(screen.getByPlaceholderText("Reply to Vex…")).toBeInTheDocument();
  });
});
