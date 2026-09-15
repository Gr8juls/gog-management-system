export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SupplierSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { supplierCode: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        purchases: {
          select: {
            id: true,
            purchaseNumber: true,
            totalCost: true,
            amountPaid: true,
            balanceDue: true,
            paymentStatus: true,
            purchaseDate: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ suppliers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (
      session &&
      !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.INVENTORY])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const result = SupplierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const count = await prisma.supplier.count();
    const supplierCode = `SUP-${String(count + 1).padStart(3, '0')}`;

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name: data.name,
        contactPerson: data.contactPerson || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        taxNumber: data.taxNumber || null,
        productsSupplied: data.productsSupplied || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      },
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'CREATE',
      entity: 'Supplier',
      entityId: supplier.id,
      details: `Created supplier ${supplier.name} (${supplier.supplierCode})`,
    });

    return NextResponse.json({ supplier, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
