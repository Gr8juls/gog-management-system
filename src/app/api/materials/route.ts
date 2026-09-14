import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateMaterialVariance } from '@/lib/calculations';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    const where: any = {};
    if (jobId) where.id = jobId;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        items: true,
        materialIssues: { include: { inventoryItem: true, issuedBy: { select: { name: true } } } },
        materialReturns: { include: { inventoryItem: true, returnedBy: { select: { name: true } } } },
        dailyProductions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const summaries = jobs.map((job) => {
      const plannedQuantity = job.items.reduce((s, i) => s + i.quantityOrdered, 0);
      const totalIssued = job.materialIssues.reduce((s, m) => s + m.quantityIssued, 0);
      const totalReturned = job.materialReturns.reduce((s, m) => s + m.quantityReturned, 0);
      const totalDamaged = job.dailyProductions.reduce((s, p) => s + p.quantityDamaged, 0);
      const totalRejected = job.dailyProductions.reduce((s, p) => s + p.quantityRejected, 0);
      const totalWasted = totalDamaged + totalRejected;

      const { materialsConsumed, variance } = calculateMaterialVariance(
        plannedQuantity,
        totalIssued,
        totalReturned
      );

      return {
        jobId: job.id,
        jobNumber: job.jobNumber,
        customerName: job.customer.name,
        status: job.status,
        productType: job.productType,
        plannedQuantity,
        materialsIssued: totalIssued,
        materialsReturned: totalReturned,
        materialsConsumed,
        materialsWasted: totalWasted,
        materialVariance: variance,
        issues: job.materialIssues,
        returns: job.materialReturns,
      };
    });

    return NextResponse.json({ summaries });
  } catch (error: any) {
    console.error('Error fetching materials summary:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
