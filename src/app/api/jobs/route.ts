export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { JobCreateSchema } from '@/lib/validations';
import { getSessionUser, isAuthorized } from '@/lib/auth';
import { Role } from '@/lib/types';
import { calculateQuantityPending } from '@/lib/calculations';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    const priority = searchParams.get('priority') || '';

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { jobNumber: { contains: search } },
        { designReference: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, customerNumber: true },
        },
        assignedStaff: {
          select: { id: true, name: true, role: true },
        },
        items: true,
        dailyProductions: {
          select: {
            id: true,
            quantityCompleted: true,
            quantityRejected: true,
            quantityDamaged: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check user role for masking sensitive finances
    const isProductionOrInventory =
      session?.role === Role.PRODUCTION || session?.role === Role.INVENTORY;

    const sanitizedJobs = jobs.map((job) => {
      const totalOrdered = job.items.reduce((s, i) => s + i.quantityOrdered, 0);
      const totalCompleted = job.items.reduce((s, i) => s + i.quantityCompleted, 0);
      const totalPending = job.items.reduce((s, i) => s + i.quantityPending, 0);

      const jobObj = {
        ...job,
        totalOrdered,
        totalCompleted,
        totalPending,
      };

      if (isProductionOrInventory) {
        // Mask financial fields for shop floor staff
        return {
          ...jobObj,
          totalAmount: null,
          discount: null,
          tax: null,
          depositPaid: null,
          balanceDue: null,
          items: job.items.map((it) => ({
            ...it,
            unitPrice: null,
            totalPrice: null,
          })),
        };
      }

      return jobObj;
    });

    return NextResponse.json({ jobs: sanitizedJobs });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (session && !isAuthorized(session.role, [Role.ADMIN, Role.MANAGER, Role.SALES])) {
      return NextResponse.json({ error: 'Production and inventory staff cannot create jobs' }, { status: 403 });
    }

    const body = await req.json();
    const result = JobCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;

    // Generate Job Number e.g. GOG-000001
    const jobCount = await prisma.job.count();
    const jobNumber = `GOG-${String(jobCount + 1).padStart(6, '0')}`;

    // Calculate item pricing and pending quantities
    let subtotal = 0;
    const itemsToCreate = data.items.map((item) => {
      const totalPrice = Number((item.quantityOrdered * item.unitPrice).toFixed(2));
      subtotal += totalPrice;
      const quantityPending = calculateQuantityPending(item.quantityOrdered, 0, 0, 0);

      return {
        itemDescription: item.itemDescription,
        garmentType: item.garmentType || null,
        brand: item.brand || null,
        size: item.size || null,
        color: item.color || null,
        quantityOrdered: item.quantityOrdered,
        quantityCompleted: 0,
        quantityRejected: 0,
        quantityDamaged: 0,
        quantityReturned: 0,
        quantityPending,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const totalAmount = Number((subtotal - data.discount + data.tax).toFixed(2));
    const balanceDue = Number((totalAmount - data.depositPaid).toFixed(2));

    const newJob = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          jobNumber,
          customerId: data.customerId,
          requiredDate: new Date(data.requiredDate),
          productType: data.productType,
          brandingMethod: data.brandingMethod,
          designReference: data.designReference || null,
          assignedStaffId: data.assignedStaffId || null,
          priority: data.priority,
          status: 'APPROVED', // Default to approved on creation by sales/admin
          totalAmount,
          discount: data.discount,
          tax: data.tax,
          depositPaid: data.depositPaid,
          balanceDue,
          notes: data.notes || null,
          labourCostEstimate: data.labourCostEstimate || 0,
          overheadCostEstimate: data.overheadCostEstimate || 0,
          packagingCostEstimate: data.packagingCostEstimate || 0,
          deliveryCostEstimate: data.deliveryCostEstimate || 0,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // If deposit was paid upfront, create a payment record
      if (data.depositPaid > 0) {
        const payCount = await tx.payment.count();
        await tx.payment.create({
          data: {
            paymentNumber: `PAY-${String(payCount + 1).padStart(6, '0')}`,
            jobId: job.id,
            amount: data.depositPaid,
            paymentMethod: 'CASH',
            paymentStatus: 'COMPLETED',
            notes: 'Initial deposit upon job order creation',
            recordedById: session?.id || null,
          },
        });
      }

      return job;
    });

    await logAuditEvent({
      userId: session?.id,
      action: 'CREATE',
      entity: 'Job',
      entityId: newJob.id,
      details: `Created job ${newJob.jobNumber} with ${itemsToCreate.length} line items. Total: $${totalAmount}`,
    });

    return NextResponse.json({ job: newJob, success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
