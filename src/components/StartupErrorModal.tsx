import { Button } from "../ui/buttons/Button";
import { CenteredTitleHeader } from "../ui/CenteredTitleHeader";
import { ErrorState } from "../ui/ErrorState";
import { ModalShell } from "../ui/modals/ModalShell";

export function StartupErrorModal() {
  return (
    <ModalShell
      ariaLabel="Unable to load your account"
      closeOnBackdrop={false}
      closeOnEscape={false}
      onClose={() => undefined}
      className="max-w-md"
    >
      <CenteredTitleHeader title="Unable to load" />
      <div className="space-y-4 px-4 py-5 text-center lg:px-5">
        <ErrorState>
          Your account could not be loaded. There may be a temporary connection problem.
        </ErrorState>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </ModalShell>
  );
}
