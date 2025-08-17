import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";
import path from "path";

// 投稿できることをチェック
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

// Export
test("excuteExportExcel", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const [download] = await Promise.all([
    page.waitForEvent("download"), // Downloadオブジェクト
    page.getByLabel("export-excel").click(), //undifined
  ]);

  await download.saveAs(path.join(__dirname, "../public/exported.xlsx"));
});

// Import
test("excuteImportExcel", async({page})=> {
  const importExcelFile = path.join(__dirname, "../public/posts.xlsx");

  await page.goto("http://localhost:3000/");

  const [filechooser] = await Promise.all([
    page.waitForEvent("filechooser"), // ファイル選択ダイアログが開くのを待つ
    page.getByLabel("select-excel-file").click(), // ファイル選択ダイアログを開く
  ]);

  await filechooser.setFiles(importExcelFile);

  await page.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByLabel('post-id-71').getByLabel('post-content')).toContainText('XXX');
})
