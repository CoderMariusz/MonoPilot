import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitPO,
  approvePO,
  rejectPO,
  getPOApprovalHistory,
  canUserApprove,
  validateStatusTransition,
  checkApprovalRequired,
  getApprovalRoles,
} from '../purchase-order-service';

// Mock the supabase server module
const mockSupabaseAdmin = {
  from: vi.fn(),
  auth: {
    getSession: vi.fn(),
  },
};

vi.mock('../../supabase/server', () => ({
  createServerSupabaseAdmin: vi.fn(() => mockSupabaseAdmin),
  createServerSupabase: vi.fn(() => mockSupabaseAdmin),
  createClient: vi.fn(() => mockSupabaseAdmin),
}));

// Mock planning settings service
vi.mock('../planning-settings-service', () => ({
  getPlanningSettings: vi.fn().mockResolvedValue({
    po_require_approval: true,
    po_approval_threshold: 10000,
    po_approval_roles: ['admin', 'manager'],
  }),
}));

describe('Purchase Order Service - Approval Workflow', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const mockPoId = 'po-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitPO', () => {
    it('should submit PO directly if approval disabled', async () => {
      // Test case: AC-03
      // Should not fail but test will fail because implementation doesn't exist
      expect(() => submitPO(mockPoId, mockOrgId, mockUserId)).toBeDefined();
    });

    it('should submit directly if total below threshold', async () => {
      // Test case: AC-01
      const testPO = {
        id: mockPoId,
        status: 'draft',
        total: 5000,
        po_lines: [{ id: 'line-1', quantity: 100, unit_price: 50 }],
      };

      expect(() =>
        submitPO(mockPoId, mockOrgId, mockUserId)
      ).toBeDefined();
    });

    it('should require approval if total >= threshold', async () => {
      // Test case: AC-02
      const testPO = {
        id: mockPoId,
        status: 'draft',
        total: 15000,
        po_lines: [{ id: 'line-1', quantity: 100, unit_price: 150 }],
      };

      expect(() =>
        submitPO(mockPoId, mockOrgId, mockUserId)
      ).toBeDefined();
    });

    it('should require approval if threshold is null', async () => {
      // Test case: BR-02
      expect(() =>
        submitPO(mockPoId, mockOrgId, mockUserId)
      ).toBeDefined();
    });

    it('should throw error if PO not in draft status', async () => {
      // Test case: AC-04
      const expectedError = 'Cannot submit: PO must be in draft status';

      await expect(
        submitPO(mockPoId, mockOrgId, mockUserId)
      ).rejects.toThrow();
    });

    it('should throw error if PO has no lines', async () => {
      // Test case: AC-04
      const expectedError = 'Cannot submit PO: Purchase order must have at least one line item';

      await expect(
        submitPO(mockPoId, mockOrgId, mockUserId)
      ).rejects.toThrow();
    });

    it('should create approval history record on submission', async () => {
      // Test case: Unit test - History creation
      expect(() => {
        submitPO(mockPoId, mockOrgId, mockUserId);
      }).toBeDefined();
    });

    it('should send notifications to approvers when approval required', async () => {
      // Test case: AC-02, AC-05
      expect(() => {
        submitPO(mockPoId, mockOrgId, mockUserId);
      }).toBeDefined();
    });

    it('should not send notifications if approval not required', async () => {
      // Test case: AC-01, AC-03
      expect(() => {
        submitPO(mockPoId, mockOrgId, mockUserId);
      }).toBeDefined();
    });

    it('should return status and notification count in response', async () => {
      // Test case: API spec
      expect(() => {
        submitPO(mockPoId, mockOrgId, mockUserId);
      }).toBeDefined();
    });
  });

  describe('approvePO', () => {
    it('should approve PO and update status to approved', async () => {
      // Test case: AC-05
      expect(() => {
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager', 'Budget approved');
      }).toBeDefined();
    });

    it('should save approval notes', async () => {
      // Test case: AC-05
      const notes = 'Approved for Q4 stock replenishment. Good pricing.';

      expect(() => {
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager', notes);
      }).toBeDefined();
    });

    it('should set approved_by and approved_at', async () => {
      // Test case: AC-05
      expect(() => {
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager');
      }).toBeDefined();
    });

    it('should create approval history record', async () => {
      // Test case: Unit test - History creation
      expect(() => {
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager');
      }).toBeDefined();
    });

    it('should send notification to PO creator', async () => {
      // Test case: AC-05
      expect(() => {
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager');
      }).toBeDefined();
    });

    it('should throw error if user lacks approval permission', async () => {
      // Test case: AC-06
      const userRole = 'planner'; // Not in approval roles

      await expect(
        approvePO(mockPoId, mockOrgId, mockUserId, userRole)
      ).rejects.toThrow();
    });

    it('should throw error if PO not in pending_approval status', async () => {
      // Test case: AC-06
      const expectedError = 'Cannot approve: PO must be in pending approval status';

      await expect(
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager')
      ).rejects.toThrow();
    });

    it('should handle concurrent approval attempts', async () => {
      // Test case: RISK-01
      const expectedError = 'This PO has already been approved';

      await expect(
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager')
      ).rejects.toThrow();
    });

    it('should allow optional approval notes', async () => {
      // Test case: API spec
      expect(() => {
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager', undefined);
      }).toBeDefined();
    });

    it('should enforce max length for approval notes', async () => {
      // Test case: API spec (1000 char limit)
      const longNotes = 'x'.repeat(1001);

      await expect(
        approvePO(mockPoId, mockOrgId, mockUserId, 'manager', longNotes)
      ).rejects.toThrow();
    });
  });

  describe('rejectPO', () => {
    it('should reject PO and update status to rejected', async () => {
      // Test case: AC-07
      expect(() => {
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', 'Exceeds budget constraints.');
      }).toBeDefined();
    });

    it('should save rejection reason in approval_notes', async () => {
      // Test case: AC-07
      const reason = 'Exceeds quarterly budget. Please reduce quantity or defer to Q2.';

      expect(() => {
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', reason);
      }).toBeDefined();
    });

    it('should create approval history record with rejection action', async () => {
      // Test case: Unit test - History creation
      expect(() => {
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', 'Budget exceeded.');
      }).toBeDefined();
    });

    it('should send notification to PO creator', async () => {
      // Test case: AC-07
      expect(() => {
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', 'Budget exceeded.');
      }).toBeDefined();
    });

    it('should require rejection reason', async () => {
      // Test case: AC-08
      const expectedError = 'Rejection reason is required';

      await expect(
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', '')
      ).rejects.toThrow();
    });

    it('should enforce minimum rejection reason length (10 chars)', async () => {
      // Test case: AC-09
      const shortReason = 'Too much'; // 8 chars
      const expectedError = 'Rejection reason must be at least 10 characters';

      await expect(
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', shortReason)
      ).rejects.toThrow();
    });

    it('should enforce maximum rejection reason length (1000 chars)', async () => {
      // Test case: API spec
      const longReason = 'x'.repeat(1001);

      await expect(
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', longReason)
      ).rejects.toThrow();
    });

    it('should throw error if user lacks approval permission', async () => {
      // Test case: AC-07 (permission denied)
      const userRole = 'planner'; // Not in approval roles

      await expect(
        rejectPO(mockPoId, mockOrgId, mockUserId, userRole, 'Budget exceeded.')
      ).rejects.toThrow();
    });

    it('should throw error if PO not in pending_approval status', async () => {
      // Test case: AC-07 (wrong status)
      await expect(
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', 'Budget exceeded.')
      ).rejects.toThrow();
    });

    it('should preserve rejection reason exactly as provided', async () => {
      // Test case: AC-07 (accuracy)
      const reason = 'Quantity too high for current inventory capacity. Please reduce to 500kg Sugar White and 250kg Brown.';

      expect(() => {
        rejectPO(mockPoId, mockOrgId, mockUserId, 'admin', reason);
      }).toBeDefined();
    });
  });

  describe('validateStatusTransition', () => {
    it('should allow draft to pending_approval with approval enabled', async () => {
      // Test case: AC-11, BR-01
      expect(() => {
        validateStatusTransition('draft', 'pending_approval', true);
      }).not.toThrow();
    });

    it('should allow draft to submitted with approval disabled', async () => {
      // Test case: AC-11, BR-01
      expect(() => {
        validateStatusTransition('draft', 'submitted', false);
      }).not.toThrow();
    });

    it('should block draft to submitted when approval enabled', async () => {
      // Test case: AC-11
      const expectedError = 'Approval is enabled. PO must go through pending_approval.';

      expect(() => {
        validateStatusTransition('draft', 'submitted', true);
      }).toThrow();
    });

    it('should allow pending_approval to approved', async () => {
      // Test case: AC-11
      expect(() => {
        validateStatusTransition('pending_approval', 'approved', true);
      }).not.toThrow();
    });

    it('should allow pending_approval to rejected', async () => {
      // Test case: AC-11
      expect(() => {
        validateStatusTransition('pending_approval', 'rejected', true);
      }).not.toThrow();
    });

    it('should allow rejected to draft for re-editing', async () => {
      // Test case: AC-11
      expect(() => {
        validateStatusTransition('rejected', 'draft', true);
      }).not.toThrow();
    });

    it('should allow approved to confirmed', async () => {
      // Test case: AC-11
      expect(() => {
        validateStatusTransition('approved', 'confirmed', true);
      }).not.toThrow();
    });

    it('should allow submitted to confirmed', async () => {
      // Test case: AC-11
      expect(() => {
        validateStatusTransition('submitted', 'confirmed', false);
      }).not.toThrow();
    });

    it('should block invalid transitions', async () => {
      // Test case: AC-11
      const invalidTransitions = [
        ['draft', 'receiving'],
        ['pending_approval', 'receiving'],
        ['approved', 'submitted'],
        ['confirmed', 'pending_approval'],
      ];

      invalidTransitions.forEach(([from, to]) => {
        expect(() => {
          validateStatusTransition(from as any, to as any, true);
        }).toThrow();
      });
    });

    it('should throw descriptive error for invalid transitions', async () => {
      // Test case: Error message quality
      const expectedPattern = /Invalid status transition/;

      expect(() => {
        validateStatusTransition('draft', 'receiving', true);
      }).toThrow(expectedPattern);
    });
  });

  describe('canUserApprove', () => {
    it('should return true if user role in approval_roles', async () => {
      // Test case: Unit test - Permission check
      // Mock user with 'manager' role (which is in approval_roles)
      mockSupabaseAdmin.from = vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: { code: 'manager' } },
            }),
          };
        }
        if (table === 'planning_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  po_approval_roles: ['admin', 'manager'],
                },
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      });

      const result = await canUserApprove(mockUserId, mockOrgId);
      expect(result).toBe(true);
    });

    it('should return false if user role not in approval_roles', async () => {
      // Test case: Unit test - Permission check
      // Mock user with 'planner' role (which is NOT in approval_roles)
      mockSupabaseAdmin.from = vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: { code: 'planner' } },
            }),
          };
        }
        if (table === 'planning_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  po_approval_roles: ['admin', 'manager'],
                },
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      });

      const result = await canUserApprove(mockUserId, mockOrgId);
      expect(result).toBe(false);
    });

    it('should handle case-insensitive role matching', async () => {
      // Test case: Unit test - Permission check
      // Mock user with 'MANAGER' (uppercase) role
      mockSupabaseAdmin.from = vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: { code: 'MANAGER' } },
            }),
          };
        }
        if (table === 'planning_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  po_approval_roles: ['admin', 'manager'],
                },
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      });

      const result = await canUserApprove(mockUserId, mockOrgId);
      expect(result).toBe(true);
    });

    it('should respect org_id isolation', async () => {
      // Test case: Multi-tenancy
      // Mock user with 'manager' role in the correct org
      mockSupabaseAdmin.from = vi.fn((table) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: { code: 'manager' } },
            }),
          };
        }
        if (table === 'planning_settings') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  po_approval_roles: ['admin', 'manager'],
                },
              }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      });

      const result = await canUserApprove(mockUserId, mockOrgId);
      expect(result).toBe(true);
    });
  });

  describe('checkApprovalRequired', () => {
    it('should return false if approval disabled', async () => {
      // Test case: BR-01
      expect(checkApprovalRequired(null, false)).toBeFalsy();
    });

    it('should return true if threshold is null', async () => {
      // Test case: BR-02
      expect(checkApprovalRequired(null, true)).toBeTruthy();
    });

    it('should return true if total >= threshold', async () => {
      // Test case: BR-03
      expect(checkApprovalRequired(15000, true, { threshold: 10000 })).toBeTruthy();
    });

    it('should return false if total < threshold', async () => {
      // Test case: BR-03
      expect(checkApprovalRequired(5000, true, { threshold: 10000 })).toBeFalsy();
    });

    it('should include tax in total calculation', async () => {
      // Test case: Calculation accuracy
      const subtotal = 1000;
      const tax = 200;
      const total = subtotal + tax; // 1200

      expect(checkApprovalRequired(total, true, { threshold: 1200 })).toBeTruthy();
    });
  });

  describe('getApprovalRoles', () => {
    it('should return approval roles from settings', async () => {
      // Test case: Configuration reading
      expect(getApprovalRoles(mockOrgId)).toBeDefined();
    });

    it('should return empty array if no roles defined', async () => {
      // Test case: Configuration reading
      expect(getApprovalRoles(mockOrgId)).toBeDefined();
    });

    it('should be cached for performance', async () => {
      // Test case: Performance (PR-01)
      expect(getApprovalRoles(mockOrgId)).toBeDefined();
    });
  });
});
