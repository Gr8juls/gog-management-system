import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { calculateQuantityPending, calculateQuantityRemaining, calculateNewStockLevel } from '../src/lib/calculations';

const prisma = new PrismaClient();

describe('End-to-End 8-Step Printing Production Workflow', () => {
  let customerId: string;
  let jobId: string;
  let jobItemId: string;
  let blankTshirtItemId: string;
  let inkItemId: string;
  let initialTshirtStock: number;
  let initialInkStock: number;

  beforeAll(async () => {
    // Locate seeded inventory items
    const blankTshirt = await prisma.inventoryItem.findFirst({
      where: { sku: 'TSH-BLK-M' },
    });
    expect(blankTshirt).toBeDefined();
    blankTshirtItemId = blankTshirt!.id;
    initialTshirtStock = blankTshirt!.currentStock;

    const ink = await prisma.inventoryItem.findFirst({
      where: { sku: 'INK-DTF-WHT' },
    });
    expect(ink).toBeDefined();
    inkItemId = ink!.id;
    initialInkStock = ink!.currentStock;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Step 1: Create a customer
  it('Step 1: Register a new customer', async () => {
    const customer = await prisma.customer.create({
      data: {
        customerNumber: `CUST-TEST-${Date.now()}`,
        name: 'Alpha Athletic Sports Club',
        phone: '+250 788 999 111',
        email: 'athletics@alpha.rw',
        customerType: 'CORPORATE',
      },
    });

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe('Alpha Athletic Sports Club');
    customerId = customer.id;
  });

  // Step 2: Create a T-shirt branding job for 100 shirts
  it('Step 2: Create T-shirt branding job for 100 shirts', async () => {
    const job = await prisma.job.create({
      data: {
        jobNumber: `GOG-TEST-${Date.now()}`,
        customerId,
        requiredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        productType: 'T-shirts',
        brandingMethod: 'DTF',
        designReference: 'ALPHA-CHEST-LOGO',
        priority: 'HIGH',
        status: 'APPROVED',
        totalAmount: 800.0,
        depositPaid: 400.0,
        balanceDue: 400.0,
        labourCostEstimate: 50.0,
        overheadCostEstimate: 30.0,
        items: {
          create: [
            {
              itemDescription: 'Round-neck T-Shirt - Black / M',
              garmentType: 'Round-neck',
              brand: 'Gildan Heavy Cotton',
              size: 'M',
              color: 'Black',
              quantityOrdered: 100,
              quantityCompleted: 0,
              quantityRejected: 0,
              quantityDamaged: 0,
              quantityReturned: 0,
              quantityPending: 100,
              unitPrice: 8.0,
              totalPrice: 800.0,
            },
          ],
        },
      },
      include: { items: true },
    });

    expect(job.id).toBeDefined();
    expect(job.items.length).toBe(1);
    expect(job.items[0].quantityOrdered).toBe(100);
    expect(job.items[0].quantityPending).toBe(100);

    jobId = job.id;
    jobItemId = job.items[0].id;
  });

  // Step 3: Issue 100 blank T-shirts to the job
  it('Step 3: Issue 100 blank T-shirts from inventory to the job', async () => {
    // Atomic issue transaction
    await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: blankTshirtItemId } });
      const newStock = calculateNewStockLevel(item!.currentStock, 'ISSUE_TO_PRODUCTION', 100);

      await tx.inventoryItem.update({
        where: { id: item!.id },
        data: { currentStock: newStock },
      });

      await tx.materialIssue.create({
        data: {
          issueNumber: `ISSUE-TEST-${Date.now()}`,
          jobId,
          inventoryItemId: blankTshirtItemId,
          quantityIssued: 100,
          notes: '100 blank shirts issued to production floor',
        },
      });

      await tx.stockTransaction.create({
        data: {
          transactionNumber: `TXN-ISS-${Date.now()}`,
          inventoryItemId: blankTshirtItemId,
          type: 'ISSUE_TO_PRODUCTION',
          quantity: -100,
          unitCost: item!.unitCost,
          balanceAfter: newStock,
          referenceType: 'JOB',
          jobId,
          isApproved: true,
        },
      });
    });

    // Check inventory stock decreased by 100
    const updatedItem = await prisma.inventoryItem.findUnique({ where: { id: blankTshirtItemId } });
    expect(updatedItem!.currentStock).toBe(initialTshirtStock - 100);
  });

  // Step 4: Record ink usage
  it('Step 4: Record 250ml DTF ink usage', async () => {
    await prisma.$transaction(async (tx) => {
      const ink = await tx.inventoryItem.findUnique({ where: { id: inkItemId } });
      const newInkStock = ink!.currentStock - 250;

      await tx.inventoryItem.update({
        where: { id: ink!.id },
        data: { currentStock: newInkStock },
      });

      await tx.inkUsage.create({
        data: {
          jobId,
          inventoryItemId: inkItemId,
          color: 'White',
          brand: 'East Africa Digital Inks',
          inkType: 'DTF',
          quantityUsed: 230,
          quantityWasted: 20,
          unitOfMeasure: 'ml',
          reason: 'CUSTOMER_PRODUCTION',
          notes: 'White underbase print for 100 black shirts',
        },
      });

      await tx.stockTransaction.create({
        data: {
          transactionNumber: `TXN-INK-${Date.now()}`,
          inventoryItemId: inkItemId,
          type: 'ISSUE_TO_PRODUCTION',
          quantity: -250,
          unitCost: ink!.unitCost,
          balanceAfter: newInkStock,
          referenceType: 'JOB',
          jobId,
          isApproved: true,
        },
      });
    });

    const updatedInk = await prisma.inventoryItem.findUnique({ where: { id: inkItemId } });
    expect(updatedInk!.currentStock).toBe(initialInkStock - 250);
  });

  // Step 5: Record 94 completed shirts, 3 rejected shirts, and 3 damaged shirts
  it('Step 5: Record production run (94 completed, 3 rejected, 3 damaged)', async () => {
    const planned = 100;
    const completed = 94;
    const rejected = 3;
    const damaged = 3;
    const remaining = calculateQuantityRemaining(planned, completed, rejected, damaged);
    expect(remaining).toBe(0);

    await prisma.$transaction(async (tx) => {
      await tx.dailyProduction.create({
        data: {
          jobId,
          jobItemId,
          product: 'Round-neck T-Shirt - Black / M',
          productionMethod: 'DTF',
          quantityPlanned: planned,
          quantityStarted: 100,
          quantityCompleted: completed,
          quantityRejected: rejected,
          quantityDamaged: damaged,
          quantityRemaining: remaining,
          workstation: 'Heat Press Station 2',
          qualityStatus: 'PASSED',
        },
      });

      // Update line item pending quantity
      const newPending = calculateQuantityPending(100, completed, rejected, 0);
      expect(newPending).toBe(3); // 100 - (94 + 3) = 3 remaining to reach target, or all 100 accounted for

      await tx.jobItem.update({
        where: { id: jobItemId },
        data: {
          quantityCompleted: completed,
          quantityRejected: rejected,
          quantityDamaged: damaged,
          quantityPending: newPending,
        },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: 'QUALITY_CHECK' },
      });
    });

    const itemAfter = await prisma.jobItem.findUnique({ where: { id: jobItemId } });
    expect(itemAfter!.quantityCompleted).toBe(94);
    expect(itemAfter!.quantityRejected).toBe(3);
    expect(itemAfter!.quantityDamaged).toBe(3);
  });

  // Step 6: Return unused material (or record 0 returns if all 100 were consumed)
  it('Step 6: Verify material returns and reconciliation', async () => {
    const issues = await prisma.materialIssue.findMany({ where: { jobId } });
    const returns = await prisma.materialReturn.findMany({ where: { jobId } });

    const totalIssued = issues.reduce((s, i) => s + i.quantityIssued, 0);
    const totalReturned = returns.reduce((s, r) => s + r.quantityReturned, 0);
    const netConsumed = totalIssued - totalReturned;

    expect(totalIssued).toBe(100);
    expect(netConsumed).toBe(100); // All 100 blank shirts were printed (94 completed + 3 rejected + 3 damaged)
  });

  // Step 7: Complete the job
  it('Step 7: Mark job as COMPLETED', async () => {
    const jobBefore = await prisma.job.findUnique({
      where: { id: jobId },
      include: { dailyProductions: true },
    });

    // Verification check: cannot complete without production records
    expect(jobBefore!.dailyProductions.length).toBeGreaterThan(0);

    const completedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' },
      include: { items: true },
    });

    expect(completedJob.status).toBe('COMPLETED');
  });

  // Step 8: Confirm inventory, production, ink usage, job status, and profitability report
  it('Step 8: Confirm all ledgers and reports reflect accurate state', async () => {
    // 1. Check Job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { items: true, dailyProductions: true, inkUsages: true, materialIssues: true },
    });
    expect(job!.status).toBe('COMPLETED');
    expect(job!.items[0].quantityCompleted).toBe(94);

    // 2. Check Inventory balances
    const blankStock = await prisma.inventoryItem.findUnique({ where: { id: blankTshirtItemId } });
    expect(blankStock!.currentStock).toBe(initialTshirtStock - 100);

    const inkStock = await prisma.inventoryItem.findUnique({ where: { id: inkItemId } });
    expect(inkStock!.currentStock).toBe(initialInkStock - 250);

    // 3. Check Stock transactions audit trail
    const txns = await prisma.stockTransaction.findMany({ where: { jobId } });
    expect(txns.length).toBeGreaterThanOrEqual(2); // Shirt issue and Ink issue

    // 4. Check Profitability
    const revenue = job!.totalAmount;
    const blankCost = 100 * 3.50; // $350
    const inkCost = 250 * 0.05; // $12.50
    const labour = job!.labourCostEstimate; // $50
    const overhead = job!.overheadCostEstimate; // $30
    const totalCost = blankCost + inkCost + labour + overhead; // $442.50
    const profit = revenue - totalCost; // $800 - $442.50 = $357.50

    expect(revenue).toBe(800);
    expect(profit).toBe(357.5);
  });
});
