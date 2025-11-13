/**
 * EPIC-003 Phase 1: Cost Calculation & Analysis API
 *
 * Provides methods for:
 * - Material cost tracking
 * - BOM cost calculation and snapshots
 * - Product pricing
 * - Work order cost tracking
 * - Cost comparison and trends
 * - Margin analysis
 */

import {
  MaterialCost,
  BOMCost,
  ProductPrice,
  WOCost,
  BOMCostBreakdown,
  MarginAnalysis,
  BOMCostComparison,
  CostTrendPoint,
  WOCostVariance,
  SetMaterialCostRequest,
  SetProductPriceRequest,
  CalculateBOMCostRequest,
  CompareBOMCostsRequest,
} from '@/lib/types';

const API_BASE_COSTS = '/api/costs';

/**
 * CostsAPI - Handles all cost-related operations
 */
export const CostsAPI = {
  // ============================================================================
  // MATERIAL COSTS
  // ============================================================================

  /**
   * Set or update material cost for a product
   */
  async setMaterialCost(data: SetMaterialCostRequest): Promise<MaterialCost> {
    const response = await fetch(`${API_BASE_COSTS}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set material cost');
    }

    return response.json();
  },

  /**
   * Get material cost history for a product
   */
  async getMaterialCostHistory(productId: number): Promise<MaterialCost[]> {
    const response = await fetch(`${API_BASE_COSTS}/materials/${productId}/history`);

    if (!response.ok) {
      throw new Error('Failed to fetch material cost history');
    }

    return response.json();
  },

  /**
   * Get material cost at a specific date
   */
  async getMaterialCostAtDate(productId: number, date?: string): Promise<number> {
    const dateParam = date ? `?date=${date}` : '';
    const response = await fetch(`${API_BASE_COSTS}/materials/${productId}/at-date${dateParam}`);

    if (!response.ok) {
      throw new Error('Failed to fetch material cost at date');
    }

    const result = await response.json();
    return result.cost || 0;
  },

  /**
   * Get current costs for multiple products
   */
  async getMaterialCosts(productIds: number[]): Promise<Record<number, number>> {
    const response = await fetch(`${API_BASE_COSTS}/materials/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch material costs');
    }

    return response.json();
  },

  /**
   * Delete material cost entry
   */
  async deleteMaterialCost(costId: number): Promise<void> {
    const response = await fetch(`${API_BASE_COSTS}/materials/${costId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete material cost');
    }
  },

  // ============================================================================
  // BOM COSTS
  // ============================================================================

  /**
   * Calculate BOM cost at a specific date
   */
  async calculateBOMCost(data: CalculateBOMCostRequest): Promise<BOMCostBreakdown> {
    const response = await fetch(`${API_BASE_COSTS}/bom/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate BOM cost');
    }

    return response.json();
  },

  /**
   * Save BOM cost snapshot
   */
  async saveBOMCostSnapshot(bomId: number): Promise<BOMCost> {
    const response = await fetch(`${API_BASE_COSTS}/bom/${bomId}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save BOM cost snapshot');
    }

    return response.json();
  },

  /**
   * Get BOM cost history
   */
  async getBOMCostHistory(bomId: number): Promise<BOMCost[]> {
    const response = await fetch(`${API_BASE_COSTS}/bom/${bomId}/history`);

    if (!response.ok) {
      throw new Error('Failed to fetch BOM cost history');
    }

    return response.json();
  },

  /**
   * Compare costs between two BOM versions
   */
  async compareBOMCosts(data: CompareBOMCostsRequest): Promise<BOMCostComparison> {
    const response = await fetch(`${API_BASE_COSTS}/bom/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to compare BOM costs');
    }

    return response.json();
  },

  // ============================================================================
  // PRODUCT PRICES
  // ============================================================================

  /**
   * Set or update product price
   */
  async setProductPrice(data: SetProductPriceRequest): Promise<ProductPrice> {
    const response = await fetch(`${API_BASE_COSTS}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set product price');
    }

    return response.json();
  },

  /**
   * Get product price history
   */
  async getProductPriceHistory(productId: number, priceType?: string): Promise<ProductPrice[]> {
    const typeParam = priceType ? `?type=${priceType}` : '';
    const response = await fetch(`${API_BASE_COSTS}/prices/${productId}/history${typeParam}`);

    if (!response.ok) {
      throw new Error('Failed to fetch product price history');
    }

    return response.json();
  },

  /**
   * Get current product price
   */
  async getCurrentPrice(productId: number, priceType: string = 'wholesale'): Promise<number> {
    const response = await fetch(`${API_BASE_COSTS}/prices/${productId}/current?type=${priceType}`);

    if (!response.ok) {
      throw new Error('Failed to fetch current price');
    }

    const result = await response.json();
    return result.price || 0;
  },

  /**
   * Delete product price entry
   */
  async deleteProductPrice(priceId: number): Promise<void> {
    const response = await fetch(`${API_BASE_COSTS}/prices/${priceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete product price');
    }
  },

  // ============================================================================
  // MARGIN ANALYSIS
  // ============================================================================

  /**
   * Get margin analysis for a product
   */
  async getMarginAnalysis(
    productId: number,
    priceType: string = 'wholesale'
  ): Promise<MarginAnalysis> {
    const response = await fetch(
      `${API_BASE_COSTS}/analysis/margin/${productId}?price_type=${priceType}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch margin analysis');
    }

    return response.json();
  },

  /**
   * Get margin analysis for multiple products
   */
  async getBulkMarginAnalysis(
    productIds: number[],
    priceType: string = 'wholesale'
  ): Promise<MarginAnalysis[]> {
    const response = await fetch(`${API_BASE_COSTS}/analysis/margin/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds, price_type: priceType }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bulk margin analysis');
    }

    return response.json();
  },

  // ============================================================================
  // COST TRENDS
  // ============================================================================

  /**
   * Get cost trend for a product over time
   */
  async getProductCostTrend(productId: number, days: number = 90): Promise<CostTrendPoint[]> {
    const response = await fetch(`${API_BASE_COSTS}/trends/product/${productId}?days=${days}`);

    if (!response.ok) {
      throw new Error('Failed to fetch cost trend');
    }

    return response.json();
  },

  /**
   * Get cost trends for multiple products
   */
  async getBulkCostTrends(
    productIds: number[],
    days: number = 90
  ): Promise<Record<number, CostTrendPoint[]>> {
    const response = await fetch(`${API_BASE_COSTS}/trends/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_ids: productIds, days }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bulk cost trends');
    }

    return response.json();
  },

  // ============================================================================
  // WORK ORDER COSTS
  // ============================================================================

  /**
   * Calculate planned cost for a work order
   */
  async calculateWOPlannedCost(woId: number): Promise<WOCost> {
    const response = await fetch(`${API_BASE_COSTS}/wo/${woId}/planned`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate WO planned cost');
    }

    return response.json();
  },

  /**
   * Calculate actual cost for a work order
   */
  async calculateWOActualCost(woId: number): Promise<WOCost> {
    const response = await fetch(`${API_BASE_COSTS}/wo/${woId}/actual`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate WO actual cost');
    }

    return response.json();
  },

  /**
   * Get WO cost variance
   */
  async getWOCostVariance(woId: number): Promise<WOCostVariance> {
    const response = await fetch(`${API_BASE_COSTS}/wo/${woId}/variance`);

    if (!response.ok) {
      throw new Error('Failed to fetch WO cost variance');
    }

    return response.json();
  },

  /**
   * Get cost variance report for multiple WOs
   */
  async getWOCostVarianceReport(filters?: {
    status?: string;
    product_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<WOCostVariance[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await fetch(`${API_BASE_COSTS}/wo/variance-report?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch WO cost variance report');
    }

    return response.json();
  },

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export cost data to Excel
   */
  async exportCostData(
    type: 'materials' | 'bom' | 'prices' | 'wo_variance',
    filters?: Record<string, any>
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('type', type);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await fetch(`${API_BASE_COSTS}/export?${params}`);

    if (!response.ok) {
      throw new Error('Failed to export cost data');
    }

    return response.blob();
  },
};

export default CostsAPI;
