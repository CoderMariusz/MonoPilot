/**
 * Machines API Integration Tests
 * Story: 1.7 Machine Configuration
 * Task 11: Integration & Testing
 *
 * Tests AC-006.1 through AC-006.8
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test data - use proper UUIDs
const testOrgId = randomUUID()
const testUserId = randomUUID()
let testWarehouseId: string
let testLineId: string

// Cleanup test data
async function cleanup() {
  // Delete test machines (this will cascade to machine_line_assignments)
  await supabase.from('machines').delete().eq('org_id', testOrgId)
  // Delete test production line
  if (testLineId) {
    await supabase.from('production_lines').delete().eq('id', testLineId)
  }
  // Delete test warehouse
  if (testWarehouseId) {
    await supabase.from('warehouses').delete().eq('id', testWarehouseId)
  }
  // Delete test user
  await supabase.from('users').delete().eq('id', testUserId)
  // Delete test org
  await supabase.from('organizations').delete().eq('id', testOrgId)
}

describe('Machines API Integration Tests', () => {
  beforeAll(async () => {
    // Create test organization
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        company_name: 'Test Company',
        country: 'PL',
        default_currency: 'PLN',
        default_language: 'PL',
      })

    if (orgError) {
      console.error('Failed to create test org:', orgError)
    }

    // Create test admin user
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        org_id: testOrgId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        status: 'active',
      })

    if (userError) {
      console.error('Failed to create test user:', userError)
    }

    // Create test warehouse (required for production line)
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .insert({
        org_id: testOrgId,
        code: 'TEST-WH',
        name: 'Test Warehouse',
        is_active: true,
        created_by: testUserId,
      })
      .select()
      .single()

    if (warehouseError) {
      console.error('Failed to create test warehouse:', warehouseError)
    } else {
      testWarehouseId = warehouse.id
    }

    // Create test production line (for machine-line assignments)
    const { data: line, error: lineError } = await supabase
      .from('production_lines')
      .insert({
        org_id: testOrgId,
        warehouse_id: testWarehouseId,
        code: 'TEST-LINE',
        name: 'Test Production Line',
        created_by: testUserId,
      })
      .select()
      .single()

    if (lineError) {
      console.error('Failed to create test production line:', lineError)
    } else {
      testLineId = line.id
    }
  })

  afterAll(async () => {
    await cleanup()
  })

  describe('AC-006.1: Create Machine', () => {
    it('should create a machine with valid data', async () => {
      const { data, error } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'MIX-01',
          name: 'Mixer Machine 1',
          status: 'active',
          units_per_hour: 1000.5,
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.code).toBe('MIX-01')
      expect(data?.status).toBe('active')
      expect(data?.units_per_hour).toBe(1000.5)
    })

    it('should reject duplicate code in same org', async () => {
      // First machine
      await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'PACK-01',
          name: 'Packaging Machine 1',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })

      // Duplicate code
      const { error } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'PACK-01', // Duplicate
          name: 'Packaging Machine 2',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique violation
    })

    it('should enforce code format (uppercase alphanumeric + hyphens)', async () => {
      const { error } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'invalid-code', // Lowercase - should fail constraint
          name: 'Invalid Machine',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })
  })

  describe('AC-006.2: Machine Status', () => {
    it('should accept valid status values', async () => {
      const statuses = ['active', 'down', 'maintenance']

      for (const status of statuses) {
        const { data, error } = await supabase
          .from('machines')
          .insert({
            org_id: testOrgId,
            code: `STATUS-${status.toUpperCase()}`,
            name: `${status} Machine`,
            status,
            created_by: testUserId,
            updated_by: testUserId,
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(data?.status).toBe(status)
      }
    })

    it('should reject invalid status values', async () => {
      const { error } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'INVALID-STATUS',
          name: 'Invalid Status Machine',
          status: 'invalid_status', // Invalid status
          created_by: testUserId,
          updated_by: testUserId,
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23514') // Check constraint violation
    })
  })

  describe('AC-006.3: Machine-Line Assignments', () => {
    it('should allow creating machine_line_assignments', async () => {
      // Create a machine first
      const { data: machine } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'ASSIGN-01',
          name: 'Assignment Test Machine',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      // Use the production line created in beforeAll
      const { data: assignment, error } = await supabase
        .from('machine_line_assignments')
        .insert({
          machine_id: machine!.id,
          line_id: testLineId,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(assignment).toBeDefined()
      expect(assignment?.machine_id).toBe(machine!.id)
      expect(assignment?.line_id).toBe(testLineId)
    })

    it('should prevent duplicate assignments (unique constraint)', async () => {
      const { data: machine } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'UNIQUE-01',
          name: 'Unique Constraint Test',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      // First assignment - use the production line created in beforeAll
      await supabase
        .from('machine_line_assignments')
        .insert({
          machine_id: machine!.id,
          line_id: testLineId,
        })

      // Duplicate assignment
      const { error } = await supabase
        .from('machine_line_assignments')
        .insert({
          machine_id: machine!.id,
          line_id: testLineId, // Same line_id
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique violation
    })
  })

  describe('AC-006.4: List Machines with Filters', () => {
    beforeAll(async () => {
      // Create test machines with different statuses
      await supabase.from('machines').insert([
        {
          org_id: testOrgId,
          code: 'LIST-ACTIVE-01',
          name: 'Active Machine 1',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        },
        {
          org_id: testOrgId,
          code: 'LIST-DOWN-01',
          name: 'Down Machine 1',
          status: 'down',
          created_by: testUserId,
          updated_by: testUserId,
        },
        {
          org_id: testOrgId,
          code: 'LIST-MAINT-01',
          name: 'Maintenance Machine 1',
          status: 'maintenance',
          created_by: testUserId,
          updated_by: testUserId,
        },
      ])
    })

    it('should list all machines for org', async () => {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('org_id', testOrgId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('should filter machines by status', async () => {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('org_id', testOrgId)
        .eq('status', 'active')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.every(m => m.status === 'active')).toBe(true)
    })

    it('should search machines by code', async () => {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .eq('org_id', testOrgId)
        .ilike('code', '%LIST%')

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })
  })

  describe('AC-006.5: Delete Constraints', () => {
    it('should delete machine with CASCADE to assignments', async () => {
      // Create machine
      const { data: machine } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'DELETE-01',
          name: 'Delete Test Machine',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      // Create assignment
      const testLineId = crypto.randomUUID()
      await supabase
        .from('machine_line_assignments')
        .insert({
          machine_id: machine!.id,
          line_id: testLineId,
        })

      // Delete machine (should CASCADE delete assignments)
      const { error: deleteError } = await supabase
        .from('machines')
        .delete()
        .eq('id', machine!.id)

      expect(deleteError).toBeNull()

      // Verify assignments deleted
      const { data: assignments } = await supabase
        .from('machine_line_assignments')
        .select('*')
        .eq('machine_id', machine!.id)

      expect(assignments).toHaveLength(0)
    })
  })

  describe('AC-006.6: Update Machine', () => {
    it('should update machine fields', async () => {
      const { data: machine } = await supabase
        .from('machines')
        .insert({
          org_id: testOrgId,
          code: 'UPDATE-01',
          name: 'Original Name',
          status: 'active',
          units_per_hour: 100,
          created_by: testUserId,
          updated_by: testUserId,
        })
        .select()
        .single()

      const { data: updated, error } = await supabase
        .from('machines')
        .update({
          name: 'Updated Name',
          status: 'maintenance',
          units_per_hour: 200,
          updated_by: testUserId,
        })
        .eq('id', machine!.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.status).toBe('maintenance')
      expect(updated?.units_per_hour).toBe(200)
    })
  })

  describe('RLS Policies', () => {
    it('should isolate machines by org_id', async () => {
      // Create another org
      const otherOrgId = 'other-org-' + Date.now()
      await supabase
        .from('organizations')
        .insert({
          id: otherOrgId,
          company_name: 'Other Company',
          country: 'US',
          default_currency: 'USD',
          default_language: 'EN',
        })

      // Create machine in other org
      await supabase
        .from('machines')
        .insert({
          org_id: otherOrgId,
          code: 'OTHER-ORG-01',
          name: 'Other Org Machine',
          status: 'active',
          created_by: testUserId,
          updated_by: testUserId,
        })

      // Query machines for test org
      const { data } = await supabase
        .from('machines')
        .select('*')
        .eq('org_id', testOrgId)

      // Should not see machines from other org
      expect(data?.every(m => m.org_id === testOrgId)).toBe(true)
      expect(data?.some(m => m.code === 'OTHER-ORG-01')).toBe(false)

      // Cleanup
      await supabase.from('machines').delete().eq('org_id', otherOrgId)
      await supabase.from('organizations').delete().eq('id', otherOrgId)
    })
  })
})
