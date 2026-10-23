// tests/integration/PickerRowParts.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { PickerRow } from "../../src/ui/pickers/PickerModal";
import {
  PickerRowChips,
  PickerRowLine,
  PickerRowName,
  PickerRowRulesLine,
  PickerRowText,
} from "../../src/ui/pickers/PickerRowParts";

describe("PickerRowName", () => {
  it("shows the name with the hover style, then the badges and the info icon", () => {
    render(
      <PickerRowName name="Frag Grenade" badges={<span>Draft</span>} infoTitle="Frag Grenade" />
    );

    const name = screen.getByText("Frag Grenade");
    expect(name).toHaveClass("font-medium", "group-hover:text-white");
    expect(name.parentElement).toHaveClass("flex", "flex-wrap", "min-w-0", "gap-1.5");
    const children = Array.from(name.parentElement!.children);
    expect(children).toHaveLength(3);
    expect(children.slice(0, 2).map((child) => child.textContent)).toEqual([
      "Frag Grenade",
      "Draft",
    ]);
  });

  it("does not render an info wrapper when there is no info icon", () => {
    render(<PickerRowName name="Frag Grenade" />);

    expect(screen.getByText("Frag Grenade").parentElement?.children).toHaveLength(1);
  });

  it("always shows the info icon for an item, with the empty message when nothing is recorded", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PickerRow onClick={onSelect}>
        <PickerRowName name="Frag Grenade" infoTitle="Frag Grenade" />
      </PickerRow>
    );

    await user.click(screen.getByRole("button", { name: "Show information about Frag Grenade" }));

    expect(screen.getByText("No description recorded.")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the recorded information when there is some", async () => {
    const user = userEvent.setup();
    render(
      <PickerRow>
        <PickerRowName name="Frag Grenade" infoTitle="Frag Grenade" information="Blast radius." />
      </PickerRow>
    );

    await user.click(screen.getByRole("button", { name: "Show information about Frag Grenade" }));

    expect(screen.getByText("Blast radius.")).toBeInTheDocument();
  });

  it("shows the status badge of a custom item between the name and the badges", () => {
    render(<PickerRowName name="Frag Grenade" status="draft" badges={<span>Extra</span>} />);

    const name = screen.getByText("Frag Grenade");
    const order = Array.from(name.parentElement!.children).map((child) => child.textContent);
    expect(order).toEqual(["Frag Grenade", "draft", "Extra"]);
  });
});

describe("PickerRowChips", () => {
  it("wraps its chips with the standard gap above and between them", () => {
    render(<PickerRowChips data-testid="chips">chips</PickerRowChips>);

    expect(screen.getByTestId("chips")).toHaveClass(
      "mt-1",
      "flex",
      "flex-wrap",
      "items-center",
      "gap-1.5"
    );
  });
});

describe("PickerRowLine", () => {
  it("shows a labelled line like an owned entry, with a 4px gap above", () => {
    render(<PickerRowLine label="Duration" value="1d10 rounds" />);

    const label = screen.getByText("Duration");
    expect(label.parentElement?.parentElement).toHaveClass("mt-1");
    const order = Array.from(label.parentElement!.children).map((child) => child.textContent);
    expect(order).toEqual(["Duration", "1d10 rounds"]);
  });

  it("opens the info icon without selecting the row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onInfo = vi.fn();
    render(
      <PickerRow onClick={onSelect}>
        <PickerRowLine
          label="Rules"
          info={
            <span
              onClick={(event) => {
                event.stopPropagation();
                onInfo();
              }}
            >
              About
            </span>
          }
        />
      </PickerRow>
    );

    await user.click(screen.getByText("About"));

    expect(onInfo).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("PickerRowRulesLine", () => {
  it("shows nothing when the entry has no rules", () => {
    const { container } = render(<PickerRowRulesLine name="Frag Grenade" rules="  " />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a Rules label with an information icon that opens the rules without selecting the row", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PickerRow onClick={onSelect}>
        <PickerRowRulesLine name="Frag Grenade" rules="Fills a 3m area." />
      </PickerRow>
    );

    expect(screen.getByText("Rules")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show information about Frag Grenade Rules" })
    );

    expect(screen.getByText("Fills a 3m area.")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("PickerRowText", () => {
  it("uses the small body text style with a 4px gap above", () => {
    render(<PickerRowText>Blast (4)</PickerRowText>);

    expect(screen.getByText("Blast (4)")).toHaveClass(
      "mt-1",
      "text-xs",
      "lg:text-sm",
      "text-slate-300"
    );
  });
});
