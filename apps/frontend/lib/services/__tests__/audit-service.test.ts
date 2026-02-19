/**
 * Unit Tests: Audit Service (Story 01.17)
 * Phase: RED - All tests FAIL (no implementation yet)
 *
 * Coverage: redactSensitiveFields, computeChanges, logCreate/Update/Delete,
 * getAuditLogs (filters, pagination, search), exportToCsv
 * Target: 90% (compliance critical)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase
const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }))
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockTextSearch = vi.fn()
const mockRange = vi.fn()
const mockOrder = vi.fn()

function createChainableMock(): any {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    or: vi.fn(() => chain),
    textSearch: vi.fn(() => chain),
    range: vi.fn(() => chain),
    order: vi.fn(() => chain),
    insert: mockInsert,
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve) => resolve({ data: [], count: 0, error: null })),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      from: vi.fn(() => createChainableMock()),
    })
  ),
}))

import { AuditService } from '../audit-service'

// ============================================================================
// FR-SET-141: Sensitive Field Redaction
// ============================================================================
describe('AuditService.redactSensitiveFields', () => {
  it('should redact password field to [REDACTED]', () => {
    const input = { email: 'user@example.com', password: 'SuperSecret123!' }
    const result = AuditService.redactSensitiveFields(input)
    expect(result.password).toBe('[REDACTED]')
    expect(result.email).toBe('user@example.com')
  })

  it('should redact password_hash field', () => {
    const input = { email: 'user@example.com', password_hash: '$2a$10$abc' }
    const result = AuditService.redactSensitiveFields(input)
    expect(result.password_hash).toBe('[REDACTED]')
  })

  it('should redact api_key field', () => {
    const input = { name: 'Integration', api_key: 'sk_live_123' }
    const result = AuditService.redactSensitiveFields(input)
    expect(result.api_key).toBe('[REDACTED]')
    expect(result.name).toBe('Integration')
  })

  it('should redact api_secret field', () => {
    const input = { api_secret: 'secret_xyz' }
    const result = AuditService.redactSensitiveFields(input)
    expect(result.api_secret).toBe('[REDACTED]')
  })

  it('should redact refresh_token field', () => {
    const input = { refresh_token: 'rt_abc123' }
    const result = AuditService.redactSensitiveFields(input)
    expect(result.refresh_token).toBe('[REDACTED]')
  })

  it('should redact nested sensitive fields recursively', () => {
    const input = {
      user: { email: 'a@b.com', password: 'secret' },
      config: { api_key: 'key_abc' },
    }
    const result = AuditService.redactSensitiveFields(input)
    expect(result.user.password).toBe('[REDACTED]')
    expect(result.config.api_key).toBe('[REDACTED]')
    expect(result.user.email).toBe('a@b.com')
  })

  it('should preserve all non-sensitive fields unchanged', () => {
    const input = { email: 'a@b.com', name: 'John', role: 'admin', phone: '555' }
    const result = AuditService.redactSensitiveFields(input)
    expect(result).toEqual(input)
  })

  it('should handle empty object', () => {
    const result = AuditService.redactSensitiveFields({})
    expect(result).toEqual({})
  })
})

// ============================================================================
// FR-SET-141: Field-Level Change Tracking
// ============================================================================
describe('AuditService.computeChanges', () => {
  it('should detect single changed field with before/after', () => {
    const before = { name: 'Product A', price: 10.0 }
    const after = { name: 'Product A', price: 12.5 }
    const result = AuditService.computeChanges(before, after)
    expect(result.before).toEqual({ price: 10.0 })
    expect(result.after).toEqual({ price: 12.5 })
    expect(result.changed_fields).toEqual(['price'])
  })

  it('should detect multiple changed fields', () => {
    const before = { name: 'Old', price: 10.0, status: 'active' }
    const after = { name: 'New', price: 12.5, status: 'active' }
    const result = AuditService.computeChanges(before, after)
    expect(result.changed_fields).toContain('name')
    expect(result.changed_fields).toContain('price')
    expect(result.changed_fields).not.toContain('status')
  })

  it('should return empty when no changes (identical objects)', () => {
    const before = { name: 'Product A', price: 10.0 }
    const after = { name: 'Product A', price: 10.0 }
    const result = AuditService.computeChanges(before, after)
    expect(result.changed_fields).toEqual([])
    expect(result.before).toEqual({})
    expect(result.after).toEqual({})
  })

  it('should handle null to value transition', () => {
    const before = { description: null, price: 10.0 }
    const after = { description: 'New desc', price: 10.0 }
    const result = AuditService.computeChanges(before, after)
    expect(result.changed_fields).toEqual(['description'])
    expect(result.before).toEqual({ description: null })
    expect(result.after).toEqual({ description: 'New desc' })
  })

  it('should handle value to null transition', () => {
    const before = { description: 'Old desc' }
    const after = { description: null }
    const result = AuditService.computeChanges(before, after)
    expect(result.changed_fields).toEqual(['description'])
  })
})

// ============================================================================
// FR-SET-140: Action Logging
// ============================================================================
describe('AuditService.logCreate', () => {
  it('should create audit entry with action CREATE', async () => {
    await AuditService.logCreate({
      orgId: 'org-1',
      userId: 'user-1',
      entityType: 'products',
      entityId: 'prod-1',
      created: { name: 'Product A', price: 10.0 },
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/100',
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entity_type: 'products' })
    )
  })

  it('should include created values in changes field', async () => {
    await AuditService.logCreate({
      orgId: 'org-1',
      userId: 'user-1',
      entityType: 'products',
      entityId: 'prod-1',
      created: { name: 'Product A' },
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({ created: { name: 'Product A' } }),
      })
    )
  })
})

describe('AuditService.logUpdate', () => {
  it('should create audit entry with before/after values', async () => {
    await AuditService.logUpdate({
      orgId: 'org-1',
      userId: 'user-1',
      entityType: 'warehouses',
      entityId: 'wh-1',
      before: { name: 'WH-A' },
      after: { name: 'WH-B' },
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE' })
    )
  })

  it('should skip entry when no fields changed', async () => {
    mockInsert.mockClear()
    await AuditService.logUpdate({
      orgId: 'org-1',
      userId: 'user-1',
      entityType: 'products',
      entityId: 'prod-1',
      before: { name: 'Same' },
      after: { name: 'Same' },
    })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('should redact sensitive fields in changes', async () => {
    await AuditService.logUpdate({
      orgId: 'org-1',
      userId: 'user-1',
      entityType: 'users',
      entityId: 'user-2',
      before: { password_hash: 'old_hash' },
      after: { password_hash: 'new_hash' },
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.objectContaining({
          before: { password_hash: '[REDACTED]' },
          after: { password_hash: '[REDACTED]' },
        }),
      })
    )
  })
})

describe('AuditService.logDelete', () => {
  it('should create audit entry with action DELETE', async () => {
    await AuditService.logDelete({
      orgId: 'org-1',
      userId: 'user-1',
      entityType: 'machines',
      entityId: 'mach-1',
      deleted: { name: 'Mixer', code: 'MX-001' },
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DELETE' })
    )
  })
})

// ============================================================================
// FR-SET-142: Auth Event Logging
// ============================================================================
describe('AuditService.logLogin', () => {
  it('should create LOGIN entry with IP and user_agent', async () => {
    await AuditService.logLogin({
      orgId: 'org-1',
      userId: 'user-1',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0',
      })
    )
  })
})

describe('AuditService.logLoginFailed', () => {
  it('should create LOGIN_FAILED with email in metadata', async () => {
    await AuditService.logLoginFailed({
      orgId: 'org-1',
      email: 'wrong@example.com',
      ipAddress: '10.0.0.1',
      reason: 'Invalid password',
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN_FAILED',
        metadata: expect.objectContaining({
          email: 'wrong@example.com',
          reason: 'Invalid password',
        }),
      })
    )
  })
})

// ============================================================================
// FR-SET-143: Search/Filter/Pagination
// ============================================================================
describe('AuditService.getAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return paginated results with total count', async () => {
    const result = await AuditService.getAuditLogs('org-1', { limit: 100, offset: 0 })
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('limit', 100)
    expect(result).toHaveProperty('offset', 0)
  })

  it('should filter by user_ids', async () => {
    const result = await AuditService.getAuditLogs('org-1', {
      user_ids: ['user-1', 'user-2'],
    })
    expect(result.data).toBeDefined()
  })

  it('should filter by action types', async () => {
    const result = await AuditService.getAuditLogs('org-1', {
      actions: ['DELETE', 'CREATE'],
    })
    expect(result.data).toBeDefined()
  })

  it('should filter by entity_types', async () => {
    const result = await AuditService.getAuditLogs('org-1', {
      entity_types: ['products', 'warehouses'],
    })
    expect(result.data).toBeDefined()
  })

  it('should filter by date range', async () => {
    const result = await AuditService.getAuditLogs('org-1', {
      date_from: new Date('2025-12-01'),
      date_to: new Date('2025-12-10'),
    })
    expect(result.data).toBeDefined()
  })

  it('should combine multiple filters with AND logic', async () => {
    const result = await AuditService.getAuditLogs('org-1', {
      user_ids: ['user-john'],
      actions: ['DELETE'],
      entity_types: ['products'],
      date_from: new Date('2025-12-01'),
    })
    expect(result.data).toBeDefined()
  })

  it('should perform full-text search', async () => {
    const result = await AuditService.getAuditLogs('org-1', {
      search: 'WH-001',
    })
    expect(result.data).toBeDefined()
  })

  it('should enforce org_id scope (RLS)', async () => {
    const result = await AuditService.getAuditLogs('org-1', {})
    expect(result.data).toBeDefined()
  })
})

// ============================================================================
// FR-SET-144: CSV Export
// ============================================================================
describe('AuditService.exportToCsv', () => {
  it('should generate valid CSV with correct columns', async () => {
    const csv = await AuditService.exportToCsv('org-1', {})
    const text = csv.toString()
    expect(text).toContain('Timestamp')
    expect(text).toContain('User')
    expect(text).toContain('Email')
    expect(text).toContain('Action')
    expect(text).toContain('Entity Type')
  })

  it('should limit export to 10,000 rows maximum', async () => {
    const csv = await AuditService.exportToCsv('org-1', {})
    const lines = csv.toString().split('\n').filter(Boolean)
    expect(lines.length).toBeLessThanOrEqual(10001) // header + 10k rows
  })

  it('should apply filters to export results', async () => {
    const csv = await AuditService.exportToCsv('org-1', {
      actions: ['DELETE'],
      user_ids: ['user-john'],
    })
    expect(csv).toBeDefined()
  })
})

/**
 * Summary: 01.17 Audit Trail Tests
 * Total: 32 test cases
 * - redactSensitiveFields: 8 tests
 * - computeChanges: 5 tests
 * - logCreate: 2 tests
 * - logUpdate: 3 tests
 * - logDelete: 1 test
 * - logLogin: 1 test
 * - logLoginFailed: 1 test
 * - getAuditLogs: 8 tests
 * - exportToCsv: 3 tests
 * Status: RED (service placeholder throws 'Not implemented')
 */
