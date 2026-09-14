import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, createSessionToken, setSessionCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      // For ease of demoing, if no session, check if demo user exists and fallback or return null
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Quick role-switch endpoint for evaluation & pair-programming testing
export async function POST(req: NextRequest) {
  try {
    const { targetRole } = await req.json();
    const user = await prisma.user.findFirst({
      where: { role: targetRole, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: `No active user found with role ${targetRole}` }, { status: 404 });
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
    });

    setSessionCookie(token);

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
