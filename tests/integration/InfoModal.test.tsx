// tests/integration/InfoModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { InfoModal } from "../../src/components/InfoModal";

describe("InfoModal", () => {
  it("renders a real button by default", () => {
    render(<InfoModal title="Frag Grenade" content={<p>Boom.</p>} />);
    expect(screen.getByRole("button", { name: "Show information about Frag Grenade" })).toBeInTheDocument();
  });

  it("opens the dialog and shows title/content when the default button is clicked", async () => {
    const user = userEvent.setup();
    render(<InfoModal title="Frag Grenade" content={<p>Boom.</p>} />);
    await user.click(screen.getByRole("button", { name: "Show information about Frag Grenade" }));
    expect(screen.getByText("Frag Grenade")).toBeInTheDocument();
    expect(screen.getByText("Boom.")).toBeInTheDocument();
  });

  it("renders a role=button span instead of a button when as='span'", () => {
    render(<InfoModal title="Frag Grenade" content={<p>Boom.</p>} as="span" />);
    const trigger = screen.getByRole("button", { name: "Show information about Frag Grenade" });
    expect(trigger.tagName).toBe("SPAN");
    expect(trigger).toHaveAttribute("tabIndex", "0");
  });

  it("opens the dialog when Enter is pressed on the span trigger", async () => {
    const user = userEvent.setup();
    render(<InfoModal title="Frag Grenade" content={<p>Boom.</p>} as="span" />);
    const trigger = screen.getByRole("button", { name: "Show information about Frag Grenade" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Boom.")).toBeInTheDocument();
  });

  it("opens the dialog when Space is pressed on the span trigger", async () => {
    const user = userEvent.setup();
    render(<InfoModal title="Frag Grenade" content={<p>Boom.</p>} as="span" />);
    const trigger = screen.getByRole("button", { name: "Show information about Frag Grenade" });
    trigger.focus();
    await user.keyboard(" ");
    expect(screen.getByText("Boom.")).toBeInTheDocument();
  });

  it("stops the click from bubbling to a parent handler for both button and span triggers", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    const { rerender } = render(
      <div onClick={parentClick}>
        <InfoModal title="Frag Grenade" content={<p>Boom.</p>} />
      </div>
    );
    await user.click(screen.getByRole("button", { name: "Show information about Frag Grenade" }));
    expect(parentClick).not.toHaveBeenCalled();

    rerender(
      <div onClick={parentClick}>
        <InfoModal title="Frag Grenade" content={<p>Boom.</p>} as="span" />
      </div>
    );
    await user.click(screen.getByRole("button", { name: "Show information about Frag Grenade" }));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
