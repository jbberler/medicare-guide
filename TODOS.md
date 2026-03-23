# TODOS

## Engine: Part A Work-Quarter Precision

**What:** `has_40_credits` is a boolean, but Medicare Part A has two premium tiers for people without 40 credits: $284/mo (30–39 quarters) and $518/mo (<30 quarters). The engine currently always uses $518/mo when `has_40_credits = false`.

**Fix:** Replace `has_40_credits: z.boolean()` with `work_quarter_band: z.enum(["40+", "30-39", "<30"])` in schemas.ts. Update engine.ts `partAMonthly` lookup to use all three values from `partbd-2026.json`.

**Impact:** Users with 30–39 work quarters are quoted $234/mo too high for Scenario A. Silent cost overquote.

**Effort:** ~30 min CC

**Priority:** P1 (affects cost accuracy; fix before public launch)

**Noticed by:** adversarial review on jbberler/phase1-foundation (2026-03-23)

---

## Engine: COBRA + Base IRMAA Conflicting Signals

**What:** When `coverage_type === "cobra"` AND `irmaa_bracket === "base"`, the engine returns both `cobraAcaWarning: true` (penalty warning) and `noTargetPersonaRedirect: true` ("situation is straightforward"). These are contradictory — COBRA is never straightforward.

**Fix:** In `computeScenarios`, gate `noTargetPersonaRedirect` to exclude COBRA/ACA users: `const noTargetPersonaRedirect = !hasEmployerCoverage && !isCobraOrAca && inputs.irmaa_bracket === "base"`.

**Impact:** COBRA users at base IRMAA get a misleading "straightforward" redirect. They are actually in the highest-risk group for late-enrollment penalty.

**Effort:** 1-line fix

**Priority:** P1 (fix before public launch)

**Noticed by:** adversarial review on jbberler/phase1-foundation (2026-03-23)

---

## Schema: employer_premium Required for employer_group

**What:** The Zod schema marks `employer_premium` as optional even when `coverage_type === "employer_group"`. If the wizard step doesn't enforce it, the engine silently uses $0 and Scenario A appears artificially cheap.

**Fix:** Add a `superRefine` rule in `schemas.ts`: if `coverage_type === "employer_group"` and `employer_premium === undefined`, issue a validation error on `employer_premium`.

**Impact:** Silent $0 cost for Scenario A if the UI doesn't enforce the field.

**Effort:** ~5 min CC

**Priority:** P2 (UI will enforce it; schema validation is a belt-and-suspenders fix)

**Noticed by:** adversarial review on jbberler/phase1-foundation (2026-03-23)

---

## Annual Rate Update Process

**What:** Define and implement a process for updating Medicare rate data (IRMAA brackets, Medigap premiums, Part B/D tables) each October/November when CMS publishes new rates.

**Why:** Medicare rates change annually. Without an update process, the app will show stale 2026 rates in 2027. The app footer banner ("Rates current for 2026") makes staleness visible, but the update itself requires manual action each fall.

**How:**
1. Monitor CMS.gov for rate announcements each October/November
2. Update `src/data/irmaa-2026.json`, `src/data/medigap-2026.json`, `src/data/partbd-2026.json` (rename files to reflect the new year)
3. Update the footer banner year string
4. Test with a few representative inputs, deploy

**Effort:** ~2-3 hours human / ~30 min CC per year

**Depends on:** Nothing. Track for fall 2026 rate season.

**Priority:** P2 (not blocking v1, but needs to happen before January 2027)

---

## Blocking: Medigap Data Curation

**What:** Compile Medigap Plan G median premiums for 10-15 states, bucketed by age band (65, 66-70, 71-75) × sex (M/F) → write to `src/data/medigap-2026.json`.

**Why:** The scenario comparison step (Step 7) cannot show real cost numbers for Scenario B (Original Medicare + Medigap) without this data. This is the blocking pre-build dependency.

**How:** State insurance departments publish per-insurer rate filings. For each state:
1. Find the top 5 Medigap Plan G insurers by market share
2. Pull their age-65 rates for Male and Female
3. Compute the median across the 5 insurers
4. Repeat for age bands 66-70 and 71-75

**Start with:** The founder's parents' state, then expand to the largest Medicare markets (FL, CA, TX, NY, PA, OH, IL, MI, NC, AZ).

**Effort:** ~2-3 hours human research. Partially compressible with AI (can search for published rate comparisons).

**Depends on:** Nothing. Can start immediately. Must complete before Step 7 scenarios can be built and tested.

---

## Engine: Scenario B Part A Cost Undercount

**What:** When `medigapUnavailable` is true, `engine.ts` lines 226-231 compute Scenario B `monthlyTotal` without adding `partAMonthly`. Users without 40 work credits pay up to $518/mo for Part A — this is silently dropped from the B cost estimate.

**Fix:** Include `partAMonthly` in the Scenario B `monthlyTotal` regardless of `medigapUnavailable`. The Medigap premium is what's unavailable, not the Part A premium.

**Impact:** Scenario B can appear up to $518/mo cheaper than reality for users without 40 work credits. Could mislead users toward B.

**Effort:** 1-line fix in engine.ts

**Priority:** P1 (fix before public launch)

**Noticed by:** adversarial review on jbberler/phase2-track-d (2026-03-23)

---

## Engine: Retirement Boolean OR-Gate Lock-In

**What:** `engine.ts:143` uses `retiring_soon || retiring_within_12_months` as an OR-gate with no clearing dependency between the two fields. If both are `true` (e.g., user changed answers), the recommendation can lock incorrectly.

**Fix:** Mutually exclude the fields in the schema — if `retiring_within_12_months` is true, `retiring_soon` should be forced false (or vice versa).

**Impact:** Edge case: users who revisited Step 3 and selected different answers could get conflicting recommendation logic.

**Effort:** Zod `superRefine` + WizardShell step reset logic, ~20 min CC

**Priority:** P2

**Noticed by:** adversarial review on jbberler/phase2-track-d (2026-03-23)

---

## Engine: IRMAA Base Bracket Label Mismatch

**What:** `engine.ts:241` applies "Full IRMAA impact" label at the base bracket, which describes the standard Part B premium as an IRMAA surcharge. The base bracket has no IRMAA surcharge — only brackets above base do.

**Fix:** Map base bracket to "No IRMAA surcharge" and only use "IRMAA impact" language for brackets above base.

**Impact:** Misleading label for most users (base bracket is the majority). Could cause unnecessary alarm.

**Effort:** Switch/case update in engine.ts, ~5 min CC

**Priority:** P2

**Noticed by:** adversarial review on jbberler/phase2-track-d (2026-03-23)

---

## Schema: Reconcile Duplicate Retirement Fields

**What:** `TimelineStep` captures `retiring_soon` (boolean) while `IncomeStep` captures `retiring_within_12_months` (boolean). Both ask "are you retiring within the next 12 months?" These are semantically identical fields stored under two different keys.

**Fix:** In the integration pass (Phase 3), pick one canonical field (suggest `retiring_soon`) and remove the duplicate. Update `IncomeStep` to read from the same field rather than storing a second value.

**Impact:** Engine sees two independent flags that should always agree; if they ever diverge (e.g., user goes back and changes one), the engine may produce inconsistent output.

**Effort:** ~15 min CC

**Priority:** P2 (no user-visible bug until integration; fix in Phase 3)

**Noticed by:** /review on jbberler/oslo-phase2-track-c (2026-03-23)

---

## Accessibility: fieldset/legend for Radio Groups

**What:** All radio button groups in Steps 2–6 are wrapped in plain `<div>` elements with a `<label>` heading. Screen readers need a `<fieldset>` + `<legend>` to associate the group label with the individual radio inputs.

**Fix:** In Phase 4 accessibility pass, replace the `<div>/<label>` pattern with `<fieldset>/<legend>` for each radio group in HouseholdStep, InsuranceStep, IncomeStep, HealthStep, and TimelineStep.

**Impact:** Screen readers may not announce the group question when focus moves to individual radio options; affects WCAG 2.1 SC 1.3.1 (Info and Relationships).

**Effort:** ~20 min CC per step (mechanical find-and-replace)

**Priority:** P3 (fix in Phase 4 accessibility pass before public launch)

**Noticed by:** /review on jbberler/oslo-phase2-track-c (2026-03-23)

---

## Completed

### Blocking: Medigap Data Curation

**Completed:** v0.1.1.0 (2026-03-23)

Medigap Plan G median premiums compiled for initial state set, bucketed by age band (65, 66-70, 71-75) × sex (M/F), written to `src/data/medigap-2026.json`. Step 7 (ScenariosStep) is now built and functional against this data.
