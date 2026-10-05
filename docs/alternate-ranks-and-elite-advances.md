# Alternate Ranks and Elite Advances

This document defines the current Alternate Rank and Elite Advance behaviour. It covers character persistence, availability, costs, purchase destinations and the effects applied by packaged Elite Advances.

## Ownership and persistence

| Concern                               | Owner                                                                                                   | Persisted field                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Alternate Rank reference data         | `ALTERNATE_RANKS` in `shared-rules/src/alternateRankData.ts`                                            | None                                                               |
| Packaged Elite Advance reference data | `ELITE_ADVANCES` in `shared-rules/src/eliteAdvanceData.ts`                                              | None                                                               |
| Selected Alternate Ranks              | `RankUpModal` in `src/pages/CharacterSheet/ExperienceTab.tsx`                                           | `experience.alternateRanks`                                        |
| Alternate Rank titles                 | `rankTitles` in `ALTERNATE_RANKS` and `getRankDisplayName` in `shared-rules/src/alternateRankTitles.ts` | `experience.alternateRanks[].titleChoices`                         |
| Granted packaged advances             | `applyAlternateRankEliteAdvanceGrants` in `src/mechanics/experience/alternateRankGrants.ts`             | `talentsAndTraits.eliteAdvances`                                   |
| Purchased packaged advances           | `EliteAdvancesTab` in `src/mechanics/eliteAdvances/EliteAdvancesTab.tsx`                                | `talentsAndTraits.eliteAdvances`                                   |
| Skills bought as Elite Advances       | `purchaseSkill` in `EliteAdvancesTab`                                                                   | `skills[].xpPurchases` and `skills[].eliteAdvancePurchases`        |
| Talents bought as Elite Advances      | `purchaseFixedTalent` and `purchaseManualTalent` in `EliteAdvancesTab`                                  | `talentsAndTraits.talents[].xpPurchase` and `eliteAdvancePurchase` |
| Weapon Training bought from a package | `purchaseFixedTalent` in `EliteAdvancesTab`                                                             | `weaponTraining.xpPurchases` and `eliteAdvancePurchases`           |
| Career-table Exotic Training choices  | `getExoticWeaponTrainingPurchases` in `shared-rules/src/weaponTrainingAdvanceCosts.ts`                  | None                                                               |
| Career-table Exotic Training purchase | `confirmExoticPurchase` in `src/pages/CharacterSheet/WeaponTrainingTab.tsx`                             | `weaponTraining.exoticWeapons[]` and its `xpPurchase`              |
| Exotic Training server validation     | `assertValidWeaponTrainingTransition` in `functions/src/shared/characterFieldValidation.ts`             | None                                                               |
| Missed-rank advance access            | `getMissedRankCareerAdvances` in `shared-rules/src/careerAdvanceAccess.ts`                              | None                                                               |
| Career Talent and Trait purchase cost | `getNextTalentOrTraitPurchase` in `shared-rules/src/careerAdvanceAccess.ts`                             | None                                                               |
| Skill purchase validation             | `assertValidSkillsTransition` in `functions/src/shared/characterFieldValidation.ts`                     | None                                                               |
| Talent and Trait purchase validation  | `assertValidTalentsAndTraitsTransition` in `functions/src/shared/characterFieldValidation.ts`           | None                                                               |
| Existing purchase price protection    | `assertExistingPurchasePricesUnchanged` in `functions/src/shared/characterFieldValidation.ts`           | None                                                               |
| Packaged advance XP                   | `getEliteAdvancesSpent` in `src/mechanics/experience/xpSpent.ts`                                        | `talentsAndTraits.eliteAdvances[].xpPurchase`                      |

Reference data is shared through the built `shared-rules` package. Character-specific selections, rolls and purchases remain in the character document.

## Alternate Rank selection

`RankUpModal` offers an Alternate Rank when all of the following are true:

- the selected next rank belongs to the required base Career;
- the selected next rank meets the Alternate Rank's minimum rank;
- the character has not already selected that Alternate Rank.

An Alternate Rank marked as a character-creation Advance Scheme is excluded from Rank Up. When its required base Career is selected at Rank 1, the Background page provides an Advance Scheme picker containing the normal starting Rank and each available character-creation Alternate Rank. Selecting one records it as replacing the normal Rank 1 table. The base Career still supplies its normal starting Skills and Talents.

Selecting an Alternate Rank stores its identifier, the identifier of the normal rank it replaced and the tier at which it was taken. The character header still advances to the underlying normal rank so ordinary Career progression can continue. Displayed Experience Rank names use the selected Alternate Rank name for the replaced Rank, or its Rank title where the Alternate Rank defines titles.

Any packaged Elite Advance granted by entering the Alternate Rank is saved in the same Rank Up update. It has no XP purchase record, appears as granted on the Elite Advances page and cannot be removed independently from its Alternate Rank.

An automatically granted packaged advance is excluded from both normal availability and Show all because it is not a purchase option.

When one Alternate Rank is available, the normal Rank and Alternate Rank remain as two inline choices in the Rank Up confirmation. When two or more Alternate Ranks are available, the Rank Up flow uses a separate Rank type picker built from the shared picker rows. At a Career branch, that picker opens after the Career path is selected. Without a Career branch, it opens directly. The picker uses the standard close action rather than a back action, and the confirmation displays only the selected Rank type after the picker closes.

The selected Alternate Rank table replaces the normal table at the shared career-advance access layer. Skills, Talents, Faith Talents, Traits and Weapon Training therefore read the Alternate Rank advances and costs, while the normal replaced table is excluded from ordinary Career purchases. Purchase records retain the replaced Rank identifier so the Experience ledger attributes them to the Alternate Rank card.

`getExoticWeaponTrainingPurchases` exposes each unlocked Exotic Weapon Training specialisation as a purchase pill. `WeaponTrainingTab` gives available pills the same animated glow as other unlocked Weapon Training, confirms the printed XP cost and stores the source rank in `weaponTraining.exoticWeapons[].xpPurchase`. Mechanicus Secutor supplies Breacher, Shock Blaster, Graviton Gun, Needle Pistol and Rad-Cleanser. Knave of Pistols filters the available list to pistol-compatible specialisations.

The app displays source prerequisites but does not enforce Corruption, origin, Characteristic, prerequisite Talent or GM-permission requirements. This matches the wider character sheet, where advancement prerequisites are informational rather than validation rules.

The server applies the same conditions when a player saves an Alternate Rank selection through the experience field: the career matches, the replaced rank is one of the character's valid next ranks and meets the Alternate Rank's minimum rank, and the Alternate Rank appears only once. A selection already on the character is not checked again, and the DM can save any selection. The server does not check Corruption, origin, Characteristic, prerequisite Talent or GM-permission requirements, matching the app.

## Alternate Rank titles

Mechanicus Secutor and Templar Calix define one title for each Rank from 4 to 8 in `rankTitles`. Mechanicus Secutor defines two titles at Rank 7, Tribune and Magnus, and either path may use either one. An Alternate Rank without `rankTitles` keeps its own name on the Rank it replaces.

| Rank                                         | Displayed name                                                                | Owner                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Rank where the Alternate Rank is taken       | The first title, or the stored choice where that Rank has two titles          | `getRankDisplayName` in `alternateRankTitles.ts`                  |
| Later Rank                                   | The normal Career name, or the stored title once one is chosen                | `getRankDisplayName` in `alternateRankTitles.ts`                  |
| Rank Up confirmation and Rank Card selection | Buttons for the normal Career name and each title, with the normal name first | `RankTitleChoice` in `src/pages/CharacterSheet/ExperienceTab.tsx` |
| Rank Card selection availability             | Shown to a player or DM with character editing access                         | `ExperienceTab`                                                   |

The title choice is stored per Rank number in `experience.alternateRanks[].titleChoices`. A missing entry means the normal Career name, except at the Rank where the Alternate Rank is taken, where it means the first title. Titles change only the displayed Rank name. Advance tables, costs, purchase attribution and the header Rank are unchanged.

The server checks the stored choices when a player saves the experience field. A choice is accepted only for the Rank where the Alternate Rank was taken or a later Rank, and only when the title appears in that Alternate Rank's list for that Rank. This check applies to selections already on the character as well as new ones. The DM can save any choice. The check is `assertValidTitleChoices` in `functions/src/shared/characterFieldValidation.ts`.

## Elite Advance availability and costs

`getAvailableNamedEliteAdvances`, `getMissedRankEliteAdvanceOptions` and `getPackageEliteAdvanceOptions` in `src/mechanics/eliteAdvances/eliteAdvanceAccess.ts` own the automatic availability rules.

| Purchase route                                                     | Normal picker availability                            |                        Cost | Buyer                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------- | --------------------------: | ------------------------------------------ |
| Packaged Elite Advance granted by entering an Alternate Rank       | Added automatically during Rank Up                    |                        None | Not purchased                              |
| Packaged Elite Advance linked to an Alternate Rank                 | After that Alternate Rank has been selected           |                Printed cost | Player or GM with character editing access |
| General packaged Elite Advance                                     | Immediately; source restrictions remain informational |                Printed cost | Player or GM with character editing access |
| Skill, Talent, or Weapon Training unlocked by an owned package     | After purchasing that package                         |                Printed cost | Player or GM with character editing access |
| Skill or Talent from the normal rank replaced by an Alternate Rank | From the following Career rank onwards                |       Original cost + 50 XP | Player or GM with character editing access |
| Skill from Show all                                                | Complete Skill catalogue                              | GM-entered cost, any amount | GM only                                    |
| Talent from Show all                                               | Complete Talent catalogue, including Faith Talents    | GM-entered cost, any amount | GM only                                    |

The replaced normal rank does not produce missed-rank options while the character is still on that rank. Only Skills and Talents from the replaced rank are eligible for the missed-rank rule.

`getMissedRankCareerAdvances` owns the shared original-cost-plus-50-XP calculation. `assertValidSkillsTransition` accepts a missed-rank Skill only when its stored Alternate Rank, replaced Rank and costs match that shared result. A Show all Skill uses `gm-approved` provenance and matching values in `manualCosts`, `xpPurchases` and `eliteAdvancePurchases`; the validator accepts that route only for the DM, including when normal Career progression still marks the Skill tier as locked.

`getNextTalentOrTraitPurchase` owns the shared next-slot Career cost for both Talents and Traits. `assertValidTalentsAndTraitsTransition` accepts a new entry only through an unlocked Career slot, a valid missed-rank purchase, an advance unlocked by an owned package, or a matching DM-priced Show all purchase. The same validator checks each new packaged Elite Advance against `ELITE_ADVANCES`, including exact XP cost, Alternate Rank access and automatic grant provenance. Campaign custom Traits and the Reformed Skin entry created by Purity of Flesh remain valid free additions.

`assertExistingPurchasePricesUnchanged` compares the stored and proposed cost fields for each retained purchase. Players with character editing access may remove purchases, but only the DM may reprice a retained Career, missed-rank, Show all or packaged purchase.

## Purchase destinations

The Elite Advances page has one Add or View flow. Special, Skills and Talents are picker categories within that flow.

| Purchased item                                       | Visible destination | Provenance                                   |
| ---------------------------------------------------- | ------------------- | -------------------------------------------- |
| Packaged Elite Advance granted by an Alternate Rank  | Elite Advances      | `[Alternate Rank] (Alternate Rank): Granted` |
| Packaged Elite Advance                               | Elite Advances      | The packaged advance remains as its own card |
| Skill bought as an Elite Advance                     | Skills              | `Gained from: [source] (Elite Advance)`      |
| Normal Talent bought as an Elite Advance             | Talents             | `Gained from: [source] (Elite Advance)`      |
| Faith Talent bought as an Elite Advance              | Faith Talents       | `Gained from: [source] (Elite Advance)`      |
| Weapon Training bought from an Elite Advance package | Weapon Training     | Package provenance stored with the purchase  |

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

The Cult of the Red Redemption costs 150 XP and is a general package whose printed membership restrictions are displayed but not automatically enforced. It grants Secret Tongue (the Redemption), Flagellant, Frenzy and the True Believer Trait. True Believer includes the Willpower/Shock rule and the complete Ludmillan Dictates. Owning the package exposes its printed advancement table through the Elite Advance Skill and Talent pickers. Basic Weapon Training (Flame) is written to the real Weapon Training block. Client and server both validate the table's printed Skill, Talent and Weapon Training costs.

Nascent Psyker costs 0 XP and is available as a general package at the GM's discretion; its Imperial Psyker, Tech-Priest and existing Psy Rating restrictions are displayed as rules text. It grants the Nascent Power Trait and exposes Deceive and Psyniscience for 100 XP each. Its single permanent random Minor Psychic Power is represented by a one-use selection in the ordinary Psychic Power picker. The temporary powers rerolled at the start of each session remain rules text rather than permanent character-sheet entries.

## Removal behaviour

Removing a packaged Elite Advance removes its derived Skill, Talent, Trait and Characteristic effects. Any Insanity recorded when it was purchased is subtracted from the current Insanity total, with the result floored at zero. Removing Nascent Psyker also removes the Minor Psychic Power linked to its package grant.

A packaged Elite Advance granted automatically by an Alternate Rank cannot be removed from the Elite Advances page.

Removing or downgrading a directly purchased Skill or Talent uses its normal page. Skill downgrades remove the corresponding Elite Advance provenance and XP record for every removed tier.

## Verification

| Contract                                      | Focused coverage                                                                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alternate Rank data                           | `tests/unit/alternateRankData.test.ts`                                                                                                                                     |
| Character-creation Advance Schemes            | `tests/integration/BackgroundTab.test.tsx`                                                                                                                                 |
| Automatic Alternate Rank grants               | `tests/unit/alternateRankGrants.test.ts`, `tests/integration/ExperienceTab.test.tsx`                                                                                       |
| Replacement table access and printed costs    | `tests/unit/careerAdvanceAccess.test.ts`, `tests/unit/skillAdvanceCosts.test.ts`, `tests/unit/talentAdvanceCosts.test.ts`, `tests/unit/weaponTrainingAdvanceCosts.test.ts` |
| Exotic Training pills and confirmation        | `tests/integration/WeaponTrainingTab.test.tsx`                                                                                                                             |
| Exotic Training server validation             | `functions/tests/shared/characterFieldValidation.test.ts`                                                                                                                  |
| Replacement picker wiring                     | `tests/integration/AlternateRankReplacement.test.tsx`, `tests/integration/TalentsTab.careerWiring.test.tsx`                                                                |
| Experience display names                      | `tests/unit/rankCards.test.ts`, `tests/integration/ExperienceTab.test.tsx`                                                                                                 |
| Rank title data and display names             | `tests/unit/alternateRankData.test.ts`, `tests/unit/alternateRankTitles.test.ts`                                                                                           |
| Rank title server validation                  | `functions/tests/shared/characterFieldValidation.test.ts`                                                                                                                  |
| Server validation for replacement purchases   | `functions/tests/shared/characterFieldValidation.test.ts`                                                                                                                  |
| Talent, Trait and packaged advance validation | `functions/tests/shared/characterFieldValidation.test.ts`, `functions/tests/operations/patchCharacterField.test.ts`                                                        |
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
