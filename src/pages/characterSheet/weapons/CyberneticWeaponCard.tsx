// src/pages/characterSheet/weapons/CyberneticWeaponCard.tsx
// Read-only card for weapons granted by cybernetic implants.

import { useState } from "react";
import type { CyberneticWeapon } from "../../../data/reference/cyberneticsReference";
import { StatChip, DamageTypeChip, SpecialRulesModal } from "./weaponShared";

export function CyberneticWeaponCard({
  cyberneticName,
  weapon,
}: {
  cyberneticName: string;
  weapon: CyberneticWeapon;
}) {
  const [showRules, setShowRules] = useState(false);
  const hasRules = !!(weapon.specialRules?.trim());

  return (
    <div className="border border-cyan-700/40 bg-cyan-900/10 rounded-lg p-3 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-200">{weapon.name}</p>
          <span className="text-[10px] uppercase tracking-wide text-cyan-400 border border-cyan-700/50 rounded px-1.5 py-0.5 font-medium">
            Cybernetic
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {cyberneticName}
          {weapon.class ? ` · ${weapon.class}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {weapon.type === "ranged" && weapon.range && (
          <StatChip label="Range" value={weapon.range} />
        )}
        {weapon.type === "ranged" && weapon.rof && (
          <StatChip label="RoF" value={weapon.rof} />
        )}
        {weapon.damage && (
          <StatChip
            label="Damage"
            value={weapon.damage.replace(/\s*[IREX]$/i, "").trim()}
          />
        )}
        {weapon.damage && <DamageTypeChip damage={weapon.damage} />}
        {weapon.pen && <StatChip label="Pen" value={weapon.pen} />}
        {weapon.type === "ranged" && weapon.clip && (
          <StatChip label="Clip" value={weapon.clip} />
        )}
        {weapon.type === "ranged" && weapon.rld && (
          <StatChip label="Reload" value={weapon.rld} />
        )}
      </div>

      {hasRules && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 italic flex-1">
            {weapon.specialRules}
          </span>
          <button
            onClick={() => setShowRules(true)}
            title="Explain special rules"
            className="text-slate-500 hover:text-amber-400 text-sm transition"
          >
            ⓘ
          </button>
        </div>
      )}

      {showRules && weapon.specialRules && (
        <SpecialRulesModal
          rules={weapon.specialRules}
          onClose={() => setShowRules(false)}
        />
      )}
    </div>
  );
}
