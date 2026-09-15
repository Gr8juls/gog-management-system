import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@/lib/types';
import { calculateJobProfitability } from '@/lib/calculations';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'thisMonth'; // today, thisWeek, thisMonth, all

    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === 'today') {
      // today start
    } else if (range === 'thisWeek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(2020, 0, 1);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Job counts
    const jobsReceivedToday = await prisma.job.count({
      where: { dateReceived: { gte: todayStart, lte: todayEnd } },
    });

    const jobsInProduction = await prisma.job.count({
      where: { status: 'IN_PRODUCTION' },
    });

    const jobsCompletedToday = await prisma.job.count({
      where: {
        status: 'COMPLETED',
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const jobsDueToday = await prisma.job.count({
      where: {
        requiredDate: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'] },
      },
    });

    const pendingJobs = await prisma.job.count({
      where: {
        status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'] },
      },
    });

    // 2. Production stats today
    const productionToday = await prisma.dailyProduction.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: {
        job: { select: { productType: true } },
      },
    });

    const tshirtsBrandedToday = productionToday
      .filter((p) => p.job?.productType?.toLowerCase().includes('shirt'))
      .reduce((sum, p) => sum + p.quantityCompleted, 0);

    const rejectedToday = productionToday.reduce((sum, p) => sum + p.quantityRejected, 0);
    const damagedToday = productionToday.reduce((sum, p) => sum + p.quantityDamaged, 0);

    // 3. Ink used today
    const inkToday = await prisma.inkUsage.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
    });
    const inkUsedToday = Number(inkToday.reduce((sum, i) => sum + i.quantityUsed, 0).toFixed(1));

    // 4. Low stock count and items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { isActive: true },
    });
    const lowStockItems = inventoryItems.filter((it) => it.currentStock <= it.reorderLevel);

    // 5. Financials (Total sales & profit)
    const completedJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: true,
        materialIssues: { include: { inventoryItem: true } },
        inkUsages: { include: { inventoryItem: true } },
      },
    });

    let totalSales = 0;
    let totalEstimatedProfit = 0;

    for (const j of completedJobs) {
      totalSales += j.totalAmount;

      const blankCost = j.materialIssues.reduce(
        (sum, m) => sum + m.quantityIssued * m.inventoryItem.unitCost,
        0
      );
      const inkCost = j.inkUsages.reduce(
        (sum, i) => sum + (i.quantityUsed + i.quantityWasted) * i.inventoryItem.unitCost,
        0
      );

      const profitCalc = calculateJobProfitability({
        revenue: j.totalAmount,
        blankProductCost: blankCost,
        inkCost,
        labourCost: j.labourCostEstimate,
        consumablesCost: j.overheadCostEstimate,
        packagingCost: j.packagingCostEstimate,
        deliveryCost: j.deliveryCostEstimate,
      });

      totalEstimatedProfit += profitCalc.estimatedProfit;
    }

    // 6. Recent jobs & movements
    const recentJobs = await prisma.job.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        items: true,
      },
    });

    const recentStockMovements = await prisma.stockTransaction.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryItem: { select: { sku: true, name: true, unitOfMeasure: true } },
        createdBy: { select: { name: true } },
      },
    });

    // 7. Dynamic Alerts
    const overdueJobs = await prisma.job.findMany({
      where: {
        requiredDate: { lt: todayStart },
        status: { notIn: ['COMPLETED', 'DELIVERED', 'CANCELLED'] },
      },
      select: { id: true, jobNumber: true, requiredDate: true },
    });

    const unapprovedStockAdjustments = await prisma.stockTransaction.findMany({
      where: { isApproved: false },
      select: { id: true, transactionNumber: true, reason: true },
    });

    const unpaidJobBalances = await prisma.job.findMany({
      where: {
        balanceDue: { gt: 0 },
        status: { in: ['COMPLETED', 'DELIVERED'] },
      },
      select: { id: true, jobNumber: true, balanceDue: true },
    });

    const alerts = [
      ...lowStockItems.map((item) => ({
        type: 'LOW_STOCK',
        title: `Low Stock: ${item.name}`,
        message: `Current stock (${item.currentStock} ${item.unitOfMeasure}) is at or below reorder level (${item.reorderLevel}).`,
        severity: 'warning',
      })),
      ...overdueJobs.map((j) => ({
        type: 'OVERDUE_JOB',
        title: `Overdue Job: ${j.jobNumber}`,
        message: `Due date was ${new Date(j.requiredDate).toLocaleDateString()}. Production still pending.`,
        severity: 'error',
      })),
      ...unapprovedStockAdjustments.map((t) => ({
        type: 'UNAPPROVED_ADJUSTMENT',
        title: `Pending Adjustment: ${t.transactionNumber}`,
        message: `Reason: ${t.reason || 'Not specified'}. Awaiting manager review.`,
        severity: 'info',
      })),
      ...unpaidJobBalances.map((j) => ({
        type: 'UNPAID_BALANCE',
        title: `Unpaid Job Balance: ${j.jobNumber}`,
        message: `Outstanding balance of RWF ${j.balanceDue.toFixed(2)} on completed job.`,
        severity: 'warning',
      })),
    ];

    // Mask financial figures if shop-floor staff
    const isProductionOrInventory =
      session?.role === Role.PRODUCTION || session?.role === Role.INVENTORY;

    return NextResponse.json({
      metrics: {
        jobsReceivedToday,
        jobsInProduction,
        jobsCompletedToday,
        jobsDueToday,
        pendingJobs,
        tshirtsBrandedToday,
        inkUsedToday,
        rejectedToday,
        damagedToday,
        lowStockCount: lowStockItems.length,
        totalSales: isProductionOrInventory ? null : Number(totalSales.toFixed(2)),
        totalEstimatedProfit: isProductionOrInventory ? null : Number(totalEstimatedProfit.toFixed(2)),
      },
      recentJobs: isProductionOrInventory
        ? recentJobs.map((j) => ({ ...j, totalAmount: null, balanceDue: null }))
        : recentJobs,
      recentStockMovements,
      alerts,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
