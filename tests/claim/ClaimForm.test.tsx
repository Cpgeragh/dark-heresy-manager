import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { ClaimForm } from "../../src/pages/ClaimCharacter/ClaimForm";

function Wrapper(props: {
  initialCode?: string;
  onSubmit?: () => void;
}) {
  const [code, setCode] = useState(props.initialCode ?? "");

  return (
    <ClaimForm
      code={code}
      onCodeChange={setCode}
      onSubmit={props.onSubmit ?? vi.fn()}
      loading={false}
    />
  );
}

describe("ClaimForm", () => {
  it("disables submit for invalid recovery code", async () => {
    const user = userEvent.setup();

    render(<Wrapper />);

    const input = screen.getByPlaceholderText("DH-XXXX-XXXX");
    const button = screen.getByRole("button");

    await user.type(input, "INVALID");

    expect(button).toBeDisabled();
  });

  it("enables submit for valid recovery code", async () => {
    const user = userEvent.setup();

    render(<Wrapper />);

    const input = screen.getByPlaceholderText("DH-XXXX-XXXX");
    const button = screen.getByRole("button");

    await user.type(input, "dh-abcd-1234");

    expect(button).not.toBeDisabled();
  });

  it("normalizes lowercase input but still validates", async () => {
    const user = userEvent.setup();

    render(<Wrapper />);

    const input = screen.getByPlaceholderText("DH-XXXX-XXXX");
    const button = screen.getByRole("button");

    await user.type(input, "dh-q7f3-b9d2");

    expect(button).not.toBeDisabled();
  });
});