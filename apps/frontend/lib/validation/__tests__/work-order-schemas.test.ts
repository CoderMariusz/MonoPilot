/**
 * Work Order Schemas Validation Tests (Story 03.14 - WO Scheduling)
 * Unit tests for scheduleWOSchema validation
 *
 * RED PHASE - These tests WILL FAIL until scheduleWOSchema is implemented
 */

import { describe, it, expect } from 'vitest'
import { scheduleWOSchema } from '../work-order-schemas'

describe('scheduleWOSchema validation', () => {
  describe('Time format validation', () => {
    it('should accept valid time format (HH:mm)', () => {
      const input = {
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept valid time format at midnight and end of day', () => {
      const input = {
        scheduled_start_time: '00:00',
        scheduled_end_time: '23:59',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid hour (25:00)', () => {
      const input = {
        scheduled_start_time: '25:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('scheduled_start_time')
      }
    })

    it('should reject invalid minute (08:65)', () => {
      const input = {
        scheduled_start_time: '08:65',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('scheduled_start_time')
      }
    })

    it('should reject time without colon (0800)', () => {
      const input = {
        scheduled_start_time: '0800',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject time with seconds (08:00:00)', () => {
      const input = {
        scheduled_start_time: '08:00:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('Time range validation', () => {
    it('should accept end time after start time (same day)', () => {
      const input = {
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject end time before start time on same day', () => {
      const input = {
        planned_start_date: '2024-12-20',
        scheduled_start_time: '16:00',
        scheduled_end_time: '08:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('scheduled_end_time')
        expect(result.error.errors[0].message).toMatch(/end time must be after start time/i)
      }
    })

    it('should reject equal start and end times on same day', () => {
      const input = {
        planned_start_date: '2024-12-20',
        scheduled_start_time: '08:00',
        scheduled_end_time: '08:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('scheduled_end_time')
      }
    })

    it('should allow overnight times when multi-day (end date different)', () => {
      const input = {
        planned_start_date: '2024-12-20',
        planned_end_date: '2024-12-21',
        scheduled_start_time: '20:00',
        scheduled_end_time: '04:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should allow start time without end time', () => {
      const input = {
        scheduled_start_time: '08:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should allow end time without start time', () => {
      const input = {
        scheduled_end_time: '16:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('Date range validation', () => {
    it('should accept valid date range (end >= start)', () => {
      const input = {
        planned_start_date: '2024-12-20',
        planned_end_date: '2024-12-22',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept same start and end dates', () => {
      const input = {
        planned_start_date: '2024-12-20',
        planned_end_date: '2024-12-20',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject end date before start date', () => {
      const input = {
        planned_start_date: '2024-12-22',
        planned_end_date: '2024-12-20',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('planned_end_date')
        expect(result.error.errors[0].message).toMatch(/end date must be on or after start date/i)
      }
    })

    it('should accept invalid date format (ISO YYYY-MM-DD)', () => {
      const input = {
        planned_start_date: '2024-12-20',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject non-ISO date format (DD/MM/YYYY)', () => {
      const input = {
        planned_start_date: '20/12/2024',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('Production line and machine validation', () => {
    it('should accept valid production_line_id (UUID)', () => {
      const input = {
        production_line_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid production_line_id (not UUID)', () => {
      const input = {
        production_line_id: 'not-a-uuid',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('production_line_id')
      }
    })

    it('should accept valid machine_id (UUID)', () => {
      const input = {
        machine_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid machine_id (not UUID)', () => {
      const input = {
        machine_id: 'not-a-uuid',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('machine_id')
      }
    })

    it('should accept null for machine_id (clearing assignment)', () => {
      const input = {
        machine_id: null,
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('Optional fields', () => {
    it('should accept empty object (all fields optional)', () => {
      const input = {}

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept partial input (only dates)', () => {
      const input = {
        planned_start_date: '2024-12-20',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept partial input (only times)', () => {
      const input = {
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('Complex scenarios', () => {
    it('should accept complete schedule with all fields', () => {
      const input = {
        planned_start_date: '2024-12-20',
        planned_end_date: '2024-12-20',
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
        production_line_id: '123e4567-e89b-12d3-a456-426614174000',
        machine_id: '987e6543-e21b-12d3-a456-426614174000',
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should validate both date range and time range constraints', () => {
      const input = {
        planned_start_date: '2024-12-22',
        planned_end_date: '2024-12-20', // Invalid date range
        scheduled_start_time: '16:00',
        scheduled_end_time: '08:00', // Invalid time range
      }

      const result = scheduleWOSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Should have at least one error (date or time)
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })
  })
})
