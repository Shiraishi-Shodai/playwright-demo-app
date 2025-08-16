
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-is-at-least-32-bytes-long');
const db = new Database('db/database.db');

interface JWTPayload {
  userId: number;
  username: string;
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = request.cookies.get('session')?.value;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(session, secret) as { payload: JWTPayload };
    const loggedInUserId = payload.userId;
    const postId = parseInt(params.id, 10);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Get the post to check ownership
    const getPostStmt = db.prepare('SELECT user_id FROM posts WHERE id = ?');
    const post = getPostStmt.get(postId) as { user_id: number } | undefined;

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if the logged-in user is the owner of the post
    if (post.user_id !== loggedInUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the post
    const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
    const result = deleteStmt.run(postId);

    if (result.changes === 0) {
        return NextResponse.json({ error: 'Post not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
