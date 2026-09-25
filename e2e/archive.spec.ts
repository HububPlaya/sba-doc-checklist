import { test, expect } from "@playwright/test";

test("archive: team lead can archive an application", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/login");
  await page.getByLabel("Name").selectOption("E2E Test Lead");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");

  await expect(page.getByText("E2E Archive Target Co")).toBeVisible();
  await page.getByText("E2E Archive Target Co").click();

  await page.getByRole("button", { name: "Archive application" }).click();

  await expect(page.getByText("E2E Archive Target Co")).not.toBeVisible({ timeout: 10000 });
});
