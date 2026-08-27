// tests/integration/ArcheotechImplantRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ArcheotechImplantRow } from "../../src/pages/characterSheet/CyberneticsTab/ArcheotechImplantRow";
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

  it("calls onRemove when editable, and hides Remove when not", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { rerender } = render(
      <ArcheotechImplantRow item={item()} editable={true} onRemove={onRemove} />
    );

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalled();

    rerender(<ArcheotechImplantRow item={item()} editable={false} onRemove={onRemove} />);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
