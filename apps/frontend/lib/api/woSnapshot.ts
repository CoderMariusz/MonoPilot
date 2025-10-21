import { WoMaterial } from '@/lib/types';

const API_BASE = '/api/production/wo';

export interface WoSnapshotPreviewResponse {
  current: WoMaterial[];
  proposed: WoMaterial[];
  diff: {
    added: WoMaterial[];
    removed: WoMaterial[];
    modified: Array<{
      current: WoMaterial;
      proposed: WoMaterial;
      changes: string[];
    }>;
  };
}

export interface WoSnapshotApplyResponse {
  ok: boolean;
  materials_updated: number;
  error?: string;
}

export const WoSnapshotAPI = {
  /**
   * Preview BOM snapshot changes for a Work Order
   * Shows diff between current wo_materials and active BOM
   */
  async preview(woId: number): Promise<WoSnapshotPreviewResponse> {
    const response = await fetch(`${API_BASE}/${woId}/snapshot/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to preview WO snapshot');
    }

    return response.json();
  },

  /**
   * Apply BOM snapshot to Work Order
   * Only works for WO status = 'planned' and no existing outputs/operations
   */
  async apply(woId: number): Promise<WoSnapshotApplyResponse> {
    const response = await fetch(`${API_BASE}/${woId}/snapshot/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply WO snapshot');
    }

    return response.json();
  },
};
