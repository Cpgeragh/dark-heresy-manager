import { ROUTES } from "../constants/routes";
import { Button } from "./buttons/Button";
import { ErrorState } from "./ErrorState";
import { uiPageTitle, uiStackBody } from "./styles/editableStyles";

interface RouteLoadErrorProps {
  resource: "campaign" | "character";
  fullPage?: boolean;
}

const RESOURCE_TITLES = { campaign: "Campaign", character: "Character" } as const;

export function RouteLoadError({ resource, fullPage = false }: RouteLoadErrorProps) {
  return (
    <div className={`${uiStackBody} py-10 text-center`}>
      {fullPage ? (
        <>
          <h1 className={uiPageTitle}>Unable to Load This {RESOURCE_TITLES[resource]}</h1>
          <ErrorState>
            You may no longer have access, or there may be a temporary connection problem.
          </ErrorState>
        </>
      ) : (
        <ErrorState>
          Unable to load this {resource}. You may no longer have access, or there may be a temporary
          connection problem.
        </ErrorState>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try Again
        </Button>
        <Button onClick={() => window.location.assign(ROUTES.DASHBOARD)}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
