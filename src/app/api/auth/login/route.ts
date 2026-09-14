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
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
