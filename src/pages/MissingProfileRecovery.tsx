import { IdentityRecoveryForm } from "../components/IdentityRecoveryForm";
import { useIdentityRecoveryFlow } from "../hooks/useIdentityRecoveryFlow";
import { Panel } from "../ui/Panel";

/**
 * Recovery route for a browser whose old local identity no longer has a
 * profile. Linking is deliberately non-destructive: the existing working
 * device remains signed in and this browser becomes a secondary device.
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
                This browser no longer has an active account profile. Enter the recovery code to
                check the account's connected-device records.
              </>
            }
            showFinishingStatus
          />
        </Panel>
      </div>
    </div>
  );
}
