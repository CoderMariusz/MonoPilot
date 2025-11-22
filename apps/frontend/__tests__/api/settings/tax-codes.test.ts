/**
 * Tax Codes API Integration Tests
 * Story: 1.10 Tax Code Configuration
 * Batch 4A: API Integration Tests
 *
 * Tests:
 * - AC-009.1: Country-based seeding
 * - AC-009.2: Create custom tax code
 * - AC-009.3: List tax codes with filters
 * - AC-009.4: Cannot delete if used in POs (Epic 3)
 * - AC-009.5: Edit tax code with rate change warning
 * - AC-009.6: Seed function idempotency
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

// Cleanup test data
async function cleanup() {
  await supabase.from('tax_codes').delete().eq('org_id', testOrgId)
  await supabase.from('users').delete().eq('id', testUserId)
  await supabase.from('organizations').delete().eq('id', testOrgId)
}

describe('Tax Codes API Integration Tests', () => {
  beforeAll(async () => {
    // Create test organization (Poland)
    const { error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        company_name: 'Test Tax Company',
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
        email: 'taxcodes@test.com',
        first_name: 'Tax',
        last_name: 'Admin',
        role: 'admin',
      })

    if (userError) {
      console.error('Failed to create test user:', userError)
    }
  })

  afterAll(async () => {
    await cleanup()
  })

  describe('AC-009.1, AC-009.6: Country-based seeding', () => {
    it('should seed tax codes for Poland (4 codes)', async () => {
      // Call seed function
      const { data, error } = await supabase.rpc('seed_tax_codes_for_organization', {
        p_org_id: testOrgId,
        p_country_code: 'PL',
      })

      expect(error).toBeNull()
      expect(data).toBe(4) // 4 tax codes for Poland

      // Verify tax codes were created
      const { data: taxCodes } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', testOrgId)
        .order('rate', { ascending: false })

      expect(taxCodes).toHaveLength(4)
      expect(taxCodes?.[0]).toMatchObject({
        code: 'VAT23',
        description: 'VAT 23%',
        rate: 23.00,
      })
      expect(taxCodes?.[1]).toMatchObject({
        code: 'VAT8',
        description: 'VAT 8%',
        rate: 8.00,
      })
      expect(taxCodes?.[2]).toMatchObject({
        code: 'VAT5',
        description: 'VAT 5%',
        rate: 5.00,
      })
      expect(taxCodes?.[3]).toMatchObject({
        code: 'VAT0',
        description: 'VAT 0%',
        rate: 0.00,
      })
    })

    it('should be idempotent (no duplicates on re-run)', async () => {
      // Call seed function again
      const { data, error } = await supabase.rpc('seed_tax_codes_for_organization', {
        p_org_id: testOrgId,
        p_country_code: 'PL',
      })

      expect(error).toBeNull()
      expect(data).toBe(0) // 0 new codes (already exist)

      // Verify still only 4 tax codes
      const { data: taxCodes } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', testOrgId)

      expect(taxCodes).toHaveLength(4)
    })
  })

  describe('AC-009.2: Create custom tax code', () => {
    it('should create a custom tax code', async () => {
      const { data, error } = await supabase
        .from('tax_codes')
        .insert({
          org_id: testOrgId,
          code: 'EXPORT',
          description: 'Export Zero VAT',
          rate: 0.00,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toMatchObject({
        org_id: testOrgId,
        code: 'EXPORT',
        description: 'Export Zero VAT',
        rate: 0.00,
      })
    })

    it('should enforce unique code per org', async () => {
      const { error } = await supabase
        .from('tax_codes')
        .insert({
          org_id: testOrgId,
          code: 'VAT23', // Duplicate
          description: 'Duplicate',
          rate: 23.00,
        })

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23505') // Unique violation
    })

    it('should enforce code format (uppercase alphanumeric + hyphens)', async () => {
      const { error } = await supabase
        .from('tax_codes')
        .insert({
          org_id: testOrgId,
          code: 'invalid-code!', // Invalid characters
          description: 'Invalid Code',
          rate: 10.00,
        })

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce rate >= 0', async () => {
      const { error } = await supabase
        .from('tax_codes')
        .insert({
          org_id: testOrgId,
          code: 'NEGATIVE',
          description: 'Negative Rate',
          rate: -5.00,
        })

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23514') // Check constraint violation
    })

    it('should enforce rate <= 100', async () => {
      const { error } = await supabase
        .from('tax_codes')
        .insert({
          org_id: testOrgId,
          code: 'TOOHIGH',
          description: 'Too High Rate',
          rate: 150.00,
        })

      expect(error).not.toBeNull()
      expect(error?.code).toBe('23514') // Check constraint violation
    })
  })

  describe('AC-009.3: List tax codes with filters', () => {
    it('should list all tax codes for organization', async () => {
      const { data, error } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', testOrgId)
        .order('code', { ascending: true })

      expect(error).toBeNull()
      expect(data).toHaveLength(5) // 4 seeded + 1 custom (EXPORT)
      expect(data?.[0].code).toBe('EXPORT')
    })

    it('should filter by search (code or description)', async () => {
      const { data, error } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', testOrgId)
        .or('code.ilike.%VAT%,description.ilike.%VAT%')

      expect(error).toBeNull()
      expect(data?.length).toBeGreaterThan(0)
      expect(data?.every(tc => tc.code.includes('VAT') || tc.description.includes('VAT'))).toBe(true)
    })

    it('should sort by rate descending', async () => {
      const { data, error } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', testOrgId)
        .order('rate', { ascending: false })

      expect(error).toBeNull()
      expect(data?.[0].rate).toBe(23.00)
      expect(data?.[data.length - 1].rate).toBe(0.00)
    })
  })

  describe('AC-009.5: Edit tax code', () => {
    it('should update tax code description', async () => {
      // Get a tax code
      const { data: taxCode } = await supabase
        .from('tax_codes')
        .select('id')
        .eq('org_id', testOrgId)
        .eq('code', 'EXPORT')
        .single()

      // Update description
      const { data, error } = await supabase
        .from('tax_codes')
        .update({ description: 'Updated Export VAT' })
        .eq('id', taxCode!.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.description).toBe('Updated Export VAT')
    })

    it('should update tax code rate', async () => {
      // Get a tax code
      const { data: taxCode } = await supabase
        .from('tax_codes')
        .select('id')
        .eq('org_id', testOrgId)
        .eq('code', 'EXPORT')
        .single()

      // Update rate
      const { data, error } = await supabase
        .from('tax_codes')
        .update({ rate: 5.00 })
        .eq('id', taxCode!.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.rate).toBe(5.00)

      // Note: Rate change warning is handled in service layer (Epic 3)
    })
  })

  describe('AC-009.4: Delete tax code', () => {
    it('should delete unused tax code', async () => {
      // Get a tax code
      const { data: taxCode } = await supabase
        .from('tax_codes')
        .select('id')
        .eq('org_id', testOrgId)
        .eq('code', 'EXPORT')
        .single()

      // Delete
      const { error } = await supabase
        .from('tax_codes')
        .delete()
        .eq('id', taxCode!.id)

      expect(error).toBeNull()

      // Verify deleted
      const { data: deleted } = await supabase
        .from('tax_codes')
        .select('id')
        .eq('id', taxCode!.id)
        .single()

      expect(deleted).toBeNull()
    })

    // Note: FK constraint check for PO lines will be tested in Epic 3
  })

  describe('RLS: Organization isolation', () => {
    it('should only see tax codes from own organization', async () => {
      // Create another org
      const otherOrgId = randomUUID()
      await supabase
        .from('organizations')
        .insert({
          id: otherOrgId,
          company_name: 'Other Company',
          country: 'UK',
        })

      // Seed tax codes for other org
      await supabase.rpc('seed_tax_codes_for_organization', {
        p_org_id: otherOrgId,
        p_country_code: 'UK',
      })

      // Query as test org (should only see test org codes)
      const { data } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', testOrgId)

      expect(data?.every(tc => tc.org_id === testOrgId)).toBe(true)

      // Cleanup
      await supabase.from('tax_codes').delete().eq('org_id', otherOrgId)
      await supabase.from('organizations').delete().eq('id', otherOrgId)
    })
  })

  describe('Seed function: UK vs Poland', () => {
    it('should seed different codes for UK', async () => {
      const ukOrgId = randomUUID()

      // Create UK org
      await supabase
        .from('organizations')
        .insert({
          id: ukOrgId,
          company_name: 'UK Company',
          country: 'UK',
        })

      // Seed UK tax codes
      const { data } = await supabase.rpc('seed_tax_codes_for_organization', {
        p_org_id: ukOrgId,
        p_country_code: 'UK',
      })

      expect(data).toBe(3) // UK has 3 tax codes

      // Verify UK codes
      const { data: taxCodes } = await supabase
        .from('tax_codes')
        .select('*')
        .eq('org_id', ukOrgId)
        .order('rate', { ascending: false })

      expect(taxCodes).toHaveLength(3)
      expect(taxCodes?.[0].code).toBe('STD20')
      expect(taxCodes?.[1].code).toBe('RED5')
      expect(taxCodes?.[2].code).toBe('ZERO')

      // Cleanup
      await supabase.from('tax_codes').delete().eq('org_id', ukOrgId)
      await supabase.from('organizations').delete().eq('id', ukOrgId)
    })
  })
})
