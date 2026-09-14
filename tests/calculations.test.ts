import { describe, it, expect } from 'vitest';
import {
  calculateQuantityPending,
  calculateQuantityRemaining,
  validateProductionLimits,
  calculateInkTotalConsumption,
  calculateNewStockLevel,
  calculateMaterialVariance,
  calculateJobProfitability,
} from '../src/lib/calculations';

describe('GOG Business Logic & Calculations', () => {
  it('calculates quantity pending accurately', () => {
    // Ordered: 100, Completed: 70, Rejected: 5, Cancelled: 0 -> Pending: 25
    expect(calculateQuantityPending(100, 70, 5, 0)).toBe(25);

    // When completed + rejected >= ordered -> Pending: 0
    expect(calculateQuantityPending(50, 48, 2, 0)).toBe(0);
    expect(calculateQuantityPending(50, 55, 0, 0)).toBe(0);
  });

  it('calculates quantity remaining for daily production runs', () => {
    // Planned: 100, Completed: 94, Rejected: 3, Damaged: 3 -> Remaining: 0
    expect(calculateQuantityRemaining(100, 94, 3, 3)).toBe(0);

    // Planned: 50, Completed: 35, Rejected: 2, Damaged: 1 -> Remaining: 12
    expect(calculateQuantityRemaining(50, 35, 2, 1)).toBe(12);
  });

  it('prevents excessive production overruns without manager approval', () => {
    // Ordered: 100, so far done: 90 completed + 5 rejected = 95. Trying to add 10 completed.
    // 95 + 10 = 105 > 100 -> Should require approval
    const resultNoApproval = validateProductionLimits({
      quantityOrdered: 100,
      totalCompletedSoFar: 90,
      totalRejectedSoFar: 5,
      newCompleted: 10,
      newRejected: 0,
      isManagerApproved: false,
    });
    expect(resultNoApproval.isValid).toBe(false);
    expect(resultNoApproval.requiresManagerApproval).toBe(true);

    // With manager approval, it should pass
    const resultWithApproval = validateProductionLimits({
      quantityOrdered: 100,
      totalCompletedSoFar: 90,
      totalRejectedSoFar: 5,
      newCompleted: 10,
      newRejected: 0,
      isManagerApproved: true,
    });
    expect(resultWithApproval.isValid).toBe(true);
  });

  it('calculates total ink consumption', () => {
    // Production: 250ml, Test: 20ml, Waste: 15ml -> Total: 285ml
    expect(calculateInkTotalConsumption(250, 20, 15)).toBe(285);
  });

  it('computes stock levels and balances correctly across transaction types', () => {
    // Current: 100, Issue to production 40 -> 60
    expect(calculateNewStockLevel(100, 'ISSUE_TO_PRODUCTION', 40)).toBe(60);

    // Current: 60, Return from production 5 -> 65
    expect(calculateNewStockLevel(60, 'RETURN_FROM_PRODUCTION', 5)).toBe(65);

    // Current: 65, Purchase receipt 100 -> 165
    expect(calculateNewStockLevel(65, 'PURCHASE_RECEIPT', 100)).toBe(165);

    // Current: 165, Damage/Wastage 10 -> 155
    expect(calculateNewStockLevel(165, 'DAMAGE', 10)).toBe(155);

    // Current: 155, Adjustment -5 -> 150
    expect(calculateNewStockLevel(155, 'ADJUSTMENT', -5)).toBe(150);
  });

  it('reconciles material variance', () => {
    // Planned: 100, Issued: 100, Returned: 5 -> Net Consumed: 95, Variance: +5
    const variance = calculateMaterialVariance(100, 100, 5);
    expect(variance.materialsConsumed).toBe(95);
    expect(variance.variance).toBe(5);
  });

  it('calculates job estimated profitability correctly', () => {
    // Revenue: $800
    // Blank shirts: 100 * $3.50 = $350
    // Ink cost: $30
    // Consumables: $20
    // Labour: $50
    // Packaging: $15
    // Delivery: $10
    // Total Cost = 350 + 30 + 20 + 50 + 15 + 10 = $475
    // Profit = 800 - 475 = $325 (Margin: 40.6%)
    const profit = calculateJobProfitability({
      revenue: 800,
      blankProductCost: 350,
      inkCost: 30,
      consumablesCost: 20,
      labourCost: 50,
      packagingCost: 15,
      deliveryCost: 10,
    });

    expect(profit.totalCost).toBe(475);
    expect(profit.estimatedProfit).toBe(325);
    expect(profit.profitMarginPercent).toBe(40.6);
  });
});
