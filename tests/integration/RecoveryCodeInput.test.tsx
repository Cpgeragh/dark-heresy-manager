import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RecoveryCodeInput } from "../../src/ui/forms/RecoveryCodeInput";

function ControlledRecoveryCodeInput() {
  const [value, setValue] = useState("");
  return <RecoveryCodeInput value={value} onValueChange={setValue} />;
}

describe("RecoveryCodeInput", () => {
  it("shows the fixed prefix as soon as the empty field receives focus", async () => {
    const user = userEvent.setup();
    render(<ControlledRecoveryCodeInput />);

    const input = screen.getByLabelText("Recovery code");
    expect(input).toHaveValue("");

    await user.click(input);

    expect(input).toHaveValue("DH-");
  });

  it("does not duplicate the prefix when Backspace is pressed at its boundary", async () => {
    const user = userEvent.setup();
    render(<ControlledRecoveryCodeInput />);

    const input = screen.getByLabelText("Recovery code");
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(input).toHaveValue("DH-");
  });

  it("pastes a complete formatted code without duplicating its prefix", async () => {
    const user = userEvent.setup();
    render(<ControlledRecoveryCodeInput />);

    const input = screen.getByLabelText("Recovery code");
    await user.click(input);
    await user.paste("DH-ABCD-1234");

    expect(input).toHaveValue("DH-ABCD-1234");
  });

  it("pastes eight variable characters and supplies the fixed characters", async () => {
    const user = userEvent.setup();
    render(<ControlledRecoveryCodeInput />);

    const input = screen.getByLabelText("Recovery code");
    await user.click(input);
    await user.paste("DH3A9K2B");

    expect(input).toHaveValue("DH-DH3A-9K2B");
  });

  it("accepts a complete code typed with the fixed prefix", async () => {
    const user = userEvent.setup();
    render(<ControlledRecoveryCodeInput />);

    const input = screen.getByLabelText("Recovery code");
    await user.type(input, "DH-ABCD-1234");

    expect(input).toHaveValue("DH-ABCD-1234");
  });
});
