// src/pages/CampaignOverview/SessionHistorySection.tsx

import { useMemo, useState } from "react";
import { useSessions } from "../../hooks/useSessions";
import { useCampaignCharacterSummaries } from "../../hooks/useCampaignCharacterSummaries";
import { applySessionXp } from "../../services/sessionService";
import { uiStackBody, uiStackList, uiTextPlaceholder } from "../../ui/styles/editableStyles";
import { Button } from "../../ui/buttons/Button";
import { ErrorState } from "../../ui/ErrorState";
import { useRouteLoading } from "../../context/useRouteReady";
import { SessionForm } from "./SessionForm";
import { SessionCard } from "./SessionCard";
import { SectionPending } from "./SectionPending";

interface SessionHistorySectionProps {
  campaignId: string;
  isDM: boolean;
}

export function SessionHistorySection({ campaignId, isDM }: SessionHistorySectionProps) {
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    deleteSession,
    updateSession,
  } = useSessions(campaignId, isDM);
  const { summaries, loading: summariesLoading } = useCampaignCharacterSummaries(campaignId);
  const loading = sessionsLoading || summariesLoading;
  useRouteLoading(loading);

  const [showSessionForm, setShowSessionForm] = useState(false);

  const sessionCharacters = useMemo(
    () =>
      summaries.map((summary) => ({
        id: summary.id,
        characterName: summary.characterName,
        userId: summary.userId ?? null,
      })),
    [summaries]
  );

  if (loading) return <SectionPending />;

  return (
    <div className={uiStackBody}>
      {isDM && showSessionForm && (
        <SessionForm
          campaignId={campaignId}
          characters={sessionCharacters}
          onClose={() => setShowSessionForm(false)}
        />
      )}

      {isDM && !showSessionForm && (
        <Button className="w-full sm:w-auto sm:self-start" onClick={() => setShowSessionForm(true)}>
          New Session
        </Button>
      )}

      {sessionsError ? (
        <ErrorState>Unable to load sessions. Please refresh the page.</ErrorState>
      ) : sessions.length === 0 ? (
        <p className={`text-sm lg:text-base ${uiTextPlaceholder}`}>No sessions recorded yet.</p>
      ) : (
        <div className={uiStackList}>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              characters={sessionCharacters}
              isDM={isDM}
              onDelete={isDM ? (reverseXp) => deleteSession(session.id, reverseXp) : undefined}
              onSave={isDM ? (data) => updateSession(session.id, data) : undefined}
              onApplyXp={
                isDM
                  ? () =>
                      applySessionXp(campaignId, session.id, session.attendees, session.xpAwarded)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
