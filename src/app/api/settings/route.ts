export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ settings: settingsMap, list: settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (session && !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER])) {
      return NextResponse.json({ error: 'Only admins and managers can change settings' }, { status: 403 });
    }

    const { settings } = await req.json(); // Array of { key, value }
    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings array required' }, { status: 400 });
    }

    for (const item of settings) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: String(item.value) },
        create: { key: item.key, value: String(item.value) },
      });
    }

    await logAuditEvent({
      userId: session?.id,
      action: 'UPDATE_SETTINGS',
      entity: 'SystemSetting',
      details: `Updated ${settings.length} system configuration parameters`,
    });

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
