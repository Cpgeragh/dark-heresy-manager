// tests/unit/validation.test.ts

import { describe, it, expect } from "vitest";
import {
  validateNumberRange,
  validateNonNegative,
  validateInteger,
  validateRequired,
  validateStringLength,
  validateCharacteristicBase,
  validateCharacteristicAdvances,
  validateCharacteristicTotal,
  validateWounds,
  validateFatePoints,
  validateRecoveryCode,
  validateCampaignName,
  validateCharacterName,
  parseAndValidateInt,
  sanitizeNumericInput,
} from "../../src/utils/validation";

describe("validateNumberRange", () => {
  it("accepts value within range", () => expect(validateNumberRange(5, 0, 10)).toEqual({ isValid: true }));
  it("accepts boundary min", () => expect(validateNumberRange(0, 0, 10)).toEqual({ isValid: true }));
  it("accepts boundary max", () => expect(validateNumberRange(10, 0, 10)).toEqual({ isValid: true }));
  it("rejects below min", () => expect(validateNumberRange(-1, 0, 10).isValid).toBe(false));
  it("rejects above max", () => expect(validateNumberRange(11, 0, 10).isValid).toBe(false));
  it("rejects NaN", () => expect(validateNumberRange(NaN, 0, 10).isValid).toBe(false));
});

describe("validateNonNegative", () => {
  it("accepts zero", () => expect(validateNonNegative(0)).toEqual({ isValid: true }));
  it("accepts positive", () => expect(validateNonNegative(5)).toEqual({ isValid: true }));
  it("rejects negative", () => expect(validateNonNegative(-1).isValid).toBe(false));
  it("rejects NaN", () => expect(validateNonNegative(NaN).isValid).toBe(false));
});

describe("validateInteger", () => {
  it("accepts whole number", () => expect(validateInteger(5)).toEqual({ isValid: true }));
  it("accepts zero", () => expect(validateInteger(0)).toEqual({ isValid: true }));
  it("rejects decimal", () => expect(validateInteger(5.5).isValid).toBe(false));
  it("rejects NaN", () => expect(validateInteger(NaN).isValid).toBe(false));
});

describe("validateRequired", () => {
  it("accepts non-empty string", () => expect(validateRequired("hello")).toEqual({ isValid: true }));
  it("rejects empty string", () => expect(validateRequired("").isValid).toBe(false));
  it("rejects whitespace-only", () => expect(validateRequired("   ").isValid).toBe(false));
});

describe("validateStringLength", () => {
  it("accepts string within bounds", () => expect(validateStringLength("hello", 1, 10)).toEqual({ isValid: true }));
  it("rejects too short", () => expect(validateStringLength("hi", 5, 10).isValid).toBe(false));
  it("rejects too long", () => expect(validateStringLength("hello world", 1, 5).isValid).toBe(false));
  it("accepts at exact min", () => expect(validateStringLength("hi", 2, 10)).toEqual({ isValid: true }));
  it("accepts at exact max", () => expect(validateStringLength("hello", 1, 5)).toEqual({ isValid: true }));
});

describe("validateCharacteristicBase", () => {
  it("accepts 0", () => expect(validateCharacteristicBase(0)).toEqual({ isValid: true }));
  it("accepts 100", () => expect(validateCharacteristicBase(100)).toEqual({ isValid: true }));
  it("accepts mid value", () => expect(validateCharacteristicBase(50)).toEqual({ isValid: true }));
  it("rejects below 0", () => expect(validateCharacteristicBase(-1).isValid).toBe(false));
  it("rejects above 100", () => expect(validateCharacteristicBase(101).isValid).toBe(false));
  it("rejects decimal", () => expect(validateCharacteristicBase(50.5).isValid).toBe(false));
});

describe("validateCharacteristicAdvances", () => {
  it("accepts 0", () => expect(validateCharacteristicAdvances(0)).toEqual({ isValid: true }));
  it("accepts 4", () => expect(validateCharacteristicAdvances(4)).toEqual({ isValid: true }));
  it("rejects 5", () => expect(validateCharacteristicAdvances(5).isValid).toBe(false));
  it("rejects negative", () => expect(validateCharacteristicAdvances(-1).isValid).toBe(false));
  it("rejects decimal", () => expect(validateCharacteristicAdvances(1.5).isValid).toBe(false));
});

describe("validateCharacteristicTotal", () => {
  it("accepts base 95 + advances 1 = 100", () => expect(validateCharacteristicTotal(95, 1)).toEqual({ isValid: true }));
  it("rejects base 96 + advances 1 = 101", () => expect(validateCharacteristicTotal(96, 1).isValid).toBe(false));
  it("accepts base 100 + advances 0", () => expect(validateCharacteristicTotal(100, 0)).toEqual({ isValid: true }));
});

describe("validateWounds", () => {
  it("accepts current equal to total", () => expect(validateWounds(10, 10)).toEqual({ isValid: true }));
  it("accepts current less than total", () => expect(validateWounds(5, 10)).toEqual({ isValid: true }));
  it("accepts zero current", () => expect(validateWounds(0, 10)).toEqual({ isValid: true }));
  it("rejects current greater than total", () => expect(validateWounds(11, 10).isValid).toBe(false));
  it("rejects negative current", () => expect(validateWounds(-1, 10).isValid).toBe(false));
  it("rejects negative total", () => expect(validateWounds(0, -1).isValid).toBe(false));
});

describe("validateFatePoints", () => {
  it("accepts current equal to total", () => expect(validateFatePoints(3, 3)).toEqual({ isValid: true }));
  it("accepts current less than total", () => expect(validateFatePoints(1, 3)).toEqual({ isValid: true }));
  it("rejects current greater than total", () => expect(validateFatePoints(4, 3).isValid).toBe(false));
  it("rejects negative current", () => expect(validateFatePoints(-1, 3).isValid).toBe(false));
  it("rejects negative total", () => expect(validateFatePoints(0, -1).isValid).toBe(false));
});

describe("validateRecoveryCode", () => {
  it("accepts valid format DH-XXXX-YYYY", () => expect(validateRecoveryCode("DH-ABCD-1234")).toEqual({ isValid: true }));
  it("rejects empty", () => expect(validateRecoveryCode("").isValid).toBe(false));
  it("rejects missing DH prefix", () => expect(validateRecoveryCode("AB-XXXX-YYYY").isValid).toBe(false));
  it("rejects too few segments", () => expect(validateRecoveryCode("DH-XXXX").isValid).toBe(false));
  it("trims whitespace before validating", () => expect(validateRecoveryCode("  DH-ABCD-1234  ")).toEqual({ isValid: true }));
});

describe("validateCampaignName", () => {
  it("accepts normal name", () => expect(validateCampaignName("My Campaign")).toEqual({ isValid: true }));
  it("rejects empty", () => expect(validateCampaignName("").isValid).toBe(false));
  it("rejects whitespace-only", () => expect(validateCampaignName("   ").isValid).toBe(false));
  it("rejects over 100 characters", () => expect(validateCampaignName("A".repeat(101)).isValid).toBe(false));
  it("accepts exactly 100 characters", () => expect(validateCampaignName("A".repeat(100))).toEqual({ isValid: true }));
});

describe("validateCharacterName", () => {
  it("accepts normal name", () => expect(validateCharacterName("Brother Mordecai")).toEqual({ isValid: true }));
  it("rejects empty", () => expect(validateCharacterName("").isValid).toBe(false));
  it("rejects whitespace-only", () => expect(validateCharacterName("   ").isValid).toBe(false));
  it("rejects over 100 characters", () => expect(validateCharacterName("A".repeat(101)).isValid).toBe(false));
});

describe("parseAndValidateInt", () => {
  it("parses valid integer string", () => expect(parseAndValidateInt("5", 0, 10)).toEqual({ value: 5 }));
  it("returns error for non-numeric string", () => expect(parseAndValidateInt("abc", 0, 10).error).toBeDefined());
  it("returns error below min", () => expect(parseAndValidateInt("-1", 0, 10).error).toBeDefined());
  it("returns error above max", () => expect(parseAndValidateInt("11", 0, 10).error).toBeDefined());
  it("parses boundary min", () => expect(parseAndValidateInt("0", 0, 10)).toEqual({ value: 0 }));
  it("parses boundary max", () => expect(parseAndValidateInt("10", 0, 10)).toEqual({ value: 10 }));
});

describe("sanitizeNumericInput", () => {
  it("removes non-digit characters", () => expect(sanitizeNumericInput("12a3b4")).toBe("1234"));
  it("removes minus when not allowed", () => expect(sanitizeNumericInput("-5")).toBe("5"));
  it("keeps minus when allowed", () => expect(sanitizeNumericInput("-5", true)).toBe("-5"));
  it("removes letters when negative allowed", () => expect(sanitizeNumericInput("-5abc", true)).toBe("-5"));
  it("returns empty string for all letters", () => expect(sanitizeNumericInput("abc")).toBe(""));
});
