import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignedStaff: {
          select: { id: true, name: true, role: true, phone: true },
        },
        items: true,
        dailyProductions: {
          include: {
            operator: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        },
        materialIssues: {
          include: {
            inventoryItem: true,
            issuedBy: { select: { id: true, name: true } },
          },
        },
        materialReturns: {
          include: {
            inventoryItem: true,
            returnedBy: { select: { id: true, name: true } },
          },
        },
        inkUsages: {
          include: {
            inventoryItem: true,
            operator: { select: { id: true, name: true } },
          },
          orderBy: { date: 'desc' },
        },
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const isProductionOrInventory =
      session?.role === Role.PRODUCTION || session?.role === Role.INVENTORY;

    if (isProductionOrInventory) {
      return NextResponse.json({
        job: {
          ...job,
          totalAmount: null,
          discount: null,
          tax: null,
          depositPaid: null,
          balanceDue: null,
          payments: [],
          items: job.items.map((i) => ({
            ...i,
            unitPrice: null,
            totalPrice: null,
          })),
        },
      });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    const body = await req.json();

    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        dailyProductions: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Business Rule Check: Cannot mark COMPLETED without production records
    if (body.status === 'COMPLETED') {
      if (existingJob.dailyProductions.length === 0) {
        return NextResponse.json(
          {
            error:
              'Job cannot be marked COMPLETED until production quantities have been recorded in the daily production module.',
          },
          { status: 400 }
        );
      }

      const totalOrdered = existingJob.items.reduce((s, i) => s + i.quantityOrdered, 0);
      const totalCompleted = existingJob.items.reduce((s, i) => s + i.quantityCompleted, 0);
      const totalRejected = existingJob.items.reduce((s, i) => s + i.quantityRejected, 0);

      if (totalCompleted + totalRejected === 0) {
        return NextResponse.json(
          {
            error:
              'Cannot complete job: No completed or rejected items recorded in production.',
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assignedStaffId !== undefined) updateData.assignedStaffId = body.assignedStaffId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.requiredDate !== undefined) updateData.requiredDate = new Date(body.requiredDate);
    if (body.designReference !== undefined) updateData.designReference = body.designReference;
    if (body.labourCostEstimate !== undefined) updateData.labourCostEstimate = Number(body.labourCostEstimate);
    if (body.overheadCostEstimate !== undefined) updateData.overheadCostEstimate = Number(body.overheadCostEstimate);
    if (body.packagingCostEstimate !== undefined) updateData.packagingCostEstimate = Number(body.packagingCostEstimate);
    if (body.deliveryCostEstimate !== undefined) updateData.deliveryCostEstimate = Number(body.deliveryCostEstimate);

    const updated = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'UPDATE',
      entity: 'Job',
      entityId: updated.id,
      details: `Updated job ${updated.jobNumber}. Status: ${updated.status}`,
    });

    return NextResponse.json({ job: updated, success: true });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
