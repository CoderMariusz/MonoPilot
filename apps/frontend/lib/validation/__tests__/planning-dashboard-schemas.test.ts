/**
 * Validation Tests: Planning Dashboard Schemas
 * Story: 03.16 - Planning Dashboard
 * Phase: RED - Tests should FAIL (schemas not yet implemented)
 *
 * Tests validation schemas for dashboard API queries:
 * - Dashboard KPI query validation
 * - Dashboard alerts query validation
 * - Dashboard activity query validation
 *
 * Coverage Target: 90%
 * Test Count: 15 tests
 */

import { describe, it, expect } from 'vitest'
import {
  dashboardKPIQuerySchema,
  dashboardAlertsQuerySchema,
  dashboardActivityQuerySchema,
  type DashboardKPIQuery,
  type DashboardAlertsQuery,
  type DashboardActivityQuery,
} from '../planning-dashboard-schemas'

const testOrgId = '123e4567-e89b-12d3-a456-426614174000'
const invalidUuid = 'not-a-uuid'

describe('Planning Dashboard Validation Schemas', () => {
  describe('dashboardKPIQuerySchema', () => {
    it('should validate with valid org_id', () => {
      const query = { org_id: testOrgId }
      expect(() => dashboardKPIQuerySchema.parse(query)).not.toThrow()
    })

    it('should fail with missing org_id', () => {
      const query = {}
      expect(() => dashboardKPIQuerySchema.parse(query)).toThrow()
    })

    it('should fail with invalid org_id (not UUID)', () => {
      const query = { org_id: invalidUuid }
      expect(() => dashboardKPIQuerySchema.parse(query)).toThrow()
    })

    it('should reject empty string org_id', () => {
      const query = { org_id: '' }
      expect(() => dashboardKPIQuerySchema.parse(query)).toThrow()
    })

    it('should support type inference', () => {
      const query: DashboardKPIQuery = { org_id: testOrgId }
      expect(query.org_id).toBe(testOrgId)
    })
  })

  describe('dashboardAlertsQuerySchema', () => {
    it('should validate with required org_id only', () => {
      const query = { org_id: testOrgId }
      expect(() => dashboardAlertsQuerySchema.parse(query)).not.toThrow()
    })

    it('should validate with org_id and valid limit', () => {
      const query = { org_id: testOrgId, limit: 10 }
      expect(() => dashboardAlertsQuerySchema.parse(query)).not.toThrow()
    })

    it('should default limit to 10 when not provided', () => {
      const query = { org_id: testOrgId }
      const result = dashboardAlertsQuerySchema.parse(query)
      expect(result.limit).toBe(10)
    })

    it('should fail with limit < 1', () => {
      const query = { org_id: testOrgId, limit: 0 }
      expect(() => dashboardAlertsQuerySchema.parse(query)).toThrow()
    })

    it('should fail with limit > 50', () => {
      const query = { org_id: testOrgId, limit: 51 }
      expect(() => dashboardAlertsQuerySchema.parse(query)).toThrow()
    })

    it('should fail with non-integer limit', () => {
      const query = { org_id: testOrgId, limit: 10.5 }
      expect(() => dashboardAlertsQuerySchema.parse(query)).toThrow()
    })

    it('should fail with invalid org_id', () => {
      const query = { org_id: invalidUuid, limit: 10 }
      expect(() => dashboardAlertsQuerySchema.parse(query)).toThrow()
    })

    it('should support type inference', () => {
      const query: DashboardAlertsQuery = { org_id: testOrgId, limit: 20 }
      expect(query.limit).toBe(20)
    })
  })

  describe('dashboardActivityQuerySchema', () => {
    it('should validate with required org_id only', () => {
      const query = { org_id: testOrgId }
      expect(() => dashboardActivityQuerySchema.parse(query)).not.toThrow()
    })

    it('should validate with org_id and valid limit', () => {
      const query = { org_id: testOrgId, limit: 20 }
      expect(() => dashboardActivityQuerySchema.parse(query)).not.toThrow()
    })

    it('should default limit to 20 when not provided', () => {
      const query = { org_id: testOrgId }
      const result = dashboardActivityQuerySchema.parse(query)
      expect(result.limit).toBe(20)
    })

    it('should fail with limit < 1', () => {
      const query = { org_id: testOrgId, limit: 0 }
      expect(() => dashboardActivityQuerySchema.parse(query)).toThrow()
    })

    it('should fail with limit > 100', () => {
      const query = { org_id: testOrgId, limit: 101 }
      expect(() => dashboardActivityQuerySchema.parse(query)).toThrow()
    })

    it('should fail with non-integer limit', () => {
      const query = { org_id: testOrgId, limit: 20.5 }
      expect(() => dashboardActivityQuerySchema.parse(query)).toThrow()
    })

    it('should fail with invalid org_id', () => {
      const query = { org_id: invalidUuid, limit: 20 }
      expect(() => dashboardActivityQuerySchema.parse(query)).toThrow()
    })

    it('should support type inference', () => {
      const query: DashboardActivityQuery = { org_id: testOrgId, limit: 50 }
      expect(query.limit).toBe(50)
    })
  })
})
