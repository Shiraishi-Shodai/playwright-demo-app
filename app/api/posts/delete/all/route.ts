import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-is-at-least-32-bytes-long');
const db = new Database('db/database.db');

interface JWTPayload {
  userId: number;
}

export async function DELETE(
  request: NextRequest
) {
  console.log('DELETE /api/posts/delete/all request received');
  const session = request.cookies.get('session')?.value;
  console.log(`session is ${session}`);

  if (!session) {
    console.log('No session cookie found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Verifying session...');
    await jwtVerify(session, secret) as { payload: JWTPayload };
    console.log('Session verified');

    console.log('Preparing to delete all posts...');
    const stmt = db.prepare('DELETE FROM posts');
    const result = stmt.run();
    console.log('All posts deleted', result);

    return NextResponse.json({ message: 'All posts deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.name === 'JWTExpired') {
        console.log('Session expired');
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    console.error('Error deleting all posts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
