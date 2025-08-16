import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import ExcelJS from "exceljs";

const db = new Database("db/database.db");

export async function POST(request: NextRequest) {
  console.log('Import API: Request received');
  try {
    const formData = await request.formData();
    const file = formData.get('importFile') as File | null;

    if (!file) {
      console.log('Import API: No file uploaded');
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    console.log('Import API: Loading workbook...');
    await workbook.xlsx.load(buffer);
    console.log('Import API: Workbook loaded.');

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        console.log('Import API: No worksheet found');
        return NextResponse.json({ error: 'No worksheet found in the Excel file.' }, { status: 400 });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const upsertStmt = db.prepare(
      'INSERT OR REPLACE INTO posts (id, content, user_id, created_at) VALUES (?, ?, ?, ?)'
    );
    const findUserStmt = db.prepare('SELECT id FROM users WHERE username = ?');

    const upsertMany = db.transaction((posts) => {
        console.log('Import API: Starting transaction...');
        for (const post of posts) {
            const user = findUserStmt.get(post.username) as { id: number } | undefined;
            if (user) {
                const existingPost = db.prepare('SELECT id FROM posts WHERE id = ?').get(post.id);
                upsertStmt.run(post.id, post.content, user.id, post.created_at);
                if (existingPost) {
                    updatedCount++;
                } else {
                    importedCount++;
                }
            } else {
                skippedCount++;
            }
        }
        console.log('Import API: Transaction complete.');
    });

    const postsToUpsert: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const id = row.getCell(1).value;
      if (!id) {
        console.warn(`Skipping row ${rowNumber}: No ID found.`);
        skippedCount++;
        return;
      }

      let createdAt: string | null = null;
      const cellValue = row.getCell(4).value;

      if (cellValue instanceof Date) {
        createdAt = cellValue.toISOString();
      } else if (typeof cellValue === 'number') {
        const jsDate = ExcelJS.utils.excelToJsDate(cellValue);
        if (jsDate instanceof Date && !isNaN(jsDate.getTime())) {
          createdAt = jsDate.toISOString();
        }
      } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
        const parsedDate = new Date(cellValue);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate.toISOString();
        }
      }

      if (createdAt === null) {
        createdAt = new Date().toISOString();
      }

      postsToUpsert.push({
        id: id,
        username: row.getCell(2).value,
        content: row.getCell(3).value,
        created_at: createdAt,
      });
    });

    console.log('Import API: Upserting posts...');
    upsertMany(postsToUpsert);
    console.log('Import API: Posts upserted.');

    return NextResponse.json({
        message: `Import complete. ${importedCount} posts added, ${updatedCount} posts updated, ${skippedCount} posts skipped (due to unknown users or missing ID).`
    });

  } catch (error) {
    console.error('Import API: Error during import:', error);
    return NextResponse.json({ error: 'Failed to process the Excel file.' }, { status: 500 });
  }
}
