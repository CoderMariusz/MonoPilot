import { describe, it, expect } from 'vitest';
import { startWorkOrderSchema } from '@/lib/validation/production-execution';

describe('Production Execution Schemas (RED PHASE)', () => {
  describe('startWorkOrderSchema', () => {
    it('should accept valid input with optional fields', () => {
      const input = {
        line_id: 'uuid-123',
        machine_id: 'uuid-456',
        force: true,
      };

      const result = startWorkOrderSchema.parse(input);

      expect(result).toEqual(input);
    });

    it('should accept input with only required fields (empty object)', () => {
      const input = {};

      const result = startWorkOrderSchema.parse(input);

      expect(result).toEqual({ force: false });
    });

    it('should reject invalid UUID for line_id', () => {
      const input = {
        line_id: 'not-a-uuid',
      };

      expect(() => startWorkOrderSchema.parse(input)).toThrow();
    });

    it('should reject invalid type for force', () => {
      const input = {
        force: 'true',
      };

      expect(() => startWorkOrderSchema.parse(input)).toThrow();
    });

    it('should apply default value of false to force field', () => {
      const input = { line_id: 'uuid-123' };

      const result = startWorkOrderSchema.parse(input);

      expect(result.force).toBe(false);
    });
  });
});
