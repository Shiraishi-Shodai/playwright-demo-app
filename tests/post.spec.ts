import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";
import path from "path";
import ExcelJS from "exceljs";
import { after } from "next/server";

// 投稿できることをチェック(ログイン済みでないと不可能)
test("excutePostText", async ({ page }) => {
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
    page.waitForEvent("download"), //ダウンロードが完了するのを待つDownloadオブジェクト
    page.getByLabel("export-excel").click(), //undifined
  ]);

  await download.saveAs(path.join(__dirname, "../public/exported.xlsx"));
});

// Import
test("excuteImportExcel", async ({ page }) => {
  const importExcelFile = path.join(__dirname, "../public/posts.xlsx");

  await page.goto("http://localhost:3000/");

  const [filechooser] = await Promise.all([
    page.waitForEvent("filechooser"), // ファイル選択ダイアログが開くのを待つ
    page.getByLabel("select-excel-file").click(), // ファイル選択ダイアログを開く
  ]);

  await filechooser.setFiles(importExcelFile);

  await page.getByRole("button", { name: "Import" }).click();
  await expect(
    page.getByLabel("post-id-71").getByLabel("post-content")
  ).toContainText("XXX");
});

const exportExcelFile = async (page: any, filename: string) => {
  // エクスポート
  const [download] = await Promise.all([
    page.waitForEvent("download"), //ダウンロードが完了するのを待つDownloadオブジェクト
    page.getByLabel("export-excel").click(), //undifined
  ]);

  await download.saveAs(filename);
};

const importExcelFile = async (page: any, filename: string) => {
  const [filechooser] = await Promise.all([
    page.waitForEvent("filechooser"), // ファイル選択ダイアログが開くのを待つ
    page.getByLabel("select-excel-file").click(), // ファイル選択ダイアログを開く
  ]);

  await filechooser.setFiles(filename);

  await page.getByRole("button", { name: "Import" }).click();
};

const getTargetValue = (worksheet: any) => {
  const beforeEditValue = worksheet.getCell("C2").value;
  return beforeEditValue;
};

const editExcelFile = async(beforeWorkbook: any,beforeWorksheet:any, edittExcelFileName:string, editValue: string, saveFileName:string) => {
  // あくまでworkbookインスタンスがメモリ上で更新されただけ
  beforeWorksheet.getCell("C2").value = editValue;
  // 上書き保存
  await beforeWorkbook.xlsx.writeFile(saveFileName);
};


// 正しくデータを編集し、システムに反映できることを確認
test("excuteEditExcelFileText", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const beforeEdittExcelFileName = path.join(__dirname, "../public/beforeEdit.xlsx");
  const edittExcelFileName = path.join(__dirname, "../public/editNow.xlsx");
  const afterEdittExcelFileName = path.join(__dirname, "../public/afterEdit.xlsx");

  // エクスポート
  await exportExcelFile(page, beforeEdittExcelFileName);

  // エクセルにアクセスする。
  const beforeWorkbook = new ExcelJS.Workbook();
  await beforeWorkbook.xlsx.readFile(beforeEdittExcelFileName);
  const beforeWorksheet = beforeWorkbook.getWorksheet("Posts");

  // 現在の値を取得
  const beforeEditValue = getTargetValue(beforeWorksheet);
  console.log(beforeEditValue);

  // 値を編集
  const editValue = "Edit Text!!!";
  await editExcelFile(beforeWorkbook, beforeWorksheet, edittExcelFileName, editValue, edittExcelFileName);

  // インポート
  await importExcelFile(page, edittExcelFileName);

  setTimeout(()=> {
    console.log("インポートが反映されるのを待つ")
  }, 3000);

  // 再エクスポート
  await exportExcelFile(page, afterEdittExcelFileName);

  // 再エクスポートした後の値を取得
  const afterWorkbook = new ExcelJS.Workbook();
  await afterWorkbook.xlsx.readFile(afterEdittExcelFileName);
  const afterWorksheet = afterWorkbook.getWorksheet("Posts");
  const afterEditValue = getTargetValue(afterWorksheet);
  console.log(afterEditValue, editValue);

  // 正しく値が編集されているかを判定
  expect(afterEditValue).toEqual(editValue);
});
