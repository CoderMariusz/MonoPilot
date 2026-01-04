// P2: RED Tests - Label Print Service
// Story: 05.14 - LP Label Printing (ZPL)
// Agent: TEST-WRITER (Claude)
// Phase: 2/7 - TDD RED phase

import { describe, it, expect, beforeEach } from 'vitest';
import { LabelPrintService } from '@/lib/services/label-print-service';
import type { LicensePlate } from '@/lib/types/license-plate';

describe('LabelPrintService', () => {
  let mockLP: LicensePlate;

  beforeEach(() => {
    mockLP = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      lp_number: 'LP20251201-000123',
      product_id: 'prod-123',
      product: {
        id: 'prod-123',
        name: 'Flour Type 00 Premium Grade Italian Import',
        code: 'FLR-00-IT',
      },
      quantity: 500.0,
      uom: 'kg',
      batch_number: 'BCH-456-2024',
      expiry_date: '2025-06-15',
      manufacture_date: '2024-12-01',
      location_id: 'loc-123',
      location: {
        id: 'loc-123',
        name: 'A-01-02',
        full_path: 'Main Warehouse / Zone A / Shelf 01 / Bin 02',
      },
      warehouse_id: 'wh-123',
      warehouse: {
        id: 'wh-123',
        name: 'Main Warehouse',
        code: 'WH-001',
      },
      status: 'available',
      qa_status: 'passed',
      catch_weight_kg: null,
      created_at: '2024-12-01T10:30:00Z',
      updated_at: '2024-12-01T10:30:00Z',
    };
  });

  describe('generateZPL', () => {
    it('should generate valid ZPL II code for standard 4x6 label', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 1 });

      expect(zpl).toContain('^XA'); // ZPL start
      expect(zpl).toContain('^XZ'); // ZPL end
      expect(zpl).toContain('^FO'); // Field Origin commands
      expect(zpl).toMatch(/\^PQ1/); // Print quantity = 1
    });

    it('should include QR code with LP metadata JSON', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, {
        size: '4x6',
        copies: 1,
        includeQR: true
      });

      // QR code command present
      expect(zpl).toContain('^BQN'); // QR barcode command

      // Extract QR data and verify JSON structure
      const qrMatch = zpl.match(/\^FD({.*?})\^FS/);
      expect(qrMatch).toBeTruthy();

      if (qrMatch) {
        const qrData = JSON.parse(qrMatch[1]);
        expect(qrData).toMatchObject({
          lp_number: 'LP20251201-000123',
          product_code: 'FLR-00-IT',
          batch: 'BCH-456-2024',
          expiry: '2025-06-15',
          quantity: 500.0,
          uom: 'kg',
        });
      }
    });

    it('should include CODE128 barcode for LP number', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 1 });

      // CODE128 barcode command
      expect(zpl).toContain('^BCN'); // CODE128 barcode
      expect(zpl).toContain('LP20251201-000123'); // LP number in barcode
    });

    it('should truncate product name to 40 characters on label', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 1 });

      // Product name should be truncated in display field
      expect(zpl).toContain('Flour Type 00 Premium Grade Italian I'); // 40 chars
      expect(zpl).not.toContain('Flour Type 00 Premium Grade Italian Import'); // Full name
    });

    it('should show "--" for missing batch number', () => {
      const lpNoBatch = { ...mockLP, batch_number: null };
      const zpl = LabelPrintService.generateZPL(lpNoBatch, { size: '4x6', copies: 1 });

      expect(zpl).toContain('Batch: --');
    });

    it('should show "N/A" for missing expiry date', () => {
      const lpNoExpiry = { ...mockLP, expiry_date: null };
      const zpl = LabelPrintService.generateZPL(lpNoExpiry, { size: '4x6', copies: 1 });

      expect(zpl).toContain('Exp: N/A');
    });

    it('should support 4x3 inch label size', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x3', copies: 1 });

      // Check label dimensions in ZPL
      expect(zpl).toMatch(/\^PW\d+/); // Print width
      expect(zpl).toMatch(/\^LL\d+/); // Label length

      // 4x3 should have smaller dimensions than 4x6
      const width = zpl.match(/\^PW(\d+)/)?.[1];
      const length = zpl.match(/\^LL(\d+)/)?.[1];

      expect(Number(width)).toBeLessThan(900); // Max width for 4x3
      expect(Number(length)).toBeLessThan(700); // Max length for 4x3
    });

    it('should support 3x2 inch label size', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '3x2', copies: 1 });

      const width = zpl.match(/\^PW(\d+)/)?.[1];
      const length = zpl.match(/\^LL(\d+)/)?.[1];

      expect(Number(width)).toBeLessThan(700); // Max width for 3x2
      expect(Number(length)).toBeLessThan(500); // Max length for 3x2
    });

    it('should set correct print quantity for multiple copies', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 5 });

      expect(zpl).toMatch(/\^PQ5/); // Print quantity = 5
    });

    it('should enforce max 100 copies', () => {
      expect(() => {
        LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 101 });
      }).toThrow('Maximum 100 copies allowed');
    });

    it('should include warehouse and location info', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 1 });

      expect(zpl).toContain('WH-001'); // Warehouse code
      expect(zpl).toContain('A-01-02'); // Location name
    });

    it('should format quantity with 1 decimal place', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 1 });

      expect(zpl).toContain('500.0 kg');
    });

    it('should include manufacture date when present', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, { size: '4x6', copies: 1 });

      expect(zpl).toContain('Mfg: 2024-12-01');
    });

    it('should omit QR code when includeQR is false', () => {
      const zpl = LabelPrintService.generateZPL(mockLP, {
        size: '4x6',
        copies: 1,
        includeQR: false
      });

      expect(zpl).not.toContain('^BQN'); // No QR barcode command
    });
  });

  describe('generateBulkZPL', () => {
    it('should generate ZPL for multiple LPs', () => {
      const lp2 = { ...mockLP, id: 'lp-2', lp_number: 'LP20251201-000124' };
      const lps = [mockLP, lp2];

      const zpl = LabelPrintService.generateBulkZPL(lps, { size: '4x6', copies: 1 });

      // Should contain both LP numbers
      expect(zpl).toContain('LP20251201-000123');
      expect(zpl).toContain('LP20251201-000124');

      // Should have multiple label sections
      expect(zpl.match(/\^XA/g)?.length).toBe(2); // 2 labels
      expect(zpl.match(/\^XZ/g)?.length).toBe(2);
    });

    it('should enforce max 100 LPs per bulk request', () => {
      const lps = Array.from({ length: 101 }, (_, i) => ({
        ...mockLP,
        id: `lp-${i}`,
        lp_number: `LP${i}`,
      }));

      expect(() => {
        LabelPrintService.generateBulkZPL(lps, { size: '4x6', copies: 1 });
      }).toThrow('Maximum 100 license plates per bulk print');
    });

    it('should apply same config to all labels in bulk', () => {
      const lp2 = { ...mockLP, id: 'lp-2', lp_number: 'LP20251201-000124' };
      const lps = [mockLP, lp2];

      const zpl = LabelPrintService.generateBulkZPL(lps, { size: '4x3', copies: 2 });

      // Both labels should have same print quantity
      const pqMatches = zpl.match(/\^PQ2/g);
      expect(pqMatches?.length).toBe(2);
    });
  });

  describe('validatePrintRequest', () => {
    it('should accept valid print request', () => {
      const request = { size: '4x6' as const, copies: 1 };

      expect(() => {
        LabelPrintService.validatePrintRequest(request);
      }).not.toThrow();
    });

    it('should reject invalid label size', () => {
      const request = { size: '8x10' as any, copies: 1 };

      expect(() => {
        LabelPrintService.validatePrintRequest(request);
      }).toThrow('Invalid label size');
    });

    it('should reject copies < 1', () => {
      const request = { size: '4x6' as const, copies: 0 };

      expect(() => {
        LabelPrintService.validatePrintRequest(request);
      }).toThrow('Copies must be between 1 and 100');
    });

    it('should reject copies > 100', () => {
      const request = { size: '4x6' as const, copies: 101 };

      expect(() => {
        LabelPrintService.validatePrintRequest(request);
      }).toThrow('Copies must be between 1 and 100');
    });
  });
});

// ========================================
// Integration Tests - API Endpoint
// ========================================

describe('POST /api/warehouse/license-plates/:id/print-label', () => {
  it('should return ZPL for valid LP and config', async () => {
    const response = await fetch('/api/warehouse/license-plates/550e8400-e29b-41d4-a716-446655440000/print-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: '4x6', copies: 1 }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('zpl');
    expect(data.zpl).toContain('^XA');
    expect(data.zpl).toContain('^XZ');
  });

  it('should return 404 for non-existent LP', async () => {
    const response = await fetch('/api/warehouse/license-plates/00000000-0000-0000-0000-000000000000/print-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: '4x6', copies: 1 }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid request body', async () => {
    const response = await fetch('/api/warehouse/license-plates/550e8400-e29b-41d4-a716-446655440000/print-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: 'invalid', copies: -1 }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 401 for unauthenticated request', async () => {
    const response = await fetch('/api/warehouse/license-plates/550e8400-e29b-41d4-a716-446655440000/print-label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No auth token
    });

    expect(response.status).toBe(401);
  });
});

// ========================================
// Expected Test Results (RED phase)
// ========================================

/*
All tests should FAIL initially because:
1. LabelPrintService does not exist yet
2. generateZPL method not implemented
3. API endpoint not created
4. Validation logic missing

Next Phase (P3 - GREEN):
- Implement LabelPrintService
- Create API endpoint
- Add Zod validation schema
- Make all tests pass
*/
