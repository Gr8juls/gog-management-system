// Core mathematical formulas and validation rules for GOG Management System

/**
 * Calculate quantity pending for a job item:
 * Quantity pending = Quantity ordered - Quantity completed - Quantity rejected - Quantity cancelled
 */
export function calculateQuantityPending(
  quantityOrdered: number,
  quantityCompleted: number,
  quantityRejected: number = 0,
  quantityCancelled: number = 0
): number {
  const pending = quantityOrdered - (quantityCompleted + quantityRejected + quantityCancelled);
  return Math.max(0, pending);
}

/**
 * Calculate quantity remaining for a production record:
 * Quantity remaining = Quantity planned - Quantity completed - Quantity rejected - Quantity damaged
 */
export function calculateQuantityRemaining(
  quantityPlanned: number,
  quantityCompleted: number,
  quantityRejected: number = 0,
  quantityDamaged: number = 0
): number {
  const remaining = quantityPlanned - (quantityCompleted + quantityRejected + quantityDamaged);
  return Math.max(0, remaining);
}

/**
 * Checks if a proposed production quantity exceeds the ordered quantity.
 * Returns true if valid or if manager override is approved.
 */
export function validateProductionLimits(params: {
  quantityOrdered: number;
  totalCompletedSoFar: number;
  totalRejectedSoFar: number;
  newCompleted: number;
  newRejected: number;
  isManagerApproved?: boolean;
}): { isValid: boolean; error?: string; requiresManagerApproval?: boolean } {
  const projectedTotal =
    params.totalCompletedSoFar +
    params.totalRejectedSoFar +
    params.newCompleted +
    params.newRejected;

  if (projectedTotal > params.quantityOrdered) {
    if (params.isManagerApproved) {
      return { isValid: true, requiresManagerApproval: true };
    }
    return {
      isValid: false,
      requiresManagerApproval: true,
      error: `Total production (${projectedTotal}) exceeds ordered quantity (${params.quantityOrdered}). Manager approval required to proceed.`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate total ink consumption:
 * Total ink consumption = Production ink used + Test-print ink used + Wasted ink
 */
export function calculateInkTotalConsumption(
  productionInkUsed: number,
  testPrintInkUsed: number = 0,
  wastedInk: number = 0
): number {
  return Number((productionInkUsed + testPrintInkUsed + wastedInk).toFixed(2));
}

/**
 * Calculates stock balance after a transaction
 */
export function calculateNewStockLevel(
  currentStock: number,
  type: string,
  quantity: number
): number {
  const positiveTypes = [
    'OPENING_BALANCE',
    'PURCHASE_RECEIPT',
    'RETURN_FROM_PRODUCTION',
    'STOCK_COUNT_CORRECTION',
  ];
  const negativeTypes = [
    'ISSUE_TO_PRODUCTION',
    'SALE',
    'DAMAGE',
    'WASTAGE',
  ];

  if (type === 'ADJUSTMENT') {
    // For ADJUSTMENT, quantity can be positive or negative
    return Number((currentStock + quantity).toFixed(2));
  }

  if (positiveTypes.includes(type)) {
    return Number((currentStock + Math.abs(quantity)).toFixed(2));
  } else if (negativeTypes.includes(type)) {
    return Number((currentStock - Math.abs(quantity)).toFixed(2));
  }

  return currentStock;
}

/**
 * Calculate Material Variance:
 * Materials Consumed = Materials Issued - Materials Returned
 * Material Variance = Materials Planned - Materials Consumed
 */
export function calculateMaterialVariance(
  materialsPlanned: number,
  materialsIssued: number,
  materialsReturned: number = 0
): {
  materialsConsumed: number;
  variance: number;
} {
  const materialsConsumed = materialsIssued - materialsReturned;
  const variance = materialsPlanned - materialsConsumed;
  return {
    materialsConsumed: Math.max(0, materialsConsumed),
    variance,
  };
}

/**
 * Job Estimated Profitability Calculation:
 * Revenue - Blank product cost - Ink cost - Consumables cost - Labour cost - Packaging cost - Delivery cost
 */
export function calculateJobProfitability(params: {
  revenue: number;
  blankProductCost: number;
  inkCost: number;
  consumablesCost?: number;
  labourCost?: number;
  packagingCost?: number;
  deliveryCost?: number;
}): {
  totalCost: number;
  estimatedProfit: number;
  profitMarginPercent: number;
} {
  const totalCost = Number(
    (
      params.blankProductCost +
      params.inkCost +
      (params.consumablesCost || 0) +
      (params.labourCost || 0) +
      (params.packagingCost || 0) +
      (params.deliveryCost || 0)
    ).toFixed(2)
  );

  const estimatedProfit = Number((params.revenue - totalCost).toFixed(2));
  const profitMarginPercent =
    params.revenue > 0
      ? Number(((estimatedProfit / params.revenue) * 100).toFixed(1))
      : 0;

  return {
    totalCost,
    estimatedProfit,
    profitMarginPercent,
  };
}
