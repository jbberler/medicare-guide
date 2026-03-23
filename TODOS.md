# TODOS

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
