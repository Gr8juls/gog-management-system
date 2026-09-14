import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CustomerSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        jobs: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const outstandingBalance = customer.jobs
      .filter((j) => j.status !== 'CANCELLED')
      .reduce((sum, j) => sum + j.balanceDue, 0);

    return NextResponse.json({
      customer: {
        ...customer,
        totalOrders: customer.jobs.length,
        outstandingBalance: Number(outstandingBalance.toFixed(2)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (session && !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.SALES])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const result = CustomerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        customerType: data.customerType,
        notes: data.notes || null,
      },
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: updated.id,
      details: `Updated customer ${updated.name}`,
    });

    return NextResponse.json({ customer: updated, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (session && !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER])) {
      return NextResponse.json({ error: 'Only managers and admins can archive customers' }, { status: 403 });
    }

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { isArchived: true },
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'ARCHIVE',
      entity: 'Customer',
      entityId: customer.id,
      details: `Archived customer ${customer.name}`,
    });

    return NextResponse.json({ success: true, message: 'Customer archived' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
