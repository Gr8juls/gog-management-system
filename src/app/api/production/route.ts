export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DailyProductionSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import {
  calculateQuantityRemaining,
  calculateQuantityPending,
  validateProductionLimits,
} from '@/lib/calculations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const jobId = searchParams.get('jobId');
    const operatorId = searchParams.get('operatorId');
    const productionMethod = searchParams.get('productionMethod');
    const qualityStatus = searchParams.get('qualityStatus');

    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (operatorId) where.operatorId = operatorId;
    if (productionMethod) where.productionMethod = productionMethod;
    if (qualityStatus) where.qualityStatus = qualityStatus;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    const records = await prisma.dailyProduction.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            customer: { select: { id: true, name: true } },
          },
        },
        jobItem: true,
        operator: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('Error fetching production records:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await req.json();

    const result = DailyProductionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Fetch the target Job and its line items
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      include: {
        items: true,
        dailyProductions: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Referenced Job does not exist' }, { status: 404 });
    }

    // Determine total ordered quantity for validation
    let targetItem = null;
    let totalOrdered = 0;
    let completedSoFar = 0;
    let rejectedSoFar = 0;

    if (data.jobItemId) {
      targetItem = job.items.find((i) => i.id === data.jobItemId);
      if (targetItem) {
        totalOrdered = targetItem.quantityOrdered;
        completedSoFar = targetItem.quantityCompleted;
        rejectedSoFar = targetItem.quantityRejected;
      }
    } else {
      totalOrdered = job.items.reduce((s, i) => s + i.quantityOrdered, 0);
      completedSoFar = job.items.reduce((s, i) => s + i.quantityCompleted, 0);
      rejectedSoFar = job.items.reduce((s, i) => s + i.quantityRejected, 0);
    }

    // Validate production limits: completed + rejected cannot exceed ordered without manager approval
    const isManagerOrAdmin =
      session?.role === Role.MANAGER || session?.role === Role.ADMIN;
    const isOverrideApproved = data.managerApproved || isManagerOrAdmin;

    const limitCheck = validateProductionLimits({
      quantityOrdered: totalOrdered,
      totalCompletedSoFar: completedSoFar,
      totalRejectedSoFar: rejectedSoFar,
      newCompleted: data.quantityCompleted,
      newRejected: data.quantityRejected,
      isManagerApproved: isOverrideApproved,
    });

    if (!limitCheck.isValid) {
      return NextResponse.json(
        {
          error: limitCheck.error,
          requiresManagerApproval: true,
        },
        { status: 422 }
      );
    }

    // Calculate remaining quantity in this production run
    const quantityRemaining = calculateQuantityRemaining(
      data.quantityPlanned,
      data.quantityCompleted,
      data.quantityRejected,
      data.quantityDamaged
    );

    const record = await prisma.$transaction(async (tx) => {
      // 1. Create the Daily Production record
      const prodRecord = await tx.dailyProduction.create({
        data: {
          date: data.date ? new Date(data.date) : new Date(),
          jobId: data.jobId,
          jobItemId: data.jobItemId || null,
          product: data.product,
          productionMethod: data.productionMethod,
          quantityPlanned: data.quantityPlanned,
          quantityStarted: data.quantityStarted,
          quantityCompleted: data.quantityCompleted,
          quantityRejected: data.quantityRejected,
          quantityDamaged: data.quantityDamaged,
          quantityRemaining,
          operatorId: data.operatorId || session?.id || null,
          workstation: data.workstation || null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          notes: data.notes || null,
          qualityStatus: data.qualityStatus,
          managerApproved: isOverrideApproved,
        },
        include: {
          job: { select: { jobNumber: true } },
          jobItem: true,
          operator: { select: { name: true } },
        },
      });

      // 2. Update the corresponding JobItem (or first item) counts
      if (targetItem) {
        const newCompleted = targetItem.quantityCompleted + data.quantityCompleted;
        const newRejected = targetItem.quantityRejected + data.quantityRejected;
        const newDamaged = targetItem.quantityDamaged + data.quantityDamaged;
        const newPending = calculateQuantityPending(
          targetItem.quantityOrdered,
          newCompleted,
          newRejected,
          0
        );

        await tx.jobItem.update({
          where: { id: targetItem.id },
          data: {
            quantityCompleted: newCompleted,
            quantityRejected: newRejected,
            quantityDamaged: newDamaged,
            quantityPending: newPending,
          },
        });
      } else if (job.items.length > 0) {
        // Distribute to the first line item
        const firstItem = job.items[0];
        const newCompleted = firstItem.quantityCompleted + data.quantityCompleted;
        const newRejected = firstItem.quantityRejected + data.quantityRejected;
        const newDamaged = firstItem.quantityDamaged + data.quantityDamaged;
        const newPending = calculateQuantityPending(
          firstItem.quantityOrdered,
          newCompleted,
          newRejected,
          0
        );

        await tx.jobItem.update({
          where: { id: firstItem.id },
          data: {
            quantityCompleted: newCompleted,
            quantityRejected: newRejected,
            quantityDamaged: newDamaged,
            quantityPending: newPending,
          },
        });
      }

      // 3. If job status was APPROVED or MATERIALS_RESERVED, move to IN_PRODUCTION
      if (['APPROVED', 'MATERIALS_RESERVED'].includes(job.status)) {
        await tx.job.update({
          where: { id: job.id },
          data: { status: 'IN_PRODUCTION' },
        });
      }

      return prodRecord;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'CREATE',
      entity: 'DailyProduction',
      entityId: record.id,
      details: `Logged production for job ${record.job?.jobNumber}: ${record.quantityCompleted} completed, ${record.quantityRejected} rejected, ${record.quantityDamaged} damaged.`,
    });

    return NextResponse.json({ record, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error logging daily production:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
