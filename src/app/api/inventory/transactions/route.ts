export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { StockTransactionSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { calculateNewStockLevel } from '@/lib/calculations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const type = searchParams.get('type');
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (itemId) where.inventoryItemId = itemId;
    if (type) where.type = type;
    if (jobId) where.jobId = jobId;

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unitOfMeasure: true,
          },
        },
        job: { select: { id: true, jobNumber: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching stock transactions:', error);
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
        { error: 'Sales and production staff cannot perform direct stock adjustments' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = StockTransactionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Rule: Stock adjustments require a reason
    if (['ADJUSTMENT', 'DAMAGE', 'WASTAGE', 'STOCK_COUNT_CORRECTION'].includes(data.type) && !data.reason) {
      return NextResponse.json(
        { error: 'A specific reason is mandatory for adjustments, damage, wastage, or stock count corrections.' },
        { status: 422 }
      );
    }

    // Adjustments may require manager approval if user is only INVENTORY
    const isManagerOrAdmin =
      session?.role === Role.MANAGER || session?.role === Role.ADMIN;
    const isApproved = isManagerOrAdmin ? true : data.isApproved;

    const transactionRecord = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      // Calculate new stock level using verified business logic
      const balanceAfter = calculateNewStockLevel(item.currentStock, data.type, data.quantity);

      // Guard against negative stock
      if (balanceAfter < 0 && !isManagerOrAdmin) {
        throw new Error(
          `Insufficient stock. Current stock is ${item.currentStock} ${item.unitOfMeasure}. Transaction would result in negative balance (${balanceAfter}).`
        );
      }

      // Update current stock on item
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { currentStock: balanceAfter },
      });

      const txnCount = await tx.stockTransaction.count();
      const transactionNumber = `TXN-${String(txnCount + 1).padStart(7, '0')}`;

      // Create ledger transaction entry
      const createdTxn = await tx.stockTransaction.create({
        data: {
          transactionNumber,
          inventoryItemId: item.id,
          type: data.type,
          quantity: data.quantity,
          unitCost: data.unitCost || item.unitCost,
          balanceAfter,
          referenceType: data.jobId ? 'JOB' : 'MANUAL',
          jobId: data.jobId || null,
          notes: data.notes || null,
          reason: data.reason || null,
          createdById: session?.id || null,
          approvedById: isApproved ? (session?.id || null) : null,
          isApproved,
        },
        include: {
          inventoryItem: true,
          createdBy: { select: { name: true } },
        },
      });

      return createdTxn;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'STOCK_TRANSACTION',
      entity: 'StockTransaction',
      entityId: transactionRecord.id,
      details: `${transactionRecord.type}: ${data.quantity} units for ${transactionRecord.inventoryItem.name}. New balance: ${transactionRecord.balanceAfter}`,
    });

    return NextResponse.json({ transaction: transactionRecord, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stock transaction:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
