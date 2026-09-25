import { test, expect } from "@playwright/test";

test("status update: change a document status and see it persist", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Name").selectOption("E2E Test Lead");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");

  await expect(page.getByText("E2E Test Bakery")).toBeVisible();
  await page.getByText("E2E Test Bakery").click();

  const docRow = page.locator("tr", { hasText: "Bank Statements (90 day)" });
  await docRow.locator("select").selectOption("Approved");

  // Scoped to this application's row specifically, avoiding the hidden
  // <option value="Complete"> inside the unrelated status-filter dropdown.
  const appRow = page.locator("tr", { hasText: "E2E Test Bakery" }).first();
  await expect(appRow.locator("span", { hasText: "Complete" })).toBeVisible({ timeout: 10000 });
});
