/**
 * Happy path: employer group coverage (20+ employees) + Tier 2 income, not retiring soon.
 * Expected: Scenario A recommended → continue to memo → print button present.
 */

import { test, expect } from "@playwright/test";

test("happy path — employer + high income → Scenario A recommended → memo ready", async ({
  page,
}) => {
  // Clear any saved state from a prior test run
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // ── Step 1: Welcome ──────────────────────────────────────────────────────────
  await expect(page.getByRole("heading", { name: "Medicare Guidepost" })).toBeVisible();
  await page.getByLabel(/what should we call you/i).fill("Alex");
  await page.getByRole("button", { name: /build my decision memo/i }).click();

  // ── Step 2: Your Household ───────────────────────────────────────────────────
  await expect(page.getByLabel("Your age")).toBeVisible();
  await page.getByLabel("Your age").fill("65");
  await page.locator('input[name="sex"][value="Male"]').check();
  await page.locator('input[name="marital_status"][value="single"]').check();
  await page.getByLabel("State of residence").selectOption("TX");
  await page.locator('input[name="has_40_credits"][value="true"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 3: Your Insurance ───────────────────────────────────────────────────
  await expect(page.getByText("What type of health coverage do you currently have?")).toBeVisible();
  await page.locator('input[name="coverage_type"][value="employer_group"]').check();
  await page.getByLabel("Who holds the employer coverage?").selectOption("me");
  await page.locator('input[name="employer_size_20_plus"][value="true"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 4: Your Income ──────────────────────────────────────────────────────
  await expect(page.getByLabel(/income bracket/i)).toBeVisible();
  await page.getByLabel(/income bracket/i).selectOption("tier2");
  // retiring_within_12_months = false
  await page.locator('input[name="retiring_within_12_months"][value="false"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 5: Your Health ──────────────────────────────────────────────────────
  await expect(page.getByText("How would you describe your overall health?")).toBeVisible();
  await page.locator('input[name="health_status"][value="healthy"]').check();
  await page.locator('input[name="medications_level"][value="none"]').check();
  // has_specific_doctors = false → no doctor preference → engine can recommend Scenario C or A
  await page.locator('input[name="has_specific_doctors"][value="false"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 6: Your Timeline ────────────────────────────────────────────────────
  await expect(page.getByText("Understanding your enrollment window")).toBeVisible();
  // retiring_soon = false
  await page.locator('input[name="retiring_soon"][value="false"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 7: Your Scenarios ───────────────────────────────────────────────────
  // Wait for the 2-second "Analyzing your situation..." interstitial
  await expect(page.getByText("Analyzing your situation...")).toBeVisible();
  await expect(page.getByText("Your scenarios")).toBeVisible({ timeout: 6000 });

  // Scenario A should be recommended (employer group, 20+ employees, not retiring, no doc pref)
  await expect(
    page.getByText(/Recommended: Scenario A/i)
  ).toBeVisible();

  // COBRA/ACA penalty warning must NOT appear
  await expect(page.getByText(/COBRA\/ACA coverage is NOT creditable/i)).not.toBeVisible();

  await page.getByRole("button", { name: /Continue to your memo/i }).click();

  // ── Step 8: Your Memo ────────────────────────────────────────────────────────
  await expect(page.getByText(/Preparing your memo/i)).toBeVisible();
  // Either the transition screen or the memo-ready screen appears
  await expect(
    page.getByText(/Your memo is ready/).or(
      page.getByRole("button", { name: /Print/i })
    )
  ).toBeVisible({ timeout: 5000 });

  // Print button must be present
  await expect(page.getByRole("button", { name: /Print/i })).toBeVisible();
});
