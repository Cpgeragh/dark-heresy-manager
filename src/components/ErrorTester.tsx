// src/components/ErrorTester.tsx

import { useState } from "react";

export function ErrorTester() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error("Test error from ErrorTester component!");
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded p-3">
      <button
        onClick={() => setShouldError(true)}
        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-500"
      >
        Trigger Error
      </button>
    </div>
  );
}