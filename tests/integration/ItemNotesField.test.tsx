import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { DescriptionAndRulesFields } from "../../src/ui/forms/DescriptionAndRulesFields";

function renderFields(onItemNotesChange?: (value: string) => void) {
  render(
    <DescriptionAndRulesFields
      idPrefix="custom-test"
      description=""
      onDescriptionChange={vi.fn()}
      rules=""
      onRulesChange={vi.fn()}
      itemNotes=""
      onItemNotesChange={onItemNotesChange}
    />
  );
}

describe("item notes field", () => {
  it("shows a Notes box beside Description and Rules when a handler is supplied", () => {
    renderFields(vi.fn());

    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Rules")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("shows no Notes box when no handler is supplied", () => {
    renderFields();

    expect(screen.queryByLabelText("Notes")).not.toBeInTheDocument();
  });

  it("passes what is typed to the handler", async () => {
    const user = userEvent.setup();
    const onItemNotesChange = vi.fn();
    renderFields(onItemNotesChange);

    await user.type(screen.getByLabelText("Notes"), "G");

    expect(onItemNotesChange).toHaveBeenCalledWith("G");
  });
});
