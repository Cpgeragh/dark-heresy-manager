// src/components/Tooltip.tsx

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;     // The element the user taps (e.g., ⓘ)
  content: ReactNode;      // Tooltip content
  maxWidth?: number;       // Optional override
}

export function Tooltip({ children, content, maxWidth = 240 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Toggle tooltip
  function toggle() {
    setOpen((s) => !s);
  }

  // Position tooltip when opened
  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const rect = trigger.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 8;

    // Keep onscreen horizontally
    if (left + ttRect.width > window.innerWidth - 8) {
      left = window.innerWidth - ttRect.width - 8;
    }
    if (left < 8) left = 8;

    // Keep onscreen vertically
    if (top + ttRect.height > window.innerHeight - 8) {
      top = rect.top - ttRect.height - 8;
    }

    setPosition({ left, top });
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (!tooltipRef.current || !triggerRef.current) return;
      const t = e.target as Node;

      if (
        !tooltipRef.current.contains(t) &&
        !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        className="text-slate-300 px-2 py-0.5 rounded bg-slate-700 border border-slate-600 hover:bg-slate-600 text-xs"
      >
        {children}
      </button>

      {open && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            left: position.left,
            top: position.top,
            maxWidth: maxWidth,
          }}
          className="z-50 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded shadow-lg"
        >
          {content}
        </div>
      )}
    </>
  );
}