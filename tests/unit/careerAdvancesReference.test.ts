import { describe, it, expect } from "vitest";
import { CAREER_ADVANCES } from "../../src/data/reference/careerAdvancesReference";
import { CAREER_LIST } from "../../src/data/reference/careerData";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { TALENT_LIST } from "../../src/data/reference/talentData";
import { TRAIT_LIST } from "../../src/data/reference/traitData";
import { WEAPON_TRAINING_GROUPS } from "../../src/data/reference/weaponTrainingData";

const skillIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));
const skillNames = new Set(DEFAULT_SKILLS.map((skill) => skill.name));
const talentById = new Map(TALENT_LIST.map((talent) => [talent.id, talent]));
const traitIds = new Set(TRAIT_LIST.map((trait) => trait.id));
const careerRankIdsById = new Map(
  CAREER_LIST.map((career) => [career.id, new Set(career.ranks.map((rank) => rank.id))])
);
const weaponTrainingOptionsByTalentName = new Map(
  WEAPON_TRAINING_GROUPS.map((group) => [
    group.label,
    new Set(group.items.map((item) => item.display)),
  ])
);

describe("careerAdvancesReference data", () => {
  for (const career of CAREER_ADVANCES) {
    describe(career.careerId, () => {
      it("every rankId exists on the matching CareerData", () => {
        const rankIds = careerRankIdsById.get(career.careerId);
        expect(rankIds, `no careerData entry for ${career.careerId}`).toBeDefined();
        for (const table of career.rankTables) {
          expect(rankIds!.has(table.rankId), `${career.careerId}: ${table.rankId}`).toBe(true);
        }
      });

      it("every skillId exists in DEFAULT_SKILLS", () => {
        for (const table of career.rankTables) {
          for (const advance of table.advances) {
            if (advance.kind !== "skill") continue;
            expect(skillIds.has(advance.skillId!), `${table.rankId}: ${advance.skillId}`).toBe(
              true
            );
          }
        }
      });

      it("every talentId exists in TALENT_LIST", () => {
        for (const table of career.rankTables) {
          for (const advance of table.advances) {
            if (advance.kind !== "talent") continue;
            expect(talentById.has(advance.talentId!), `${table.rankId}: ${advance.talentId}`).toBe(
              true
            );
          }
        }
      });

      it("every traitId exists in TRAIT_LIST", () => {
        for (const table of career.rankTables) {
          for (const advance of table.advances) {
            if (advance.kind !== "trait") continue;
            expect(traitIds.has(advance.traitId!), `${table.rankId}: ${advance.traitId}`).toBe(
              true
            );
          }
        }
      });

      it("every specialisation is a real option for that talent", () => {
        for (const table of career.rankTables) {
          for (const advance of table.advances) {
            if (advance.kind !== "talent" || !advance.specialisation) continue;
            const talent = talentById.get(advance.talentId!);
            const label = `${table.rankId}: ${advance.talentId} (${advance.specialisation})`;

            const weaponGroupOptions = weaponTrainingOptionsByTalentName.get(talent?.name ?? "");
            if (weaponGroupOptions) {
              expect(weaponGroupOptions.has(advance.specialisation), label).toBe(true);
              continue;
            }

            if (advance.talentId === "talented") {
              expect(skillNames.has(advance.specialisation), label).toBe(true);
              continue;
            }

            const behaviour = talent?.behaviour;
            if (
              behaviour &&
              (behaviour.kind === "fixed-repeatable" || behaviour.kind === "fixed-single")
            ) {
              expect(behaviour.options.includes(advance.specialisation), label).toBe(true);
            }
          }
        }
      });
    });
  }
});
