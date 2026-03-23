# Changelog

All notable changes to Medicare Guidepost will be documented in this file.

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
