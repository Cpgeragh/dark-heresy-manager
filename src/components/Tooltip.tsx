// src/components/Tooltip.tsx

import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  maxWidth?: number;
}

export function Tooltip({ children, content, maxWidth = 240 }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2, 9)}`);

  function toggle() {
    setOpen((s) => !s);
  }

  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const rect = trigger.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();

    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + ttRect.width > window.innerWidth - 8) {
      left = window.innerWidth - ttRect.width - 8;
    }
    if (left < 8) left = 8;

    if (top + ttRect.height > window.innerHeight - 8) {
      top = rect.top - ttRect.height - 8;
    }

    setPosition({ left, top });
  }, [open]);

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
        aria-expanded={open}
        aria-controls={tooltipId.current}
        aria-label="Show additional information"
        className="text-slate-300 px-2 py-0.5 rounded bg-slate-700 border border-slate-600 hover:bg-slate-600 text-xs"
      >
        {children}
      </button>

      {open && (
        <div
          id={tooltipId.current}
          ref={tooltipRef}
          role="tooltip"
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