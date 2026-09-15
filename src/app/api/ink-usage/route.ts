export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { InkUsageSchema } from '@/lib/validations';
import { getSessionUser } from '@/lib/auth';
import { calculateInkTotalConsumption } from '@/lib/calculations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const color = searchParams.get('color');
    const reason = searchParams.get('reason');

    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (color) where.color = color;
    if (reason) where.reason = reason;

    const inkLogs = await prisma.inkUsage.findMany({
      where,
      include: {
        job: { select: { id: true, jobNumber: true, customer: { select: { name: true } } } },
        inventoryItem: { select: { id: true, name: true, sku: true, unitCost: true, currentStock: true } },
        operator: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Aggregates
    const totalUsed = inkLogs.reduce((sum, log) => sum + log.quantityUsed, 0);
    const totalWasted = inkLogs.reduce((sum, log) => sum + log.quantityWasted, 0);
    const totalConsumption = calculateInkTotalConsumption(totalUsed, 0, totalWasted);

    // Group by color
    const colorBreakdown: Record<string, { used: number; wasted: number; cost: number }> = {};
    for (const log of inkLogs) {
      if (!colorBreakdown[log.color]) {
        colorBreakdown[log.color] = { used: 0, wasted: 0, cost: 0 };
      }
      colorBreakdown[log.color].used += log.quantityUsed;
      colorBreakdown[log.color].wasted += log.quantityWasted;
      const unitCost = log.inventoryItem?.unitCost || 0;
      colorBreakdown[log.color].cost += (log.quantityUsed + log.quantityWasted) * unitCost;
    }

    return NextResponse.json({
      inkLogs,
      summary: {
        totalUsed: Number(totalUsed.toFixed(2)),
        totalWasted: Number(totalWasted.toFixed(2)),
        totalConsumption,
        colorBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Error fetching ink usage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await req.json();

    const result = InkUsageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const totalDeduction = data.quantityUsed + data.quantityWasted;

    const record = await prisma.$transaction(async (tx) => {
      const inkItem = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!inkItem) {
        throw new Error('Selected ink item does not exist in inventory');
      }

      // Deduct ink from inventory
      const newStock = Math.max(0, Number((inkItem.currentStock - totalDeduction).toFixed(2)));
      await tx.inventoryItem.update({
        where: { id: inkItem.id },
        data: { currentStock: newStock },
      });

      // Record Stock Transaction for audit
      const txnCount = await tx.stockTransaction.count();
      await tx.stockTransaction.create({
        data: {
          transactionNumber: `TXN-${String(txnCount + 1).padStart(7, '0')}`,
          inventoryItemId: inkItem.id,
          type: 'ISSUE_TO_PRODUCTION',
          quantity: -totalDeduction,
          unitCost: inkItem.unitCost,
          balanceAfter: newStock,
          referenceType: data.jobId ? 'JOB' : 'MANUAL',
          jobId: data.jobId || null,
          reason: data.reason,
          notes: `Ink consumed: ${data.quantityUsed} ${data.unitOfMeasure} used, ${data.quantityWasted} ${data.unitOfMeasure} wasted. (${data.reason})`,
          createdById: session?.id || null,
          isApproved: true,
        },
      });

      // Create InkUsage record
      const inkLog = await tx.inkUsage.create({
        data: {
          jobId: data.jobId || null,
          inventoryItemId: data.inventoryItemId,
          color: data.color,
          brand: data.brand || inkItem.brand || null,
          inkType: data.inkType || inkItem.description || null,
          quantityUsed: data.quantityUsed,
          quantityWasted: data.quantityWasted,
          unitOfMeasure: data.unitOfMeasure,
          operatorId: session?.id || null,
          reason: data.reason,
          notes: data.notes || null,
        },
        include: {
          job: { select: { jobNumber: true } },
          inventoryItem: true,
          operator: { select: { name: true } },
        },
      });

      return inkLog;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'CREATE',
      entity: 'InkUsage',
      entityId: record.id,
      details: `Logged ink usage: ${record.quantityUsed} ${record.unitOfMeasure} ${record.color} ink. Job: ${record.job?.jobNumber || 'None'}`,
    });

    return NextResponse.json({ record, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording ink usage:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
