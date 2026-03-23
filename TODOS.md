# TODOS

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
