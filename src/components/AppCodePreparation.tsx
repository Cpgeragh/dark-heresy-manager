import { useEffect } from "react";
import { matchPath } from "react-router-dom";
import { ROUTE_PATTERNS } from "../constants/routes";
import { loadCharacterSheet, loadChatInbox, loadSettings } from "../loading/appModules";
import { prepareCode } from "../utils/prepareCode";

export function AppCodePreparation({
  shownPath,
  pathname,
}: {
  shownPath: string | null;
  pathname: string;
}) {
  useEffect(() => {
    if (shownPath !== pathname) return;
    const jobs = matchPath(ROUTE_PATTERNS.CAMPAIGN_OVERVIEW, pathname)
      ? [loadCharacterSheet, loadSettings, loadChatInbox]
      : [loadSettings, loadChatInbox];
    return prepareCode(jobs);
  }, [shownPath, pathname]);
  return null;
}
