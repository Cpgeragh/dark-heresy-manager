import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import {
  useToast,
  useToasts,
  ToastContext,
  ToastStateContext,
  type ToastContextValue,
} from "../../src/components/Toast/ToastContext";

describe("useToast", () => {
  it("throws when used outside a ToastProvider", () => {
    expect(() => renderHook(() => useToast())).toThrow(
      "useToast must be used within ToastProvider"
    );
  });

  it("returns the real context value when wrapped in a provider", () => {
    const value = {} as ToastContextValue;
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }) => createElement(ToastContext.Provider, { value }, children),
    });

    expect(result.current).toBe(value);
  });
});

describe("useToasts", () => {
  it("throws when used outside a ToastProvider", () => {
    expect(() => renderHook(() => useToasts())).toThrow(
      "useToasts must be used within ToastProvider"
    );
  });

  it("returns the real state context value when wrapped in a provider", () => {
    const value = [{ id: "toast-1", message: "Saved", type: "success" as const }];
    const { result } = renderHook(() => useToasts(), {
      wrapper: ({ children }) => createElement(ToastStateContext.Provider, { value }, children),
    });

    expect(result.current).toBe(value);
  });
});
