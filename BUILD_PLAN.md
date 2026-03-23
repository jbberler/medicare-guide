# Medicare Guidepost — Build Plan

Generated 2026-03-23. Based on DESIGN.md (CEO + Eng reviewed, CLEARED).

## Prerequisites (must complete before any parallel work)

- [ ] **Medigap data curation** — compile Plan G median premiums for 10-15 states into `src/data/medigap-2026.json`. See TODOS.md. Blocks Step 7 only but best to have it ready.
- [ ] **Scaffold Next.js app** — `npx create-next-app@latest . --typescript --tailwind --app --src-dir`. Add Zod, Vitest, Playwright. Commit the empty scaffold.

---

## Phase 1 — Foundation (sequential, ~30 min CC)

Everything else depends on these. Build in order.

```
[ ] 1A  Zod schemas (lib/schemas.ts)
        - WizardInputs type with all fields
        - has_40_credits, coverage_type enum, IRMAA bracket enum, state enum
        - Conditional requirements (retirement_date required if retiring_soon)
        - Export WizardInputs type for use everywhere

[ ] 1B  Data files (src/data/)
        - irmaa-2026.json
        - partbd-2026.json
        - medigap-2026.json (needs Medigap data curation first)

[ ] 1C  Rules engine (lib/engine.ts + engine.test.ts)
        - Pure function: WizardInputs → ScenarioResults
        - COBRA/ACA gate
        - IRMAA + Medigap lookups with defensive fallbacks + LookupError
        - Scenario ranking logic
        - Cost calculations (Scenario A, B, C)
        - has_40_credits → Part A premium logic
        Depends on: 1A, 1B
        ~22 unit tests in engine.test.ts

[ ] 1D  localStorage utility (lib/storage.ts + storage.test.ts)
        - save/load/clear/expiry helpers
        - try/catch wrapper: quota exceeded, private browsing, corrupted JSON
        - 30-day expiry
        ~5 unit tests
        Depends on: 1A (needs WizardInputs type)

[ ] 1E  Wizard Context (components/wizard/WizardShell.tsx)
        - React Context + useReducer
        - State: currentStep, inputs (WizardInputs partial), completedSteps
        - Actions: SET_FIELD, ADVANCE, GO_BACK, RESET, HYDRATE_FROM_STORAGE
        - Conditional invalidation: when upstream field changes, clear dependent fields
        - localStorage sync on every state change (using storage.ts)
        - On mount: hydrate from localStorage, show resume banner if data found
        Depends on: 1A, 1D
```

---

## Phase 2 — Parallel Tracks (after Phase 1 complete)

Once the schema, engine, storage, and context are in place, these four tracks are **fully independent** and can run in parallel across multiple agents/sessions.

---

### Track A — UI Primitives & Shell (~20 min CC)

```
[ ] 2A1  UI primitives (components/ui/)
         - Button.tsx (primary, secondary, ghost variants + disabled state + debounce prop)
         - Input.tsx (label, error message, helper text)
         - Select.tsx (label, options, error message)
         - Banner.tsx (info, warning, error variants — used for age gate, return-visit, private browsing)

[ ] 2A2  App shell layout (app/layout.tsx + globals.css)
         - Two-zone layout: 280px fixed left rail + fluid main pane (desktop ≥768px)
         - Single-column layout (mobile <768px)
         - Tailwind base styles, global CSS
         - CSS @media print styles (hidden nav/rail, full-width content)
         - "Rates current for 2026 · Last updated March 2026" footer

[ ] 2A3  Wizard navigation components
         - ProgressRail.tsx — step list, green checkmarks for completed, running summary panel
         - StepNav.tsx — Back/Continue buttons, debounce 300ms, Enter/Escape keyboard handlers,
                         forward button disabled until validation passes
         - MobileProgress.tsx — sticky header dots + step label, tap-to-open progress overlay,
                                 pull-up bottom sheet for running summary
         Depends on: 2A1
```

---

### Track B — Educational Content Components (~15 min CC)

```
[x] 2B1  Education components (components/education/)
         - RuleSummary.tsx — one-line rule + expandable "Why this matters" block
         - NumberExample.tsx — mini calculation example with realistic 2026 numbers
         - DeadlineStrip.tsx — timeline graphic showing key dates and penalty windows
         - ComparisonSnippet.tsx — 2-row inline comparison table

         These are pure display components. No props from wizard context needed.
         Each takes typed content props (strings, numbers) — not hardcoded copy.
```

---

### Track C — Input Steps 2–6 (~30 min CC)

Can build all 5 steps in parallel. Each step is an isolated form component that reads from and writes to WizardContext. Each follows the teach-then-ask pattern: educational component on top, inputs below.

```
[ ] 2C1  HouseholdStep.tsx (Step 2)
         Inputs: age, spouse_age, sex (Male/Female/Prefer not to say), marital_status, state
         Education: RuleSummary (why age + state matter)
         Extra: has_40_credits boolean question
         Age gate: if age 62-64, replace step with interstitial (continue + persistent banner, or exit)
         Depends on: 2A1, 2B1, WizardContext (Phase 1)

[ ] 2C2  InsuranceStep.tsx (Step 3)
         Inputs: coverage_type enum, employer_holder (conditional), employer_size (conditional),
                 employer_premium (conditional)
         Education: RuleSummary (MSP rules, employer size threshold)
         Conditional fields: employer_holder + employer_size + employer_premium only if
                             coverage_type == "employer_group"
         Depends on: 2A1, 2B1, WizardContext

[ ] 2C3  IncomeStep.tsx (Step 4)
         Inputs: irmaa_bracket dropdown, retiring_within_12_months boolean
         Education: NumberExample (IRMAA calculation with 2026 numbers)
         Extra: reassurance sentence at bottom of educational panel
                "You'll see exactly how this affects your options in Step 7 —
                 and there may be a path that avoids this entirely."
         Graceful redirect: after this step, if no employer coverage AND irmaa_bracket == "base",
                            show redirect interstitial (see CEO Review Decisions in DESIGN.md)
         Depends on: 2A1, 2B1, WizardContext

[ ] 2C4  HealthStep.tsx (Step 5)
         Inputs: health_status enum, medications_level enum, has_specific_doctors boolean
         Education: ComparisonSnippet (Original Medicare vs MA network access)
         Depends on: 2A1, 2B1, WizardContext

[ ] 2C5  TimelineStep.tsx (Step 6)
         Inputs: retiring_soon boolean, retirement_date (conditional — required if retiring_soon)
                 employer_coverage_end_date
         Education: DeadlineStrip (SEP timeline, 8-month window, penalty risk)
         Depends on: 2A1, 2B1, WizardContext
```

---

### Track D — Output Steps 7–8 & Scenario Components (~30 min CC)

Blocked on rules engine (Phase 1C) and Medigap data. Can start Step 8 immediately; Step 7 needs engine.

```
[ ] 2D1  Scenario comparison components (components/scenarios/)
         - ComparisonTable.tsx — desktop: rows × 3 columns, recommended scenario highlighted
         - ScenarioTabs.tsx — mobile: tab bar (A/B/C) + sticky cost comparison bar at bottom
         - RecommendationPanel.tsx — "Best fit" rationale box below table
         All take ScenarioResults as props (output of engine.ts). Pure display.
         Depends on: Phase 1C (engine.ts types), 2A1

[ ] 2D2  ScenariosStep.tsx (Step 7)
         - 2-second "Analyzing your situation..." loading interstitial with setTimeout
           (comment: intentional trust mechanism, not real async work)
         - Calls rules engine with WizardContext inputs
         - Renders ComparisonTable (desktop) or ScenarioTabs (mobile)
         - Handles unsupported state: Scenario B shows SHIP fallback inline
         - Handles rules engine LookupError: shows "Something went wrong" with refresh prompt
         Depends on: 2D1, Phase 1C, WizardContext

[ ] 2D3  MemoStep.tsx (Step 8) + decision memo layout
         - "Preparing your memo..." 1-second interstitial
         - "Your memo is ready" transitional screen with plain-language summary
         - Printable memo layout (CSS @media print): header, situation summary,
           recommendation, cost table, action items checklist, key deadlines,
           what you learned, SHIP footer
         - window.print() trigger
         - Fallback: if print fails (popup blocked), show "Download as PDF" button
         - On memo print/download: clear localStorage (journey complete)
         - Optional name from Step 1 Welcome populates memo header
         Depends on: WizardContext, 2A2 (print styles)
```

---

## Phase 3 — Welcome Screen & Integration (~20 min CC)

```
[x] 3A  Welcome screen (app/page.tsx)
        - "Medicare Decision Map" hero visual (SVG showing Current Coverage → Age → Income → Recommendation)
        - Optional first-name field: "What should we call you? (optional — stays in your browser)"
        - CTA: "Build my decision memo →"
        - Expectations copy: ~15-20 min, personalized output, no data leaves browser
        - Return-visit banner: "Welcome back — pick up where you left off" (from WizardShell)
        Depends on: 2A1, 2A2, WizardContext

[x] 3B  End-to-end integration pass
        - Wire all steps into WizardShell routing
        - Verify back/forward navigation + conditional invalidation across all steps
        - Verify localStorage persistence across browser refresh
        - Verify graceful redirect triggers correctly after Step 4
        - Verify age gate interstitial + persistent banner
        Depends on: all tracks complete

[x] 3C  E2E tests (e2e/)
        - Happy path (employer + high income → Scenario A recommended → memo prints)
        - COBRA path (penalty warning → Scenario A never recommended → memo has Part B action item)
        - Unsupported state (SHIP fallback in Scenario B card → memo includes caveat)
        Depends on: 3B
```

---

## Phase 4 — Polish & Launch (~15 min CC)

```
[ ] 4A  Accessibility pass
        - WCAG 2.1 AA: keyboard nav, focus rings, screen reader labels on all inputs
        - 16px minimum body text, high contrast ratios
        - Touch targets ≥44px on mobile

[ ] 4B  Mobile layout QA
        - Sticky header dots + progress overlay
        - Bottom sheet running summary (pull-up handle)
        - Tab bar on Step 7, sticky cost bar
        - Print behavior on mobile (opens browser print dialog)

[ ] 4C  CSP + security headers (vercel.json or next.config.ts)
        - Content-Security-Policy blocking inline scripts
        - X-Frame-Options, X-Content-Type-Options, Referrer-Policy

[ ] 4D  Vercel deploy + smoke test
        - Deploy to preview URL
        - Run post-deploy checklist (full 8-step flow, memo print, localStorage resume)
```

---

## Dependency Graph

```
Medigap data curation ──────────────────────────────────────────┐
                                                                  ▼
Scaffold ──▶ 1A schemas ──▶ 1B data ──▶ 1C engine ──────────▶ 2D2 ScenariosStep
                  │                                              ▲
                  ├──▶ 1D storage ──▶ 1E WizardContext ─────────┤
                  │                         │                    │
                  │              ┌──────────┴──────────┐        │
                  │              ▼                      ▼        │
                  │         Track A (shell)        Track C (steps 2-6)
                  │         Track B (education)    Track D (step 7-8)
                  │              │                      │
                  └──────────────┴──────────────────────┴──▶ 3A Welcome
                                                              ──▶ 3B Integration
                                                              ──▶ 3C E2E tests
                                                              ──▶ 4A-D Polish
```

---

## Parallelization Summary

| What can run in parallel | After what |
|--------------------------|-----------|
| Track A, B, C, D (all 4) | Phase 1 complete |
| Steps 2C1–2C5 (all 5 input steps) | Each other — fully independent |
| Medigap data curation | Can start immediately (no code dependency) |
| 2D3 MemoStep | Can start after 2A2 (print styles) — no engine dependency |

**Max parallelism window:** After Phase 1 (schema + engine + storage + context), you can run 4 parallel agents: one on shell/navigation, one on education components, one building all 5 input steps, one building output components + memo.

---

## Estimated Effort

| Phase | Human | CC+gstack |
|-------|-------|-----------|
| Prerequisites (data curation) | 2-3 hours | 2-3 hours (human research, partially AI-assisted) |
| Phase 1 (foundation) | 4 hours | ~30 min |
| Phase 2 (parallel tracks, sequential) | 2 days | ~1.5 hours |
| Phase 3 (integration) | 4 hours | ~30 min |
| Phase 4 (polish) | 4 hours | ~30 min |
| **Total** | **~3-4 days** | **~5 hours** |

Medigap data curation is the only task that doesn't compress well — it's human research regardless of AI assistance.

---

## Conductor Workspace Plan

6 workspaces total. Max 4 running simultaneously during Wave 2.

### Wave 1 — Foundation (1 workspace)

**Workspace:** `foundation`
**Branch:** `jbberler/foundation`
**Prompt:** "Scaffold a Next.js + TypeScript + Tailwind + Zod app. Then build Phase 1 of BUILD_PLAN.md in order: Zod schemas (lib/schemas.ts) → data files (src/data/) → rules engine + tests (lib/engine.ts) → localStorage utility + tests (lib/storage.ts) → WizardContext (components/wizard/WizardShell.tsx). See DESIGN.md for all specs and CEO Review Decisions for the has_40_credits field and defensive lookup requirements."

**Gate:** Merge to `main` before starting Wave 2.

---

### Wave 2 — Parallel Build (4 workspaces, branch off main after Wave 1)

#### Workspace: `shell`
**Branch:** `jbberler/shell`
**Files:** `app/layout.tsx`, `globals.css`, `components/wizard/*`, `components/ui/*`
**Prompt:** "Build Track A from BUILD_PLAN.md: UI primitives (Button, Input, Select, Banner), app shell two-zone layout, ProgressRail, StepNav (with 300ms debounce), MobileProgress. WizardContext and all types are already on main. Do not touch step components. See DESIGN.md for the two-zone layout spec, mobile layout spec, and running summary panel."

#### Workspace: `education`
**Branch:** `jbberler/education`
**Files:** `components/education/*`
**Prompt:** "Build Track B from BUILD_PLAN.md: the 4 educational content components (RuleSummary, NumberExample, DeadlineStrip, ComparisonSnippet). These are pure display components — no context, no state. Each takes typed content props. See DESIGN.md 'Educational Content Formats' section for the spec of each."

#### Workspace: `input-steps`
**Branch:** `jbberler/input-steps`
**Files:** `components/steps/HouseholdStep.tsx` through `TimelineStep.tsx`
**Prompt:** "Build Track C from BUILD_PLAN.md: input Steps 2–6 (HouseholdStep, InsuranceStep, IncomeStep, HealthStep, TimelineStep). WizardContext and education components are on main. Each step follows the teach-then-ask pattern. Key requirements: (1) HouseholdStep adds a has_40_credits boolean question and handles the age-gate interstitial for users under 65. (2) IncomeStep adds a reassurance sentence at the bottom of the IRMAA panel: 'You'll see exactly how this affects your options in Step 7 — and there may be a path that avoids this entirely.' (3) IncomeStep triggers the graceful redirect interstitial after Step 4 if no employer coverage AND irmaa_bracket == base. See DESIGN.md CEO Review Decisions and Core Flow sections."

#### Workspace: `output-steps`
**Branch:** `jbberler/output-steps`
**Files:** `components/scenarios/*`, `components/steps/ScenariosStep.tsx`, `components/steps/MemoStep.tsx`
**Prompt:** "Build Track D from BUILD_PLAN.md: scenario comparison components (ComparisonTable, ScenarioTabs, RecommendationPanel), ScenariosStep (Step 7), and MemoStep (Step 8). Rules engine and types are on main. Key requirements: (1) The 2-second loading interstitial before Step 7 is intentional — use setTimeout, add a comment explaining it's a trust mechanism not real async work. (2) MemoStep generates the printable memo entirely client-side via CSS @media print + window.print(). (3) Stub medigap-2026.json with a few sample states if the data isn't ready yet. See DESIGN.md for the comparison table layout, memo structure, and interaction states."

---

### Wave 2b — Medigap Data (human-led, parallel with all waves)

Not a Conductor workspace — this is research work. Output: `src/data/medigap-2026.json`. Open a PR from any branch when ready; the `output-steps` workspace can stub the file and swap in real data before merging.

---

### Wave 3 — Integration (1 workspace, after all Wave 2 branches merge)

**Workspace:** `integration`
**Branch:** `jbberler/integration`
**Prompt:** "Build Phase 3 + Phase 4 from BUILD_PLAN.md. All components are on main. Tasks: (1) Build the Welcome screen (app/page.tsx) with the Medicare Decision Map hero, optional name field, and CTA. (2) Wire all 8 steps into WizardShell routing. (3) Verify conditional invalidation, localStorage resume, graceful redirect after Step 4, and age gate. (4) Write the 3 E2E tests (happy path, COBRA, unsupported state). (5) Accessibility pass: WCAG 2.1 AA, 16px min text, 44px touch targets. (6) Add CSP + security headers to next.config.ts. (7) Deploy to Vercel preview and run the post-deploy checklist from BUILD_PLAN.md."

---

### Timeline

```
Day 1 AM    [foundation] scaffold + Phase 1
            [medigap research] starts

Day 1 PM    foundation merges to main
              │
              ├──▶ [shell]        ─────────────────────────┐
              ├──▶ [education]    ──────────────┐           │
              ├──▶ [input-steps]  ──────────────────────────┤
              └──▶ [output-steps] ─────────────────────────┤
                                                            │
Day 2-3     all 4 merge to main ────────────────────────────┘
                                     │
Day 3       [integration] wire + E2E + polish + deploy

            [medigap research] → PR lands any time before output-steps merges
```

### Merge Order for Wave 2

Branches touch disjoint files — merges should be conflict-free. Suggested order:
1. `education` (no dependencies on other Wave 2 work)
2. `shell` (navigation needed by integration)
3. `input-steps`
4. `output-steps` (swap in real Medigap data here if research is done)
