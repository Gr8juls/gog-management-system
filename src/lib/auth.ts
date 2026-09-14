import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gog-secret-key-at-least-32-chars-long-secure!'
);

const TOKEN_NAME = 'gog_session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
    };
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function removeSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(TOKEN_NAME);
}

export function isAuthorized(userRole: string, allowedRoles: Role[]): boolean {
  if (userRole === Role.ADMIN) return true; // Admins have full access
  return allowedRoles.includes(userRole as Role);
}
