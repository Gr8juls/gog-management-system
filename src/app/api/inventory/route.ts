export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { InventoryItemSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const garmentType = searchParams.get('garmentType');
    const color = searchParams.get('color');
    const size = searchParams.get('size');

    const where: any = { isActive: true };

    if (category) where.category = category;
    if (garmentType) where.garmentType = garmentType;
    if (color) where.color = color;
    if (size) where.size = size;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
        { color: { contains: search } },
        { storageLocation: { contains: search } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    let filteredItems = items;
    if (lowStockOnly) {
      filteredItems = items.filter((item) => item.currentStock <= item.reorderLevel);
    }

    // Compute inventory valuation
    const totalValuation = items.reduce(
      (sum, item) => sum + item.currentStock * item.unitCost,
      0
    );

    const lowStockCount = items.filter(
      (item) => item.currentStock <= item.reorderLevel
    ).length;

    return NextResponse.json({
      items: filteredItems,
      totalCount: items.length,
      lowStockCount,
      totalValuation: Number(totalValuation.toFixed(2)),
    });
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
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
      return NextResponse.json(
        { error: 'Only inventory staff, managers, and admins can add catalog items' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = InventoryItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check SKU collision
    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: data.sku },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Item with SKU "${data.sku}" already exists (${existing.name}).` },
        { status: 409 }
      );
    }

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          sku: data.sku,
          name: data.name,
          category: data.category,
          description: data.description || null,
          unitOfMeasure: data.unitOfMeasure,
          garmentType: data.garmentType || null,
          brand: data.brand || null,
          size: data.size || null,
          color: data.color || null,
          gender: data.gender || null,
          openingStock: data.openingStock,
          currentStock: data.openingStock,
          reorderLevel: data.reorderLevel,
          maxStockLevel: data.maxStockLevel || null,
          unitCost: data.unitCost,
          sellingPrice: data.sellingPrice || null,
          supplierId: data.supplierId || null,
          storageLocation: data.storageLocation || null,
        },
      });

      // Record Opening Balance Transaction
      if (data.openingStock > 0) {
        const txnNumber = `TXN-OPN-${created.sku}`;
        await tx.stockTransaction.create({
          data: {
            transactionNumber: txnNumber,
            inventoryItemId: created.id,
            type: 'OPENING_BALANCE',
            quantity: data.openingStock,
            unitCost: data.unitCost,
            balanceAfter: data.openingStock,
            referenceType: 'MANUAL',
            notes: 'Initial inventory creation opening balance',
            createdById: session?.id || null,
            isApproved: true,
          },
        });
      }

      return created;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: item.id,
      details: `Created inventory item ${item.sku} - ${item.name}`,
    });

    return NextResponse.json({ item, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
