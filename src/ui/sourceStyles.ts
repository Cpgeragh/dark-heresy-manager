// src/ui/sourceStyles.ts
// Colour classes for source-book badges, rarity chips, and characteristic chips across all tabs.

/**
 * Returns Tailwind text + border classes for a given SkillSource code.
 * Used inline as:
 *   <span className={`… ${sourceColour(item.source)}`}>{item.source}</span>
 */
export function sourceColour(source: string): string {
  switch (source) {
    case "CR":    return "text-slate-300 border-slate-500";
    case "IH":    return "text-cyan-400 border-cyan-700/50";
    case "RH":    return "text-teal-400 border-teal-700/50";
    case "BoM":   return "text-red-400 border-red-700/50";
    case "BoJ":   return "text-amber-400 border-amber-700/50";
    case "CA":    return "text-green-400 border-green-700/50";
    case "DH":    return "text-violet-400 border-violet-700/50";
    case "LW":    return "text-orange-400 border-orange-700/50";
    case "Asc":   return "text-yellow-400 border-yellow-700/50";
    case "DotDG": return "text-pink-400 border-pink-700/50";
    case "BSep":  return "text-blue-400 border-blue-700/50";
    case "CC":    return "text-rose-400 border-rose-700/50";
    case "H3":    return "text-indigo-400 border-indigo-700/50";
    case "LD":    return "text-sky-400 border-sky-700/50";
    case "SDS":   return "text-emerald-400 border-emerald-700/50";
    default:      return "text-slate-400 border-slate-600";
  }
}

/**
 * Returns a Tailwind text colour class for a given rarity string.
 * Used inline as:
 *   <span className={`… ${rarityColour(item.rarity)}`}>{item.rarity}</span>
 */
export function rarityColour(rarity: string | undefined): string {
  switch (rarity) {
    case "Plentiful":
    case "Abundant":               return "text-slate-400";
    case "Common":                 return "text-green-400";
    case "Average":                return "text-slate-300";
    case "Scarce":                 return "text-yellow-400";
    case "Rare":                   return "text-orange-400";
    case "Very Rare":              return "text-red-400";
    case "Extremely Rare":         return "text-purple-400";
    case "Near Unique":
    case "Unique":                 return "text-pink-400";
    case "Issued Only":
    case "Adeptus Mechanicus Only": return "text-cyan-400";
    default:                       return "text-slate-400";
  }
}

/**
 * Returns Tailwind text + border classes for a characteristic key.
 * Groups: combat (WS/BS) → amber, physical (S/T/Ag) → green,
 *         mental (Int/Per/WP) → blue, social (Fel) → pink.
 */
export function charColour(characteristic: string): string {
  switch (characteristic.toLowerCase()) {
    case "ws":
    case "bs":  return "text-amber-400 border-amber-700/50";
    case "s":
    case "t":
    case "ag":  return "text-green-400 border-green-700/50";
    case "int":
    case "per":
    case "wp":  return "text-blue-400 border-blue-700/50";
    case "fel": return "text-pink-400 border-pink-700/50";
    default:    return "text-slate-400 border-slate-600";
  }
}
