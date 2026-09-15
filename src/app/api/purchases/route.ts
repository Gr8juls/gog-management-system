export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PurchaseCreateSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        receivedBy: { select: { id: true, name: true } },
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return NextResponse.json({ purchases });
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
    const result = PurchaseCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const purchaseCount = await prisma.purchase.count();
    const purchaseNumber = `PO-${String(purchaseCount + 1).padStart(6, '0')}`;

    let totalCost = 0;
    const purchaseItemsData = data.items.map((it) => {
      const lineTotal = Number((it.quantity * it.unitCost).toFixed(2));
      totalCost += lineTotal;
      return {
        inventoryItemId: it.inventoryItemId,
        quantity: it.quantity,
        unitCost: it.unitCost,
        totalCost: lineTotal,
      };
    });

    totalCost = Number(totalCost.toFixed(2));
    const balanceDue = Number((totalCost - data.amountPaid).toFixed(2));
    const paymentStatus =
      data.amountPaid >= totalCost
        ? 'PAID'
        : data.amountPaid > 0
        ? 'PARTIALLY_PAID'
        : 'UNPAID';

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const createdPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
          expectedPaymentDate: data.expectedPaymentDate ? new Date(data.expectedPaymentDate) : null,
          totalCost,
          amountPaid: data.amountPaid,
          balanceDue,
          paymentStatus,
          status: 'RECEIVED',
          notes: data.notes || null,
          receivedById: session?.id || null,
          items: {
            create: purchaseItemsData,
          },
        },
        include: {
          supplier: true,
          items: { include: { inventoryItem: true } },
        },
      });

      // 2. Automatically increase inventory stock for each purchased item & record transaction
      for (const item of data.items) {
        const currentItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });

        if (currentItem) {
          const newStock = Number((currentItem.currentStock + item.quantity).toFixed(2));

          // Update inventory stock and unit cost
          await tx.inventoryItem.update({
            where: { id: currentItem.id },
            data: {
              currentStock: newStock,
              unitCost: item.unitCost, // Update latest purchase cost
            },
          });

          // Create stock transaction
          const txnCount = await tx.stockTransaction.count();
          await tx.stockTransaction.create({
            data: {
              transactionNumber: `TXN-${String(txnCount + 1).padStart(7, '0')}`,
              inventoryItemId: currentItem.id,
              type: 'PURCHASE_RECEIPT',
              quantity: item.quantity,
              unitCost: item.unitCost,
              balanceAfter: newStock,
              referenceType: 'PURCHASE',
              referenceId: createdPurchase.id,
              notes: `Stock received via Purchase Order ${purchaseNumber}`,
              createdById: session?.id || null,
              isApproved: true,
            },
          });
        }
      }

      return createdPurchase;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'PURCHASE_RECEIPT',
      entity: 'Purchase',
      entityId: purchase.id,
      details: `Received purchase ${purchase.purchaseNumber} from ${purchase.supplier.name}. Total: $${totalCost}`,
    });

    return NextResponse.json({ purchase, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating purchase receipt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
