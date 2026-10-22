// tests/integration/ArcheotechImplantRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ArcheotechImplantRow } from "../../src/pages/CharacterSheet/CyberneticsTab/ArcheotechImplantRow";
import type { ArcheotechItem } from "../../src/types/Character";

function item(over: Partial<ArcheotechItem> = {}): ArcheotechItem {
  return { id: "a1", name: "Auto-Quill", ...over } as ArcheotechItem;
}

describe("ArcheotechImplantRow", () => {
  it("renders the item name and the Archeotech badge by default", () => {
    render(<ArcheotechImplantRow item={item()} editable={true} onRemove={vi.fn()} />);
    expect(screen.getByText("Auto-Quill")).toBeInTheDocument();
    expect(screen.getByText("Archeotech")).toBeInTheDocument();
  });

  it("hides the Archeotech badge and uses the plain section style when highlightAsArcheotech is false", () => {
    render(
      <ArcheotechImplantRow
        item={item()}
        editable={true}
        onRemove={vi.fn()}
        highlightAsArcheotech={false}
      />
    );
    expect(screen.queryByText("Archeotech")).not.toBeInTheDocument();
  });

  it("shows the craftsmanship chip when set", () => {
    render(
      <ArcheotechImplantRow
        item={item({ craftsmanship: "Good" })}
        editable={true}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("shows a location chip when bodyLocation is set", () => {
    render(
      <ArcheotechImplantRow
        item={item({ bodyLocation: ["rightArm"] })}
        editable={true}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText(/Right Arm/i)).toBeInTheDocument();
  });

  it("confirms removal when editable, and hides Remove when not", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { rerender } = render(
      <ArcheotechImplantRow item={item()} editable={true} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));
    expect(onRemove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();

    rerender(<ArcheotechImplantRow item={item()} editable={false} onRemove={onRemove} />);
    expect(screen.queryByRole("button", { name: "Remove Auto-Quill" })).not.toBeInTheDocument();
  });
});

describe("ArcheotechImplantRow shared entry pieces", () => {
  it("shows craftsmanship on a labelled Craftsmanship line as plain text", () => {
    render(
      <ArcheotechImplantRow
        item={item({ craftsmanship: "Good" })}
        editable={true}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Craftsmanship")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Good" })).not.toBeInTheDocument();
  });

  it("always has an information icon and an empty Rules line", async () => {
    const user = userEvent.setup();
    render(<ArcheotechImplantRow item={item()} editable={true} onRemove={vi.fn()} />);
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show information about Auto-Quill" }));
    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
  });
});

describe("ArcheotechImplantRow shared layout", () => {
  it("names the Remove pop-up after an Archeotech Item", async () => {
    const user = userEvent.setup();
    render(<ArcheotechImplantRow item={item()} editable onRemove={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove Auto-Quill" }));

    expect(screen.getByRole("dialog", { name: "Remove Archeotech Item" })).toBeInTheDocument();
  });

  it("shows the source chip when the item has a source", () => {
    render(<ArcheotechImplantRow item={item({ source: "IH" })} editable onRemove={vi.fn()} />);

    expect(screen.getByText("IH")).toBeInTheDocument();
  });
});
