import type { ReactNode } from "react";
import { Chip } from "./Chip";
import { colourAmberFaint } from "./colourTokens";

export function RollChip({ children }: { children: ReactNode }) {
  return <Chip className={colourAmberFaint}>{children}</Chip>;
}
