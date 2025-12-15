// src/components/ToastTester.tsx

import { useToast } from "./Toast";

export function ToastTester() {
  const toast = useToast();

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-100 mb-3">
        Toast Tester
      </h3>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => toast.success("Character saved successfully!")}
          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-500 transition"
        >
          Success Toast
        </button>

        <button
          onClick={() => toast.error("Failed to save character.")}
          className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-500 transition"
        >
          Error Toast
        </button>

        <button
          onClick={() => toast.warning("Please select a campaign first.")}
          className="px-3 py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-500 transition"
        >
          Warning Toast
        </button>

        <button
          onClick={() => toast.info("This is an informational message.")}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition"
        >
          Info Toast
        </button>

        <button
          onClick={() =>
            toast.success(
              "Recovery Code: DH-ABC1-DEF2\n\nClick the copy button to save this code!",
              10000
            )
          }
          className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-500 transition"
        >
          Long Toast (10s)
        </button>

        <button
          onClick={() => {
            toast.success("Toast 1");
            setTimeout(() => toast.error("Toast 2"), 200);
            setTimeout(() => toast.warning("Toast 3"), 400);
            setTimeout(() => toast.info("Toast 4"), 600);
          }}
          className="px-3 py-1.5 bg-slate-600 text-white text-xs rounded hover:bg-slate-500 transition"
        >
          Multiple Toasts
        </button>
      </div>
    </div>
  );
}