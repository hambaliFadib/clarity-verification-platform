import { test, expect } from "@playwright/test";

test("requirements page loads", async ({ page }) => {
  await page.goto("/requirements");
  await expect(page.locator("h1")).toContainText("Requirements");
});

test("can create requirement", async ({ page }) => {
  await page.goto("/requirements/create");
  await page.fill('input[name="title"]', "E2E Test Requirement");
  await page.fill('input[name="module"]', "E2E Module");
  await page.click('button[type="submit"]');
  await expect(page.locator(".toast")).toContainText("created");
});

test("can view requirement detail", async ({ page }) => {
  await page.goto("/requirements");
  await page.click("table tbody tr:first-child a");
  await expect(page.locator("h1")).toContainText("REQ-");
});

test("AI analysis works", async ({ page }) => {
  await page.goto("/requirements");
  await page.click("table tbody tr:first-child a");
  await page.click('button:has-text("Analyze")');
  await expect(page.locator(".ai-score")).toBeVisible();
});
