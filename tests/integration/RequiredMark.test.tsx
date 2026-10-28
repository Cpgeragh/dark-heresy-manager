import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { RequiredMark } from "../../src/ui/forms/RequiredMark";
import { RequiredFieldsNote } from "../../src/ui/forms/CustomFormFooter";
import { FormLabel } from "../../src/ui/forms/FormLabel";
import { colourHeadingAccent, colourRequiredText } from "../../src/ui/styles/colourTokens";

describe("RequiredMark", () => {
  it("renders an asterisk in the required colour that screen readers skip", () => {
    const { container } = render(<RequiredMark />);
    const mark = container.querySelector("span");

    expect(mark).toHaveTextContent("*");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveClass(colourRequiredText);
  });

  it("uses the same red as headings", () => {
    expect(colourRequiredText).toBe(colourHeadingAccent);
  });

  it("is the star used by the shared required label and the required note", () => {
    const { container } = render(
      <>
        <FormLabel htmlFor="field" required>
          Name
        </FormLabel>
        <RequiredFieldsNote />
      </>
    );
    const marks = container.querySelectorAll("span[aria-hidden='true']");

    expect(marks).toHaveLength(2);
    marks.forEach((mark) => expect(mark).toHaveClass(colourRequiredText));
  });
});

describe("FormLabel", () => {
  it("shows the star only when the control is required", () => {
    const { container } = render(
      <>
        <FormLabel htmlFor="plain">Plain</FormLabel>
        <FormLabel htmlFor="needed" required>
          Needed
        </FormLabel>
      </>
    );

    expect(container.querySelector("label[for='plain'] span[aria-hidden='true']")).toBeNull();
    expect(container.querySelector("label[for='needed'] span[aria-hidden='true']")).not.toBeNull();
  });

  it("puts the star before the hint", () => {
    const { container } = render(
      <FormLabel htmlFor="field" required supportingText="(optional)">
        Name
      </FormLabel>
    );

    expect(container.querySelector("label")).toHaveTextContent("Name *(optional)");
  });

  it("renders a legend with the same look as a label", () => {
    const { container } = render(
      <fieldset>
        <FormLabel as="legend">Group</FormLabel>
      </fieldset>
    );

    expect(container.querySelector("legend")).toHaveClass(
      "text-slate-200",
      "font-medium",
      "uppercase"
    );
  });
});
