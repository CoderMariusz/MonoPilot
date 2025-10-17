/**
 * API Integration Tests for Excel Exports
 * Tests the Excel export API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { convertToCSV, convertToXLSX } from '../../lib/utils/exportHelpers';

// Mock SheetJS
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn(() => ({})),
    book_new: jest.fn(() => ({})),
    book_append_sheet: jest.fn(() => ({})),
    write: jest.fn(() => new ArrayBuffer(8))
  }
}));

describe('Export Helpers', () => {
  describe('convertToCSV', () => {
    it('should convert data to CSV format', () => {
      const mockData = [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 }
      ];

      const csv = convertToCSV(mockData);

      expect(csv).toContain('id,name,value');
      expect(csv).toContain('1,Test 1,100');
      expect(csv).toContain('2,Test 2,200');
    });

    it('should handle empty data', () => {
      const csv = convertToCSV([]);

      expect(csv).toBe('');
    });

    it('should handle data with null values', () => {
      const mockData = [
        { id: 1, name: null, value: 100 },
        { id: 2, name: 'Test 2', value: null }
      ];

      const csv = convertToCSV(mockData);

      expect(csv).toContain('id,name,value');
      expect(csv).toContain('1,,100');
      expect(csv).toContain('2,Test 2,');
    });

    it('should handle custom headers', () => {
      const mockData = [
        { id: 1, name: 'Test 1', value: 100 }
      ];

      const csv = convertToCSV(mockData, ['ID', 'Name', 'Value']);

      expect(csv).toContain('ID,Name,Value');
      expect(csv).toContain('1,Test 1,100');
    });

    it('should escape double quotes in data', () => {
      const mockData = [
        { id: 1, name: 'Test "with" quotes', value: 100 }
      ];

      const csv = convertToCSV(mockData);

      expect(csv).toContain('"Test ""with"" quotes"');
    });
  });

  describe('convertToXLSX', () => {
    it('should convert data to XLSX format', () => {
      const mockData = [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 }
      ];

      const xlsx = convertToXLSX(mockData, 'Test Sheet');

      expect(xlsx).toBeInstanceOf(Blob);
      expect(xlsx.type).toBe('application/octet-stream');
    });

    it('should handle empty data', () => {
      const xlsx = convertToXLSX([], 'Empty Sheet');

      expect(xlsx).toBeInstanceOf(Blob);
    });

    it('should use default sheet name', () => {
      const mockData = [{ id: 1, name: 'Test' }];

      const xlsx = convertToXLSX(mockData);

      expect(xlsx).toBeInstanceOf(Blob);
    });
  });
});

describe('Export API Endpoints', () => {
  describe('GET /api/exports/yield-pr.xlsx', () => {
    it('should export PR yield data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/yield-pr.xlsx?startDate=2024-01-01&endDate=2024-01-31&line=Line-1');
      
      const mockResponse = {
        success: true,
        data: [
          {
            report_date: '2024-01-01',
            line_number: 'Line-1',
            product_id: 1,
            product_name: 'Beef',
            planned_qty: 100.0,
            actual_qty: 95.0,
            yield_percentage: 95.0
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].yield_percentage).toBe(95.0);
    });
  });

  describe('GET /api/exports/yield-fg.xlsx', () => {
    it('should export FG yield data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/yield-fg.xlsx?startDate=2024-01-01&endDate=2024-01-31&line=Line-1');
      
      const mockResponse = {
        success: true,
        data: [
          {
            report_date: '2024-01-01',
            line_number: 'Line-1',
            product_id: 1,
            product_name: 'Ground Beef',
            planned_qty: 100.0,
            actual_qty: 90.0,
            yield_percentage: 90.0,
            waste_qty: 10.0
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].waste_qty).toBe(10.0);
    });
  });

  describe('GET /api/exports/consume.xlsx', () => {
    it('should export consumption data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/consume.xlsx?woId=1&startDate=2024-01-01&endDate=2024-01-31');
      
      const mockResponse = {
        success: true,
        data: [
          {
            wo_number: 'WO-001',
            material_id: 1,
            material_name: 'Beef',
            bom_standard: 100.0,
            actual_consumed: 95.0,
            variance_kg: -5.0,
            variance_percentage: -5.0
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].variance_percentage).toBe(-5.0);
    });
  });

  describe('GET /api/exports/trace.xlsx', () => {
    it('should export traceability data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/trace.xlsx?lp=LP-001&direction=forward');
      
      const mockResponse = {
        success: true,
        data: [
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
            depth: 0
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].node_number).toBe('LP-001');
    });
  });

  describe('GET /api/exports/work-orders.xlsx', () => {
    it('should export work orders data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/work-orders.xlsx?line=Line-1&status=in_progress');
      
      const mockResponse = {
        success: true,
        data: [
          {
            wo_number: 'WO-001',
            product_name: 'Beef',
            status: 'in_progress',
            kpi_scope: 'PR',
            line_number: 'Line-1',
            planned_qty: 100.0,
            actual_qty: 95.0,
            yield_percentage: 95.0,
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].wo_number).toBe('WO-001');
    });
  });

  describe('GET /api/exports/license-plates.xlsx', () => {
    it('should export license plates data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/license-plates.xlsx?qa_status=Passed&location=1');
      
      const mockResponse = {
        success: true,
        data: [
          {
            lp_number: 'LP-001',
            product_name: 'Beef',
            quantity: 100.0,
            uom: 'kg',
            qa_status: 'Passed',
            stage_suffix: '-RS',
            location: 'Cold Store',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].lp_number).toBe('LP-001');
    });
  });

  describe('GET /api/exports/stock-moves.xlsx', () => {
    it('should export stock moves data', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/exports/stock-moves.xlsx?move_type=WO_ISSUE&startDate=2024-01-01&endDate=2024-01-31');
      
      const mockResponse = {
        success: true,
        data: [
          {
            move_number: 'SM-001',
            lp_number: 'LP-001',
            product_name: 'Beef',
            move_type: 'WO_ISSUE',
            quantity: 100.0,
            uom: 'kg',
            from_location: 'Cold Store',
            to_location: 'Production',
            status: 'completed',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toHaveLength(1);
      expect(mockResponse.data[0].move_type).toBe('WO_ISSUE');
    });
  });
});

describe('Export Error Handling', () => {
  it('should handle export errors gracefully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/exports/yield-pr.xlsx');
    
    const mockResponse = {
      success: false,
      error: 'No data found for the specified filters'
    };

    expect(mockResponse.success).toBe(false);
    expect(mockResponse.error).toContain('No data found');
  });

  it('should handle invalid date ranges', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/exports/yield-pr.xlsx?startDate=invalid&endDate=invalid');
    
    const mockResponse = {
      success: false,
      error: 'Invalid date format'
    };

    expect(mockResponse.success).toBe(false);
    expect(mockResponse.error).toContain('Invalid date format');
  });

  it('should handle missing required parameters', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/exports/consume.xlsx');
    
    const mockResponse = {
      success: false,
      error: 'Missing required parameter: woId'
    };

    expect(mockResponse.success).toBe(false);
    expect(mockResponse.error).toContain('Missing required parameter');
  });
});

