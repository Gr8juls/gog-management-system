export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    const where: any = {};
    if (jobId) where.jobId = jobId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            totalAmount: true,
            depositPaid: true,
            balanceDue: true,
            customer: { select: { name: true } },
          },
        },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (
      session &&
      !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.SALES])
    ) {
      return NextResponse.json(
        { error: 'Production and inventory staff cannot record payments' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = PaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    const paymentResult = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: data.jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-${String(payCount + 1).padStart(6, '0')}`;

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          jobId: data.jobId,
          amount: data.amount,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          paymentMethod: data.paymentMethod,
          reference: data.reference || null,
          paymentStatus: 'COMPLETED',
          notes: data.notes || null,
          recordedById: session?.id || null,
        },
        include: {
          job: { select: { jobNumber: true } },
        },
      });

      // Update Job deposit and balance
      const newDeposit = Number((job.depositPaid + data.amount).toFixed(2));
      const newBalance = Math.max(0, Number((job.totalAmount - newDeposit).toFixed(2)));

      await tx.job.update({
        where: { id: job.id },
        data: {
          depositPaid: newDeposit,
          balanceDue: newBalance,
        },
      });

      return payment;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'PAYMENT_RECEIVED',
      entity: 'Payment',
      entityId: paymentResult.id,
      details: `Payment of $${data.amount} recorded for job ${paymentResult.job.jobNumber}`,
    });

    return NextResponse.json({ payment: paymentResult, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
