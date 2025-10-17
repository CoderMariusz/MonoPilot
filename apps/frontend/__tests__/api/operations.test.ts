/**
 * API Integration Tests for Operations
 * Tests the operations API endpoints and 1:1 enforcement
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { BusinessLogicOrchestrator, OneToOneValidator, SequentialRoutingValidator } from '../../lib/utils/businessLogic';

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
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
};

jest.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Operations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Record Weights', () => {
    it('should record operation weights successfully', async () => {
      const mockWeights = {
        actual_input_weight: 100.0,
        actual_output_weight: 95.0,
        cooking_loss_weight: 3.0,
        trim_loss_weight: 2.0,
        marinade_gain_weight: 0.0,
        scrap_breakdown: { 'fat': 1.0, 'bone': 1.0 }
      };

      mockSupabase.from().update().eq().eq().select().single.mockReturnValue({
        data: {
          wo_id: 1,
          sequence: 1,
          ...mockWeights
        },
        error: null
      });

      const result = await mockSupabase.from('wo_operations')
        .update(mockWeights)
        .eq('wo_id', 1)
        .eq('sequence', 1)
        .select()
        .single();

      expect(result.data.wo_id).toBe(1);
      expect(result.data.sequence).toBe(1);
      expect(result.data.actual_input_weight).toBe(100.0);
      expect(result.data.actual_output_weight).toBe(95.0);
    });

    it('should handle weight recording errors', async () => {
      mockSupabase.from().update().eq().eq().select().single.mockReturnValue({
        data: null,
        error: new Error('Operation not found')
      });

      const result = await mockSupabase.from('wo_operations')
        .update({ actual_input_weight: 100.0 })
        .eq('wo_id', 1)
        .eq('sequence', 1)
        .select()
        .single();

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Operation not found');
    });
  });

  describe('1:1 Component Enforcement', () => {
    it('should validate 1:1 components correctly', async () => {
      const mockMaterials = [
        { material_id: 1, one_to_one: true, quantity: 50.0 },
        { material_id: 2, one_to_one: false, quantity: 25.0 }
      ];

      mockSupabase.from().select().eq().eq().mockReturnValue({
        data: mockMaterials,
        error: null
      });

      const result = await OneToOneValidator.validateOneToOneRule(1, 1, ['LP-001'], ['LP-002']);

      expect(result.isOneToOne).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid 1:1 relationships', async () => {
      const mockMaterials = [
        { material_id: 1, one_to_one: true, quantity: 50.0 }
      ];

      mockSupabase.from().select().eq().eq().mockReturnValue({
        data: mockMaterials,
        error: null
      });

      const result = await OneToOneValidator.validateOneToOneRule(1, 1, ['LP-001', 'LP-002'], ['LP-003']);

      expect(result.isOneToOne).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exactly one input LP per output LP');
    });

    it('should allow non-1:1 components to have multiple inputs', async () => {
      const mockMaterials = [
        { material_id: 1, one_to_one: false, quantity: 50.0 }
      ];

      mockSupabase.from().select().eq().eq().mockReturnValue({
        data: mockMaterials,
        error: null
      });

      const result = await OneToOneValidator.validateOneToOneRule(1, 1, ['LP-001', 'LP-002'], ['LP-003']);

      expect(result.isOneToOne).toBe(false);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Sequential Routing Enforcement', () => {
    it('should allow operation in correct sequence', async () => {
      const mockWorkOrder = {
        current_operation_seq: 1,
        status: 'in_progress'
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockWorkOrder,
        error: null
      });

      const result = await SequentialRoutingValidator.validateOperationSequence(1, 1, 'start');

      expect(result.isValid).toBe(true);
    });

    it('should block operation out of sequence', async () => {
      const mockWorkOrder = {
        current_operation_seq: 1,
        status: 'in_progress'
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockWorkOrder,
        error: null
      });

      const result = await SequentialRoutingValidator.validateOperationSequence(1, 2, 'start');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot start operation 2. Current operation is 1');
    });

    it('should block operation on completed work order', async () => {
      const mockWorkOrder = {
        current_operation_seq: 1,
        status: 'completed'
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockWorkOrder,
        error: null
      });

      const result = await SequentialRoutingValidator.validateOperationSequence(1, 1, 'start');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Work order must be in progress');
    });
  });

  describe('Weight Recording Validation', () => {
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

  describe('Operation Completion', () => {
    it('should complete operation successfully', async () => {
      const mockOperation = {
        actual_input_weight: 100.0,
        actual_output_weight: 95.0
      };

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockOperation,
        error: null
      });

      const result = await mockSupabase.from('wo_operations')
        .select('actual_input_weight, actual_output_weight')
        .eq('wo_id', 1)
        .eq('sequence', 1)
        .single();

      expect(result.data.actual_input_weight).toBe(100.0);
      expect(result.data.actual_output_weight).toBe(95.0);
    });

    it('should block completion without weights', async () => {
      const mockOperation = {
        actual_input_weight: null,
        actual_output_weight: null
      };

      mockSupabase.from().select().eq().eq().single.mockReturnValue({
        data: mockOperation,
        error: null
      });

      const result = await mockSupabase.from('wo_operations')
        .select('actual_input_weight, actual_output_weight')
        .eq('wo_id', 1)
        .eq('sequence', 1)
        .single();

      expect(result.data.actual_input_weight).toBeNull();
      expect(result.data.actual_output_weight).toBeNull();
    });
  });
});

describe('Operations API Endpoints', () => {
  describe('POST /api/production/wo/:id/operations/:seq/weights', () => {
    it('should record operation weights', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/production/wo/1/operations/1/weights', {
        method: 'POST',
        body: JSON.stringify({
          actual_input_weight: 100.0,
          actual_output_weight: 95.0,
          cooking_loss_weight: 3.0,
          trim_loss_weight: 2.0,
          marinade_gain_weight: 0.0,
          scrap_breakdown: { 'fat': 1.0, 'bone': 1.0 }
        })
      });

      const mockResponse = {
        success: true,
        message: 'Operation weights recorded successfully'
      };

      expect(mockResponse.success).toBe(true);
    });
  });

  describe('POST /api/scanner/process/:woId/operations/:seq/weights', () => {
    it('should record scanner operation weights', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/scanner/process/1/operations/1/weights', {
        method: 'POST',
        body: JSON.stringify({
          actual_input_weight: 100.0,
          actual_output_weight: 95.0,
          cooking_loss_weight: 3.0,
          trim_loss_weight: 2.0,
          marinade_gain_weight: 0.0,
          scrap_breakdown: { 'fat': 1.0, 'bone': 1.0 },
          user_id: 'user-id'
        })
      });

      const mockResponse = {
        success: true,
        message: 'Scanner operation weights recorded successfully'
      };

      expect(mockResponse.success).toBe(true);
    });
  });
});

