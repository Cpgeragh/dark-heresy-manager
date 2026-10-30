import { uiTextDescription, uiStackBody } from "../../../ui/styles/editableStyles";
import {
  uiTable,
  uiTableBody,
  uiTableCell,
  uiTableFirstCell,
  uiTableHeaderCell,
  uiTableHeaderRow,
  uiTableScroll,
} from "../../../ui/styles/tableStyles";

export function ExplosiveMishapsContent() {
  return (
    <div className={uiStackBody}>
      <p className={uiTextDescription}>
        Whenever a jam results from throwing a grenade or firing a grenade, something unfortunate
        has happened. Roll on the table below to find out the results.
      </p>
      <div className={uiTableScroll}>
        <table className={uiTable} aria-label="Explosive mishaps">
          <thead>
            <tr className={uiTableHeaderRow}>
              <th scope="col" className={`${uiTableHeaderCell} ${uiTableFirstCell}`}>
                Roll
              </th>
              <th scope="col" className={uiTableHeaderCell}>
                Result
              </th>
            </tr>
          </thead>
          <tbody className={uiTableBody}>
            <tr>
              <td
                className={`${uiTableCell} ${uiTableFirstCell} align-top font-code whitespace-nowrap`}
              >
                1-5
              </td>
              <td className={uiTableCell}>
                <span className="font-semibold">Dud.</span> The explosive or round fails to explode
                and, in the case of grenade launchers, the weapon must be reloaded before it can
                fire.
              </td>
            </tr>
            <tr>
              <td
                className={`${uiTableCell} ${uiTableFirstCell} align-top font-code whitespace-nowrap`}
              >
                6-8
              </td>
              <td className={uiTableCell}>
                <span className="font-semibold">"It might be ok…"</span> Nothing happens. Roll again
                on this table next round.
              </td>
            </tr>
            <tr>
              <td
                className={`${uiTableCell} ${uiTableFirstCell} align-top font-code whitespace-nowrap`}
              >
                9-0
              </td>
              <td className={uiTableCell}>
                <span className="font-semibold">BOOM!</span> The round or explosive detonates
                immediately. Centre the effect on the character. If this was the result of firing a
                grenade launcher, the grenade detonates in the barrel, having its normal effect as
                well as destroying the weapon.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
