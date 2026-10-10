import { Chip } from "./Chip";
import type { ChipColour } from "../styles/colourTokens";
import type { CustomItemStatus } from "../../types/CustomItems";

const STATUS_COLOUR: Record<CustomItemStatus, ChipColour> = {
  published: "emerald",
  draft: "amber",
  archived: "slate",
};

export function StatusBadge({ status }: { status: CustomItemStatus }) {
  return (
    <Chip size="sm" colour={STATUS_COLOUR[status]} className="shrink-0 uppercase tracking-wide">
      {status}
    </Chip>
  );
}
