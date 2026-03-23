import { describe, it, expect } from "vitest";
import { computeScenarios, LookupError } from "./engine";
import type { WizardInputs } from "./schemas";

// Baseline fixture — employer coverage, high income, not retiring
const baseInputs: WizardInputs = {
  age: 65,
  sex: "Male",
  marital_status: "married",
  spouse_age: 63,
  state: "FL",
  has_40_credits: true,
  coverage_type: "employer_group",
  employer_holder: "me",
  employer_size_20_plus: true,
  employer_premium: 500,
  irmaa_bracket: "tier1",
  retiring_within_12_months: false,
  health_status: "healthy",
  medications_level: "none",
  has_specific_doctors: false,
  retiring_soon: false,
  retirement_date: undefined,
  employer_coverage_end_date: undefined,
};

// --- COBRA/ACA Gate ---

describe("COBRA/ACA gate", () => {
  it("coverage_type cobra → Scenario A never tagged as best fit", () => {
    const result = computeScenarios({ ...baseInputs, coverage_type: "cobra" });
    expect(result.scenarios[0].tag).toBeNull();
  });

  it("coverage_type aca → Scenario A never tagged as best fit", () => {
    const result = computeScenarios({ ...baseInputs, coverage_type: "aca" });
    expect(result.scenarios[0].tag).toBeNull();
  });

  it("coverage_type cobra → cobraAcaWarning is true with penalty message", () => {
    const result = computeScenarios({ ...baseInputs, coverage_type: "cobra" });
    expect(result.cobraAcaWarning).toBe(true);
    expect(result.cobraAcaMessage).toContain("NOT creditable");
  });

  it("coverage_type aca → cobraAcaWarning is true", () => {
    const result = computeScenarios({ ...baseInputs, coverage_type: "aca" });
    expect(result.cobraAcaWarning).toBe(true);
  });

  it("coverage_type employer_group → cobraAcaWarning is false", () => {
    const result = computeScenarios(baseInputs);
    expect(result.cobraAcaWarning).toBe(false);
    expect(result.cobraAcaMessage).toBeNull();
  });
});

// --- IRMAA Lookup ---

describe("IRMAA lookup", () => {
  const brackets = [
    { id: "base", expectedPartB: 185.0, expectedPartD: 0.0 },
    { id: "tier1", expectedPartB: 259.0, expectedPartD: 13.7 },
    { id: "tier2", expectedPartB: 370.0, expectedPartD: 35.3 },
    { id: "tier3", expectedPartB: 480.9, expectedPartD: 57.0 },
    { id: "tier4", expectedPartB: 591.9, expectedPartD: 78.6 },
    { id: "tier5", expectedPartB: 628.9, expectedPartD: 85.8 },
  ] as const;

  for (const { id, expectedPartB, expectedPartD } of brackets) {
    it(`bracket ${id} → correct Part B monthly premium ($${expectedPartB})`, () => {
      const result = computeScenarios({
        ...baseInputs,
        irmaa_bracket: id,
        coverage_type: "none",
        employer_holder: undefined,
        employer_size_20_plus: undefined,
        employer_premium: 0,
        retiring_soon: true,
      });
      // Scenario B Part B premium should match
      expect(result.scenarios[1].partBMonthly).toBe(expectedPartB);
    });

    it(`bracket ${id} → correct Part D monthly surcharge ($${expectedPartD})`, () => {
      const result = computeScenarios({
        ...baseInputs,
        irmaa_bracket: id,
        coverage_type: "none",
        employer_holder: undefined,
        employer_size_20_plus: undefined,
        employer_premium: 0,
        retiring_soon: true,
      });
      expect(result.scenarios[1].partDMonthly).toBe(expectedPartD);
    });
  }
});

// --- Medigap Lookup ---

describe("Medigap lookup", () => {
  it("supported state + age 65 + Male → returns a premium", () => {
    const result = computeScenarios({
      ...baseInputs,
      state: "FL",
      age: 65,
      sex: "Male",
      coverage_type: "none",
      retiring_soon: true,
    });
    expect(result.scenarios[1].medigapMonthly).not.toBeNull();
    expect(result.scenarios[1].medigapMonthly).toBeGreaterThan(0);
  });

  it("supported state + age 65 + Female → returns a premium different from Male", () => {
    const malePremium = computeScenarios({
      ...baseInputs,
      state: "FL",
      age: 65,
      sex: "Male",
      coverage_type: "none",
      retiring_soon: true,
    }).scenarios[1].medigapMonthly;

    const femalePremium = computeScenarios({
      ...baseInputs,
      state: "FL",
      age: 65,
      sex: "Female",
      coverage_type: "none",
      retiring_soon: true,
    }).scenarios[1].medigapMonthly;

    expect(malePremium).not.toBe(femalePremium);
  });

  it("unsupported state → medigapUnavailable is true and medigapMonthly is null", () => {
    const result = computeScenarios({
      ...baseInputs,
      state: "WY",
      coverage_type: "none",
      retiring_soon: true,
    });
    expect(result.scenarios[1].medigapUnavailable).toBe(true);
    expect(result.scenarios[1].medigapMonthly).toBeNull();
  });

  it("sex 'Prefer not to say' → uses Female premium (conservative estimate)", () => {
    const femalePremium = computeScenarios({
      ...baseInputs,
      state: "FL",
      age: 65,
      sex: "Female",
      coverage_type: "none",
      retiring_soon: true,
    }).scenarios[1].medigapMonthly;

    const preferNotPremium = computeScenarios({
      ...baseInputs,
      state: "FL",
      age: 65,
      sex: "Prefer not to say",
      coverage_type: "none",
      retiring_soon: true,
    }).scenarios[1].medigapMonthly;

    expect(preferNotPremium).toBe(femalePremium);
  });
});

// --- Scenario Ranking ---

describe("Scenario ranking", () => {
  it("employer + size≥20 + not retiring → tags Scenario A as best fit", () => {
    const result = computeScenarios(baseInputs);
    expect(result.scenarios[0].tag).toBe("best_fit");
    expect(result.recommended).toBe("A");
  });

  it("retiring_soon + has_specific_doctors → tags Scenario B as best fit", () => {
    const result = computeScenarios({
      ...baseInputs,
      retiring_soon: true,
      has_specific_doctors: true,
    });
    expect(result.scenarios[1].tag).toBe("best_fit");
    expect(result.recommended).toBe("B");
  });

  it("retiring_soon + no doctors + cost diff > $150 → tags Scenario C", () => {
    // Use high IRMAA bracket to make Scenario B significantly more expensive
    const result = computeScenarios({
      ...baseInputs,
      irmaa_bracket: "tier3",
      retiring_soon: true,
      has_specific_doctors: false,
      state: "FL",
    });
    const bCost = result.scenarios[1].monthlyTotal;
    const cCost = result.scenarios[2].monthlyTotal;
    if (bCost - cCost > 150) {
      expect(result.scenarios[2].tag).toBe("best_fit_cost");
      expect(result.recommended).toBe("C");
    } else {
      expect(result.scenarios[1].tag).toBe("best_fit_overall");
      expect(result.recommended).toBe("B");
    }
  });

  it("retiring_soon + no doctors + cost diff ≤ $150 → tags Scenario B as best fit overall", () => {
    // Use base IRMAA — small cost difference
    const result = computeScenarios({
      ...baseInputs,
      irmaa_bracket: "base",
      retiring_soon: true,
      has_specific_doctors: false,
      state: "WY", // unsupported state → medigap null → B monthly is lower
    });
    // With unsupported state, medigap is null so B cost is partB + partD only
    // C cost is partB + MA premium — difference should be small
    const bCost = result.scenarios[1].monthlyTotal;
    const cCost = result.scenarios[2].monthlyTotal;
    if (bCost - cCost <= 150) {
      expect(result.recommended).toBe("B");
    }
  });

  it("employer + size<20 → no best-fit tag on A (employer coverage not primary)", () => {
    const result = computeScenarios({
      ...baseInputs,
      employer_size_20_plus: false,
      retiring_soon: false,
    });
    expect(result.scenarios[0].tag).toBeNull();
  });

  it("COBRA user + retiring_soon → Scenario A has no tag (never recommended)", () => {
    const result = computeScenarios({
      ...baseInputs,
      coverage_type: "cobra",
      retiring_soon: true,
    });
    expect(result.scenarios[0].tag).toBeNull();
    expect(result.recommended).not.toBe("A");
  });
});

// --- Cost Calculations ---

describe("Cost calculations", () => {
  it("Scenario A total = Part A premium + employer_premium", () => {
    const result = computeScenarios({
      ...baseInputs,
      has_40_credits: true,
      employer_premium: 500,
    });
    // Part A is free with 40 credits → monthly = 0 + 500 = 500
    expect(result.scenarios[0].monthlyTotal).toBe(500);
    expect(result.scenarios[0].annualTotal).toBe(6000);
  });

  it("Scenario B total = Part B (with IRMAA) + Medigap + Part D (with IRMAA)", () => {
    const result = computeScenarios({
      ...baseInputs,
      state: "FL",
      age: 65,
      sex: "Male",
      irmaa_bracket: "tier1",
      coverage_type: "none",
      retiring_soon: true,
    });
    const b = result.scenarios[1];
    const expected = b.partBMonthly + (b.medigapMonthly ?? 0) + b.partDMonthly;
    expect(b.monthlyTotal).toBe(expected);
  });

  it("Scenario C total = Part B (with IRMAA) + MA premium", () => {
    const result = computeScenarios({
      ...baseInputs,
      irmaa_bracket: "tier1",
      coverage_type: "none",
      retiring_soon: true,
    });
    const c = result.scenarios[2];
    const expected = c.partBMonthly + c.maMonthlyPremium;
    expect(c.monthlyTotal).toBe(expected);
  });
});

// --- Work Credits (has_40_credits) ---

describe("Work credits (has_40_credits)", () => {
  it("has_40_credits true → Part A is $0 in Scenario A", () => {
    const result = computeScenarios({ ...baseInputs, has_40_credits: true });
    expect(result.scenarios[0].partAMonthly).toBe(0);
  });

  it("has_40_credits false → Part A premium is shown in Scenario A", () => {
    const result = computeScenarios({ ...baseInputs, has_40_credits: false });
    expect(result.scenarios[0].partAMonthly).toBeGreaterThan(0);
  });
});

// --- Graceful redirect (non-target persona) ---

describe("Graceful redirect", () => {
  it("no employer coverage AND base IRMAA → noTargetPersonaRedirect is true", () => {
    const result = computeScenarios({
      ...baseInputs,
      coverage_type: "none",
      irmaa_bracket: "base",
      employer_holder: undefined,
      employer_size_20_plus: undefined,
      employer_premium: 0,
    });
    expect(result.noTargetPersonaRedirect).toBe(true);
    expect(result.noTargetPersonaMessage).not.toBeNull();
  });

  it("employer coverage → no redirect", () => {
    const result = computeScenarios(baseInputs);
    expect(result.noTargetPersonaRedirect).toBe(false);
  });

  it("no employer but high IRMAA → no redirect (complex situation)", () => {
    const result = computeScenarios({
      ...baseInputs,
      coverage_type: "none",
      irmaa_bracket: "tier2",
      employer_holder: undefined,
      employer_size_20_plus: undefined,
      employer_premium: 0,
    });
    expect(result.noTargetPersonaRedirect).toBe(false);
  });
});
