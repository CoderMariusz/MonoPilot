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
};
