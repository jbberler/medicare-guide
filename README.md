# Medicare Guidepost

A guided decision tool that helps people turning 65 choose the right Medicare coverage. TurboTax-style: teaches each concept before asking for input, then produces a personalized printable decision memo.

**No data leaves your browser.** All calculations run client-side. No login, no accounts.

## Status

`v0.1.7.0` — Phase 4 complete: WCAG 2.1 AA accessibility, CSP security headers, P1/P2 engine bug fixes, and full regression test coverage.

| Phase | Status |
|-------|--------|
| Phase 1 — Foundation (schemas, engine, storage, WizardShell) | ✅ Complete |
| Phase 2 Track A — UI primitives, app shell, wizard nav | ✅ Complete |
| Phase 2 Track B — Education components | ✅ Complete |
| Phase 2 Track C — Input steps 2–6 | ✅ Complete |
| Phase 2 Track D — Output steps 7–8 + scenario components | ✅ Complete |
| Phase 3 — Welcome screen + integration + E2E | ✅ Complete |
| Phase 4 — Accessibility + security headers + bug fixes | ✅ Complete |
| Phase 4D — Vercel deploy | 🔜 Pending |

## What it does

An 8-step wizard that collects household facts and produces a 3-scenario cost comparison plus a printable decision memo:

- **Scenario A:** Stay on employer insurance, take free Part A only
- **Scenario B:** Enroll in Original Medicare (Parts A+B) + Medigap Plan G + Part D
- **Scenario C:** Enroll in Medicare Advantage (Part C)

The recommended scenario is personalized based on employer coverage, IRMAA bracket, health needs, and retirement timeline.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test          # Vitest unit tests (81 tests)
npx playwright test   # Playwright E2E tests (3 scenarios)
npm run build     # TypeScript + Next.js build check
```

## Architecture

```
src/
  app/            # Next.js App Router (layout, page, globals.css)
  components/
    ui/           # Button, Input, Select, Banner
    wizard/       # WizardShell (context), WizardAppShell (layout), ProgressRail, StepNav, MobileProgress
    education/    # RuleSummary, NumberExample, DeadlineStrip, ComparisonSnippet
    steps/        # WelcomeStep (1), HouseholdStep–TimelineStep (Steps 2–6), ScenariosStep (7), MemoStep (8)
    scenarios/    # ComparisonTable, ScenarioTabs, RecommendationPanel
  lib/
    engine.ts     # Pure rules engine: WizardInputs → ScenarioResults
    schemas.ts    # Zod schemas for all wizard fields
    storage.ts    # localStorage helpers with 30-day expiry
  data/
    irmaa-2026.json       # 2026 IRMAA brackets (Part B + Part D surcharges)
    partbd-2026.json      # Standard Part A/B/D premiums
    medigap-2026.json     # Medigap Plan G median estimates (10 states)
```

See [BUILD_PLAN.md](BUILD_PLAN.md) for the full implementation roadmap and [DESIGN.md](DESIGN.md) for the approved design spec.
