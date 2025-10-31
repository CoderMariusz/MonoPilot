// Phase 1 Planning Totals Calculation
// Frontend calculation of PO/TO totals and financial summaries

import { POHeader, POLine, TOHeader, TOLine } from '../types';

// =============================================
// PO TOTALS CALCULATION
// =============================================

export interface POTotals {
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  lineCount: number;
  itemCount: number;
  averageUnitPrice: number;
  currency: string;
}

export interface POLineTotals {
  lineTotal: number;
  vatAmount: number;
  grossTotal: number;
  netTotal: number;
}

export function calculatePOLineTotals(line: POLine): POLineTotals {
  const netTotal = line.qty_ordered * line.unit_price;
  const vatAmount = netTotal * (line.vat_rate / 100);
  const grossTotal = netTotal + vatAmount;

  return {
    lineTotal: netTotal,
    vatAmount,
    grossTotal,
    netTotal
  };
}

export function calculatePOTotals(po: POHeader, lines: POLine[]): POTotals {
  if (!lines || lines.length === 0) {
    return {
      netTotal: 0,
      vatTotal: 0,
      grossTotal: 0,
      lineCount: 0,
      itemCount: 0,
      averageUnitPrice: 0,
      currency: po.currency || 'USD'
    };
  }

  let netTotal = 0;
  let vatTotal = 0;
  let grossTotal = 0;
  let totalQuantity = 0;
  let totalUnitPrice = 0;

  for (const line of lines) {
    const lineTotals = calculatePOLineTotals(line);
    
    netTotal += lineTotals.netTotal;
    vatTotal += lineTotals.vatAmount;
    grossTotal += lineTotals.grossTotal;
    
    totalQuantity += line.qty_ordered;
    totalUnitPrice += line.unit_price;
  }

  const averageUnitPrice = lines.length > 0 ? totalUnitPrice / lines.length : 0;

  return {
    netTotal: Math.round(netTotal * 100) / 100,
    vatTotal: Math.round(vatTotal * 100) / 100,
    grossTotal: Math.round(grossTotal * 100) / 100,
    lineCount: lines.length,
    itemCount: new Set(lines.map(l => l.item_id)).size,
    averageUnitPrice: Math.round(averageUnitPrice * 100) / 100,
    currency: po.currency || 'USD'
  };
}

// =============================================
// TO TOTALS CALCULATION
// =============================================

export interface TOTotals {
  totalPlanned: number;
  totalMoved: number;
  completionPercentage: number;
  lineCount: number;
  itemCount: number;
  scanRequiredCount: number;
  approvedLineCount: number;
}

export interface TOLineTotals {
  plannedQuantity: number;
  movedQuantity: number;
  remainingQuantity: number;
  completionPercentage: number;
}

export function calculateTOLineTotals(line: TOLine): TOLineTotals {
  const plannedQuantity = line.qty_planned;
  const movedQuantity = line.qty_moved;
  const remainingQuantity = Math.max(0, plannedQuantity - movedQuantity);
  const completionPercentage = plannedQuantity > 0 
    ? Math.round((movedQuantity / plannedQuantity) * 100) 
    : 0;

  return {
    plannedQuantity,
    movedQuantity,
    remainingQuantity,
    completionPercentage
  };
}

export function calculateTOTotals(to: TOHeader, lines: TOLine[]): TOTotals {
  if (!lines || lines.length === 0) {
    return {
      totalPlanned: 0,
      totalMoved: 0,
      completionPercentage: 0,
      lineCount: 0,
      itemCount: 0,
      scanRequiredCount: 0,
      approvedLineCount: 0
    };
  }

  let totalPlanned = 0;
  let totalMoved = 0;
  let scanRequiredCount = 0;
  let approvedLineCount = 0;

  for (const line of lines) {
    totalPlanned += line.qty_planned;
    totalMoved += line.qty_moved;
    
    if (line.scan_required) {
      scanRequiredCount++;
    }
    
    if (line.approved_line) {
      approvedLineCount++;
    }
  }

  const completionPercentage = totalPlanned > 0 
    ? Math.round((totalMoved / totalPlanned) * 100) 
    : 0;

  return {
    totalPlanned: Math.round(totalPlanned * 100) / 100,
    totalMoved: Math.round(totalMoved * 100) / 100,
    completionPercentage,
    lineCount: lines.length,
    itemCount: new Set(lines.map(l => l.item_id)).size,
    scanRequiredCount,
    approvedLineCount
  };
}

// =============================================
// FINANCIAL SUMMARY HELPERS
// =============================================

export interface FinancialSummary {
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  currency: string;
  formattedNetTotal: string;
  formattedVatTotal: string;
  formattedGrossTotal: string;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function createFinancialSummary(
  netTotal: number,
  vatTotal: number,
  grossTotal: number,
  currency: string = 'USD'
): FinancialSummary {
  return {
    netTotal,
    vatTotal,
    grossTotal,
    currency,
    formattedNetTotal: formatCurrency(netTotal, currency),
    formattedVatTotal: formatCurrency(vatTotal, currency),
    formattedGrossTotal: formatCurrency(grossTotal, currency)
  };
}

// =============================================
// PROGRESS TRACKING
// =============================================

export interface ProgressSummary {
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
}

export function calculatePOProgress(po: POHeader, lines: POLine[]): ProgressSummary {
  if (!lines || lines.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      progressPercentage: 0,
      status: 'not_started'
    };
  }

  let totalOrdered = 0;
  let totalReceived = 0;

  for (const line of lines) {
    totalOrdered += line.qty_ordered;
    totalReceived += line.qty_received;
  }

  const progressPercentage = totalOrdered > 0 
    ? Math.round((totalReceived / totalOrdered) * 100) 
    : 0;

  let status: ProgressSummary['status'] = 'not_started';
  if (progressPercentage > 0 && progressPercentage < 100) {
    status = 'in_progress';
  } else if (progressPercentage >= 100) {
    status = 'completed';
  }

  return {
    totalItems: lines.length,
    completedItems: lines.filter(l => l.qty_received >= l.qty_ordered).length,
    progressPercentage,
    status
  };
}

export function calculateTOProgress(to: TOHeader, lines: TOLine[]): ProgressSummary {
  if (!lines || lines.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      progressPercentage: 0,
      status: 'not_started'
    };
  }

  let totalPlanned = 0;
  let totalMoved = 0;

  for (const line of lines) {
    totalPlanned += line.qty_planned;
    totalMoved += line.qty_moved;
  }

  const progressPercentage = totalPlanned > 0 
    ? Math.round((totalMoved / totalPlanned) * 100) 
    : 0;

  let status: ProgressSummary['status'] = 'not_started';
  if (progressPercentage > 0 && progressPercentage < 100) {
    status = 'in_progress';
  } else if (progressPercentage >= 100) {
    status = 'completed';
  }

  return {
    totalItems: lines.length,
    completedItems: lines.filter(l => l.qty_moved >= l.qty_planned).length,
    progressPercentage,
    status
  };
}

// =============================================
// WARNING DETECTION
// =============================================

export interface POWarnings {
  hasPartialReceipts: boolean;
  hasBackorders: boolean;
  hasOverReceipts: boolean;
  hasMissingPrices: boolean;
  hasMissingUoM: boolean;
  warnings: string[];
}

export function detectPOWarnings(po: POHeader, lines: POLine[]): POWarnings {
  const warnings: string[] = [];
  let hasPartialReceipts = false;
  let hasBackorders = false;
  let hasOverReceipts = false;
  let hasMissingPrices = false;
  let hasMissingUoM = false;

  for (const line of lines) {
    // Check for partial receipts
    if (line.qty_received > 0 && line.qty_received < line.qty_ordered) {
      hasPartialReceipts = true;
    }

    // Check for backorders (negative received)
    if (line.qty_received < 0) {
      hasBackorders = true;
    }

    // Check for over-receipts
    if (line.qty_received > line.qty_ordered) {
      hasOverReceipts = true;
    }

    // Check for missing prices
    if (!line.unit_price || line.unit_price <= 0) {
      hasMissingPrices = true;
    }

    // Check for missing UoM
    if (!line.uom) {
      hasMissingUoM = true;
    }
  }

  if (hasPartialReceipts) {
    warnings.push('Some items have partial receipts');
  }
  if (hasBackorders) {
    warnings.push('Some items have backorders');
  }
  if (hasOverReceipts) {
    warnings.push('Some items have over-receipts');
  }
  if (hasMissingPrices) {
    warnings.push('Some items are missing unit prices');
  }
  if (hasMissingUoM) {
    warnings.push('Some items are missing UoM');
  }

  return {
    hasPartialReceipts,
    hasBackorders,
    hasOverReceipts,
    hasMissingPrices,
    hasMissingUoM,
    warnings
  };
}

export interface TOWarnings {
  hasIncompleteScans: boolean;
  hasMissingLocations: boolean;
  hasUnapprovedLines: boolean;
  warnings: string[];
}

export function detectTOWarnings(to: TOHeader, lines: TOLine[]): TOWarnings {
  const warnings: string[] = [];
  let hasIncompleteScans = false;
  let hasMissingLocations = false;
  let hasUnapprovedLines = false;

  for (const line of lines) {
    // Check for incomplete scans
    if (line.scan_required && line.qty_moved < line.qty_planned) {
      hasIncompleteScans = true;
    }

    // Check for missing locations
    if (!line.from_location_id || !line.to_location_id) {
      hasMissingLocations = true;
    }

    // Check for unapproved lines
    if (!line.approved_line) {
      hasUnapprovedLines = true;
    }
  }

  if (hasIncompleteScans) {
    warnings.push('Some lines require scanning but are incomplete');
  }
  if (hasMissingLocations) {
    warnings.push('Some lines are missing from/to locations');
  }
  if (hasUnapprovedLines) {
    warnings.push('Some lines are not approved for transfer');
  }

  return {
    hasIncompleteScans,
    hasMissingLocations,
    hasUnapprovedLines,
    warnings
  };
}
