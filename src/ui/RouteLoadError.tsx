import { ROUTES } from "../constants/routes";
import { Button } from "./buttons/Button";
import { ErrorState } from "./ErrorState";

interface RouteLoadErrorProps {
  resource: "campaign" | "character";
}

export function RouteLoadError({ resource }: RouteLoadErrorProps) {
  return (
    <div className="space-y-4 py-10 text-center">
      <ErrorState>
        Unable to load this {resource}. You may no longer have access, or there may be a temporary
        connection problem.
      </ErrorState>
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
