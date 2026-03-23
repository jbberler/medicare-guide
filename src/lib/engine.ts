import type { WizardInputs, IrmaaBracket } from "./schemas";
import irmaaData from "../data/irmaa-2026.json";
import partbdData from "../data/partbd-2026.json";
import medigapData from "../data/medigap-2026.json";

export class LookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LookupError";
  }
}

export type ScenarioTag =
  | "best_fit"
  | "best_fit_cost"
  | "best_fit_overall"
  | null;

export type ScenarioResult = {
  id: "A" | "B" | "C";
  label: string;
  monthlyTotal: number;
  annualTotal: number;
  tag: ScenarioTag;
  tagReason: string | null;
  partBMonthly: number;
  partAMonthly: number;
  medigapMonthly: number | null;
  medigapUnavailable: boolean;
  partDMonthly: number;
  employerPremiumMonthly: number;
  maMonthlyPremium: number;
  irmaaImpact: string;
  doctorFreedom: string;
  penaltyRisk: string;
  bestWhen: string;
  personalizedFit: string;
};

export type ScenarioResults = {
  scenarios: [ScenarioResult, ScenarioResult, ScenarioResult];
  cobraAcaWarning: boolean;
  cobraAcaMessage: string | null;
  noTargetPersonaRedirect: boolean;
  noTargetPersonaMessage: string | null;
  recommended: "A" | "B" | "C" | null;
};

type IrmaaEntry = {
  id: string;
  label: string;
  partBMonthly: number;
  partDMonthly: number;
};

function lookupIrmaa(bracket: IrmaaBracket): IrmaaEntry {
  const entry = (irmaaData.brackets as IrmaaEntry[]).find(
    (b) => b.id === bracket
  );
  if (!entry) {
    throw new LookupError(`IRMAA bracket not found: ${bracket}`);
  }
  return entry;
}

type AgeBand = "65" | "66-70" | "71-75";

function getAgeBand(age: number): AgeBand {
  if (age <= 65) return "65";
  if (age <= 70) return "66-70";
  return "71-75";
}

type MedigapSex = "Male" | "Female";

function lookupMedigap(
  state: string,
  age: number,
  sex: string
): number | null {
  const stateData = (
    medigapData.states as unknown as Record<
      string,
      Record<string, Record<string, number>>
    >
  )[state];

  if (!stateData) return null;

  const band = getAgeBand(age);
  const bandData = stateData[band];
  if (!bandData) return null;

  // "Prefer not to say" uses Female (higher estimate for conservative calculation)
  const lookupSex: MedigapSex = sex === "Male" ? "Male" : "Female";
  const premium = bandData[lookupSex];
  if (premium === undefined) return null;

  return premium;
}

export function computeScenarios(inputs: WizardInputs): ScenarioResults {
  const irmaa = lookupIrmaa(inputs.irmaa_bracket);

  // Part A premium based on work credits
  const partAMonthly = inputs.has_40_credits
    ? 0
    : partbdData.partA.premiumWith0to29Quarters;

  // Medigap lookup
  const medigapMonthly = lookupMedigap(inputs.state, inputs.age, inputs.sex);
  const medigapUnavailable = medigapMonthly === null;

  // COBRA/ACA gate — check first before scenario ranking
  const isCobraOrAca =
    inputs.coverage_type === "cobra" || inputs.coverage_type === "aca";

  const cobraAcaWarning = isCobraOrAca;
  const cobraAcaMessage = isCobraOrAca
    ? "⚠️ COBRA/ACA coverage is NOT creditable for Medicare. Delaying Part B enrollment while on COBRA/ACA will result in a permanent late-enrollment penalty (10% surcharge per year of delay)."
    : null;

  const employerPremiumMonthly =
    inputs.coverage_type !== "none" ? (inputs.employer_premium ?? 0) : 0;

  // Scenario A: Stay on employer insurance + free Part A
  const scenarioAMonthly = partAMonthly + employerPremiumMonthly;

  // Scenario B: Original Medicare + Medigap + Part D
  const scenarioBMonthly =
    partAMonthly +
    irmaa.partBMonthly +
    (medigapMonthly ?? 0) +
    (irmaa.partDMonthly + partbdData.partD.standardMonthlyPremium);

  // Scenario C: Medicare Advantage
  const maMonthlyPremium = partbdData.partD.maDefaultMonthlyPremium;
  const scenarioCMonthly = partAMonthly + irmaa.partBMonthly + maMonthlyPremium;

  // Determine tags via scenario ranking
  const hasEmployerCoverage = inputs.coverage_type === "employer_group";
  const employerLargeEnough = inputs.employer_size_20_plus === true;
  // retiring_soon is the canonical retirement field (retiring_within_12_months was removed in Phase 4)
  const retiringSOOn = inputs.retiring_soon;

  let tagA: ScenarioTag = null;
  let tagB: ScenarioTag = null;
  let tagC: ScenarioTag = null;
  let tagReasonA: string | null = null;
  let tagReasonB: string | null = null;
  let tagReasonC: string | null = null;
  let recommended: "A" | "B" | "C" | null = null;

  if (
    hasEmployerCoverage &&
    employerLargeEnough &&
    !retiringSOOn &&
    !isCobraOrAca
  ) {
    tagA = "best_fit";
    const irmaaAnnualSavings = (irmaa.partBMonthly - partbdData.partB.standardMonthlyPremium) * 12;
    tagReasonA =
      irmaaAnnualSavings > 0
        ? `IRMAA avoidance saves ~$${Math.round(irmaaAnnualSavings).toLocaleString()}/year; employer coverage protects against late-enrollment penalty.`
        : "Employer coverage protects against late-enrollment penalty.";
    recommended = "A";
  } else if (retiringSOOn || !hasEmployerCoverage || isCobraOrAca) {
    if (inputs.has_specific_doctors) {
      tagB = "best_fit";
      tagReasonB =
        "Broadest provider access — see any Medicare-accepting doctor nationwide. Predictable costs with Medigap.";
      recommended = "B";
    } else {
      const costDiff = scenarioBMonthly - scenarioCMonthly;
      if (costDiff > 150) {
        tagC = "best_fit_cost";
        tagReasonC = `Saves ~$${Math.round(costDiff).toLocaleString()}/mo vs. Original Medicare + Medigap. Network restrictions apply.`;
        recommended = "C";
      } else {
        tagB = "best_fit_overall";
        tagReasonB =
          "Cost difference is small — broader provider access is worth the modest premium difference.";
        recommended = "B";
      }
    }
  }
  // else: no tag — situation has trade-offs in multiple directions

  // Graceful redirect for non-target persona: no employer coverage AND base IRMAA.
  // COBRA/ACA users are never redirected — they are highest-risk for late-enrollment penalty.
  const noTargetPersonaRedirect =
    !hasEmployerCoverage && !isCobraOrAca && inputs.irmaa_bracket === "base";
  const noTargetPersonaMessage = noTargetPersonaRedirect
    ? "Your situation is straightforward — enroll in Parts A & B during your Initial Enrollment Period, consider a Medigap plan, and contact a free SHIP counselor to confirm."
    : null;

  const scenarioA: ScenarioResult = {
    id: "A",
    label: "Keep Employer Plan",
    monthlyTotal: scenarioAMonthly,
    annualTotal: scenarioAMonthly * 12,
    tag: isCobraOrAca ? null : tagA,
    tagReason: isCobraOrAca ? null : tagReasonA,
    partBMonthly: 0,
    partAMonthly,
    medigapMonthly: null,
    medigapUnavailable: false,
    partDMonthly: 0,
    employerPremiumMonthly,
    maMonthlyPremium: 0,
    irmaaImpact: "None — no Part B enrollment, no surcharge",
    doctorFreedom: "Keep current doctors and network",
    penaltyRisk: isCobraOrAca
      ? "⚠️ COBRA/ACA is NOT creditable — late enrollment penalty applies"
      : "None — employer coverage protects enrollment window",
    bestWhen: "Good employer plan, high income (IRMAA avoidance), not retiring within 12 months",
    personalizedFit: isCobraOrAca
      ? "Not recommended — COBRA/ACA coverage does not protect you from Medicare late-enrollment penalties."
      : tagA
      ? tagReasonA ?? ""
      : "May work if your employer plan is strong, but review costs carefully.",
  };

  const scenarioB: ScenarioResult = {
    id: "B",
    label: "Original Medicare + Medigap",
    monthlyTotal: medigapUnavailable
      // Part A premium applies whether or not Medigap is available; only Medigap is what's missing
      ? partAMonthly + irmaa.partBMonthly + irmaa.partDMonthly
      : scenarioBMonthly,
    annualTotal: medigapUnavailable
      ? (partAMonthly + irmaa.partBMonthly + irmaa.partDMonthly) * 12
      : scenarioBMonthly * 12,
    tag: tagB,
    tagReason: tagReasonB,
    partBMonthly: irmaa.partBMonthly,
    partAMonthly,
    medigapMonthly,
    medigapUnavailable,
    partDMonthly: irmaa.partDMonthly,
    employerPremiumMonthly: 0,
    maMonthlyPremium: 0,
    irmaaImpact: inputs.irmaa_bracket === "base"
      ? `Standard Part B $${irmaa.partBMonthly}/mo — no IRMAA surcharge`
      : `IRMAA — Part B $${irmaa.partBMonthly}/mo + Part D $${irmaa.partDMonthly}/mo above standard`,
    doctorFreedom: "Any Medicare-accepting doctor nationwide",
    penaltyRisk: "None if enrolling during Initial Enrollment Period or Special Enrollment Period",
    bestWhen: "Retiring soon, want broadest provider choice, value predictable costs",
    personalizedFit: tagB
      ? tagReasonB ?? ""
      : "Good option if you value flexibility and want predictable out-of-pocket costs.",
  };

  const scenarioC: ScenarioResult = {
    id: "C",
    label: "Medicare Advantage",
    monthlyTotal: scenarioCMonthly,
    annualTotal: scenarioCMonthly * 12,
    tag: tagC,
    tagReason: tagReasonC,
    partBMonthly: irmaa.partBMonthly,
    partAMonthly,
    medigapMonthly: null,
    medigapUnavailable: false,
    partDMonthly: 0,
    employerPremiumMonthly: 0,
    maMonthlyPremium,
    irmaaImpact: inputs.irmaa_bracket === "base"
      ? `Standard Part B $${irmaa.partBMonthly}/mo — no IRMAA surcharge; Part D bundled in MA premium`
      : `IRMAA — Part B $${irmaa.partBMonthly}/mo surcharge; no Part D surcharge (Part D bundled in MA)`,
    doctorFreedom: "Plan network only — verify your specific doctors are in-network",
    penaltyRisk: "None if enrolling during Initial Enrollment Period or Special Enrollment Period",
    bestWhen: "Lower premiums are priority, willing to accept network restrictions",
    personalizedFit: tagC
      ? tagReasonC ?? ""
      : "Consider if cost is the primary factor and you're flexible on doctor networks.",
  };

  return {
    scenarios: [scenarioA, scenarioB, scenarioC],
    cobraAcaWarning,
    cobraAcaMessage,
    noTargetPersonaRedirect,
    noTargetPersonaMessage,
    recommended,
  };
}
