import { uiTextBody, uiTextLabel } from "../../../ui/editableStyles";

export function ExplosiveMishapsContent() {
  return (
    <div className="space-y-3">
      <p className={`text-sm lg:text-base ${uiTextBody} leading-relaxed`}>
        Whenever a jam results from throwing a grenade or firing a grenade, something unfortunate
        has happened. Roll on the table below to find out the results.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm lg:text-base border-collapse">
          <thead>
            <tr className={`${uiTextLabel} border-b border-slate-700`}>
              <th className="py-1.5 pr-3 font-medium">Roll</th>
              <th className="py-1.5 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60">
            <tr>
              <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>
                1-5
              </td>
              <td className={`py-2 ${uiTextBody}`}>
                <span className="font-semibold text-slate-100">Dud.</span> The explosive or round
                fails to explode and, in the case of grenade launchers, the weapon must be reloaded
                before it can fire.
              </td>
            </tr>
            <tr>
              <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>
                6-8
              </td>
              <td className={`py-2 ${uiTextBody}`}>
                <span className="font-semibold text-slate-100">"It might be ok…"</span> Nothing
                happens. Roll again on this table next round.
              </td>
            </tr>
            <tr>
              <td className={`py-2 pr-3 align-top font-code ${uiTextBody} whitespace-nowrap`}>
                9-0
              </td>
              <td className={`py-2 ${uiTextBody}`}>
                <span className="font-semibold text-slate-100">BOOM!</span> The round or explosive
                detonates immediately. Centre the effect on the character. If this was the result of
                firing a grenade launcher, the grenade detonates in the barrel, having its normal
                effect as well as destroying the weapon.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
