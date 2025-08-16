
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import ExcelJS from 'exceljs';

const db = new Database('db/database.db');

export async function GET() {
  try {
    const posts = db.prepare(`
      SELECT
        posts.id,
        posts.content,
        posts.created_at,
        users.username
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `).all();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Posts');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: '投稿者名', key: 'username', width: 20 },
      { header: '投稿文', key: 'content', width: 50 },
      { header: '投稿日時', key: 'created_at', width: 25 },
    ];

    // Add rows
    posts.forEach(post => {
      worksheet.addRow({
        id: post.id,
        username: post.username,
        content: post.content,
        created_at: new Date(post.created_at).toLocaleString(),
      });
    });

    // Set headers for file download
    const buffer = await workbook.xlsx.writeBuffer();
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename=posts.xlsx');

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
