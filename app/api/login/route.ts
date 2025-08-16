
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-jwt-that-is-at-least-32-bytes-long');
// Note: In a real-world serverless environment, you might want to manage DB connections differently.
const db = new Database('db/database.db');

export async function POST(request: Request) {
  console.log('--- Login API called ---');
  try {
    const { username, password } = await request.json();
    console.log('Request body:', { username, password });

    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as { id: number; username: string; password: string } | undefined;
    console.log('User from DB:', user);

    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    console.log('Comparing passwords...');
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', passwordMatch);

    if (!passwordMatch) {
      console.log('Password does not match');
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    console.log('Login successful, creating token...');
    const token = await new SignJWT({ userId: user.id, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    console.log('Token created and cookie set. Sending response.');
    return response;
  } catch (error) {
    console.error('An error occurred in the login API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
