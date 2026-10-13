// tests/integration/ChatAvatar.test.tsx
import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatAvatar } from "../../src/components/chat/ChatAvatar";
import { getInitials } from "../../src/utils/chatInitials";

describe("getInitials", () => {
  it("uses the first letters of the first and last words", () => {
    expect(getInitials("Brother Kael")).toBe("BK");
    expect(getInitials("Inquisitor Anna Vance")).toBe("IV");
  });

  it("uses the first two letters of a single word", () => {
    expect(getInitials("kael")).toBe("KA");
  });

  it("falls back to a question mark for an empty name", () => {
    expect(getInitials("   ")).toBe("?");
  });
});

describe("ChatAvatar", () => {
  it("shows only a plain disc while the picture is loading", () => {
    const { container } = render(
      <ChatAvatar name="Brother Kael" picture={{ status: "loading" }} />
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("BK")).not.toBeInTheDocument();
  });

  it("shows initials when there is no picture", () => {
    render(<ChatAvatar name="Brother Kael" picture={{ status: "none" }} />);

    expect(screen.getByText("BK")).toBeInTheDocument();
  });

  it("keeps a ready picture invisible until it has loaded, then fades it in", () => {
    const { container } = render(
      <ChatAvatar
        name="Brother Kael"
        picture={{ status: "ready", url: "data:image/png;base64,AA" }}
      />
    );
    const image = container.querySelector("img");

    expect(image).toHaveClass("opacity-0");
    expect(screen.queryByText("BK")).not.toBeInTheDocument();

    fireEvent.load(image as HTMLImageElement);

    expect(image).toHaveClass("opacity-100");
  });

  it("falls back to initials when the picture fails to load", () => {
    const { container } = render(
      <ChatAvatar
        name="Brother Kael"
        picture={{ status: "ready", url: "data:image/png;base64,AA" }}
      />
    );

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("BK")).toBeInTheDocument();
  });

  it("starts the fade again when the picture changes", () => {
    const { container, rerender } = render(
      <ChatAvatar
        name="Brother Kael"
        picture={{ status: "ready", url: "data:image/png;base64,AA" }}
      />
    );
    fireEvent.load(container.querySelector("img") as HTMLImageElement);

    rerender(
      <ChatAvatar
        name="Brother Kael"
        picture={{ status: "ready", url: "data:image/png;base64,BB" }}
      />
    );

    expect(container.querySelector("img")).toHaveClass("opacity-0");
  });

  it("is hidden from screen readers", () => {
    const { container } = render(<ChatAvatar name="Brother Kael" picture={{ status: "none" }} />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
