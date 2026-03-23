import { describe, it, expect } from "vitest";
import { WizardInputsSchema } from "./schemas";

// Base valid inputs — employer group scenario
const base = {
  age: 65,
  sex: "Male" as const,
  marital_status: "married" as const,
  spouse_age: 63,
  state: "FL" as const,
  has_40_credits: true,
  coverage_type: "employer_group" as const,
  employer_holder: "me" as const,
  employer_size_20_plus: true,
  employer_premium: 500,
  irmaa_bracket: "tier1" as const,
  health_status: "healthy" as const,
  medications_level: "none" as const,
  has_specific_doctors: false,
  retiring_soon: false,
};

describe("WizardInputsSchema", () => {
  it("age 63 → passes validation (age gate is handled in UI, not schema)", () => {
    const result = WizardInputsSchema.safeParse({ ...base, age: 63 });
    expect(result.success).toBe(true);
  });

  it("age 71 → fails validation (above max of 70)", () => {
    const result = WizardInputsSchema.safeParse({ ...base, age: 71 });
    expect(result.success).toBe(false);
  });

  it("coverage_type cobra → employer_holder not required", () => {
    const result = WizardInputsSchema.safeParse({
      ...base,
      coverage_type: "cobra",
      employer_holder: undefined,
      employer_size_20_plus: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("coverage_type employer_group → employer_holder required", () => {
    const result = WizardInputsSchema.safeParse({
      ...base,
      coverage_type: "employer_group",
      employer_holder: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("employer_holder");
    }
  });

  it("retiring_soon false → retirement_date not required", () => {
    const result = WizardInputsSchema.safeParse({
      ...base,
      retiring_soon: false,
      retirement_date: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("retiring_soon true → retirement_date required", () => {
    const result = WizardInputsSchema.safeParse({
      ...base,
      retiring_soon: true,
      retirement_date: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("retirement_date");
    }
  });
});
