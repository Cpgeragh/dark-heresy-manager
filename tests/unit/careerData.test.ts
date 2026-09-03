import { describe, it, expect } from "vitest";
import { CAREER_LIST } from "../../src/data/reference/careerData";
import { DEFAULT_SKILLS } from "../../src/data/reference/defaultSkills";
import { TALENT_LIST } from "../../src/data/reference/talentData";
import { WEAPON_TRAINING_GROUPS } from "../../src/data/reference/weaponTrainingData";

const skillIds = new Set(DEFAULT_SKILLS.map((skill) => skill.id));
const talentById = new Map(TALENT_LIST.map((talent) => [talent.id, talent]));
const weaponTrainingOptionsByTalentName = new Map(
  WEAPON_TRAINING_GROUPS.map((group) => [group.label, new Set(group.items.map((item) => item.display))])
);

describe("careerData starting benefit grants", () => {
  for (const career of CAREER_LIST) {
    describe(career.name, () => {
      it("every startingSkillGrants skillId exists in DEFAULT_SKILLS", () => {
        for (const grant of career.startingSkillGrants ?? []) {
          for (const option of grant.options) {
            expect(skillIds.has(option.skillId), option.skillId).toBe(true);
          }
        }
      });

      it("every startingTalentGrants talentId exists in TALENT_LIST", () => {
        for (const grant of career.startingTalentGrants ?? []) {
          for (const option of grant.options) {
            expect(talentById.has(option.talentId), option.talentId).toBe(true);
          }
        }
      });

      it("every startingTalentGrants specialisation is a real option for that talent", () => {
        for (const grant of career.startingTalentGrants ?? []) {
          for (const option of grant.options) {
            if (!option.specialisation) continue;
            const talent = talentById.get(option.talentId);
            const label = `${option.talentId} (${option.specialisation})`;

            const weaponGroupOptions = weaponTrainingOptionsByTalentName.get(talent?.name ?? "");
            if (weaponGroupOptions) {
              expect(weaponGroupOptions.has(option.specialisation), label).toBe(true);
              continue;
            }

            const behaviour = talent?.behaviour;
            if (behaviour && (behaviour.kind === "fixed-repeatable" || behaviour.kind === "fixed-single")) {
              expect(behaviour.options.includes(option.specialisation), label).toBe(true);
            }
          }
        }
      });
    });
  }
});
