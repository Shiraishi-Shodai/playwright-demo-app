import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-is-at-least-32-bytes-long');

interface JWTPayload {
  userId: number;
  username: string;
}

export async function getSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(session, secret) as { payload: JWTPayload };
    return { userId: payload.userId, username: payload.username };
  } catch (err) {
    console.error("Session verification failed:", err);
    return null;
  }
}
