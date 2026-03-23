import { z } from "zod";

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

export type USState = (typeof US_STATES)[number];

export const IRMAA_BRACKETS = [
  "base",
  "tier1",
  "tier2",
  "tier3",
  "tier4",
  "tier5",
] as const;

export type IrmaaBracket = (typeof IRMAA_BRACKETS)[number];

export const COVERAGE_TYPES = [
  "employer_group",
  "cobra",
  "aca",
  "none",
] as const;

export type CoverageType = (typeof COVERAGE_TYPES)[number];

export const EMPLOYER_HOLDER_TYPES = ["me", "spouse", "both"] as const;
export type EmployerHolder = (typeof EMPLOYER_HOLDER_TYPES)[number];

export const SEX_OPTIONS = ["Male", "Female", "Prefer not to say"] as const;
export type Sex = (typeof SEX_OPTIONS)[number];

export const HEALTH_STATUS_OPTIONS = [
  "healthy",
  "managing_conditions",
  "frequent_care",
] as const;
export type HealthStatus = (typeof HEALTH_STATUS_OPTIONS)[number];

export const MEDICATIONS_LEVEL_OPTIONS = [
  "none",
  "few_generics",
  "specialty",
] as const;
export type MedicationsLevel = (typeof MEDICATIONS_LEVEL_OPTIONS)[number];

export const WizardInputsSchema = z
  .object({
    // Step 1 (Welcome)
    name: z.string().optional(),

    // Step 2 (Household)
    age: z.number().int().min(62).max(70),
    spouse_age: z.number().int().min(0).max(120).optional(),
    sex: z.enum(SEX_OPTIONS),
    marital_status: z.enum(["single", "married"]),
    state: z.enum(US_STATES),
    has_40_credits: z.boolean(),

    // Step 3 (Insurance)
    coverage_type: z.enum(COVERAGE_TYPES),
    employer_holder: z.enum(EMPLOYER_HOLDER_TYPES).optional(),
    employer_size_20_plus: z.boolean().optional(),
    employer_premium: z.number().min(0).optional(),

    // Step 4 (Income)
    irmaa_bracket: z.enum(IRMAA_BRACKETS),
    retiring_within_12_months: z.boolean(),

    // Step 5 (Health)
    health_status: z.enum(HEALTH_STATUS_OPTIONS),
    medications_level: z.enum(MEDICATIONS_LEVEL_OPTIONS),
    has_specific_doctors: z.boolean(),

    // Step 6 (Timeline)
    retiring_soon: z.boolean(),
    retirement_date: z.string().optional(),
    employer_coverage_end_date: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // employer_holder required if coverage_type == "employer_group"
    if (data.coverage_type === "employer_group") {
      if (data.employer_holder === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "employer_holder is required when coverage type is employer group",
          path: ["employer_holder"],
        });
      }
      if (data.employer_size_20_plus === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "employer_size_20_plus is required when coverage type is employer group",
          path: ["employer_size_20_plus"],
        });
      }
    }

    // retirement_date required if retiring_soon == true
    if (data.retiring_soon && !data.retirement_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "retirement_date is required when retiring soon",
        path: ["retirement_date"],
      });
    }
  });

export type WizardInputs = z.infer<typeof WizardInputsSchema>;

// Partial type used while the wizard is in progress (not all steps completed)
export type PartialWizardInputs = Partial<WizardInputs>;
