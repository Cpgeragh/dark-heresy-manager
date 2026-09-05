import { useCallback, useRef, useState, type ReactNode } from "react";
import { DEFAULT_TOAST_DURATION } from "../../constants/ui";
import { ToastContext, type Toast, type ToastType } from "./ToastContext";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      duration = DEFAULT_TOAST_DURATION,
      copyText?: string
    ) => {
      const id = crypto.randomUUID();
      const toast: Toast = {
        id,
        message,
        type,
        duration,
        ...(copyText ? { copyText } : {}),
      };

      setToasts((previous) => [...previous, toast]);

      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number, copyText?: string) =>
      addToast(message, "success", duration, copyText),
    [addToast]
  );
  const error = useCallback(
    (message: string, duration?: number) => addToast(message, "error", duration),
    [addToast]
  );
  const info = useCallback(
    (message: string, duration?: number) => addToast(message, "info", duration),
    [addToast]
  );
  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, "warning", duration),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
}
