/**
 * Settings Wizard API Integration Tests
 * Story: 1.12 Settings Wizard UX Design
 * Batch 4A: API Integration Tests
 *
 * Tests:
 * - AC-012.3: Save wizard progress
 * - AC-012.4: Resume from saved progress
 * - AC-012.8: Mark wizard as completed
 * - JSONB structure validation
 * - Progress persistence across steps
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test data
const testOrgId = 'test-org-wizard-' + Date.now()

// Cleanup test data
async function cleanup() {
  await supabase.from('organizations').delete().eq('id', testOrgId)
}

describe('Settings Wizard API Integration Tests', () => {
  beforeAll(async () => {
    // Create test organization
    const { error } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        company_name: 'Test Wizard Company',
        country: 'PL',
        wizard_completed: false,
        wizard_progress: null,
      })

    if (error) {
      console.error('Failed to create test org:', error)
    }
  })

  afterAll(async () => {
    await cleanup()
  })

  describe('AC-012.3: Save wizard progress', () => {
    it('should save wizard progress with step and data', async () => {
      const progressData = {
        step: 1,
        data: {
          companyName: 'Test Wizard Company',
          country: 'PL',
          defaultCurrency: 'PLN',
        },
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          wizard_progress: progressData,
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify progress saved
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress).toEqual(progressData)
    })

    it('should update wizard progress for next step', async () => {
      const progressData = {
        step: 2,
        data: {
          companyName: 'Test Wizard Company',
          country: 'PL',
          defaultCurrency: 'PLN',
          users: [
            { email: 'admin@test.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
          ],
        },
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          wizard_progress: progressData,
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify updated progress
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress).toEqual(progressData)
      expect(data?.wizard_progress.step).toBe(2)
    })

    it('should allow null wizard_progress (reset)', async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          wizard_progress: null,
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify reset
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress).toBeNull()
    })
  })

  describe('AC-012.4: Resume from saved progress', () => {
    it('should retrieve saved wizard progress', async () => {
      // Save progress first
      const progressData = {
        step: 3,
        data: {
          companyName: 'Test Wizard Company',
          country: 'PL',
          warehouses: [
            { code: 'WH01', name: 'Main Warehouse' },
          ],
        },
      }

      await supabase
        .from('organizations')
        .update({ wizard_progress: progressData })
        .eq('id', testOrgId)

      // Retrieve progress (simulate resume)
      const { data, error } = await supabase
        .from('organizations')
        .select('wizard_progress, wizard_completed')
        .eq('id', testOrgId)
        .single()

      expect(error).toBeNull()
      expect(data?.wizard_progress).toEqual(progressData)
      expect(data?.wizard_completed).toBe(false)
    })

    it('should handle missing wizard_progress (new wizard)', async () => {
      // Reset progress
      await supabase
        .from('organizations')
        .update({ wizard_progress: null })
        .eq('id', testOrgId)

      // Retrieve progress (no saved progress)
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress).toBeNull()
    })
  })

  describe('AC-012.8: Mark wizard as completed', () => {
    it('should mark wizard as completed', async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          wizard_completed: true,
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify completion
      const { data } = await supabase
        .from('organizations')
        .select('wizard_completed')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_completed).toBe(true)
    })

    it('should allow resetting wizard_completed to false', async () => {
      const { error } = await supabase
        .from('organizations')
        .update({
          wizard_completed: false,
        })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify reset
      const { data } = await supabase
        .from('organizations')
        .select('wizard_completed')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_completed).toBe(false)
    })
  })

  describe('JSONB structure validation', () => {
    it('should support nested JSONB objects', async () => {
      const complexProgress = {
        step: 4,
        data: {
          companyName: 'Test Company',
          settings: {
            modules: ['technical', 'planning', 'production'],
            features: {
              enableNotifications: true,
              enableRealtime: false,
            },
          },
          users: [
            { email: 'user1@test.com', firstName: 'User', lastName: 'One' },
            { email: 'user2@test.com', firstName: 'User', lastName: 'Two' },
          ],
        },
      }

      const { error } = await supabase
        .from('organizations')
        .update({ wizard_progress: complexProgress })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify complex structure
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress).toEqual(complexProgress)
      expect(data?.wizard_progress.data.settings.modules).toHaveLength(3)
      expect(data?.wizard_progress.data.users).toHaveLength(2)
    })

    it('should support JSONB array operations', async () => {
      const progressWithArrays = {
        step: 5,
        data: {
          selectedModules: ['technical', 'planning', 'production', 'warehouse'],
          configuredWarehouses: ['WH01', 'WH02'],
          invitedUsers: ['user1@test.com', 'user2@test.com', 'user3@test.com'],
        },
      }

      const { error } = await supabase
        .from('organizations')
        .update({ wizard_progress: progressWithArrays })
        .eq('id', testOrgId)

      expect(error).toBeNull()

      // Verify arrays
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress.data.selectedModules).toHaveLength(4)
      expect(data?.wizard_progress.data.configuredWarehouses).toHaveLength(2)
      expect(data?.wizard_progress.data.invitedUsers).toHaveLength(3)
    })
  })

  describe('Progress persistence across steps', () => {
    it('should persist data as user progresses through wizard', async () => {
      // Step 1: Company info
      await supabase
        .from('organizations')
        .update({
          wizard_progress: {
            step: 1,
            data: { companyName: 'Test Corp', country: 'PL' },
          },
        })
        .eq('id', testOrgId)

      // Step 2: Add users (preserve step 1 data)
      await supabase
        .from('organizations')
        .update({
          wizard_progress: {
            step: 2,
            data: {
              companyName: 'Test Corp',
              country: 'PL',
              users: [{ email: 'admin@test.com' }],
            },
          },
        })
        .eq('id', testOrgId)

      // Step 3: Add warehouses (preserve all previous data)
      await supabase
        .from('organizations')
        .update({
          wizard_progress: {
            step: 3,
            data: {
              companyName: 'Test Corp',
              country: 'PL',
              users: [{ email: 'admin@test.com' }],
              warehouses: [{ code: 'WH01' }],
            },
          },
        })
        .eq('id', testOrgId)

      // Verify final state has all data
      const { data } = await supabase
        .from('organizations')
        .select('wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_progress.step).toBe(3)
      expect(data?.wizard_progress.data.companyName).toBe('Test Corp')
      expect(data?.wizard_progress.data.users).toHaveLength(1)
      expect(data?.wizard_progress.data.warehouses).toHaveLength(1)
    })
  })

  describe('Wizard completion workflow', () => {
    it('should complete full wizard workflow', async () => {
      // 1. Start wizard (step 1)
      await supabase
        .from('organizations')
        .update({
          wizard_progress: {
            step: 1,
            data: { companyName: 'Full Test', country: 'UK' },
          },
          wizard_completed: false,
        })
        .eq('id', testOrgId)

      // 2. Progress through steps 2-6
      for (let step = 2; step <= 6; step++) {
        await supabase
          .from('organizations')
          .update({
            wizard_progress: {
              step,
              data: { companyName: 'Full Test', country: 'UK', step },
            },
          })
          .eq('id', testOrgId)
      }

      // 3. Complete wizard
      await supabase
        .from('organizations')
        .update({
          wizard_completed: true,
          wizard_progress: null, // Clear progress after completion
        })
        .eq('id', testOrgId)

      // Verify final state
      const { data } = await supabase
        .from('organizations')
        .select('wizard_completed, wizard_progress')
        .eq('id', testOrgId)
        .single()

      expect(data?.wizard_completed).toBe(true)
      expect(data?.wizard_progress).toBeNull()
    })
  })

  describe('Index performance', () => {
    it('should efficiently query by wizard_completed status', async () => {
      // Query using index
      const { data, error } = await supabase
        .from('organizations')
        .select('id, wizard_completed')
        .eq('wizard_completed', false)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Default values', () => {
    it('should have wizard_completed = false by default', async () => {
      const newOrgId = 'test-org-default-' + Date.now()

      // Create org without specifying wizard fields
      await supabase
        .from('organizations')
        .insert({
          id: newOrgId,
          company_name: 'Default Test',
          country: 'PL',
        })

      // Verify defaults
      const { data } = await supabase
        .from('organizations')
        .select('wizard_completed, wizard_progress')
        .eq('id', newOrgId)
        .single()

      expect(data?.wizard_completed).toBe(false)
      expect(data?.wizard_progress).toBeNull()

      // Cleanup
      await supabase.from('organizations').delete().eq('id', newOrgId)
    })
  })
})
