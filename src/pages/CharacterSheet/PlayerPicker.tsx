// src/pages/CharacterSheet/PlayerPicker.tsx
// Lets a DM pick a campaign member by name to force-assign a character to.
// Names are resolved from each member's public profile on open, a one-off
// fetch, not a live subscription, since this is an occasional admin action.

import { useEffect, useState } from "react";
import { getFirstName } from "../../services/profileService";
import { PendingOverlay } from "../../ui/PendingOverlay";
import { PickerList, PickerModal, PickerRow } from "../../ui/pickers/PickerModal";
import { PickerRowName, PickerRowText } from "../../ui/pickers/PickerRowParts";

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
  const memberIdsKey = JSON.stringify(memberIds);
  const [resolvedPlayers, setResolvedPlayers] = useState<{
    memberIdsKey: string;
    players: PlayerOption[];
  } | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all(
      memberIds.map(async (uid) => ({
        uid,
        label: (await getFirstName(uid).catch(() => null)) ?? uid,
      }))
    ).then((resolved) => {
      if (ignore) return;
      setResolvedPlayers({
        memberIdsKey,
        players: resolved.sort((a, b) => a.label.localeCompare(b.label)),
      });
    });

    return () => {
      ignore = true;
    };
  }, [memberIds, memberIdsKey]);

  const loading = resolvedPlayers?.memberIdsKey !== memberIdsKey;
  const players = resolvedPlayers?.memberIdsKey === memberIdsKey ? resolvedPlayers.players : [];

  if (loading) return <PendingOverlay active />;

  return (
    <PickerModal
      title="Assign To"
      query=""
      onQueryChange={() => {}}
      onClose={onClose}
      isEmpty={players.length === 0}
      emptyMessage="No players in this campaign yet."
      hideSearch
    >
      <PickerList>
        {players.map((player) => (
          <PickerRow key={player.uid} onClick={() => onSelect(player.uid)}>
            <PickerRowName name={player.label} />
            <PickerRowText className="font-code break-all">{player.uid}</PickerRowText>
          </PickerRow>
        ))}
      </PickerList>
    </PickerModal>
  );
}
