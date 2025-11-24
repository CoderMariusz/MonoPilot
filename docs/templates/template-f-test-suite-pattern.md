# Template F: Test Suite Pattern

**Use Case:** Unit tests dla wszystkich service layers (CRUD, transactions, validations)
**Token Savings:** ~3,500 tokens per story (vs 5,000 bez template)
**Stories Using:** ALL stories z service logic (~80 stories)

---

## Pattern Overview

Każdy service layer potrzebuje standardowego zestawu testów:
- ✅ CRUD operations (create, read, update, delete)
- ✅ RLS policy enforcement (org isolation)
- ✅ Validation logic (uniqueness, required fields, FK constraints)
- ✅ Error handling (not found, duplicate, constraint violations)
- ✅ Audit trail (created_by, updated_at, soft delete)

---

## Template Structure

```typescript
// __tests__/services/{entity-name}-service.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { {Entity}Service } from '@/lib/services/{entity-name}-service'
import { createServerSupabaseAdmin } from '@/lib/supabase/server-admin'

describe('{Entity}Service', () => {
  let service: {Entity}Service
  let testOrgId: string
  let cleanupIds: string[] = []

  beforeEach(async () => {
    // Setup: Create test org context
    testOrgId = 'test-org-uuid-{entity}'
    service = new {Entity}Service()

    // Mock getCurrentOrgId
    vi.mock('@/lib/services/org-service', () => ({
      getCurrentOrgId: vi.fn().mockResolvedValue(testOrgId)
    }))
  })

  afterEach(async () => {
    // Cleanup: Delete test data
    if (cleanupIds.length > 0) {
      const supabase = createServerSupabaseAdmin()
      await supabase
        .from('{table_name}')
        .delete()
        .in('id', cleanupIds)
    }
    cleanupIds = []
    vi.clearAllMocks()
  })

  // ==========================================
  // CREATE Tests
  // ==========================================
  describe('create', () => {
    it('should create {entity} with org_id scoping', async () => {
      const input = {
        code: 'TEST-001',
        name: 'Test {Entity}',
        // ... other required fields
      }

      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.code).toBe('TEST-001')
      expect(result.data.org_id).toBe(testOrgId)
      expect(result.data.created_by).toBeDefined()
      expect(result.data.created_at).toBeDefined()

      cleanupIds.push(result.data.id)
    })

    it('should validate required fields', async () => {
      const input = {
        // Missing required 'name' field
        code: 'TEST-002',
      }

      const result = await service.create(input)

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
      expect(result.code).toBe('VALIDATION_ERROR')
    })

    it('should enforce uniqueness of code per org', async () => {
      const input1 = { code: 'UNIQUE-001', name: '{Entity} 1' }
      const input2 = { code: 'UNIQUE-001', name: '{Entity} 2' } // Duplicate code

      const result1 = await service.create(input1)
      expect(result1.success).toBe(true)
      cleanupIds.push(result1.data.id)

      const result2 = await service.create(input2)
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('already exists')
      expect(result2.code).toBe('DUPLICATE_CODE')
    })

    it('should set audit trail fields', async () => {
      const input = { code: 'AUDIT-001', name: 'Audit Test' }

      const result = await service.create(input)

      expect(result.success).toBe(true)
      expect(result.data.created_by).toBeDefined()
      expect(result.data.created_at).toBeDefined()
      expect(result.data.updated_at).toBeDefined()
      expect(result.data.is_deleted).toBe(false)

      cleanupIds.push(result.data.id)
    })
  })

  // ==========================================
  // READ Tests
  // ==========================================
  describe('getById', () => {
    it('should retrieve {entity} by id', async () => {
      const created = await service.create({ code: 'READ-001', name: 'Read Test' })
      cleanupIds.push(created.data.id)

      const result = await service.getById(created.data.id)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe(created.data.id)
      expect(result.data.code).toBe('READ-001')
    })

    it('should return null if {entity} not found', async () => {
      const result = await service.getById('nonexistent-uuid')

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })

    it('should prevent cross-org access (RLS)', async () => {
      // Create entity in org A
      const created = await service.create({ code: 'RLS-001', name: 'RLS Test' })
      cleanupIds.push(created.data.id)

      // Attempt to read from org B
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce('other-org-uuid')
      const result = await service.getById(created.data.id)

      expect(result.success).toBe(true)
      expect(result.data).toBeNull() // RLS blocks access
    })
  })

  describe('list', () => {
    beforeEach(async () => {
      // Seed test data
      const items = [
        { code: 'LIST-001', name: 'Item 1', status: 'active' },
        { code: 'LIST-002', name: 'Item 2', status: 'active' },
        { code: 'LIST-003', name: 'Inactive Item', status: 'inactive' },
      ]
      for (const item of items) {
        const result = await service.create(item)
        cleanupIds.push(result.data.id)
      }
    })

    it('should list all {entities} for org', async () => {
      const result = await service.list({ limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(3)
      expect(result.total).toBeGreaterThanOrEqual(3)
    })

    it('should filter by search term', async () => {
      const result = await service.list({ search: 'Item 1', limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
      expect(result.data[0].name).toBe('Item 1')
    })

    it('should filter by status', async () => {
      const result = await service.list({ status: 'active', limit: 10, offset: 0 })

      expect(result.success).toBe(true)
      expect(result.data.every(item => item.status === 'active')).toBe(true)
    })

    it('should paginate results', async () => {
      const page1 = await service.list({ limit: 2, offset: 0 })
      const page2 = await service.list({ limit: 2, offset: 2 })

      expect(page1.data.length).toBe(2)
      expect(page2.data.length).toBeGreaterThanOrEqual(1)
      expect(page1.data[0].id).not.toBe(page2.data[0].id) // Different items
    })

    it('should exclude soft-deleted items', async () => {
      const created = await service.create({ code: 'SOFT-001', name: 'Soft Delete Test' })
      cleanupIds.push(created.data.id)

      await service.delete(created.data.id) // Soft delete

      const result = await service.list({ limit: 100, offset: 0 })
      const foundDeleted = result.data.find(item => item.id === created.data.id)

      expect(foundDeleted).toBeUndefined() // Soft-deleted items excluded
    })
  })

  // ==========================================
  // UPDATE Tests
  // ==========================================
  describe('update', () => {
    it('should update {entity} fields', async () => {
      const created = await service.create({ code: 'UPD-001', name: 'Original Name' })
      cleanupIds.push(created.data.id)

      const result = await service.update(created.data.id, { name: 'Updated Name' })

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Updated Name')
      expect(result.data.code).toBe('UPD-001') // Code unchanged
      expect(result.data.updated_at).not.toBe(created.data.updated_at) // Timestamp updated
    })

    it('should throw error if {entity} not found', async () => {
      const result = await service.update('nonexistent-uuid', { name: 'New Name' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
      expect(result.code).toBe('NOT_FOUND')
    })

    it('should prevent cross-org update (RLS)', async () => {
      const created = await service.create({ code: 'RLS-UPD-001', name: 'RLS Update Test' })
      cleanupIds.push(created.data.id)

      // Attempt update from org B
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce('other-org-uuid')
      const result = await service.update(created.data.id, { name: 'Hacked Name' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found') // RLS makes it look like not found
    })

    it('should update updated_at timestamp', async () => {
      const created = await service.create({ code: 'TIMESTAMP-001', name: 'Timestamp Test' })
      cleanupIds.push(created.data.id)

      await new Promise(resolve => setTimeout(resolve, 10)) // Wait 10ms

      const result = await service.update(created.data.id, { name: 'Updated' })

      expect(result.success).toBe(true)
      expect(new Date(result.data.updated_at).getTime())
        .toBeGreaterThan(new Date(created.data.updated_at).getTime())
    })
  })

  // ==========================================
  // DELETE Tests
  // ==========================================
  describe('delete', () => {
    it('should soft delete {entity}', async () => {
      const created = await service.create({ code: 'DEL-001', name: 'Delete Test' })
      cleanupIds.push(created.data.id)

      const result = await service.delete(created.data.id)

      expect(result.success).toBe(true)

      // Verify soft delete
      const supabase = createServerSupabaseAdmin()
      const { data } = await supabase
        .from('{table_name}')
        .select('is_deleted, deleted_at, deleted_by')
        .eq('id', created.data.id)
        .single()

      expect(data.is_deleted).toBe(true)
      expect(data.deleted_at).toBeDefined()
      expect(data.deleted_by).toBeDefined()
    })

    it('should check for dependencies before delete', async () => {
      // This test is entity-specific
      // Example: Cannot delete warehouse if it has locations

      // Create parent (e.g., warehouse)
      const parent = await service.create({ code: 'PARENT-001', name: 'Parent' })
      cleanupIds.push(parent.data.id)

      // Create child (e.g., location) - simulate FK constraint
      // ... (entity-specific logic)

      const result = await service.delete(parent.data.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('dependencies')
      expect(result.code).toBe('HAS_DEPENDENCIES')
    })

    it('should prevent cross-org delete (RLS)', async () => {
      const created = await service.create({ code: 'RLS-DEL-001', name: 'RLS Delete Test' })
      cleanupIds.push(created.data.id)

      // Attempt delete from org B
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce('other-org-uuid')
      const result = await service.delete(created.data.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found') // RLS blocks access
    })

    it('should preserve audit trail after soft delete', async () => {
      const created = await service.create({ code: 'AUDIT-DEL-001', name: 'Audit Delete' })
      cleanupIds.push(created.data.id)

      await service.delete(created.data.id)

      // Verify record still exists with audit trail
      const supabase = createServerSupabaseAdmin()
      const { data } = await supabase
        .from('{table_name}')
        .select('*')
        .eq('id', created.data.id)
        .single()

      expect(data).toBeDefined() // Record still exists
      expect(data.created_by).toBeDefined() // Audit trail preserved
      expect(data.created_at).toBeDefined()
      expect(data.is_deleted).toBe(true)
    })
  })

  // ==========================================
  // RLS Policy Tests
  // ==========================================
  describe('RLS Policies', () => {
    it('should enforce org_id isolation on SELECT', async () => {
      // Create in org A
      const created = await service.create({ code: 'RLS-SELECT-001', name: 'RLS Test' })
      cleanupIds.push(created.data.id)

      // Query from org B
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce('other-org-uuid')
      const result = await service.list({ limit: 100, offset: 0 })

      const foundInOrgB = result.data.find(item => item.id === created.data.id)
      expect(foundInOrgB).toBeUndefined() // RLS blocks cross-org access
    })

    it('should enforce org_id isolation on INSERT', async () => {
      // Attempt to insert with different org_id (should be overridden by RLS)
      const supabase = createServerSupabaseAdmin()

      // This test verifies RLS at DB level
      // Service layer should always use getCurrentOrgId()
      // Manual INSERT with wrong org_id should fail or be corrected by RLS
    })

    it('should enforce org_id isolation on UPDATE', async () => {
      const created = await service.create({ code: 'RLS-UPD-002', name: 'RLS Update' })
      cleanupIds.push(created.data.id)

      // Switch to org B
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce('other-org-uuid')

      const result = await service.update(created.data.id, { name: 'Hacked' })
      expect(result.success).toBe(false) // RLS prevents update
    })

    it('should enforce org_id isolation on DELETE', async () => {
      const created = await service.create({ code: 'RLS-DEL-002', name: 'RLS Delete' })
      cleanupIds.push(created.data.id)

      // Switch to org B
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce('other-org-uuid')

      const result = await service.delete(created.data.id)
      expect(result.success).toBe(false) // RLS prevents delete

      // Verify record still exists in org A
      vi.mocked(getCurrentOrgId).mockResolvedValueOnce(testOrgId)
      const check = await service.getById(created.data.id)
      expect(check.data).toBeDefined() // Still exists
    })
  })

  // ==========================================
  // Cache Invalidation Tests (if applicable)
  // ==========================================
  describe('Cache Invalidation', () => {
    it('should invalidate cache after create', async () => {
      // Mock cache service
      const cacheService = vi.spyOn(service, 'invalidateCache')

      await service.create({ code: 'CACHE-001', name: 'Cache Test' })

      expect(cacheService).toHaveBeenCalledWith(testOrgId)
    })

    it('should invalidate cache after update', async () => {
      const created = await service.create({ code: 'CACHE-002', name: 'Cache Test' })
      cleanupIds.push(created.data.id)

      const cacheService = vi.spyOn(service, 'invalidateCache')
      await service.update(created.data.id, { name: 'Updated' })

      expect(cacheService).toHaveBeenCalledWith(testOrgId)
    })

    it('should invalidate cache after delete', async () => {
      const created = await service.create({ code: 'CACHE-003', name: 'Cache Test' })
      cleanupIds.push(created.data.id)

      const cacheService = vi.spyOn(service, 'invalidateCache')
      await service.delete(created.data.id)

      expect(cacheService).toHaveBeenCalledWith(testOrgId)
    })
  })
})
```

---

## Customization Guide

Dla każdej story, dostosuj:

### 1. Entity-Specific Fields
```typescript
// Example: Product CRUD
const input = {
  code: 'PROD-001',
  name: 'Sugar, White',
  type: 'RM',           // Custom field
  uom: 'kg',            // Custom field
  version: '1.0',       // Custom field
  status: 'active'
}
```

### 2. Custom Validations
```typescript
it('should validate custom business rules', async () => {
  // Example: Product code must be uppercase alphanumeric
  const result = await service.create({
    code: 'invalid-code', // Should fail
    name: 'Test'
  })

  expect(result.success).toBe(false)
  expect(result.error).toContain('Code must be uppercase')
})
```

### 3. FK Constraint Tests
```typescript
it('should validate foreign key relationships', async () => {
  // Example: Location must reference valid warehouse
  const result = await service.create({
    code: 'LOC-001',
    name: 'Storage A',
    warehouse_id: 'nonexistent-uuid' // Invalid FK
  })

  expect(result.success).toBe(false)
  expect(result.error).toContain('Warehouse not found')
})
```

### 4. Dependency Checks
```typescript
it('should prevent delete if dependencies exist', async () => {
  // Example: Cannot delete warehouse if it has locations
  const warehouse = await warehouseService.create({ code: 'WH-001', name: 'Main WH' })
  const location = await locationService.create({
    code: 'LOC-001',
    name: 'Aisle A',
    warehouse_id: warehouse.data.id
  })

  const result = await warehouseService.delete(warehouse.data.id)

  expect(result.success).toBe(false)
  expect(result.error).toContain('has locations')
})
```

---

## Test Execution

```bash
# Run all service tests
pnpm test __tests__/services/

# Run specific service test
pnpm test __tests__/services/product-service.test.ts

# Run with coverage
pnpm test:coverage __tests__/services/

# Watch mode (during development)
pnpm test:watch __tests__/services/product-service.test.ts
```

---

## Token Savings Calculation

**Without Template F:**
- Write 100+ lines of test boilerplate per service
- Repeat RLS tests for each entity
- Repeat CRUD tests for each entity
- **Total:** ~150 lines × 20 tokens/line = ~3,000 tokens

**With Template F:**
- Reference template + customize 20-30 lines
- **Total:** ~600 tokens (80% reduction)

**Project-Wide:**
- 80 services × 2,400 tokens saved = 192,000 tokens saved
- 80 services × 1 hour saved = 80 hours saved

---

**END OF TEMPLATE F**
