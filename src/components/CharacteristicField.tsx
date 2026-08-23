// src/components/CharacteristicField.tsx

import { useState, useCallback, useRef } from "react";
import type { CharField } from "../types/Character";
import {
  MAX_CHARACTERISTIC_ADVANCES,
  CHARACTERISTIC_ADVANCE_INCREMENT,
} from "../constants/gameRules";
import { validateCharacteristicBase, validateCharacteristicTotal } from "../utils/validation";
import { Button } from "../ui/Button";
import { PickerBody, PickerModal } from "../ui/PickerModal";
import { uiTextBody } from "../ui/editableStyles";
import { colourAmberPlain } from "../ui/colourTokens";

interface Props {
  label: string;
  value: CharField;
  editable: boolean;
  onChange: (newValue: CharField) => void;
  hideLabel?: boolean;
  /** XP cost of each of the 4 advance tiers, in order. Undefined entries show no cost. */
  tierCosts?: (number | null | undefined)[];
}

export default function CharacteristicField({
  label,
  value,
  editable,
  onChange,
  hideLabel = false,
  tierCosts,
}: Props) {
  const { base, advances } = value;
  const [error, setError] = useState<string | undefined>();
  const [draft, setDraft] = useState(String(base));
  const [pendingAdvances, setPendingAdvances] = useState<number | null>(null);
  const isFocused = useRef(false);

  // ── Base input handlers ────────────────────────────────────────────────────

  const commitBase = useCallback(
    (raw: string) => {
      const num = parseInt(raw, 10);

      if (raw.trim() === "" || isNaN(num)) {
        setDraft(String(base)); // revert to last committed value
        setError(undefined);
        return;
      }

      const baseCheck = validateCharacteristicBase(num);
      if (!baseCheck.isValid) {
        setError(baseCheck.error);
        setDraft(String(base));
        return;
      }

      const totalCheck = validateCharacteristicTotal(num, advances);
      if (!totalCheck.isValid) {
        setError(totalCheck.error);
        setDraft(String(base));
        return;
      }

      setError(undefined);
      onChange({ base: num, advances });
    },
    [advances, base, onChange]
  );

  const handleBaseFocus = useCallback(() => {
    isFocused.current = true;
    setDraft(String(base)); // sync to current committed value on focus
  }, [base]);

  const handleBaseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip anything that isn't a digit — no minus, no decimal, no letters
    setDraft(e.target.value.replace(/\D/g, ""));
  }, []);

  const handleBaseBlur = useCallback(() => {
    isFocused.current = false;
    commitBase(draft);
  }, [commitBase, draft]);

  const handleBaseKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitBase(draft);
      if (e.key === "Escape") {
        setDraft(String(base));
        setError(undefined);
        (e.target as HTMLInputElement).blur();
      }
    },
    [base, commitBase, draft]
  );

  const toggleAdvance = useCallback(
    (index: number) => {
      if (!editable) return;
      if (tierCosts?.[index] === null) return;

      let newAdvances = index < advances ? index : index + 1;

      if (newAdvances < 0) newAdvances = 0;
      if (newAdvances > MAX_CHARACTERISTIC_ADVANCES) newAdvances = MAX_CHARACTERISTIC_ADVANCES;

      // Validate total won't exceed max
      const totalCheck = validateCharacteristicTotal(base, newAdvances);
      if (!totalCheck.isValid) {
        setError(totalCheck.error);
        return;
      }

      setError(undefined);
      setPendingAdvances(newAdvances);
    },
    [editable, base, advances, tierCosts]
  );

  const total = base + advances * CHARACTERISTIC_ADVANCE_INCREMENT;
  const isUpgrade = pendingAdvances !== null && pendingAdvances > advances;
  const changedTierCosts = pendingAdvances === null
    ? []
    : isUpgrade
      ? tierCosts?.slice(advances, pendingAdvances) ?? []
      : tierCosts?.slice(pendingAdvances, advances) ?? [];
  const hasCompleteCost =
    changedTierCosts.length === Math.abs((pendingAdvances ?? advances) - advances) &&
    changedTierCosts.every((cost): cost is number => typeof cost === "number");
  const changedXp = hasCompleteCost
    ? changedTierCosts.reduce((sum, cost) => sum + cost, 0)
    : undefined;

  const confirmAdvanceChange = useCallback(() => {
    if (pendingAdvances === null) return;
    onChange({ base, advances: pendingAdvances });
    setPendingAdvances(null);
  }, [base, onChange, pendingAdvances]);

  return (
    <>
      <div className="mb-4 p-3 lg:p-4 border border-slate-700 rounded-md bg-slate-900/60">
        {!hideLabel && <div className="font-semibold lg:text-lg mb-1">{label}</div>}

        {/* Base value */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm lg:text-base text-slate-400">Base:</span>
          <input
            type="text"
            inputMode="numeric"
            value={draft}
            disabled={!editable}
            onFocus={handleBaseFocus}
            onChange={handleBaseChange}
            onBlur={handleBaseBlur}
            onKeyDown={handleBaseKeyDown}
            aria-label={`${label} base value`}
            aria-invalid={!!error}
            aria-describedby={error ? `${label}-error` : undefined}
            className={`w-20 lg:w-24 px-2 lg:px-3 py-1 lg:py-1.5 rounded text-sm lg:text-base text-slate-100 ${
              error && editable
                ? "bg-slate-800 border border-red-700 focus:border-red-600"
                : "bg-slate-800 border border-slate-600 focus:border-red-500"
            } focus:outline-none`}
          />
        </div>

        {/* Advances */}
        <div className="flex min-w-0 items-start gap-2 mb-2">
          <span className="shrink-0 pt-1 text-sm lg:text-base text-slate-400">Advances:</span>
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1">
            {Array.from({ length: MAX_CHARACTERISTIC_ADVANCES }).map((_, idx) => {
              const filled = idx < advances;
              const cost = tierCosts?.[idx];
              const locked = cost === null;
              const clickable = editable && !locked;
              return (
                <div key={idx} className="flex min-w-0 flex-col items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleAdvance(idx)}
                    disabled={!clickable}
                    aria-label={`${label} advance ${idx + 1} of ${MAX_CHARACTERISTIC_ADVANCES}${
                      typeof cost === "number" ? `, ${cost} XP` : locked ? ", not available for this career" : ""
                    }`}
                    aria-pressed={filled}
                    tabIndex={clickable ? 0 : -1}
                    className={`aspect-square w-full max-w-7 sm:max-w-6 lg:max-w-8 border rounded flex items-center justify-center
                      ${filled ? "bg-red-700 border-red-500" : "bg-slate-900 border-slate-600"}
                      ${
                        clickable
                          ? "cursor-pointer hover:border-red-600 hover:bg-red-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                          : editable && locked
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-default"
                      }`}
                  />
                  {typeof cost === "number" && (
                    <span className={`text-[10px] leading-none font-code ${colourAmberPlain}`}>
                      {cost}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Total */}
        <div className="text-sm lg:text-base">
          <span className="text-slate-400">Total:</span>
          <span className="ml-2 font-bold">{total}</span>
        </div>

        {/* Error message */}
        {error && editable && (
          <div id={`${label}-error`} className="text-xs lg:text-sm text-red-600 mt-2" role="alert">
            {error}
          </div>
        )}
      </div>

      {pendingAdvances !== null && (
        <PickerModal
          title={isUpgrade ? "Upgrade Characteristic" : "Downgrade Characteristic"}
          query=""
          onQueryChange={() => undefined}
          onClose={() => setPendingAdvances(null)}
          isEmpty={false}
          hideSearch
          maxWidth="max-w-sm"
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                onClick={confirmAdvanceChange}
              >
                {isUpgrade ? "Upgrade" : "Downgrade"}
              </Button>
              <Button variant="ghost" onClick={() => setPendingAdvances(null)}>
                Cancel
              </Button>
            </div>
          }
        >
          <PickerBody>
            <p className={`text-sm lg:text-base ${uiTextBody} text-center`}>
              {isUpgrade ? "Upgrade" : "Downgrade"} {label} from {advances} to {pendingAdvances}{" "}
              {pendingAdvances === 1 ? "advance" : "advances"}
              {changedXp !== undefined
                ? isUpgrade
                  ? ` for ${changedXp} XP`
                  : ` and refund ${changedXp} XP`
                : ""}
              ?
            </p>
          </PickerBody>
        </PickerModal>
      )}
    </>
  );
}
