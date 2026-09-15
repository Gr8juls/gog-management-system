export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MaterialIssueSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (
      session &&
      !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.INVENTORY])
    ) {
      return NextResponse.json(
        { error: 'Only inventory staff, managers, and admins can issue materials' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = MaterialIssueSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    const issueRecord = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!item) {
        throw new Error('Inventory item not found');
      }

      if (item.currentStock < data.quantityIssued) {
        throw new Error(
          `Insufficient inventory. Requested ${data.quantityIssued} ${item.unitOfMeasure}, but only ${item.currentStock} is in stock.`
        );
      }

      const job = await tx.job.findUnique({
        where: { id: data.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Deduct stock from inventory
      const newStock = Number((item.currentStock - data.quantityIssued).toFixed(2));
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { currentStock: newStock },
      });

      // Create MaterialIssue record
      const issueCount = await tx.materialIssue.count();
      const issueNumber = `ISSUE-${String(issueCount + 1).padStart(6, '0')}`;

      const issue = await tx.materialIssue.create({
        data: {
          issueNumber,
          jobId: data.jobId,
          inventoryItemId: data.inventoryItemId,
          quantityIssued: data.quantityIssued,
          issuedById: session?.id || null,
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
          type: 'ISSUE_TO_PRODUCTION',
          quantity: -data.quantityIssued,
          unitCost: item.unitCost,
          balanceAfter: newStock,
          referenceType: 'JOB',
          jobId: job.id,
          notes: `Material issued to job ${job.jobNumber} (${issueNumber})`,
          createdById: session?.id || null,
          isApproved: true,
        },
      });

      // Update Job status to MATERIALS_RESERVED or IN_PRODUCTION if currently APPROVED
      if (job.status === 'APPROVED') {
        await tx.job.update({
          where: { id: job.id },
          data: { status: 'MATERIALS_RESERVED' },
        });
      }

      return issue;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'MATERIAL_ISSUE',
      entity: 'MaterialIssue',
      entityId: issueRecord.id,
      details: `Issued ${data.quantityIssued} ${issueRecord.inventoryItem.name} to job ${issueRecord.job.jobNumber}`,
    });

    return NextResponse.json({ issue: issueRecord, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error issuing materials:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
