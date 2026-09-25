import { test, expect } from "@playwright/test";

test("role gating: processor does not see team-lead-only controls", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Name").selectOption("E2E Test Processor");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");

  const anyAppRow = page.locator("tbody tr").first();
  await anyAppRow.click();
  await expect(page.getByRole("button", { name: "Archive application" })).not.toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("Team", { exact: true })).not.toBeVisible();
});
