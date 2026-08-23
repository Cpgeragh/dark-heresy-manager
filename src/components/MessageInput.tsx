// src/components/MessageInput.tsx

import { useState } from "react";
import { Button } from "../ui/Button";
import { PRODUCT_LIMITS } from "../constants/productLimits";

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
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-2 lg:gap-3 mt-2">
      <input
        className="flex-1 px-3 lg:px-4 py-2 lg:py-2.5 bg-slate-800 border border-slate-600 rounded text-sm lg:text-base text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
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
      />
      <Button onClick={handleSend} disabled={disabled || sending || !text.trim()}>
        {sending ? "…" : "Send"}
      </Button>
    </div>
  );
}
