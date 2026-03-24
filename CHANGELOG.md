# Changelog

All notable changes to Medicare Guidepost will be documented in this file.

## [0.1.7.1] - 2026-03-23

### Fixed
- **Mobile: whitespace gap above recommendation panel** (`ScenarioTabs.tsx`): Removed `pb-24` that was creating a large blank space between the tabbed scenario detail and the COBRA/ACA warning box
- **Mobile: nav buttons covered by sticky cost bar** (`ScenariosStep.tsx`): Added `pb-20 md:pb-0` to the step container so Back/Continue buttons scroll clear of the fixed bottom bar
- **Desktop: comparison table too narrow** (`ScenariosStep.tsx`): Added `-mx-8` to break the table out of the container's horizontal padding, gaining ~64px of width
- **Welcome page: excessive vertical spacing on mobile** (`WelcomeStep.tsx`): Reduced page padding and section gaps on mobile (`py-6`/`space-y-6`) while keeping desktop layout unchanged (`md:py-12`/`md:space-y-10`)

## [0.1.7.0] - 2026-03-23

### Added
- Security headers in `next.config.ts`: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo blocked)

### Fixed
- **P1 — Engine: COBRA + Base IRMAA conflict** (`engine.ts`): `noTargetPersonaRedirect` now excludes COBRA/ACA users — they are highest-risk for late-enrollment penalty and should never see the "this may be simple" redirect
- **P1 — Engine: Scenario B Part A undercount** (`engine.ts`): When Medigap data is unavailable, Scenario B `monthlyTotal`/`annualTotal` now correctly includes `partAMonthly` (previously dropped up to $518/mo)
- **P2 — Engine: IRMAA base bracket label** (`engine.ts`): `irmaaImpact` in Scenarios B and C now shows "Standard Part B — no IRMAA surcharge" at the base bracket instead of incorrectly labeling the standard $185 premium as a surcharge
- **P2 — Schema: Duplicate retirement fields** (`schemas.ts`, `IncomeStep.tsx`, `MemoStep.tsx`, `engine.ts`): Removed `retiring_within_12_months` — `retiring_soon` is now the single canonical field; IncomeStep and TimelineStep both write to `retiring_soon`
- **P2 — Schema: `employer_premium` validation** (`schemas.ts`): Added `superRefine` requiring `employer_premium` when `coverage_type === "employer_group"` (belt-and-suspenders; UI also enforces)
- **P3 — Accessibility: `<fieldset>/<legend>` for radio groups** (Steps 2–6): All radio button groups now use `<fieldset>/<legend>` instead of `<div>/<label>`. Fixes WCAG 2.1 SC 1.3.1 (Info and Relationships) — screen readers now correctly announce the group question when focus moves to individual radio options
- **Accessibility: touch targets** (Steps 2–6): All radio button labels now have `min-h-[44px]` for WCAG 2.1 AA touch target compliance on mobile
- **Accessibility: focus rings** (Steps 2–6): All radio inputs now have `focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1` for keyboard-accessible focus indicators
- **Accessibility: MobileProgress focus trap** (`MobileProgress.tsx`): Progress overlay now traps Tab focus within the dialog; Escape closes and returns focus to trigger
- **Accessibility: raw button touch targets** (`MemoStep.tsx`, `ScenariosStep.tsx`): All raw `<button>` elements (error-state back, memo confirm yes/no, print, "Can't print?") now have `min-h-[44px]`
- **IncomeStep COBRA/ACA redirect guard** (`IncomeStep.tsx`): COBRA and ACA users no longer see the "this may be simple" redirect interstitial, matching engine behavior
- **Test cleanup** (`steps.test.tsx`): Removed unused `userEvent` import; fixed spurious tuple type cast
- **E2E test selectors** (`e2e/*.spec.ts`): Updated radio button `name` attributes from stale `retiring_within_12_months` to `retiring_soon_income`
- **Regression tests** (`engine.test.ts`): Added 7 regression tests covering P1/P2 bug fixes (COBRA redirect, Part A undercount, IRMAA base label)

## [0.1.6.0] - 2026-03-23

### Added
- Welcome screen (`src/components/steps/WelcomeStep.tsx`):
  - Medicare Decision Map SVG hero — 4-node flow: Current Coverage → Your Age → Your Income → Your Recommendation
  - Optional first-name field (persists to memo header via `WizardContext`)
  - Return-visit resume banner: "Welcome back — your information is saved locally" with Continue / Start over actions
  - Private browsing notice via `state.isPrivateBrowsing`
  - Expectations panel: 15–20 min, personalized output, no data leaves browser
- Step routing (`src/app/page.tsx`): client component replacing placeholder; maps `state.currentStep` 1–8 to the correct step component (WelcomeStep → MemoStep); `default` case falls back to WelcomeStep
- Playwright E2E tests (`e2e/`, `playwright.config.ts`):
  - `happy-path.spec.ts` — employer group + Tier 2 income → Scenario A recommended → memo print button present
  - `cobra-path.spec.ts` — COBRA coverage + Tier 1 income → COBRA penalty warning shown → Scenario A NOT recommended → "Enroll in Part B immediately" in printable memo DOM
  - `unsupported-state.spec.ts` — Alaska (AK, not in Medigap dataset) → Scenario B shows shiphelp.org SHIP fallback → "Medigap estimate not available" in printable memo DOM
  - All tests use attribute-based selectors (`input[name][value]`) for radio buttons to avoid ambiguity; `toHaveCount(1)` for print-only DOM assertions

## [0.1.5.0] - 2026-03-23

### Added
- Scenario comparison components (`src/components/scenarios/`):
  - `ComparisonTable` — responsive 3-column desktop table; recommended scenario highlighted with blue border + badge; Medigap-unavailable notice inline for Scenario B; exhaustive `tagLabel` guard with `never` pattern
  - `ScenarioTabs` — mobile tabbed view (A/B/C); sticky cost comparison bar with `env(safe-area-inset-bottom)` for iPhone home indicator; dot indicator on recommended tab only (`aria-hidden`); `aria-labelledby` on tabpanel (WCAG 2.1 AA); `?? scenarios[0]` null-safe fallback
  - `RecommendationPanel` — recommended scenario rationale box or amber trade-offs notice; COBRA/ACA warning banner
- Step components (`src/components/steps/`):
  - `ScenariosStep` (Step 7) — 2-second intentional loading interstitial; validates inputs with `WizardInputsSchema.safeParse` before calling `computeScenarios`; handles `LookupError` and unexpected errors; responsive: ComparisonTable on desktop, ScenarioTabs on mobile
  - `MemoStep` (Step 8) — 1-second loading interstitial; `@media print` printable memo with 7 sections; print flow uses `afterprint` + confirmation screen ("Did you save your memo?") instead of auto-clear to handle dialog-cancel edge case; `useRef` cleanup for `afterprint` listener on unmount; `coverageLabel` exhaustiveness guard
- Print styles (`src/app/globals.css`): hides UI chrome, reveals `.print-memo`, sets `@page` margins, prevents section page breaks, ensures table borders print
- Component test coverage (`src/components/**/*.test.tsx`): 29 new tests covering all rendering branches, tab navigation, timer states, print confirmation flow, and error paths

### Fixed
- `afterprint` fires on print-dialog cancellation — replaced auto-clear with "Did you save your memo?" confirmation screen to prevent accidental data loss

## [0.1.4.0] - 2026-03-23

### Added
- Input steps 2–6 (`src/components/steps/`):
  - `HouseholdStep` — age (62–70), sex, marital status, state, work credits, conditional spouse age; age-gate interstitial for users aged 62–64 (planning ahead notice)
  - `InsuranceStep` — coverage type selector; conditional employer sub-form (holder, employer size, optional monthly premium with NaN-safe parsing)
  - `IncomeStep` — IRMAA bracket selector (6 tiers, 2023 tax year); graceful redirect interstitial for non-employer + base-bracket users (with guard preventing premature fire when upstream step is incomplete)
  - `HealthStep` — overall health status, medication use level, doctor/specialist preference; Original Medicare vs Medicare Advantage comparison snippet
  - `TimelineStep` — SEP deadline education strip; conditional expected retirement date; optional employer coverage end date

### Fixed
- `HouseholdStep`: age input now validates range (62–70) with a human-readable message — previously only checked for `NaN`
- `InsuranceStep`: employer premium now ignores whitespace-only strings (`" "`) to prevent `$0/mo` being silently stored as NaN
- `IncomeStep`: graceful redirect guard now requires `coverage_type` to be set before checking — prevents spurious redirect when the Insurance step was never completed
- `HouseholdStep`: age-gate "Continue exploring" button now uses `debounce={300}` (number) to match the `Button` component API

## [0.1.3.0] - 2026-03-23

### Added
- UI primitives (`src/components/ui/`):
  - `Button` — primary/secondary/ghost variants, disabled state, optional `debounce` prop (blocks re-clicks within the debounce window to prevent double-advance)
  - `Input` — label, error message, helper text; `aria-describedby`/`aria-invalid` wired for screen-reader error announcement; 44px min touch target
  - `Select` — label, typed `options` array, error message, placeholder; same WCAG wiring as Input
  - `Banner` — info/warning/error variants with icon, content slot, and optional dismiss button; used for age gate, return-visit, and private browsing warnings
- App shell layout (`src/app/layout.tsx` + `src/app/globals.css`):
  - Two-zone desktop layout: 280px fixed left rail + fluid main pane (≥768px), single-column on mobile
  - `WizardShell` + `WizardAppShell` wired into root layout; rail and sticky header suppressed on Step 1 (Welcome) to preserve full-width hero
  - `@media print` styles: hides rail/nav (`print:hidden`), full-width memo content, `#wizard-main` full-width override, 12pt body, `break-inside: avoid` on `.memo-section`, suppressed link-URL expansion
  - `step-enter` CSS animation (150ms ease-out translateX slide) for step transitions
  - 16px base font (WCAG 2.1 AA minimum — target users are 64–66)
  - Footer: "Rates current for 2026 · Last updated March 2026"
- Wizard navigation components (`src/components/wizard/`):
  - `ProgressRail` — 8-step list; green checkmarks for completed steps; current step highlighted in blue; back-navigation enabled for completed steps; running summary panel showing key inputs (name, age, state, marital status, coverage type, IRMAA bracket, health status) accumulated as steps complete
  - `StepNav` — Back/Continue buttons with 300ms debounce; Enter key advances (skips if focused inside an input/select/textarea), Escape key goes back; Continue disabled when `canContinue=false`
  - `MobileProgress` — sticky 56px header with step indicator dots + current step label; tap-to-open full-screen progress overlay with step list; pull-up bottom sheet showing key inputs; `aria-labelledby` on overlay dialog
  - `WizardAppShell` — client component managing conditional two-zone layout; renders full-width on Step 1, activates rail + mobile header on Steps 2–8

### Fixed
- `MobileProgress` dialog: replaced `aria-label` with `aria-labelledby` pointing to visible heading, per ARIA authoring practices
- `globals.css`: removed redundant `.print\:hidden` manual CSS rule (Tailwind v4 generates this class natively; manual override was unnecessary)

## [0.1.2.0] - 2026-03-23

### Added
- Educational content components (`src/components/education/`):
  - `RuleSummary` — one-line rule with collapsible "Why this matters" block; used in Steps 2 and 3
  - `NumberExample` — calculation breakdown table with highlighted result row; used in Step 4 (IRMAA)
  - `DeadlineStrip` — numbered milestone timeline with warning callouts; used in Step 6 (SEP/penalty windows)
  - `ComparisonSnippet` — 2-column inline comparison table; used in Step 5 (Original Medicare vs MA)
- All four components are pure display — typed content props, no wizard context dependency, no hardcoded copy

## [0.1.1] - 2026-03-23

### Added
- Scaffold Next.js 16 + TypeScript + Tailwind + App Router project
- Zod schemas (`src/lib/schemas.ts`) — `WizardInputs` with all wizard fields, IRMAA bracket/coverage type/state enums, conditional validation (employer_holder required for employer_group, retirement_date required when retiring_soon), unbounded name.max(100) guard
- Data files: `irmaa-2026.json` (6 IRMAA brackets), `partbd-2026.json` (Part A/B/D premiums), `medigap-2026.json` (10-state Plan G median premium stub: FL, CA, TX, NY, PA, OH, IL, MI, NC, AZ)
- Rules engine (`src/lib/engine.ts`) — pure function `WizardInputs → ScenarioResults`; COBRA/ACA gate with penalty warning; IRMAA/Medigap lookups with `LookupError`; scenario ranking (Employer/Medigap/Advantage); graceful redirect for non-target persona; `has_40_credits` Part A premium logic
- localStorage utility (`src/lib/storage.ts`) — save/load/clear with 30-day expiry; try/catch for quota exceeded (now frees space before retrying), private browsing, and corrupted JSON; Zod partial validation on load to prevent NaN propagation
- Wizard Context (`src/components/wizard/WizardShell.tsx`) — React Context + useReducer; SET_FIELD/ADVANCE/GO_BACK/GO_TO_STEP (clamped)/RESET/HYDRATE_FROM_STORAGE/DISMISS_RESUME_BANNER actions; downstream field invalidation on upstream changes; localStorage sync on every state change; return-visit resume banner

### Fixed
- Scenario B and C monthly totals now include Part A premium for users without 40 work credits (previously silently underquoted by up to $518/mo)
- Storage quota-exceeded retry now removes existing entry before retrying (previously overwrote with empty `{}`, silently destroying saved progress)
- localStorage data validated against schema on load to prevent NaN from tampered entries

### Added (tests — 46 total)
- 35 engine unit tests: COBRA/ACA gate, all 6 IRMAA bracket lookups × Part B + Part D, Medigap lookups, scenario ranking branches, cost calculations, work credits
- 6 schema validation tests per DESIGN.md spec
- 5 storage tests: fresh visit, save/load, 30-day expiry, unavailable localStorage, corrupted JSON
