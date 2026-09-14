import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateJobProfitability, calculateQuantityPending } from '@/lib/calculations';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'daily-production';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDateParam) dateFilter.gte = new Date(startDateParam);
    if (endDateParam) {
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Daily Production Report
    if (reportType === 'daily-production') {
      const productions = await prisma.dailyProduction.findMany({
        where: hasDateFilter ? { date: dateFilter } : undefined,
        include: {
          job: { select: { id: true, jobNumber: true, productType: true, customer: { select: { name: true } } } },
          operator: { select: { id: true, name: true } },
          jobItem: true,
        },
        orderBy: { date: 'desc' },
      });

      const summary = {
        totalPlanned: productions.reduce((s, p) => s + p.quantityPlanned, 0),
        totalCompleted: productions.reduce((s, p) => s + p.quantityCompleted, 0),
        totalRejected: productions.reduce((s, p) => s + p.quantityRejected, 0),
        totalDamaged: productions.reduce((s, p) => s + p.quantityDamaged, 0),
        totalRemaining: productions.reduce((s, p) => s + p.quantityRemaining, 0),
      };

      return NextResponse.json({ type: reportType, summary, records: productions });
    }

    // 2. Ink Usage Report
    if (reportType === 'ink-usage') {
      const inkLogs = await prisma.inkUsage.findMany({
        where: hasDateFilter ? { date: dateFilter } : undefined,
        include: {
          job: { select: { id: true, jobNumber: true } },
          inventoryItem: true,
          operator: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      });

      let totalUsed = 0;
      let totalWasted = 0;
      let totalCost = 0;
      const colorMap: Record<string, { used: number; wasted: number; cost: number }> = {};

      for (const log of inkLogs) {
        totalUsed += log.quantityUsed;
        totalWasted += log.quantityWasted;
        const unitCost = log.inventoryItem?.unitCost || 0;
        const cost = (log.quantityUsed + log.quantityWasted) * unitCost;
        totalCost += cost;

        if (!colorMap[log.color]) {
          colorMap[log.color] = { used: 0, wasted: 0, cost: 0 };
        }
        colorMap[log.color].used += log.quantityUsed;
        colorMap[log.color].wasted += log.quantityWasted;
        colorMap[log.color].cost += cost;
      }

      return NextResponse.json({
        type: reportType,
        summary: {
          totalUsed: Number(totalUsed.toFixed(1)),
          totalWasted: Number(totalWasted.toFixed(1)),
          totalCost: Number(totalCost.toFixed(2)),
          colorBreakdown: colorMap,
        },
        records: inkLogs,
      });
    }

    // 3. T-shirt Report
    if (reportType === 't-shirt') {
      const tshirts = await prisma.inventoryItem.findMany({
        where: {
          category: { in: ['BLANK_TSHIRTS', 'OTHER_GARMENTS'] },
          isActive: true,
        },
        include: {
          transactions: true,
          materialIssues: true,
          materialReturns: true,
        },
      });

      const matrix = tshirts.map((item) => {
        const received = item.transactions
          .filter((t) => ['OPENING_BALANCE', 'PURCHASE_RECEIPT'].includes(t.type))
          .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

        const issued = item.materialIssues.reduce((sum, m) => sum + m.quantityIssued, 0);
        const returned = item.materialReturns.reduce((sum, m) => sum + m.quantityReturned, 0);

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          garmentType: item.garmentType,
          brand: item.brand,
          size: item.size,
          color: item.color,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          unitCost: item.unitCost,
          received,
          issued,
          returned,
          netIssued: issued - returned,
        };
      });

      return NextResponse.json({ type: reportType, records: matrix });
    }

    // 4. Inventory Report & Valuation
    if (reportType === 'inventory') {
      const items = await prisma.inventoryItem.findMany({
        where: { isActive: true },
        include: {
          supplier: { select: { name: true } },
          transactions: true,
        },
        orderBy: { category: 'asc' },
      });

      let totalValuation = 0;
      let totalLowStock = 0;

      const records = items.map((item) => {
        const valuation = Number((item.currentStock * item.unitCost).toFixed(2));
        totalValuation += valuation;
        const isLow = item.currentStock <= item.reorderLevel;
        if (isLow) totalLowStock += 1;

        const totalReceived = item.transactions
          .filter((t) => ['OPENING_BALANCE', 'PURCHASE_RECEIPT'].includes(t.type))
          .reduce((s, t) => s + Math.abs(t.quantity), 0);

        const totalIssued = item.transactions
          .filter((t) => t.type === 'ISSUE_TO_PRODUCTION')
          .reduce((s, t) => s + Math.abs(t.quantity), 0);

        const totalWasted = item.transactions
          .filter((t) => ['DAMAGE', 'WASTAGE'].includes(t.type))
          .reduce((s, t) => s + Math.abs(t.quantity), 0);

        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          unitOfMeasure: item.unitOfMeasure,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          unitCost: item.unitCost,
          valuation,
          isLow,
          totalReceived,
          totalIssued,
          totalWasted,
          supplierName: item.supplier?.name || 'N/A',
        };
      });

      return NextResponse.json({
        type: reportType,
        summary: {
          totalValuation: Number(totalValuation.toFixed(2)),
          totalItems: items.length,
          lowStockCount: totalLowStock,
        },
        records,
      });
    }

    // 5. Job Report
    if (reportType === 'jobs') {
      const jobs = await prisma.job.findMany({
        where: hasDateFilter ? { createdAt: dateFilter } : undefined,
        include: {
          customer: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const statusCounts: Record<string, number> = {};
      let overdueCount = 0;

      const records = jobs.map((job) => {
        statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
        const isOverdue =
          new Date(job.requiredDate) < today &&
          !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(job.status);
        if (isOverdue) overdueCount += 1;

        const totalOrdered = job.items.reduce((s, i) => s + i.quantityOrdered, 0);
        const totalCompleted = job.items.reduce((s, i) => s + i.quantityCompleted, 0);

        return {
          id: job.id,
          jobNumber: job.jobNumber,
          customerName: job.customer.name,
          dateReceived: job.dateReceived,
          requiredDate: job.requiredDate,
          status: job.status,
          priority: job.priority,
          productType: job.productType,
          totalOrdered,
          totalCompleted,
          totalAmount: job.totalAmount,
          balanceDue: job.balanceDue,
          isOverdue,
        };
      });

      return NextResponse.json({
        type: reportType,
        summary: {
          totalJobs: jobs.length,
          overdueCount,
          statusCounts,
        },
        records,
      });
    }

    // 6. Profitability Report
    if (reportType === 'profitability') {
      // Production & Inventory staff cannot view financial reports
      if (
        session?.role === Role.PRODUCTION ||
        session?.role === Role.INVENTORY
      ) {
        return NextResponse.json({ error: 'Unauthorized to view financial profitability reports' }, { status: 403 });
      }

      const jobs = await prisma.job.findMany({
        where: hasDateFilter ? { createdAt: dateFilter } : undefined,
        include: {
          customer: { select: { name: true } },
          items: true,
          materialIssues: { include: { inventoryItem: true } },
          materialReturns: { include: { inventoryItem: true } },
          inkUsages: { include: { inventoryItem: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      let grandRevenue = 0;
      let grandCost = 0;
      let grandProfit = 0;

      const records = jobs.map((job) => {
        // 1. Blank product cost (net issued - returned)
        const blankCost = job.materialIssues.reduce((sum, m) => {
          const matchingReturn = job.materialReturns
            .filter((r) => r.inventoryItemId === m.inventoryItemId)
            .reduce((rs, r) => rs + r.quantityReturned, 0);
          const netQty = Math.max(0, m.quantityIssued - matchingReturn);
          return sum + netQty * m.inventoryItem.unitCost;
        }, 0);

        // 2. Ink cost
        const inkCost = job.inkUsages.reduce((sum, i) => {
          const totalQty = i.quantityUsed + i.quantityWasted;
          return sum + totalQty * (i.inventoryItem?.unitCost || 0);
        }, 0);

        // 3. Profitability calculation
        const profit = calculateJobProfitability({
          revenue: job.totalAmount,
          blankProductCost: blankCost,
          inkCost,
          consumablesCost: job.overheadCostEstimate,
          labourCost: job.labourCostEstimate,
          packagingCost: job.packagingCostEstimate,
          deliveryCost: job.deliveryCostEstimate,
        });

        grandRevenue += job.totalAmount;
        grandCost += profit.totalCost;
        grandProfit += profit.estimatedProfit;

        return {
          id: job.id,
          jobNumber: job.jobNumber,
          customerName: job.customer.name,
          productType: job.productType,
          status: job.status,
          revenue: job.totalAmount,
          blankProductCost: Number(blankCost.toFixed(2)),
          inkCost: Number(inkCost.toFixed(2)),
          labourCost: job.labourCostEstimate,
          overheadCost: job.overheadCostEstimate,
          packagingCost: job.packagingCostEstimate,
          deliveryCost: job.deliveryCostEstimate,
          totalCost: profit.totalCost,
          estimatedProfit: profit.estimatedProfit,
          profitMarginPercent: profit.profitMarginPercent,
        };
      });

      const overallMargin =
        grandRevenue > 0 ? Number(((grandProfit / grandRevenue) * 100).toFixed(1)) : 0;

      return NextResponse.json({
        type: reportType,
        summary: {
          totalRevenue: Number(grandRevenue.toFixed(2)),
          totalCost: Number(grandCost.toFixed(2)),
          totalProfit: Number(grandProfit.toFixed(2)),
          overallMarginPercent: overallMargin,
        },
        records,
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
