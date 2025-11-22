/**
 * Module Activation API Integration Tests
 * Story: 1.11 Module Activation
 * Batch 4A: API Integration Tests
 *
 * Tests:
 * - AC-010.1: 8 modules configuration
 * - AC-010.2: Default enabled modules
 * - AC-010.4: is_module_enabled helper function
 * - AC-010.5: Toggle module on/off
 * - Constraint: At least one module must be enabled
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test data
const testOrgId = 'test-org-modules-' + Date.now()

// Cleanup test data
async function cleanup() {
  await supabase.from('organizations').delete().eq('id', testOrgId)
}

describe('Module Activation API Integration Tests', () => {
  beforeAll(async () => {
    // Create test organization
    const { error } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        company_name: 'Test Modules Company',
        country: 'PL',
        // modules_enabled will use default: ['technical', 'planning', 'production', 'warehouse']
      })

    if (error) {
      console.error('Failed to create test org:', error)
    }
  })

  afterAll(async () => {
    await cleanup()
  })

  describe('AC-010.2: Default enabled modules', () => {
    it('should have 4 default modules enabled on org creation', async () => {
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).toEqual(['technical', 'planning', 'production', 'warehouse'])
    })
  })

  describe('AC-010.4: is_module_enabled helper function', () => {
    it('should return true for enabled module', async () => {
      const { data, error } = await supabase.rpc('is_module_enabled', {
        p_org_id: testOrgId,
        p_module_code: 'technical',
      })

      expect(error).toBeNull()
      expect(data).toBe(true)
    })

    it('should return false for disabled module', async () => {
      const { data, error } = await supabase.rpc('is_module_enabled', {
        p_org_id: testOrgId,
        p_module_code: 'quality',
      })

      expect(error).toBeNull()
      expect(data).toBe(false)
    })
  })

  describe('AC-010.5: Toggle module on/off', () => {
    it('should enable a disabled module', async () => {
      // Enable quality module
      const { error } = await supabase
        .from('organizations')
        .update({
          modules_enabled: ['technical', 'planning', 'production', 'warehouse', 'quality'],
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).toContain('quality')
      expect(data?.modules_enabled).toHaveLength(5)
    })

    it('should disable an enabled module', async () => {
      // Disable quality module
      const { error } = await supabase
        .from('organizations')
        .update({
          modules_enabled: ['technical', 'planning', 'production', 'warehouse'],
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).not.toContain('quality')
      expect(data?.modules_enabled).toHaveLength(4)
    })
  })

  describe('Constraint: At least one module required', () => {
    it('should prevent disabling all modules', async () => {
      // Try to set empty array
      const { error } = await supabase
        .from('organizations')
        .update({
          modules_enabled: [],
        })
        .eq('id', testOrgId)

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23514') // Check constraint violation

      // Verify modules unchanged
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).toHaveLength(4) // Still has 4 modules
    })
  })

  describe('AC-010.1: All 8 modules can be enabled', () => {
    it('should allow enabling all 8 modules', async () => {
      const allModules = [
        'technical',
        'planning',
        'production',
        'warehouse',
        'quality',
        'shipping',
        'npd',
        'finance',
      ]

      const { error } = await supabase
        .from('organizations')
        .update({ modules_enabled: allModules })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).toEqual(allModules)
      expect(data?.modules_enabled).toHaveLength(8)
    })

    it('should allow disabling all optional modules (keep only defaults)', async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          modules_enabled: ['technical', 'planning', 'production', 'warehouse'],
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).toHaveLength(4)
    })
  })

  describe('Module array operations', () => {
    it('should support adding module to array', async () => {
      // Get current modules
      const { data: current } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      // Add shipping module
      const newModules = [...(current?.modules_enabled || []), 'shipping']

      const { error } = await supabase
        .from('organizations')
        .update({ modules_enabled: newModules })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).toContain('shipping')
    })

    it('should support removing module from array', async () => {
      // Get current modules
      const { data: current } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      // Remove shipping module
      const newModules = (current?.modules_enabled || []).filter(m => m !== 'shipping')

      const { error } = await supabase
        .from('organizations')
        .update({ modules_enabled: newModules })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify
      const { data } = await supabase
        .from('organizations')
        .select('modules_enabled')
        .eq('id', testOrgId)
        .single()

      expect(data?.modules_enabled).not.toContain('shipping')
    })
  })

  describe('GIN Index performance', () => {
    it('should efficiently query modules_enabled with contains operator', async () => {
      // Query using array contains operator (uses GIN index)
      const { data, error } = await supabase
        .from('organizations')
        .select('id, modules_enabled')
        .contains('modules_enabled', ['technical'])

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)
      expect(data?.every(org => org.modules_enabled.includes('technical'))).toBe(true)
    })
  })
})
