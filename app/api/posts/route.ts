
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

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

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
