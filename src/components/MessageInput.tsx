// src/components/MessageInput.tsx

import { useState } from "react";

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
    <div className="flex gap-2 mt-2">
      <input
        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-50"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        disabled={disabled || sending}
      />
      <button
        onClick={handleSend}
        disabled={disabled || sending || !text.trim()}
        className="px-3 py-2 bg-amber-500 text-slate-900 font-semibold rounded text-sm hover:bg-amber-400 disabled:opacity-50 transition"
      >
        {sending ? "…" : "Send"}
      </button>
    </div>
  );
}
