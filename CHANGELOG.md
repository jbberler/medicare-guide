# Changelog

All notable changes to Medicare Guidepost will be documented in this file.

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
