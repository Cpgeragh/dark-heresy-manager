import { ARMOUR_LOCATION_LABELS } from "../constants/locations";
import type { ArmourLocationKey } from "../types/Character";

/** Human-readable list of armour locations. */
export function locationLabel(locations: ArmourLocationKey[]): string {
  if (locations.length === 6) return "All";
  return locations.map((location) => ARMOUR_LOCATION_LABELS[location]).join(", ");
}
