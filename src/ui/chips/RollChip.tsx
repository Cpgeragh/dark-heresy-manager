import type { ReactNode } from "react";
import { Chip } from "./Chip";

export function RollChip({ children }: { children: ReactNode }) {
  return <Chip colour="amber">{children}</Chip>;
}
