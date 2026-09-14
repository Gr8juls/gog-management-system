import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MaterialReturnSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (
      session &&
      !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.INVENTORY, Role.PRODUCTION])
    ) {
      return NextResponse.json({ error: 'Unauthorized to return materials' }, { status: 403 });
    }

    const body = await req.json();
    const result = MaterialReturnSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    const returnRecord = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      const job = await tx.job.findUnique({
        where: { id: data.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Add back to inventory
      const newStock = Number((item.currentStock + data.quantityReturned).toFixed(2));
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { currentStock: newStock },
      });

      // Create MaterialReturn record
      const returnCount = await tx.materialReturn.count();
      const returnNumber = `RET-${String(returnCount + 1).padStart(6, '0')}`;

      const materialRet = await tx.materialReturn.create({
        data: {
          returnNumber,
          jobId: data.jobId,
          inventoryItemId: data.inventoryItemId,
          quantityReturned: data.quantityReturned,
          returnedById: session?.id || null,
          receivedById: data.receivedById || null,
          notes: data.notes || null,
        },
        include: {
          inventoryItem: true,
          job: { select: { jobNumber: true } },
        },
      });

      // Record Stock Transaction
      const txnCount = await tx.stockTransaction.count();
      await tx.stockTransaction.create({
        data: {
          transactionNumber: `TXN-${String(txnCount + 1).padStart(7, '0')}`,
          inventoryItemId: item.id,
          type: 'RETURN_FROM_PRODUCTION',
          quantity: data.quantityReturned,
          unitCost: item.unitCost,
          balanceAfter: newStock,
          referenceType: 'JOB',
          jobId: job.id,
          notes: `Unused material returned from job ${job.jobNumber} (${returnNumber})`,
          createdById: session?.id || null,
          isApproved: true,
        },
      });

      return materialRet;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'MATERIAL_RETURN',
      entity: 'MaterialReturn',
      entityId: returnRecord.id,
      details: `Returned ${data.quantityReturned} ${returnRecord.inventoryItem.name} from job ${returnRecord.job.jobNumber}`,
    });

    return NextResponse.json({ returnRecord, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error returning materials:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
