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
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText("");
    } catch {
      // The parent reports the error. Keep the draft so the user can retry.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-2 lg:gap-3 mt-2">
      <input
        className={`flex-1 rounded border px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base disabled:opacity-50 ${editableInputColour(true)}`}
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
        disabled={disabled || sending}
        autoComplete="off"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        loading={sending}
        loadingLabel="Sending"
      >
        Send
      </Button>
    </div>
  );
}
