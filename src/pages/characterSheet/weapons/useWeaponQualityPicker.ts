import { useMemo, useState } from "react";
import { WEAPON_QUALITY_OPTIONS } from "./weaponSharedUtils";

const PARAMETERIZED_WEAPON_QUALITIES = new Set([
  "Blast",
  "Felling",
  "Haywire",
  "Proven",
]);

function baseQualityName(quality: string): string {
  return quality.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export function useWeaponQualityPicker(
  selected: string[],
  onChange: (next: string[]) => void
) {
  const [showPicker, setShowPicker] = useState(false);
  const [pendingQuality, setPendingQuality] = useState<string | null>(null);
  const [parameterValue, setParameterValue] = useState("");
  const available = useMemo(() => {
    const selectedBaseNames = new Set(selected.map(baseQualityName));
    return WEAPON_QUALITY_OPTIONS.filter(
      (quality) => !selectedBaseNames.has(quality)
    );
  }, [selected]);
  const needsParameter = pendingQuality
    ? PARAMETERIZED_WEAPON_QUALITIES.has(pendingQuality)
    : false;
  const canConfirm =
    Boolean(pendingQuality) && (!needsParameter || parameterValue !== "");

  return {
    showPicker,
    available,
    pendingQuality,
    needsParameter,
    parameterValue,
    canConfirm,
    setParameterValue,
    openPicker: () => setShowPicker(true),
    closePicker: () => setShowPicker(false),
    pickQuality: (quality: string) => {
      setPendingQuality(quality);
      setParameterValue("");
      setShowPicker(false);
    },
    confirmPending: () => {
      if (!pendingQuality || !canConfirm) return;
      const nextQuality = needsParameter
        ? `${pendingQuality} (${parameterValue})`
        : pendingQuality;
      onChange([...selected, nextQuality]);
      setPendingQuality(null);
      setParameterValue("");
    },
  };
}
