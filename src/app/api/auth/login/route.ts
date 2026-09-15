export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { LoginSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials or inactive account' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
    });

    setSessionCookie(token);

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      details: `User ${user.email} logged in successfully`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    const isDbConnectionError =
      error.message?.includes('Server selection timeout') ||
      error.message?.includes('No available servers') ||
      error.message?.includes('timed out') ||
      error.code === 'P2010' ||
      error.code === 'P1001';

    const errorMessage = isDbConnectionError
      ? 'Database connection timed out: Unable to reach MongoDB on port 27017. Please check your MongoDB Atlas IP whitelist or local MongoDB service.'
      : (error.message || 'Internal server error');

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}
