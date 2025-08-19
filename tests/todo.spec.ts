import { test, expect } from "@playwright/test";

test("version", async ({ browser }) => {
  const version = browser.version();
  console.log(version);
  expect(version).toBeTruthy();
});

test("should check todo app feature", async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc/#/");
  await page.getByRole("textbox", { name: "What needs to be done?" }).click();
  await page
    .getByRole("textbox", { name: "What needs to be done?" })
    .fill("Laern Playwright");
  await page
    .getByRole("textbox", { name: "What needs to be done?" })
    .press("Enter");
  await page
    .getByRole("textbox", { name: "What needs to be done?" })
    .fill("Create Test");
  await page
    .getByRole("textbox", { name: "What needs to be done?" })
    .press("Enter");
  await page
    .getByRole("listitem")
    .filter({ hasText: "Laern Playwright" })
    .getByLabel("Toggle Todo")
    .check();
  await page.getByRole("link", { name: "Complete" }).click();
  await expect(page.getByTestId("todo-title")).toContainText("Laern Playwright");
  await page.getByRole("link", { name: "Active" }).click();
  await expect(page.getByTestId("todo-title")).toContainText("Create Test");
});
