import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DisorderInfoContent } from "../../src/mechanics/insanity/InsanityReferenceModals";
import {
  MalignancyInfoContent,
  MutationInfoContent,
} from "../../src/mechanics/corruption/CorruptionReferenceModals";
import { uiRuleName } from "../../src/ui/styles/editableStyles";
import { colourMetadataLabelText } from "../../src/ui/styles/colourTokens";

describe("uiRuleName", () => {
  it("is built from the metadata sky blue", () => {
    expect(uiRuleName).toContain(colourMetadataLabelText);
  });

  it("styles the roll name in the Malignancy and Mutation info content", () => {
    render(
      <>
        <MalignancyInfoContent malignancy={{ roll: "Malignancy roll", effect: "Effect" }} />
        <MutationInfoContent mutation={{ roll: "Mutation roll", effect: "Effect" }} />
      </>
    );

    expect(screen.getByText("Malignancy roll")).toHaveClass(uiRuleName);
    expect(screen.getByText("Mutation roll")).toHaveClass(uiRuleName);
  });

  it("styles the disorder type name in the Insanity info content", () => {
    render(
      <DisorderInfoContent
        type="Phobia"
        name="Fear of the dark"
        description="Description"
        typeDescription="Type description"
      />
    );

    expect(screen.getByText("Phobia")).toHaveClass(uiRuleName);
  });
});
