import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import {
  useToast,
  ToastContext,
  type ToastContextValue,
} from "../../src/components/Toast/ToastContext";

describe("useToast", () => {
  it("throws when used outside a ToastProvider", () => {
    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used within ToastProvider"
    );
  });

  it("returns the real context value when wrapped in a provider", () => {
    const value = { toasts: [] } as unknown as ToastContextValue;
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => createElement(ToastContext.Provider, { value }, children),
    });

    expect(result.current).toBe(value);
  });
});
