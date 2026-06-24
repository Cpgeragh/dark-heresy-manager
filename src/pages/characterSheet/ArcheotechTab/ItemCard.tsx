// src/pages/characterSheet/ArcheotechTab/ItemCard.tsx

import { useState } from "react";
import type { ArcheotechItem } from "../../../types/Character";
import { ARCHEOTECH_REFERENCE } from "../../../data/reference/archeotechReference";
import { uiActionButtonCompact, uiSection, uiTextBody, uiTextLabel, uiTextMuted } from "../../../ui/editableStyles";
import { Chip } from "../../../ui/Chip";
import { ItemMetaChips } from "../../../ui/ItemMetaChips";
import { InfoModal } from "../../../components/InfoModal";

interface Props {
  item: ArcheotechItem;
  editable: boolean;
  onRemove: () => void;
}

export function ItemCard({ item, editable, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasBody = !!(item.description?.trim() || item.notes?.trim());
  const ref = item.referenceId
    ? ARCHEOTECH_REFERENCE.find((r) => r.id === item.referenceId)
    : undefined;

  const description = item.description ?? ref?.description;
  const specialRules = ref?.specialRules;
  const weight = item.weight ?? ref?.weight;
  const value = item.value ?? ref?.value;
  const availability = item.availability ?? ref?.availability;
  const source = item.source ?? ref?.source;

  return (
    <div className={uiSection}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm lg:text-base font-medium text-slate-200">{item.name}</span>
            {item.type && (
              <Chip className={`border-slate-700 bg-slate-800/40 ${uiTextMuted}`}>
                {item.type}
              </Chip>
            )}
            {hasBody && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-slate-500 hover:text-slate-300 text-xs lg:text-sm transition"
              >
                {expanded ? "▲" : "▼"}
              </button>
            )}
            {description && !hasBody && (
              <span className="inline-flex items-center -translate-y-[1.4px]">
                <InfoModal title={item.name} content={description} />
              </span>
            )}
          </div>

          {/* Expanded body */}
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {specialRules && (
                <p className={`text-xs lg:text-sm ${uiTextMuted}`}>
                  <span className={`${uiTextLabel} mr-1`}>
                    Special
                  </span>
                  {specialRules}
                </p>
              )}
              {description && (
                <p className={`text-xs lg:text-sm ${uiTextBody} leading-relaxed`}>{description}</p>
              )}
              {item.notes?.trim() && (
                <p className="text-xs lg:text-sm text-amber-300/70 italic leading-relaxed">{item.notes}</p>
              )}
            </div>
          )}

          {/* Chips */}
          <ItemMetaChips
            weight={weight}
            value={value}
            availability={availability}
            source={source}
            className="flex flex-wrap gap-1.5 mt-1.5"
          />
        </div>

        {editable && (
          <button
            onClick={onRemove}
            className={`${uiActionButtonCompact} shrink-0 mt-0.5`}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
