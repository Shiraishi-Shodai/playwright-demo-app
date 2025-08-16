import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getSession } from '@/lib/session';

const db = new Database('db/database.db');

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(request);
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ message: 'Content is required' }, { status: 400 });
    }

    const stmt = db.prepare('UPDATE posts SET content = ? WHERE id = ? AND user_id = ?');
    const info = stmt.run(content, id, session.userId);

    if (info.changes === 0) {
      return NextResponse.json({ message: 'Post not found or not authorized to update' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ message: 'Error updating post' }, { status: 500 });
  }
}
