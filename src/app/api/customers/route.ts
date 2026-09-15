export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CustomerSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const where: any = {
      isArchived: includeArchived ? undefined : false,
    };

    if (type) {
      where.customerType = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { customerNumber: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        jobs: {
          select: {
            id: true,
            jobNumber: true,
            totalAmount: true,
            depositPaid: true,
            balanceDue: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregates: total orders and outstanding balance
    const enrichedCustomers = customers.map((cust) => {
      const totalOrders = cust.jobs.length;
      const outstandingBalance = cust.jobs
        .filter((j) => j.status !== 'CANCELLED')
        .reduce((sum, j) => sum + j.balanceDue, 0);

      return {
        ...cust,
        totalOrders,
        outstandingBalance: Number(outstandingBalance.toFixed(2)),
      };
    });

    return NextResponse.json({ customers: enrichedCustomers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    // Allow admin, manager, sales
    if (session && !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.SALES])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const result = CustomerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Duplicate check on phone or email
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
        isArchived: false,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A customer with phone "${data.phone}" or email "${data.email}" already exists (${existing.name}).` },
        { status: 409 }
      );
    }

    // Auto-generate customer number
    const count = await prisma.customer.count();
    const customerNumber = `CUST-${String(count + 1).padStart(4, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        customerNumber,
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
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      details: `Created customer ${customer.name} (${customer.customerNumber})`,
    });

    return NextResponse.json({ customer, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
