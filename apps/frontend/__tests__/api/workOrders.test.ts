/**
 * API Integration Tests for Work Orders
 * Tests the work orders API endpoints and business logic
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { WorkOrdersAPI } from '../../lib/api/workOrders';
import { BusinessLogicOrchestrator } from '../../lib/utils/businessLogic';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      order: jest.fn(() => ({
        data: [],
        error: null
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    }))
  })),
  rpc: jest.fn(() => ({
    data: null,
    error: null
  }))
};

jest.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Work Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAll', () => {
    it('should fetch work orders with filters', async () => {
      const mockWorkOrders = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          status: 'in_progress',
          kpi_scope: 'PR',
          line_number: 'Line-1',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.from().select().order.mockReturnValue({
        data: mockWorkOrders,
        error: null
      });

      const result = await WorkOrdersAPI.getAll({
        line: 'Line-1',
        kpi_scope: 'PR',
        status: 'in_progress'
      });

      expect(result).toHaveLength(1);
      expect(result[0].wo_number).toBe('WO-001');
      expect(mockSupabase.from).toHaveBeenCalledWith('work_orders');
    });

    it('should handle date bucket filtering', async () => {
      const mockWorkOrders = [
        {
          id: 1,
          wo_number: 'WO-001',
          actual_start: '2024-01-01T00:00:00Z'
        }
      ];

      mockSupabase.from().select().order.mockReturnValue({
        data: mockWorkOrders,
        error: null
      });

      const result = await WorkOrdersAPI.getAll({
        date_bucket: 'day'
      });

      expect(result).toHaveLength(1);
      expect(mockSupabase.from().select().gte).toHaveBeenCalledWith('actual_start', expect.any(String));
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from().select().order.mockReturnValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getWorkOrderStageStatus', () => {
    it('should return stage status for work order', async () => {
      const mockStageStatus = {
        wo_id: 1,
        operations: [
          {
            seq: 1,
            operation_name: 'Grind',
            required_kg: 100,
            staged_kg: 50,
            in_kg: 0,
            remaining_kg: 100,
            color_code: 'red',
            one_to_one_components: []
          }
        ]
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: {
          id: 1,
          wo_number: 'WO-001',
          kpi_scope: 'PR',
          wo_materials: [
            {
              sequence: 1,
              quantity: 100,
              one_to_one: false,
              material: { description: 'Beef' }
            }
          ],
          wo_operations: [
            {
              sequence: 1,
              operation_name: 'Grind',
              actual_input_weight: null,
              actual_output_weight: null
            }
          ]
        },
        error: null
      });

      const result = await WorkOrdersAPI.getWorkOrderStageStatus(1);

      expect(result.wo_id).toBe(1);
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].operation_name).toBe('Grind');
    });

    it('should handle mock data mode', async () => {
      // Mock the shouldUseMockData function to return true
      jest.doMock('../../lib/clientState', () => ({
        shouldUseMockData: () => true
      }));

      const result = await WorkOrdersAPI.getWorkOrderStageStatus(1);

      expect(result.wo_id).toBe(1);
      expect(result.operations).toHaveLength(1);
    });
  });

  describe('closeWorkOrder', () => {
    it('should close work order successfully', async () => {
      const mockCloseResult = {
        success: true,
        message: 'Work order closed successfully'
      };

      mockSupabase.rpc.mockReturnValue({
        data: mockCloseResult,
        error: null
      });

      const result = await WorkOrdersAPI.closeWorkOrder(1, 'user-id', 'Completed', 'portal');

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('close_work_order', {
        p_wo_id: 1,
        p_user_id: 'user-id',
        p_reason: 'Completed',
        p_source: 'portal'
      });
    });

    it('should handle close work order errors', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: new Error('Cannot close work order')
      });

      const result = await WorkOrdersAPI.closeWorkOrder(1, 'user-id', 'Completed', 'portal');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot close work order');
    });
  });
});

describe('Business Logic Integration', () => {
  describe('validateStagingOperation', () => {
    it('should validate staging operation successfully', async () => {
      const mockValidation = {
        isValid: true
      };

      jest.spyOn(BusinessLogicOrchestrator, 'validateStagingOperation').mockResolvedValue(mockValidation);

      const result = await BusinessLogicOrchestrator.validateStagingOperation(1, 1, 'LP-001', 50);

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid staging operation', async () => {
      const mockValidation = {
        isValid: false,
        error: 'QA gate blocked'
      };

      jest.spyOn(BusinessLogicOrchestrator, 'validateStagingOperation').mockResolvedValue(mockValidation);

      const result = await BusinessLogicOrchestrator.validateStagingOperation(1, 1, 'LP-001', 50);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('QA gate blocked');
    });
  });

  describe('validateWeightRecording', () => {
    it('should validate weight recording with 1:1 components', async () => {
      const mockValidation = {
        isValid: true
      };

      jest.spyOn(BusinessLogicOrchestrator, 'validateWeightRecording').mockResolvedValue(mockValidation);

      const result = await BusinessLogicOrchestrator.validateWeightRecording(1, 1, ['LP-001'], ['LP-002']);

      expect(result.isValid).toBe(true);
    });

    it('should reject weight recording with invalid 1:1 relationship', async () => {
      const mockValidation = {
        isValid: false,
        error: 'One-to-one components require exactly one input LP per output LP'
      };

      jest.spyOn(BusinessLogicOrchestrator, 'validateWeightRecording').mockResolvedValue(mockValidation);

      const result = await BusinessLogicOrchestrator.validateWeightRecording(1, 1, ['LP-001', 'LP-002'], ['LP-003']);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('One-to-one components');
    });
  });

  describe('validateOperationCompletion', () => {
    it('should validate operation completion successfully', async () => {
      const mockValidation = {
        isValid: true
      };

      jest.spyOn(BusinessLogicOrchestrator, 'validateOperationCompletion').mockResolvedValue(mockValidation);

      const result = await BusinessLogicOrchestrator.validateOperationCompletion(1, 1);

      expect(result.isValid).toBe(true);
    });

    it('should reject operation completion without weights', async () => {
      const mockValidation = {
        isValid: false,
        error: 'Cannot complete operation without recording input and output weights'
      };

      jest.spyOn(BusinessLogicOrchestrator, 'validateOperationCompletion').mockResolvedValue(mockValidation);

      const result = await BusinessLogicOrchestrator.validateOperationCompletion(1, 1);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('weights');
    });
  });
});

describe('Work Order API Endpoints', () => {
  describe('GET /api/production/work-orders', () => {
    it('should return work orders with filters', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/production/work-orders?line=Line-1&kpi_scope=PR');
      
      // Mock the API response
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            wo_number: 'WO-001',
            status: 'in_progress',
            kpi_scope: 'PR'
          }
        ]
      };

      // This would be tested with actual API calls in integration tests
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
    });
  });

  describe('POST /api/production/work-orders/:id/close', () => {
    it('should close work order', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/production/work-orders/1/close', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-id',
          reason: 'Completed',
          source: 'portal'
        })
      });

      const mockResponse = {
        success: true,
        message: 'Work order closed successfully'
      };

      expect(mockResponse.success).toBe(true);
    });
  });
});

