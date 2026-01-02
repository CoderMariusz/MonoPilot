import { describe, it, expect } from 'vitest';
import {
  getGanttDataSchema,
  rescheduleWOSchema,
  checkAvailabilitySchema,
} from '../gantt-schemas';

describe('Gantt Validation Schemas', () => {
  describe('getGanttDataSchema', () => {
    it('should accept valid parameters', async () => {
      // Unit test: getGanttDataSchema accepts valid params
      const input = {
        view_by: 'line',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.view_by).toBe('line');
        expect(result.data.from_date).toBe('2024-12-15');
        expect(result.data.to_date).toBe('2024-12-20');
      }
    });

    it('should apply default view_by=line if not provided', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.view_by).toBe('line');
      }
    });

    it('should accept view_by=machine', async () => {
      const input = {
        view_by: 'machine',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid view_by value', async () => {
      const input = {
        view_by: 'invalid',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should validate date format YYYY-MM-DD', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', async () => {
      const input = {
        from_date: '15-12-2024', // Wrong format
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept optional status array', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        status: ['planned', 'released'],
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data.status)).toBe(true);
      }
    });

    it('should accept optional line_id UUID', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        line_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for line_id', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        line_id: 'not-a-uuid',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept optional product_id UUID', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        product_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept optional search string', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2024-12-20',
        search: 'WO-00156',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should enforce from_date before to_date', async () => {
      const input = {
        from_date: '2024-12-20',
        to_date: '2024-12-15', // to_date before from_date
      };

      const result = getGanttDataSchema.safeParse(input);

      // Should fail validation
      expect(result.success).toBe(false);
    });

    it('should reject date range exceeding 90 days', async () => {
      const input = {
        from_date: '2024-12-15',
        to_date: '2025-03-25', // More than 90 days
      };

      const result = getGanttDataSchema.safeParse(input);

      // Should fail validation
      expect(result.success).toBe(false);
    });
  });

  describe('rescheduleWOSchema', () => {
    it('should accept valid reschedule parameters', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduled_date).toBe('2024-12-18');
        expect(result.data.scheduled_start_time).toBe('10:00');
        expect(result.data.scheduled_end_time).toBe('18:00');
      }
    });

    it('should validate scheduled_date format', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid scheduled_date format', async () => {
      const input = {
        scheduled_date: '18-12-2024', // Wrong format
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should validate time format HH:mm', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid time format', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10', // Invalid format
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject start >= end time', async () => {
      // Unit test: rescheduleWOSchema rejects start >= end time
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '14:00',
        scheduled_end_time: '10:00', // end before start
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject equal start and end time', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '10:00', // same time
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject duration < 1 hour', async () => {
      // Unit test: rescheduleWOSchema rejects duration < 1 hour
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '10:30', // 30 minutes
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept exactly 1 hour duration', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '11:00', // 1 hour
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept optional production_line_id UUID', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        production_line_id: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid production_line_id UUID', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        production_line_id: 'not-a-uuid',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept validate_dependencies boolean', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        validate_dependencies: true,
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept validate_materials boolean', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
        validate_materials: true,
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should apply default validate_dependencies=true', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validate_dependencies).toBe(true);
      }
    });

    it('should apply default validate_materials=true', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '18:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validate_materials).toBe(true);
      }
    });
  });

  describe('checkAvailabilitySchema', () => {
    it('should accept valid availability check parameters', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.line_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should require line_id as UUID', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid line_id', async () => {
      const input = {
        line_id: 'not-a-uuid',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should validate scheduled_date format', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid scheduled_date format', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '18-12-2024',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should validate time format HH:mm for start_time', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should validate time format HH:mm for end_time', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject if start_time >= end_time', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '14:00',
        scheduled_end_time: '10:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should accept optional exclude_wo_id UUID', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
        exclude_wo_id: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid exclude_wo_id', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
        exclude_wo_id: 'not-a-uuid',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should work without exclude_wo_id', async () => {
      const input = {
        line_id: '550e8400-e29b-41d4-a716-446655440000',
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '14:00',
      };

      const result = checkAvailabilitySchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });

  describe('Schema Error Messages', () => {
    it('should provide clear error message for invalid view_by', async () => {
      const input = {
        view_by: 'invalid',
        from_date: '2024-12-15',
        to_date: '2024-12-20',
      };

      const result = getGanttDataSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should provide clear error message for time validation failure', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '14:00',
        scheduled_end_time: '10:00',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should provide clear error message for duration too short', async () => {
      const input = {
        scheduled_date: '2024-12-18',
        scheduled_start_time: '10:00',
        scheduled_end_time: '10:30',
      };

      const result = rescheduleWOSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
