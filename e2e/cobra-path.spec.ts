/**
 * COBRA path: COBRA coverage + Tier 1 income, retiring within 12 months.
 * Using Tier 1 (not base) to avoid the graceful-redirect interstitial, which
 * only fires for non-employer-group + base income.
 *
 * Expected:
 *  - COBRA/ACA penalty warning appears in Step 7 (Scenarios)
 *  - Scenario A is NOT recommended
 *  - Step 8 (Memo) includes "Enroll in Part B immediately"
 */

import { test, expect } from "@playwright/test";

test("COBRA path — penalty warning shown, Scenario A not recommended, memo has Part B action", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // ── Step 1: Welcome ──────────────────────────────────────────────────────────
  await expect(page.getByRole("heading", { name: "Medicare Guidepost" })).toBeVisible();
  await page.getByRole("button", { name: /build my decision memo/i }).click();

  // ── Step 2: Your Household ───────────────────────────────────────────────────
  await expect(page.getByLabel("Your age")).toBeVisible();
  await page.getByLabel("Your age").fill("65");
  await page.locator('input[name="sex"][value="Female"]').check();
  await page.locator('input[name="marital_status"][value="single"]').check();
  await page.getByLabel("State of residence").selectOption("FL");
  await page.locator('input[name="has_40_credits"][value="true"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 3: Your Insurance ───────────────────────────────────────────────────
  await expect(page.getByText("What type of health coverage do you currently have?")).toBeVisible();
  // COBRA coverage — does NOT qualify for employer exemption from late-enrollment penalty
  await page.locator('input[name="coverage_type"][value="cobra"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 4: Your Income ──────────────────────────────────────────────────────
  await expect(page.getByLabel(/income bracket/i)).toBeVisible();
  // Tier 1 avoids the graceful-redirect interstitial (redirect only for non-employer + base)
  await page.getByLabel(/income bracket/i).selectOption("tier1");
  await page.locator('input[name="retiring_soon_income"][value="true"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 5: Your Health ──────────────────────────────────────────────────────
  await expect(page.getByText("How would you describe your overall health?")).toBeVisible();
  await page.locator('input[name="health_status"][value="healthy"]').check();
  await page.locator('input[name="medications_level"][value="none"]').check();
  await page.locator('input[name="has_specific_doctors"][value="false"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 6: Your Timeline ────────────────────────────────────────────────────
  await expect(page.getByText("Understanding your enrollment window")).toBeVisible();
  await page.locator('input[name="retiring_soon"][value="true"]').check();
  // retirement_date is required when retiring_soon = true
  await page.getByLabel("Expected retirement date").fill("2026-06-01");
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 7: Your Scenarios ───────────────────────────────────────────────────
  await expect(page.getByText("Analyzing your situation...")).toBeVisible();
  await expect(page.getByText("Your scenarios")).toBeVisible({ timeout: 6000 });

  // COBRA/ACA warning must appear — text from RecommendationPanel / engine cobraAcaMessage
  await expect(
    page.getByText(/COBRA\/ACA coverage is NOT creditable/i)
  ).toBeVisible();

  // Scenario A must NOT be recommended
  await expect(
    page.getByText(/Recommended: Scenario A/i)
  ).not.toBeVisible();

  await page.getByRole("button", { name: /Continue to your memo/i }).click();

  // ── Step 8: Your Memo ────────────────────────────────────────────────────────
  await expect(page.getByText(/Preparing your memo/i)).toBeVisible();
  await expect(
    page.getByText(/Your memo is ready/).or(
      page.getByRole("button", { name: /Print/i })
    )
  ).toBeVisible({ timeout: 5000 });

  // Print button must be present
  await expect(page.getByRole("button", { name: /Print/i })).toBeVisible();

  // The "Enroll in Part B immediately" action item is in the printable memo section
  // (hidden on screen, visible when printing). Verify it exists in the DOM.
  await expect(
    page.getByText(/Enroll in Part B immediately/i)
  ).toHaveCount(1);
});
