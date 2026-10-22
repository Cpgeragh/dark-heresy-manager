// tests/integration/AccordionCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { AccordionCard } from "../../src/ui/AccordionCard";

function renderCard(props: Partial<Parameters<typeof AccordionCard>[0]> = {}) {
  return render(
    <AccordionCard
      name="Group name"
      label="Group name"
      expanded={false}
      onToggle={() => undefined}
      {...props}
    >
      <p>Body content</p>
    </AccordionCard>
  );
}

describe("AccordionCard", () => {
  it("names the toggle after its label and reports its expanded state", () => {
    renderCard();
    expect(screen.getByRole("button", { name: "Expand Group name details" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("reads Collapse when expanded", () => {
    renderCard({ expanded: true });
    expect(screen.getByRole("button", { name: "Collapse Group name details" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("calls onToggle when the header is pressed", async () => {
    const onToggle = vi.fn();
    renderCard({ onToggle });
    await userEvent.click(screen.getByRole("button", { name: "Expand Group name details" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows the body only while expanded", () => {
    const { rerender } = renderCard();
    expect(screen.queryByText("Body content")).not.toBeInTheDocument();
    rerender(
      <AccordionCard name="Group name" label="Group name" expanded onToggle={() => undefined}>
        <p>Body content</p>
      </AccordionCard>
    );
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("gives the body the entry card padding with no top divider", () => {
    renderCard({ expanded: true });
    const body = screen.getByText("Body content").parentElement!;
    expect(body).toHaveClass("px-3", "pb-3", "lg:px-4", "lg:pb-4", "space-y-3");
    expect(body).not.toHaveClass("border-t");
  });

  it("shows a name that wraps, is medium weight and has no ellipsis", () => {
    renderCard();
    const name = screen.getByText("Group name");
    expect(name).toHaveClass("font-medium", "break-words");
    expect(name).not.toHaveClass("truncate");
  });

  it("keeps a header button working without toggling the card", async () => {
    const onToggle = vi.fn();
    const onRemove = vi.fn();
    renderCard({
      onToggle,
      removeAction: (
        <button type="button" onClick={onRemove}>
          Remove thing
        </button>
      ),
    });
    await userEvent.click(screen.getByRole("button", { name: "Remove thing" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("chooses on a tap in select mode and expands from the chevron button", async () => {
    const onSelect = vi.fn();
    const onToggle = vi.fn();
    renderCard({ onSelect, onToggle });
    await userEvent.click(screen.getByRole("button", { name: "Select Group name" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Expand Group name details" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows the body with no toggle when forced expanded", () => {
    renderCard({ forceExpanded: true });
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses a notice shell for a tone and links the toggle to the body", () => {
    const { container } = renderCard({ expanded: true, tone: "red", bodyId: "details-1" });
    expect(container.firstElementChild).toHaveClass("border-red-500/60");
    expect(screen.getByRole("button", { name: "Collapse Group name details" })).toHaveAttribute(
      "aria-controls",
      "details-1"
    );
    expect(screen.getByText("Body content").parentElement).toHaveAttribute("id", "details-1");
  });
});
