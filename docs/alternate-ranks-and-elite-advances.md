# Alternate Ranks and Elite Advances

This document defines the current Alternate Rank and Elite Advance behaviour. It covers character persistence, availability, costs, purchase destinations and the effects applied by packaged Elite Advances.

## Ownership and persistence

| Concern                               | Owner                                                                                       | Persisted field                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Alternate Rank reference data         | `ALTERNATE_RANKS` in `shared-rules/src/alternateRankData.ts`                                | None                                                               |
| Packaged Elite Advance reference data | `ELITE_ADVANCES` in `shared-rules/src/eliteAdvanceData.ts`                                  | None                                                               |
| Selected Alternate Ranks              | `RankUpModal` in `src/pages/CharacterSheet/ExperienceTab.tsx`                               | `experience.alternateRanks`                                        |
| Granted packaged advances             | `applyAlternateRankEliteAdvanceGrants` in `src/mechanics/experience/alternateRankGrants.ts` | `talentsAndTraits.eliteAdvances`                                   |
| Purchased packaged advances           | `EliteAdvancesTab` in `src/mechanics/eliteAdvances/EliteAdvancesTab.tsx`                    | `talentsAndTraits.eliteAdvances`                                   |
| Skills bought as Elite Advances       | `purchaseSkill` in `EliteAdvancesTab`                                                       | `skills[].xpPurchases` and `skills[].eliteAdvancePurchases`        |
| Talents bought as Elite Advances      | `purchaseFixedTalent` and `purchaseManualTalent` in `EliteAdvancesTab`                      | `talentsAndTraits.talents[].xpPurchase` and `eliteAdvancePurchase` |
| Packaged advance XP                   | `getEliteAdvancesSpent` in `src/mechanics/experience/xpSpent.ts`                            | `talentsAndTraits.eliteAdvances[].xpPurchase`                      |

Reference data is shared through the built `shared-rules` package. Character-specific selections, rolls and purchases remain in the character document.

## Alternate Rank selection

`RankUpModal` offers an Alternate Rank when all of the following are true:

- the selected next rank belongs to the required base Career;
- the selected next rank meets the Alternate Rank's minimum rank;
- the character has not already selected that Alternate Rank.

Selecting an Alternate Rank stores its identifier, the identifier of the normal rank it replaced and the tier at which it was taken. The character header still advances to the underlying normal rank so ordinary Career progression can continue. Displayed Experience Rank names use the selected Alternate Rank name for the replaced Rank.

Any packaged Elite Advance granted by entering the Alternate Rank is saved in the same Rank Up update. It has no XP purchase record, appears as granted on the Elite Advances page and cannot be removed independently from its Alternate Rank.

An automatically granted packaged advance is excluded from both normal availability and Show all because it is not a purchase option.

When one Alternate Rank is available, the normal Rank and Alternate Rank remain as two inline choices in the Rank Up confirmation. When two or more Alternate Ranks are available, the Rank Up flow uses a separate Rank type picker built from the shared picker rows. At a Career branch, that picker opens after the Career path is selected. Without a Career branch, it opens directly. The picker uses the standard close action rather than a back action, and the confirmation displays only the selected Rank type after the picker closes.

The selected Alternate Rank table replaces the normal table at the shared career-advance access layer. Skills, Talents, Faith Talents, Traits and Weapon Training therefore read the Alternate Rank advances and costs, while the normal replaced table is excluded from ordinary Career purchases. Purchase records retain the replaced Rank identifier so the Experience ledger attributes them to the Alternate Rank card.

The app displays source prerequisites but does not enforce Corruption, origin, Characteristic, prerequisite Talent or GM-permission requirements. This matches the wider character sheet, where advancement prerequisites are informational rather than validation rules.

The server applies the same conditions when a player saves an Alternate Rank selection through the experience field: the career matches, the replaced rank is one of the character's valid next ranks and meets the Alternate Rank's minimum rank, and the Alternate Rank appears only once. A selection already on the character is not checked again, and the DM can save any selection. The server does not check Corruption, origin, Characteristic, prerequisite Talent or GM-permission requirements, matching the app.

## Elite Advance availability and costs

`getAvailableNamedEliteAdvances` and `getMissedRankEliteAdvanceOptions` in `src/mechanics/eliteAdvances/eliteAdvanceAccess.ts` own the automatic availability rules.

| Purchase route                                                     | Normal picker availability                         |                            Cost | Buyer                                      |
| ------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------: | ------------------------------------------ |
| Packaged Elite Advance granted by entering an Alternate Rank       | Added automatically during Rank Up                 |                            None | Not purchased                              |
| Packaged Elite Advance linked to an Alternate Rank                 | After that Alternate Rank has been selected        |                    Printed cost | Player or GM with character editing access |
| Skill or Talent from the normal rank replaced by an Alternate Rank | From the following Career rank onwards             |           Original cost + 50 XP | Player or GM with character editing access |
| Skill from Show all                                                | Complete Skill catalogue                           | GM-entered cost, minimum 200 XP | GM only                                    |
| Talent from Show all                                               | Complete Talent catalogue, including Faith Talents | GM-entered cost, minimum 200 XP | GM only                                    |

The replaced normal rank does not produce missed-rank options while the character is still on that rank. Only Skills and Talents from the replaced rank are eligible for the missed-rank rule.

## Purchase destinations

The Elite Advances page has one Add or View flow. Special, Skills and Talents are picker categories within that flow.

| Purchased item                                      | Visible destination | Provenance                                   |
| --------------------------------------------------- | ------------------- | -------------------------------------------- |
| Packaged Elite Advance granted by an Alternate Rank | Elite Advances      | `[Alternate Rank] (Alternate Rank): Granted` |
| Packaged Elite Advance                              | Elite Advances      | The packaged advance remains as its own card |
| Skill bought as an Elite Advance                    | Skills              | `Gained from: [source] (Elite Advance)`      |
| Normal Talent bought as an Elite Advance            | Talents             | `Gained from: [source] (Elite Advance)`      |
| Faith Talent bought as an Elite Advance             | Faith Talents       | `Gained from: [source] (Elite Advance)`      |

Direct Skill and Talent purchases do not create cards on the Elite Advances page. Their exact costs remain attached to their normal Skill or Talent records and contribute to XP accounting.

Every Talent purchased through Elite Advances uses `useTalentAcquisitionFlow` in `src/mechanics/talents/useTalentAcquisitionFlow.tsx`, which is also used by the normal Talents page. Talents that require additional acquisition choices must complete the normal acquisition form before they are saved.

## Packaged Elite Advance effects

Packaged advances may define granted Skills, Talents and Traits, recorded Insanity and permanent Characteristic reductions. The owning calculations are:

| Effect                    | Owner                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Granted Skills            | `getEliteAdvanceSkillGrants` in `src/mechanics/eliteAdvances/eliteAdvanceEffects.ts`                                                |
| Granted Talents           | `getEliteAdvanceTalentGrants` in `eliteAdvanceEffects.ts` and `getGrantedTalentEntries` in `src/mechanics/talents/talentEffects.ts` |
| Granted Traits            | `getEliteAdvanceTraitGrants` in `eliteAdvanceEffects.ts` and `getDerivedTraitEntries` in `src/mechanics/traits/traitEffects.ts`     |
| Characteristic reductions | `getEliteAdvanceCharacteristicModifierSources` in `eliteAdvanceEffects.ts`                                                          |
| Insanity                  | `purchaseSpecial` and `removeSpecial` in `EliteAdvancesTab`                                                                         |

Encarta Maleficarum costs 500 XP. Its purchase records the actual result of each 1d5 roll for Insanity, Toughness reduction and Fellowship reduction. It grants Forbidden Lore (Ordos: Malleus) and Insanely Faithful. Its remaining resistance and possession rules are displayed as rules text and are not calculated automatically.

## Removal behaviour

Removing a packaged Elite Advance removes its derived Skill, Talent, Trait and Characteristic effects. Any Insanity recorded when it was purchased is subtracted from the current Insanity total, with the result floored at zero.

A packaged Elite Advance granted automatically by an Alternate Rank cannot be removed from the Elite Advances page.

Removing or downgrading a directly purchased Skill or Talent uses its normal page. Skill downgrades remove the corresponding Elite Advance provenance and XP record for every removed tier.

## Verification

| Contract                                      | Focused coverage                                                                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alternate Rank data                           | `tests/unit/alternateRankData.test.ts`                                                                                                                                     |
| Automatic Alternate Rank grants               | `tests/unit/alternateRankGrants.test.ts`, `tests/integration/ExperienceTab.test.tsx`                                                                                       |
| Replacement table access and printed costs    | `tests/unit/careerAdvanceAccess.test.ts`, `tests/unit/skillAdvanceCosts.test.ts`, `tests/unit/talentAdvanceCosts.test.ts`, `tests/unit/weaponTrainingAdvanceCosts.test.ts` |
| Replacement picker wiring                     | `tests/integration/AlternateRankReplacement.test.tsx`, `tests/integration/TalentsTab.careerWiring.test.tsx`                                                                |
| Experience display names                      | `tests/unit/rankCards.test.ts`, `tests/integration/ExperienceTab.test.tsx`                                                                                                 |
| Server validation for replacement purchases   | `functions/tests/shared/characterFieldValidation.test.ts`                                                                                                                  |
| Server validation for Alternate Rank choices  | `functions/tests/shared/characterFieldValidation.test.ts`, `functions/tests/operations/patchCharacterField.test.ts`                                                        |
| Named and missed-rank availability            | `tests/unit/eliteAdvanceAccess.test.ts`                                                                                                                                    |
| Packaged reference data                       | `tests/unit/eliteAdvanceData.test.ts`                                                                                                                                      |
| Packaged grants and Characteristic effects    | `tests/unit/eliteAdvanceEffects.test.ts`                                                                                                                                   |
| Picker routes, Show all and packaged purchase | `tests/integration/EliteAdvancesTab.test.tsx`                                                                                                                              |
| Talent acquisition routing                    | `tests/integration/EliteAdvancesTab.test.tsx`                                                                                                                              |
| XP accounting                                 | `tests/unit/xpSpent.test.ts`                                                                                                                                               |

The production verification command is:

```bash
npm run build
```
