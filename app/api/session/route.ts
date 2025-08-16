
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-is-at-least-32-bytes-long');

interface JWTPayload {
  userId: number;
  username: string;
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(session, secret) as { payload: JWTPayload };
    return NextResponse.json({ userId: payload.userId, username: payload.username });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
