import { useState } from "react";
import { exportAccountDiagnostics } from "../accountDiagnostics";
import { Button } from "../ui/buttons/Button";
import { uiLayerForeground } from "../ui/styles/layerStyles";

export function AccountCheck() {
  const [message, setMessage] = useState("");
  async function copy() {
    const report = exportAccountDiagnostics();
    try {
      await navigator.clipboard.writeText(report);
      setMessage("Copied");
    } catch {
      const url = URL.createObjectURL(new Blob([report], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "account-check.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Saved");
    }
  }
  return (
    <div className={`fixed bottom-2 left-2 ${uiLayerForeground}`}>
      <Button size="xs" variant="neutral" onClick={copy}>
        Copy account check
      </Button>
      <span role="status" className="ml-2 text-xs">
        {message}
      </span>
    </div>
  );
}
