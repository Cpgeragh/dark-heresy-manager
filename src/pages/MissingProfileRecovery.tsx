import { IdentityRecoveryForm } from "../components/IdentityRecoveryForm";
import { useIdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";
import { Panel } from "../ui/Panel";

/**
 * Compatibility route for a legacy browser whose old identity no longer has
 * a profile. Current devices return to onboarding when disconnected.
 */
export default function MissingProfileRecovery() {
  const recoveryFlow = useIdentityRecoveryFlow();

  return (
    <div className="min-h-svh bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm lg:max-w-md w-full space-y-6">
        <h1 className="text-lg lg:text-xl font-semibold text-center">Reconnect This Browser</h1>

        <Panel spacing="compact">
          <IdentityRecoveryForm
            flow={recoveryFlow}
            deviceNoun="browser"
            description={
              <>
                This browser no longer has an active account profile. Enter your recovery code to
                connect it to the account again.
              </>
            }
            showFinishingStatus
          />
        </Panel>
      </div>
    </div>
  );
}
