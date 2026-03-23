/**
 * Unsupported state: Alaska (AK) has no Medigap data in medigap-2026.json.
 * Curated states: FL, CA, TX, NY, PA, OH, IL, MI, NC, AZ.
 *
 * Expected:
 *  - Scenario B shows "estimates unavailable" with shiphelp.org link
 *  - Memo includes a SHIP counselor reference (since estimates are unavailable)
 */

import { test, expect } from "@playwright/test";

test("unsupported state — Scenario B shows SHIP fallback, memo includes caveat", async ({
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
  await page.getByLabel("Your age").fill("66");
  await page.locator('input[name="sex"][value="Male"]').check();
  await page.locator('input[name="marital_status"][value="single"]').check();
  // AK (Alaska) is not in the curated Medigap dataset → triggers SHIP fallback for Scenario B
  await page.getByLabel("State of residence").selectOption("AK");
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
  await page.getByLabel(/income bracket/i).selectOption("tier1");
  await page.locator('input[name="retiring_within_12_months"][value="false"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 5: Your Health ──────────────────────────────────────────────────────
  await expect(page.getByText("How would you describe your overall health?")).toBeVisible();
  await page.locator('input[name="health_status"][value="managing_conditions"]').check();
  await page.locator('input[name="medications_level"][value="few_generics"]').check();
  // has_specific_doctors = true → engine tags Scenario B as best_fit (broadest access)
  await page.locator('input[name="has_specific_doctors"][value="true"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 6: Your Timeline ────────────────────────────────────────────────────
  await expect(page.getByText("Understanding your enrollment window")).toBeVisible();
  await page.locator('input[name="retiring_soon"][value="false"]').check();
  await page.getByRole("button", { name: "Continue" }).click();

  // ── Step 7: Your Scenarios ───────────────────────────────────────────────────
  await expect(page.getByText("Analyzing your situation...")).toBeVisible();
  await expect(page.getByText("Your scenarios")).toBeVisible({ timeout: 6000 });

  // Scenario B must show the Medigap SHIP fallback for AK (not in curated list)
  await expect(page.getByText(/estimates unavailable/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /shiphelp\.org/i })).toBeVisible();

  await page.getByRole("button", { name: /Continue to your memo/i }).click();

  // ── Step 8: Your Memo ────────────────────────────────────────────────────────
  await expect(page.getByText(/Preparing your memo/i)).toBeVisible();
  await expect(
    page.getByText(/Your memo is ready/).or(
      page.getByRole("button", { name: /Print/i })
    )
  ).toBeVisible({ timeout: 5000 });

  // Memo must reference the Medigap estimate caveat.
  // The printable memo section (hidden on screen) includes "* Medigap estimate not
  // available for your state" — verify it exists in the DOM.
  await expect(
    page.getByText(/Medigap estimate not available for your state/i)
  ).toHaveCount(1);
});
