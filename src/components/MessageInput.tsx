// src/components/MessageInput.tsx

import { useState } from "react";
import { Button } from "../ui/buttons/Button";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { editableInputColour } from "../ui/styles/editableStyles";

export function MessageInput({
  onSend,
  disabled,
  placeholder = "Message…",
}: {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // The box empties at once. The parent shows the message and reports a failure, and then the
    // text goes back, in front of anything typed in the meantime, so nothing is lost.
    setText("");
    try {
      await onSend(trimmed);
    } catch {
      setText((current) =>
        (current === "" ? trimmed : `${trimmed} ${current}`).slice(
          0,
          PRODUCT_LIMITS.messageCharacters
        )
      );
    }
  };

  return (
    <div className="flex gap-2 lg:gap-3 mt-2">
      <input
        className={`flex-1 rounded border px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base ${editableInputColour(
          !disabled
        )}`}
        placeholder={placeholder}
        value={text}
        maxLength={PRODUCT_LIMITS.messageCharacters}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        disabled={disabled}
        autoComplete="off"
      />
      <Button onClick={handleSend} disabled={disabled || !text.trim()}>
        Send
      </Button>
    </div>
  );
}
