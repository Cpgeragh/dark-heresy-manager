import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { RequiredMark } from "../../src/ui/forms/RequiredMark";
import { RequiredFieldsNote } from "../../src/ui/forms/CustomFormFooter";
import { RequiredFormLabel } from "../../src/ui/forms/RequiredFormLabel";
import { colourErrorText, colourRequiredText } from "../../src/ui/styles/colourTokens";

describe("RequiredMark", () => {
  it("renders an asterisk in the required colour that screen readers skip", () => {
    const { container } = render(<RequiredMark />);
    const mark = container.querySelector("span");

    expect(mark).toHaveTextContent("*");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark).toHaveClass(colourRequiredText);
  });

  it("uses the same red as error text", () => {
    expect(colourRequiredText).toBe(colourErrorText);
  });

  it("is the star used by the shared required label and the required note", () => {
    const { container } = render(
      <>
        <RequiredFormLabel htmlFor="field">Name</RequiredFormLabel>
        <RequiredFieldsNote />
      </>
    );
    const marks = container.querySelectorAll("span[aria-hidden='true']");

    expect(marks).toHaveLength(2);
    marks.forEach((mark) => expect(mark).toHaveClass(colourRequiredText));
  });
});
