// src/pages/characterSheet/PlayerPicker.tsx
// Lets a DM pick a campaign member by name to force-assign a character to.
// Names are resolved from each member's public profile on open — a one-off
// fetch, not a live subscription, since this is an occasional admin action.

import { useEffect, useState } from "react";
import { getFirstName } from "../../services/profileService";
import { PickerModal, PickerRow } from "../../ui/PickerModal";
import { uiItemName, uiTextMuted } from "../../ui/editableStyles";

interface PlayerOption {
  uid: string;
  label: string;
}

interface Props {
  memberIds: string[];
  onSelect: (uid: string) => void;
  onClose: () => void;
}

export function PlayerPicker({ memberIds, onSelect, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerOption[]>([]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    Promise.all(
      memberIds.map(async (uid) => ({
        uid,
        label: (await getFirstName(uid).catch(() => null)) ?? uid,
      }))
    ).then((resolved) => {
      if (ignore) return;
      setPlayers(resolved.sort((a, b) => a.label.localeCompare(b.label)));
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [memberIds]);

  const emptyMessage = loading ? "Loading players…" : "No players in this campaign yet.";

  return (
    <PickerModal
      title="Assign To"
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={loading || players.length === 0}
      emptyMessage={emptyMessage}
      hideSearch
    >
      {players.map((player) => (
        <PickerRow key={player.uid} onClick={() => onSelect(player.uid)}>
          <span className={uiItemName}>{player.label}</span>
          <span className={`block text-xs lg:text-sm ${uiTextMuted} font-code break-all`}>
            {player.uid}
          </span>
        </PickerRow>
      ))}
    </PickerModal>
  );
}
