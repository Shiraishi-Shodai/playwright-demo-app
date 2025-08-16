import { test, expect } from "@playwright/test";
import path from "path";

test("test", async ({ page }) => {
  const authFile = path.join(__dirname, "../playwright/.auth/user.json");
  console.log(authFile);
  await page.goto("http://localhost:3000/login");
  await page.getByRole("textbox", { name: "Username" }).click();
  await page.getByRole("textbox", { name: "Username" }).fill("admin");
  await page.getByRole("textbox", { name: "Username" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("SecurePass123!");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.locator("h1")).toContainText("Welcome, admin!");

  await page.context().storageState({ path: authFile });
});
