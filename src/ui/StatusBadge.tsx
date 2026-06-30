import { Chip } from "./Chip";
import { colourEmerald, colourAmberFaint, colourInactive } from "./colourTokens";
import type { CustomItemStatus } from "../types/CustomItems";

const STATUS_COLOUR: Record<CustomItemStatus, string> = {
  published: colourEmerald,
  draft:     colourAmberFaint,
  archived:  colourInactive,
};

export function StatusBadge({ status }: { status: CustomItemStatus }) {
  return (
    <Chip size="sm" className={`shrink-0 uppercase tracking-wide ${STATUS_COLOUR[status]}`}>
      {status}
    </Chip>
  );
}
