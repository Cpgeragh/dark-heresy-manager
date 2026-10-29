import type { ReactNode } from "react";
import { InfoModal } from "../components/InfoModal";
import { RemoveEntryButton } from "./RemoveEntryButton";
import {
  uiCell,
  uiInfoModalWrapper,
  uiSplitRow,
  uiTextBody,
  uiTextLabel,
} from "./styles/editableStyles";

/** A fitted upgrade on an armour piece or weapon: its name with Remove, its chips, and a Rules icon. */
export function UpgradeEntryCard({
  name,
  removeFrom,
  editable,
  onRemove,
  chips,
  rules,
}: {
  name: string;
  /** Where the upgrade is removed from, such as "this armour". */
  removeFrom: string;
  editable: boolean;
  onRemove: () => void;
  chips: ReactNode;
  /** What the Rules information icon opens. */
  rules: ReactNode;
}) {
  return (
    <div className={`${uiCell} px-2 lg:px-3 py-1.5 lg:py-2`}>
      <div className={uiSplitRow}>
        <span className={`text-xs lg:text-sm font-medium ${uiTextBody}`}>{name}</span>
        {editable && (
          <RemoveEntryButton kind="Upgrade" name={name} from={removeFrom} onRemove={onRemove} />
        )}
      </div>
      {chips}
      <div className="flex items-center gap-1.5 mt-1">
        <span className={uiTextLabel}>Rules</span>
        <span className={uiInfoModalWrapper}>
          <InfoModal title={name} content={rules} />
        </span>
      </div>
    </div>
  );
}
