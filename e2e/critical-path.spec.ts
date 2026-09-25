import { test, expect } from "@playwright/test";

test("critical path: login, view applications, sign out", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Name").selectOption("E2E Test Lead");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();

  await page.getByText("Sign out").click();
  await expect(page).toHaveURL("/login", { timeout: 15000 });
});
