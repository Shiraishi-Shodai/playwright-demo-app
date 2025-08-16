import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";
import path from "path";

test("test", async ({ page }) => {
  const db = new Database("db/database.db");
  const stmt = db.prepare("SELECT MAX(id) as max_id FROM posts");
  const beforeNewestPostId = stmt.get() as { max_id: number } | undefined;

  //   投稿前の最新の投稿idを取得
  let nextPostId = beforeNewestPostId ? beforeNewestPostId.max_id + 1 : 0;

  await page.goto("http://localhost:3000/");
  await expect(page.locator("h1")).toContainText("Welcome, admin!");

  await page
    .getByRole("textbox", { name: "What's on your mind?" })
    .fill("Hello World!");

  await page.getByRole("button", { name: "Post", exact: true }).click();
  await page.getByLabel(`post-id-${nextPostId}`).waitFor();
  const p = page.getByLabel("post-content").first();
  const t = await p.textContent();
  await expect(p).toContainText("Hello World!");
});
