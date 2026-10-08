// tests/integration/AccordionCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { AccordionCard } from "../../src/ui/AccordionCard";

describe("AccordionCard", () => {
  it("shows the header and reports its expanded state", () => {
    render(
      <AccordionCard expanded={false} onToggle={() => undefined} header={<span>Group name</span>}>
        <p>Body content</p>
      </AccordionCard>
    );
    expect(screen.getByRole("button", { name: /Group name/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("calls onToggle when the header is pressed", async () => {
    const onToggle = vi.fn();
    render(<AccordionCard expanded={false} onToggle={onToggle} header={<span>Group name</span>} />);
    await userEvent.click(screen.getByRole("button", { name: /Group name/ }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("uses the picker row hover and padding on the header button", () => {
    render(<AccordionCard expanded onToggle={() => undefined} header={<span>Group name</span>} />);
    const header = screen.getByRole("button", { name: /Group name/ });
    expect(header).toHaveClass("p-3", "hover:bg-slate-800");
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("omits the chevron when the header draws its own", () => {
    const { container } = render(
      <AccordionCard
        expanded={false}
        onToggle={() => undefined}
        showChevron={false}
        header={<span>Group name</span>}
      />
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("passes aria attributes through to the header button", () => {
    render(
      <AccordionCard
        expanded={false}
        onToggle={() => undefined}
        aria-label="Expand Group name"
        aria-controls="details-1"
        header={<span>Group name</span>}
      />
    );
    const header = screen.getByRole("button", { name: "Expand Group name" });
    expect(header).toHaveAttribute("aria-controls", "details-1");
  });
});
