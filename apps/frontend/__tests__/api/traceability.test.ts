/**
 * API Integration Tests for Traceability
 * Tests the traceability API endpoints and forward/backward trace
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getForwardTrace, getBackwardTrace, buildTraceTree, calculateTraceCompleteness, getOverallQAStatus, calculateTotalQuantity } from '../../lib/api/traceability';

// Mock Supabase client
const mockSupabase = {
  rpc: jest.fn(() => ({
    data: null,
    error: null
  }))
};

jest.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Traceability API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Forward Trace', () => {
    it('should get forward trace successfully', async () => {
      const mockTraceData = [
        {
          node_id: '1',
          node_type: 'LP',
          node_number: 'LP-001',
          product_description: 'Beef',
          quantity: 100.0,
          uom: 'kg',
          qa_status: 'Passed',
          stage_suffix: '-RS',
          location: 'Cold Store',
          parent_node: null,
          depth: 0,
          path: ['LP-001']
        },
        {
          node_id: '2',
          node_type: 'LP',
          node_number: 'LP-002',
          product_description: 'Ground Beef',
          quantity: 95.0,
          uom: 'kg',
          qa_status: 'Passed',
          stage_suffix: '-SM',
          location: 'Production',
          parent_node: 'LP-001',
          depth: 1,
          path: ['LP-001', 'LP-002']
        }
      ];

      mockSupabase.rpc.mockReturnValue({
        data: mockTraceData,
        error: null
      });

      const result = await getForwardTrace('LP-001');

      expect(result.success).toBe(true);
      expect(result.data.tree.root).toBeDefined();
      expect(result.data.summary.total_nodes).toBe(2);
    });

    it('should handle forward trace with no data', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: [],
        error: null
      });

      const result = await getForwardTrace('LP-NOT-FOUND');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No traceability data found');
    });

    it('should handle forward trace errors', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await getForwardTrace('LP-001');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Backward Trace', () => {
    it('should get backward trace successfully', async () => {
      const mockTraceData = [
        {
          node_id: '2',
          node_type: 'LP',
          node_number: 'LP-002',
          product_description: 'Ground Beef',
          quantity: 95.0,
          uom: 'kg',
          qa_status: 'Passed',
          stage_suffix: '-SM',
          location: 'Production',
          parent_node: 'LP-001',
          depth: 0,
          path: ['LP-002']
        },
        {
          node_id: '1',
          node_type: 'LP',
          node_number: 'LP-001',
          product_description: 'Beef',
          quantity: 100.0,
          uom: 'kg',
          qa_status: 'Passed',
          stage_suffix: '-RS',
          location: 'Cold Store',
          parent_node: null,
          depth: 1,
          path: ['LP-002', 'LP-001']
        }
      ];

      mockSupabase.rpc.mockReturnValue({
        data: mockTraceData,
        error: null
      });

      const result = await getBackwardTrace('LP-002');

      expect(result.success).toBe(true);
      expect(result.data.tree.root).toBeDefined();
      expect(result.data.summary.total_nodes).toBe(2);
    });

    it('should handle backward trace with no data', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: [],
        error: null
      });

      const result = await getBackwardTrace('LP-NOT-FOUND');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No traceability data found');
    });

    it('should handle backward trace errors', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await getBackwardTrace('LP-002');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Trace Tree Building', () => {
    it('should build trace tree correctly', () => {
      const mockTraceData = [
        {
          node_id: '1',
          node_type: 'LP',
          node_number: 'LP-001',
          product_description: 'Beef',
          quantity: 100.0,
          uom: 'kg',
          qa_status: 'Passed',
          stage_suffix: '-RS',
          location: 'Cold Store',
          parent_node: null,
          depth: 0,
          path: ['LP-001']
        },
        {
          node_id: '2',
          node_type: 'LP',
          node_number: 'LP-002',
          product_description: 'Ground Beef',
          quantity: 95.0,
          uom: 'kg',
          qa_status: 'Passed',
          stage_suffix: '-SM',
          location: 'Production',
          parent_node: 'LP-001',
          depth: 1,
          path: ['LP-001', 'LP-002']
        }
      ];

      const tree = buildTraceTree(mockTraceData, 'forward');

      expect(tree.root).toBeDefined();
      expect(tree.root.node_number).toBe('LP-001');
      expect(tree.root.children).toHaveLength(1);
      expect(tree.root.children[0].node_number).toBe('LP-002');
    });

    it('should handle empty trace data', () => {
      const tree = buildTraceTree([], 'forward');

      expect(tree.root).toBeNull();
    });
  });

  describe('Trace Completeness Calculation', () => {
    it('should calculate trace completeness correctly', () => {
      const mockTraceData = [
        {
          node_id: '1',
          node_type: 'LP',
          qa_status: 'Passed',
          depth: 0
        },
        {
          node_id: '2',
          node_type: 'LP',
          qa_status: 'Passed',
          depth: 1
        },
        {
          node_id: '3',
          node_type: 'LP',
          qa_status: 'Failed',
          depth: 2
        }
      ];

      const completeness = calculateTraceCompleteness(mockTraceData);

      expect(completeness).toBe(66.67); // 2 out of 3 nodes have Passed status
    });

    it('should handle empty trace data', () => {
      const completeness = calculateTraceCompleteness([]);

      expect(completeness).toBe(0);
    });
  });

  describe('Overall QA Status', () => {
    it('should determine overall QA status correctly', () => {
      const mockTraceData = [
        {
          node_id: '1',
          qa_status: 'Passed'
        },
        {
          node_id: '2',
          qa_status: 'Passed'
        }
      ];

      const qaStatus = getOverallQAStatus(mockTraceData);

      expect(qaStatus).toBe('Passed');
    });

    it('should return Failed if any node has Failed status', () => {
      const mockTraceData = [
        {
          node_id: '1',
          qa_status: 'Passed'
        },
        {
          node_id: '2',
          qa_status: 'Failed'
        }
      ];

      const qaStatus = getOverallQAStatus(mockTraceData);

      expect(qaStatus).toBe('Failed');
    });

    it('should return Quarantine if any node has Quarantine status', () => {
      const mockTraceData = [
        {
          node_id: '1',
          qa_status: 'Passed'
        },
        {
          node_id: '2',
          qa_status: 'Quarantine'
        }
      ];

      const qaStatus = getOverallQAStatus(mockTraceData);

      expect(qaStatus).toBe('Quarantine');
    });

    it('should return Pending if any node has Pending status', () => {
      const mockTraceData = [
        {
          node_id: '1',
          qa_status: 'Passed'
        },
        {
          node_id: '2',
          qa_status: 'Pending'
        }
      ];

      const qaStatus = getOverallQAStatus(mockTraceData);

      expect(qaStatus).toBe('Pending');
    });
  });

  describe('Total Quantity Calculation', () => {
    it('should calculate total quantity correctly', () => {
      const mockTraceData = [
        {
          node_id: '1',
          quantity: 100.0
        },
        {
          node_id: '2',
          quantity: 95.0
        },
        {
          node_id: '3',
          quantity: 50.0
        }
      ];

      const totalQty = calculateTotalQuantity(mockTraceData);

      expect(totalQty).toBe(245.0);
    });

    it('should handle null quantities', () => {
      const mockTraceData = [
        {
          node_id: '1',
          quantity: 100.0
        },
        {
          node_id: '2',
          quantity: null
        }
      ];

      const totalQty = calculateTotalQuantity(mockTraceData);

      expect(totalQty).toBe(100.0);
    });

    it('should handle empty trace data', () => {
      const totalQty = calculateTotalQuantity([]);

      expect(totalQty).toBe(0);
    });
  });
});

describe('Traceability API Endpoints', () => {
  describe('GET /api/production/trace/forward', () => {
    it('should get forward trace', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/production/trace/forward?lp=LP-001');
      
      const mockResponse = {
        success: true,
        data: {
          root: {
            node_number: 'LP-001',
            product_description: 'Beef',
            quantity: 100.0,
            qa_status: 'Passed'
          },
          tree: {
            root: {
              node_number: 'LP-001',
              children: []
            }
          },
          summary: {
            total_nodes: 1,
            trace_completeness: 100,
            qa_status: 'Passed',
            total_quantity: 100.0
          }
        }
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.root.node_number).toBe('LP-001');
    });
  });

  describe('GET /api/production/trace/backward', () => {
    it('should get backward trace', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/production/trace/backward?lp=LP-002');
      
      const mockResponse = {
        success: true,
        data: {
          root: {
            node_number: 'LP-002',
            product_description: 'Ground Beef',
            quantity: 95.0,
            qa_status: 'Passed'
          },
          tree: {
            root: {
              node_number: 'LP-002',
              children: []
            }
          },
          summary: {
            total_nodes: 1,
            trace_completeness: 100,
            qa_status: 'Passed',
            total_quantity: 95.0
          }
        }
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.root.node_number).toBe('LP-002');
    });
  });
});

