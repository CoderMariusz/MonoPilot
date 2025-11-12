import { Bom, BomItem } from '@/lib/types';

const API_BASE = '/api/technical/boms';

export interface BomUpdateData {
  version?: string;
  notes?: string;
  requires_routing?: boolean;
  default_routing_id?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
}

export interface BomItemUpdateData {
  material_id: number | null;
  quantity: number;
  uom: string;
  sequence?: number;
  priority?: number | null;
  production_lines?: string[];
  production_line_restrictions?: string[];
  scrap_std_pct?: number | null;
  is_optional?: boolean;
  is_phantom?: boolean;
  consume_whole_lp?: boolean;
  unit_cost_std?: number | null;
  tax_code_id?: number | null;
  lead_time_days?: number | null;
  moq?: number | null;
  line_id?: number[] | null;  // Array of production line IDs for line-specific materials
}

export interface BomUpdateResponse {
  id: number;
  status: 'draft' | 'active' | 'archived';
  cloned: boolean;
}

export interface BomDeleteResponse {
  ok: boolean;
  mode: 'hard' | 'archive';
  error?: string;
  hint?: string;
}

export interface BomCloneResponse {
  id: number;
  version: string;
  status: 'draft';
}

export interface BomActivateResponse {
  id: number;
  status: 'active';
  previous_archived: number;
}

export interface BomArchiveResponse {
  id: number;
  status: 'archived';
}

export interface BomItemsUpdateResponse {
  bom_id: number;
  status: 'draft' | 'active' | 'archived';
}

/**
 * Helper functions for BOM version management
 */
export const BomVersionHelper = {
  /**
   * Parse version string into major and minor numbers
   */
  parseVersion(version: string): { major: number; minor: number } {
    const parts = version.split('.');
    return {
      major: parseInt(parts[0]) || 1,
      minor: parseInt(parts[1]) || 0,
    };
  },

  /**
   * Calculate next version based on change type
   */
  calculateNextVersion(current: string, changeType: 'major' | 'minor' | 'none'): string {
    if (changeType === 'none') return current;
    
    const { major, minor } = this.parseVersion(current);
    
    if (changeType === 'major') {
      return `${major + 1}.0`;
    } else {
      return `${major}.${minor + 1}`;
    }
  },

  /**
   * Detect type of change between old and new BOM items
   * Major: material_id changed
   * Minor: qty, scrap%, or metadata changed
   * None: no changes
   */
  detectChangeType(oldItems: BomItemUpdateData[], newItems: BomItemUpdateData[]): 'major' | 'minor' | 'none' {
    // Create maps by material_id for comparison
    const oldMap = new Map(oldItems.map(item => [item.material_id, item]));
    const newMap = new Map(newItems.map(item => [item.material_id, item]));

    // Check for added or removed items (major change)
    if (oldMap.size !== newMap.size) {
      return 'major';
    }

    // Check for material_id changes (major change)
    for (const newItem of newItems) {
      if (!oldMap.has(newItem.material_id)) {
        return 'major';
      }
    }

    for (const oldItem of oldItems) {
      if (!newMap.has(oldItem.material_id)) {
        return 'major';
      }
    }

    // Check for quantity or other changes (minor change)
    for (const newItem of newItems) {
      const oldItem = oldMap.get(newItem.material_id);
      if (!oldItem) continue;

      if (
        oldItem.quantity !== newItem.quantity ||
        oldItem.scrap_std_pct !== newItem.scrap_std_pct ||
        oldItem.uom !== newItem.uom ||
        oldItem.sequence !== newItem.sequence ||
        JSON.stringify(oldItem.line_id) !== JSON.stringify(newItem.line_id)
      ) {
        return 'minor';
      }
    }

    return 'none';
  },

  /**
   * Validate line compatibility between BOM and BOM items
   */
  validateLineCompatibility(bomLineIds: number[] | null, itemLineIds: number[] | null): boolean {
    // If BOM has no line restrictions, item can have any lines
    if (!bomLineIds || bomLineIds.length === 0) {
      return true;
    }

    // If item has no line restrictions, it inherits from BOM (valid)
    if (!itemLineIds || itemLineIds.length === 0) {
      return true;
    }

    // Item lines must be a subset of BOM lines
    return itemLineIds.every(lineId => bomLineIds.includes(lineId));
  },
};

export const BomsAPI = {
  /**
   * Update BOM header information
   * If BOM is active, will clone-on-edit
   */
  async updateHeader(id: number, data: BomUpdateData): Promise<BomUpdateResponse> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update BOM header');
    }

    return response.json();
  },

  /**
   * Update BOM items (bulk upsert)
   * If BOM is active, will clone-on-edit
   */
  async updateItems(id: number, items: BomItemUpdateData[]): Promise<BomItemsUpdateResponse> {
    const response = await fetch(`${API_BASE}/${id}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update BOM items');
    }

    return response.json();
  },

  /**
   * Clone BOM (manual clone action)
   */
  async clone(id: number): Promise<BomCloneResponse> {
    const response = await fetch(`${API_BASE}/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clone BOM');
    }

    return response.json();
  },

  /**
   * Activate BOM
   * Archives all other active BOMs for the same product
   */
  async activate(id: number): Promise<BomActivateResponse> {
    const response = await fetch(`${API_BASE}/${id}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to activate BOM');
    }

    return response.json();
  },

  /**
   * Archive BOM
   */
  async archive(id: number): Promise<BomArchiveResponse> {
    const response = await fetch(`${API_BASE}/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to archive BOM');
    }

    return response.json();
  },

  /**
   * Hard delete BOM (only for draft + unused)
   */
  async hardDelete(id: number): Promise<BomDeleteResponse> {
    const response = await fetch(`${API_BASE}/${id}?mode=hard`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to hard delete BOM');
    }

    return response.json();
  },

  /**
   * Soft delete BOM (archive)
   */
  async softDelete(id: number): Promise<BomDeleteResponse> {
    const response = await fetch(`${API_BASE}/${id}?mode=soft`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to soft delete BOM');
    }

    return response.json();
  },

  // ============================================================================
  // EPIC-001 Phase 2: Multi-Version BOM Support
  // ============================================================================

  /**
   * Get BOM for specific date (BOM versioning)
   * Selects the correct BOM version that is active on the given date
   * 
   * @param productId - Product ID
   * @param date - Date to find BOM for (defaults to now)
   * @returns BOM that is active on the given date
   */
  async getBOMForDate(
    productId: number,
    date?: string
  ): Promise<{
    bom_id: number;
    bom_version: string;
    effective_from: string;
    effective_to: string | null;
    is_current: boolean;
    is_future: boolean;
  }> {
    const params = new URLSearchParams({
      product_id: productId.toString(),
      ...(date && { date }),
    });

    const response = await fetch(`${API_BASE}/select-by-date?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `No active BOM found for product ${productId} on ${date || 'today'}`);
    }

    return response.json();
  },

  /**
   * Get all BOM versions for a product
   * Returns list of all BOMs with status flags (current, future, expired)
   * 
   * @param productId - Product ID
   * @returns Array of BOM versions with status
   */
  async getAllVersions(
    productId: number
  ): Promise<Array<{
    bom_id: number;
    bom_version: string;
    effective_from: string;
    effective_to: string | null;
    status: 'draft' | 'active' | 'archived';
    is_current: boolean;
    is_future: boolean;
    is_expired: boolean;
    items_count: number;
  }>> {
    const response = await fetch(`${API_BASE}/versions/${productId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch BOM versions for product ${productId}`);
    }

    return response.json();
  },

  /**
   * Clone BOM with new effective dates (create new version)
   * Used to create a future BOM version based on current one
   * 
   * @param id - BOM ID to clone
   * @param effectiveFrom - Start date for new version
   * @param effectiveTo - End date for new version (optional)
   * @returns Created BOM version
   */
  async cloneBOMWithDates(
    id: number,
    effectiveFrom: string,
    effectiveTo?: string | null
  ): Promise<BomCloneResponse & { effective_from: string; effective_to: string | null }> {
    const response = await fetch(`${API_BASE}/${id}/clone-version`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clone BOM version');
    }

    return response.json();
  },

  /**
   * Validate BOM date range (check for overlaps)
   * 
   * @param productId - Product ID
   * @param effectiveFrom - Start date
   * @param effectiveTo - End date (optional)
   * @param bomId - BOM ID (for updates, to exclude current BOM)
   * @returns Validation result
   */
  async validateDateRange(
    productId: number,
    effectiveFrom: string,
    effectiveTo?: string | null,
    bomId?: number
  ): Promise<{
    is_valid: boolean;
    error_message: string | null;
    conflicting_bom_id: number | null;
  }> {
    const params = new URLSearchParams({
      product_id: productId.toString(),
      effective_from: effectiveFrom,
      ...(effectiveTo && { effective_to: effectiveTo }),
      ...(bomId && { bom_id: bomId.toString() }),
    });

    const response = await fetch(`${API_BASE}/validate-date-range?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to validate date range');
    }

    return response.json();
  },
};
