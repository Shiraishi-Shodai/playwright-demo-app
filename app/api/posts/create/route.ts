
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-is-at-least-32-bytes-long');
const db = new Database('db/database.db');

interface JWTPayload {
  userId: number;
  username: string;
}

export async function POST(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(session, secret) as { payload: JWTPayload };
    const userId = payload.userId;

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO posts (content, user_id) VALUES (?, ?)');
    const result = stmt.run(content, userId);

    const newPost = {
      id: result.lastInsertRowid,
      content,
      user_id: userId,
      created_at: new Date().toISOString(),
      username: payload.username, // Include username in the response
    };

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'JWTExpired') {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
