import { test, expect } from "@playwright/test";

const CSV_CONTENT =
  "application_id,business_name,borrower_name,loan_amount,application_date,assigned_processor,document_type,document_status,date_received,expiration_date,notes\n" +
  "E2E-IMPORT-APP,E2E Import Test Co,John Tester,50000,2026-02-01,E2E Test Processor,Bank Statements (90 day),Pending,,,\n";

test("import: upload a CSV and see the summary", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Name").selectOption("E2E Test Lead");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/import");
  await expect(page.getByRole("heading", { name: "Import applications" })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "e2e-import-test.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(CSV_CONTENT),
  });

  await page.getByRole("button", { name: "Import CSV" }).click();

  await expect(page.getByText("Import summary")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Inserted")).toBeVisible();
});
