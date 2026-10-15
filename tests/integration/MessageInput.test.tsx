// tests/integration/MessageInput.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

  it("empties the box at once, without waiting for the send, and never shows a Sending label", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(() => new Promise<void>(() => undefined));
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Message…"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByPlaceholderText("Message…")).toHaveValue("");
    expect(screen.getByPlaceholderText("Message…")).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Sending/ })).not.toBeInTheDocument();
  });

  it("sends nothing on a second Enter while the first send is still pending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(() => new Promise<void>(() => undefined));
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText("Message…");

    await user.type(input, "Hi");
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSend).toHaveBeenCalledOnce();
  });

  it("puts the text in front of anything typed meanwhile when delivery fails", async () => {
    const user = userEvent.setup();
    let reject: (error: Error) => void = () => undefined;
    const onSend = vi.fn(
      () =>
        new Promise<void>((_resolve, rejectSend) => {
          reject = rejectSend;
        })
    );
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText("Message…");

    await user.type(input, "First");
    await user.click(screen.getByRole("button", { name: "Send" }));
    await user.type(input, "Second");
    reject(new Error("offline"));

    await waitFor(() => expect(input).toHaveValue("First Second"));
  });

  it("retains the draft and re-enables sending when delivery fails", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockRejectedValue(new Error("offline"));
    render(<MessageInput onSend={onSend} />);

    const input = screen.getByPlaceholderText("Message…");
    await user.type(input, "Try again later");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeEnabled());
    expect(input).toHaveValue("Try again later");
    expect(onSend).toHaveBeenCalledOnce();
  });
});
