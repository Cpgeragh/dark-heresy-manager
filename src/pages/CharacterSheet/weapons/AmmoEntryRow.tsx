import type { WeaponAmmoEntry } from "../../../types/Character";
import {
  AMMO_REFERENCE,
  RECHARGING_POWER_PACKS_TEXT,
  formatAmmoName,
  isChargePackAmmoName,
} from "../../../data/reference/ammoReference";
import { Button } from "../../../ui/buttons/Button";
import { Chip } from "../../../ui/chips/Chip";
import { ItemMetaChips } from "../../../ui/chips/ItemMetaChips";
import { QuantityControl } from "../../../ui/QuantityControl";
import { formatWeightForDisplay } from "../../../ui/format/weightFormat";
import {
  uiInfoModalWrapper,
  uiItemName,
  uiTextBody,
  uiTextLabel,
  uiTextMuted,
} from "../../../ui/styles/editableStyles";
import { InfoModal } from "../../../components/InfoModal";
import type { AmmoTrackingMode } from "./weaponHelpers";
import { formatAmmoWeight } from "./formatAmmoWeight";

// ─── Ammo Entry Row ───────────────────────────────────────────────────────────

export function AmmoEntryRow({
  entry,
  isLoaded,
  editable,
  clipSize,
  ammoTracking,
  weightKg,
  onSetLoaded,
  onRemove,
  onUpdateClips,
  onUpdateRounds,
  onSetLooseRounds,
}: {
  entry: WeaponAmmoEntry;
  isLoaded: boolean;
  editable: boolean;
  clipSize?: string;
  ammoTracking: AmmoTrackingMode;
  weightKg?: number;
  onSetLoaded: () => void;
  onRemove: () => void;
  onUpdateClips: (qty: number) => void;
  onUpdateRounds: (qty: number) => void;
  onSetLooseRounds: (qty: number) => void;
}) {
  const ammoRef = entry.referenceId
    ? AMMO_REFERENCE.find((ammo) => ammo.id === entry.referenceId)
    : undefined;
  const displayName = formatAmmoName(ammoRef?.name ?? entry.name);
  const isChargePack = isChargePackAmmoName(displayName);
  const hasAmmoInfo = !!ammoRef?.description || isChargePack;
  const clipSizeNumber = parseFloat(clipSize ?? "0") || 0;
  const looseRoundCount = entry.rounds + entry.clips * (clipSizeNumber || 1);
  const clipSizeLabel =
    clipSize && clipSize !== "0" && clipSize !== "—" && clipSize !== "N/A"
      ? `${clipSize}/clip`
      : undefined;
  const visibleClipSizeLabel = ammoTracking === "clip" ? clipSizeLabel : undefined;

  return (
    <div className="rounded border border-slate-500 bg-slate-800/60 px-2 lg:px-3 py-1.5 lg:py-2 space-y-1.5">
      {/* Name row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={editable ? onSetLoaded : undefined}
            disabled={!editable}
            aria-label={isLoaded ? `${displayName} loaded` : `Mark ${displayName} as loaded`}
            title={isLoaded ? "Loaded" : "Mark as loaded"}
            className={`w-2 h-2 rounded-full shrink-0 transition ${
              isLoaded
                ? "bg-green-400"
                : editable
                  ? "bg-slate-600 hover:bg-green-500"
                  : "bg-slate-600"
            }`}
          />
          <span className={`${uiItemName} truncate`}>{displayName}</span>
          {isLoaded && (
            <span className="text-[10px] lg:text-xs text-green-500 uppercase tracking-wide shrink-0">
              Loaded
            </span>
          )}
        </div>
        {editable && (
          <Button size="xs" onClick={onRemove} className="shrink-0">
            Remove
          </Button>
        )}
      </div>

      {(ammoRef || visibleClipSizeLabel || weightKg !== undefined) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] lg:text-xs">
          {visibleClipSizeLabel && (
            <Chip size="sm" className={`border-slate-700 bg-slate-900/40 ${uiTextMuted}`}>
              {visibleClipSizeLabel}
            </Chip>
          )}
          {ammoRef && (
            <ItemMetaChips
              value={ammoRef.cost}
              purchaseAmount={ammoRef.purchaseAmount}
              availability={ammoRef.availability}
              size="sm"
              bare
            />
          )}
          <Chip size="sm" className={`border-slate-700 bg-slate-900/40 ${uiTextMuted}`}>
            ⚖ {formatWeightForDisplay(formatAmmoWeight(weightKg ?? 0))}
          </Chip>
        </div>
      )}

      {hasAmmoInfo && (
        <div className="flex items-center gap-1.5">
          <span className={uiTextLabel}>Rules</span>
          <span className={uiInfoModalWrapper}>
            <InfoModal
              title={displayName}
              content={
                <div className="space-y-2">
                  {ammoRef?.description && (
                    <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                      {ammoRef.description}
                    </p>
                  )}
                  {isChargePack && (
                    <div className="space-y-1">
                      <p className="text-sm lg:text-base font-semibold text-slate-100">
                        Recharging Power Packs
                      </p>
                      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
                        {RECHARGING_POWER_PACKS_TEXT}
                      </p>
                    </div>
                  )}
                </div>
              }
            />
          </span>
        </div>
      )}

      {/* Count */}
      <div className="flex items-center gap-4">
        {ammoTracking === "loose" ? (
          <div className="flex items-center gap-1.5">
            <span className={uiTextLabel}>Rounds</span>
            <QuantityControl
              quantity={looseRoundCount}
              editable={editable}
              size="xs"
              onUpdate={onSetLooseRounds}
            />
          </div>
        ) : (
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Clips</span>
              <QuantityControl
                quantity={entry.clips}
                editable={editable}
                size="xs"
                onUpdate={onUpdateClips}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={uiTextLabel}>Rounds</span>
              <QuantityControl
                quantity={entry.rounds}
                editable={editable}
                size="xs"
                onUpdate={onUpdateRounds}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
