export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, isAuthorized, hashPassword } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (session && !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (session && !isAuthorized(session.role, [Role.ADMIN])) {
      return NextResponse.json({ error: 'Only administrators can create users' }, { status: 403 });
    }

    const { email, name, password, role, phone } = await req.json();
    if (!email || !name || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
      },
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Created new user ${user.name} (${user.email}) with role ${user.role}`,
    });

    return NextResponse.json({ user, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
