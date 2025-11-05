/**
 * Audit API
 * Functions for managing audit logs with reason field
 */

const API_BASE = '/api/audit';

export const AuditAPI = {
  /**
   * Add a reason to the most recent audit event for an entity
   */
  async addReason(entityType: string, entityId: number, reason: string): Promise<void> {
    const response = await fetch(`${API_BASE}/add-reason`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        reason: reason
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add audit reason');
    }
  },
};

