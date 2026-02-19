# BOM Service Documentation

**Story**: 02.4 - BOMs CRUD + Date Validity
**Module**: `apps/frontend/lib/services/bom-service-02-4.ts`
**Version**: 1.0
**Last Updated**: 2025-12-26
**Status**: Production Ready

## Overview

The BOM Service is a server-side service layer that handles all BOM operations with multi-tenant isolation, validation, and security. It accepts a Supabase client as a parameter to support both server-side (API routes) and client-side usage patterns.

**Architecture**: Service layer with Defense in Depth security (RLS + explicit org_id filtering)

**Security Model (ADR-013)**:
- Database RLS policies enforce org_id isolation
- Service layer adds explicit org_id filtering
- Both layers work together to prevent cross-tenant access

---

## Constants

```typescript
const DEFAULT_PAGE_SIZE = 50
const DEFAULT_SORT_BY = 'effective_from'
const DEFAULT_SORT_ORDER = 'desc'
const ROW_NOT_FOUND_ERROR_CODE = 'PGRST116'

// Reusable select string for BOM with product join
const BOM_WITH_PRODUCT_SELECT = `
  *,
  product:products!product_id (
    id,
    code,
    name,
    type,
    uom
  )
`
```

---

## Service Methods

### 1. listBOMs()

**Signature**:
```typescript
async function listBOMs(
  supabase: SupabaseClient,
  filters?: BOMFilters,
  orgId: string
): Promise<BOMsListResponse>
```

**Description**: List BOMs with pagination, filtering, and sorting.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `filters` | BOMFilters | No | Filter and pagination options |
| `orgId` | string | Yes | Organization ID (required for multi-tenant isolation) |

**BOMFilters Interface**:
```typescript
interface BOMFilters {
  page?: number
  limit?: number
  search?: string
  status?: 'draft' | 'active' | 'phased_out' | 'inactive'
  product_type?: string
  effective_date?: 'current' | 'future' | 'expired'
  product_id?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

**Returns**: `BOMsListResponse`
```typescript
interface BOMsListResponse {
  boms: BOMWithProduct[]
  total: number
  page: number
  limit: number
}
```

**Usage Example**:
```typescript
import { BOMService024 } from '@/lib/services/bom-service-02-4'
import { createServerSupabase } from '@/lib/supabase/server'

const supabase = await createServerSupabase()
const result = await BOMService024.listBOMs(
  supabase,
  {
    status: 'active',
    effective_date: 'current',
    page: 1,
    limit: 50,
    sortBy: 'effective_from',
    sortOrder: 'desc'
  },
  orgId
)

console.log(`Found ${result.total} BOMs`)
result.boms.forEach(bom => {
  console.log(`${bom.product.code} v${bom.version}`)
})
```

**Filtering Logic**:

- **search**: Case-insensitive LIKE on product code/name (sanitizes special chars)
- **status**: Exact match
- **product_id**: Exact match
- **effective_date**:
  - `'current'`: effective_from <= today AND (effective_to IS NULL OR effective_to >= today)
  - `'future'`: effective_from > today
  - `'expired'`: effective_to < today
- **product_type**: Not yet implemented (requires join)

**Security**:
- Validates orgId presence
- Explicit `.eq('org_id', orgId)` filter
- Sanitizes search input for LIKE patterns

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- Supabase error messages if query fails

---

### 2. getBOM()

**Signature**:
```typescript
async function getBOM(
  supabase: SupabaseClient,
  id: string,
  orgId: string
): Promise<BOMWithProduct | null>
```

**Description**: Retrieve a single BOM by ID with product details.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `id` | string | Yes | BOM ID (UUID) |
| `orgId` | string | Yes | Organization ID (required for multi-tenant isolation) |

**Returns**: `BOMWithProduct | null`

**Usage Example**:
```typescript
const bom = await BOMService024.getBOM(supabase, bomId, orgId)

if (!bom) {
  console.log('BOM not found or belongs to different org')
} else {
  console.log(`BOM: ${bom.product.code} v${bom.version}`)
  console.log(`Effective: ${bom.effective_from} to ${bom.effective_to}`)
}
```

**Security**:
- Validates orgId presence
- Explicit `.eq('org_id', orgId)` filter
- Returns null if not found (no error thrown for missing records)

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- Supabase error messages if query fails

---

### 3. getNextVersion()

**Signature**:
```typescript
async function getNextVersion(
  supabase: SupabaseClient,
  productId: string,
  orgId: string
): Promise<number>
```

**Description**: Get the next available version number for a product.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `productId` | string | Yes | Product ID (UUID) |
| `orgId` | string | Yes | Organization ID |

**Returns**: `number` - Next version (1 if no versions exist)

**Usage Example**:
```typescript
const nextVer = await BOMService024.getNextVersion(supabase, productId, orgId)
console.log(`Creating BOM version ${nextVer}`)

// If product has no BOMs yet: returns 1
// If product has versions [1, 2, 5]: returns 6
```

**Implementation Detail**:
- Queries MAX(version) ordered DESC with limit 1
- Increments by 1
- Returns 1 if no versions found

**Security**:
- Validates orgId presence
- Explicit `.eq('org_id', orgId)` filter

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- Supabase error messages if query fails

---

### 4. checkDateOverlap()

**Signature**:
```typescript
async function checkDateOverlap(
  supabase: SupabaseClient,
  productId: string,
  effectiveFrom: string,
  effectiveTo: string | null,
  orgId: string,
  excludeId?: string
): Promise<DateOverlapResult>
```

**Description**: Check if date range overlaps with existing BOMs for the same product.

**Architecture Note - Defense in Depth**:

This function calls the RPC `check_bom_date_overlap()` for CLIENT-SIDE validation. The database TRIGGER `check_bom_date_overlap()` is the SOURCE OF TRUTH.

- **Trigger**: Database-level preventive control (blocks invalid data)
- **RPC**: Client-side validation (provides user-friendly error messages)
- **Service**: Orchestration layer (coordinates validation flow)

Both use IDENTICAL daterange logic to ensure consistency.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `productId` | string | Yes | Product ID (UUID) |
| `effectiveFrom` | string | Yes | Start date (ISO format) |
| `effectiveTo` | string \| null | Yes | End date or null (ongoing) |
| `orgId` | string | Yes | Organization ID |
| `excludeId` | string | No | BOM ID to exclude from check (for updates) |

**Returns**: `DateOverlapResult`
```typescript
interface DateOverlapResult {
  overlaps: boolean
  conflictingBom?: BOM
}
```

**Usage Example**:
```typescript
// Creating new BOM - check if dates overlap
const overlapCheck = await BOMService024.checkDateOverlap(
  supabase,
  productId,
  '2025-01-01',
  '2025-06-30',
  orgId
)

if (overlapCheck.overlaps) {
  console.log(`Overlaps with BOM v${overlapCheck.conflictingBom?.version}`)
}

// Updating BOM - exclude current BOM from check
const updated = await BOMService024.checkDateOverlap(
  supabase,
  productId,
  '2025-01-15',
  '2025-06-30',
  orgId,
  bomId // Exclude self from overlap check
)
```

**Overlap Logic**:
```
Ranges overlap if NOT (newTo < existingFrom OR newFrom > existingTo)

Cases:
- [2025-01-01, 2025-06-30] overlaps [2025-05-01, 2025-08-31] ✗ OVERLAP
- [2025-01-01, 2025-06-30] overlaps [2025-07-01, 2025-12-31] ✓ NO OVERLAP
- [2025-01-01, null] overlaps [2025-05-01, 2025-08-31] ✗ OVERLAP (ongoing)
- [2025-01-01, null] overlaps [2025-01-01, null] ✗ OVERLAP (multiple ongoing blocked)
```

**Security**:
- Validates orgId presence
- Passes orgId to RPC function
- RPC enforces org_id isolation

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- RPC error messages if query fails

---

### 5. createBOM()

**Signature**:
```typescript
async function createBOM(
  supabase: SupabaseClient,
  input: CreateBOMRequest,
  orgId: string
): Promise<BOMWithProduct>
```

**Description**: Create a new BOM with auto-versioning and date overlap validation.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `input` | CreateBOMRequest | Yes | BOM creation data |
| `orgId` | string | Yes | Organization ID |

**CreateBOMRequest Interface**:
```typescript
interface CreateBOMRequest {
  product_id: string
  effective_from: string
  effective_to?: string | null
  status?: 'draft' | 'active'
  output_qty: number
  output_uom: string
  notes?: string
}
```

**Returns**: `BOMWithProduct` - Created BOM with product details

**Validation Rules** (Zod schema):
- `product_id`: UUID required
- `effective_from`: Valid ISO date required
- `effective_to`: ISO date or null (optional); if provided, must be after effective_from
- `status`: Enum 'draft' or 'active' (default: 'draft')
- `output_qty`: Number > 0, max 999999999
- `output_uom`: String 1-20 chars required
- `notes`: String max 2000 chars (optional)

**Usage Example**:
```typescript
const newBOM = await BOMService024.createBOM(
  supabase,
  {
    product_id: '650e8400-e29b-41d4-a716-446655440001',
    effective_from: '2025-01-01',
    effective_to: '2025-06-30',
    status: 'draft',
    output_qty: 100,
    output_uom: 'kg',
    notes: 'Q1-Q2 version'
  },
  orgId
)

console.log(`Created BOM v${newBOM.version} for ${newBOM.product.code}`)
```

**Creation Logic**:
1. Validates input with Zod schema
2. Checks date overlap with existing BOMs
3. Verifies no multiple BOMs with null effective_to
4. Gets next version number
5. Inserts BOM with org_id
6. Returns created BOM with product details

**Security**:
- Validates orgId presence
- Explicit `org_id: orgId` in INSERT
- Zod validation prevents invalid data
- Database trigger as final safeguard

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- Zod validation error messages
- `Date range overlaps with existing BOM v{N}` - if overlap detected
- `Only one BOM can have no end date per product` - if multiple ongoing BOMs
- Supabase error messages if INSERT fails

---

### 6. updateBOM()

**Signature**:
```typescript
async function updateBOM(
  supabase: SupabaseClient,
  id: string,
  input: UpdateBOMRequest,
  orgId: string
): Promise<BOMWithProduct>
```

**Description**: Update existing BOM (product_id is immutable).

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `id` | string | Yes | BOM ID (UUID) |
| `input` | UpdateBOMRequest | Yes | Update data (all fields optional) |
| `orgId` | string | Yes | Organization ID |

**UpdateBOMRequest Interface**:
```typescript
interface UpdateBOMRequest {
  effective_from?: string
  effective_to?: string | null
  status?: 'draft' | 'active' | 'phased_out' | 'inactive'
  output_qty?: number
  output_uom?: string
  notes?: string | null
}
```

**Immutable Fields**: `product_id`, `version`, `bom_type`, `org_id`

**Usage Example**:
```typescript
const updated = await BOMService024.updateBOM(
  supabase,
  bomId,
  {
    status: 'active',
    effective_to: '2025-06-30',
    output_qty: 120
  },
  orgId
)

console.log(`Updated BOM v${updated.version}`)
```

**Update Logic**:
1. Validates input with Zod schema
2. If updating dates: retrieves current BOM for comparison
3. Validates date range if both dates provided
4. Checks date overlap excluding self (using excludeId)
5. Updates BOM with org_id filter
6. Returns updated BOM with product details

**Validation Rules**:
- `effective_from`: Valid ISO date (optional)
- `effective_to`: ISO date or null; must be after effective_from
- `status`: Enum from ['draft', 'active', 'phased_out', 'inactive']
- `output_qty`: > 0, max 999999999
- `output_uom`: 1-20 chars
- `notes`: Max 2000 chars or null

**Security**:
- Validates orgId presence
- Explicit `.eq('org_id', orgId)` in UPDATE
- Checks current BOM with org_id filter before updating
- Zod validation prevents invalid data

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- Zod validation error messages
- `BOM not found` - if BOM doesn't exist in org
- `Effective To must be after Effective From` - if dates invalid
- `Date range overlaps with existing BOM v{N}` - if overlap detected
- Supabase error messages if UPDATE fails

---

### 7. deleteBOM()

**Signature**:
```typescript
async function deleteBOM(
  supabase: SupabaseClient,
  id: string,
  orgId: string
): Promise<void>
```

**Description**: Delete BOM if not used in Work Orders.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `id` | string | Yes | BOM ID (UUID) |
| `orgId` | string | Yes | Organization ID |

**Returns**: `void` (Promise resolves on success)

**Usage Example**:
```typescript
try {
  await BOMService024.deleteBOM(supabase, bomId, orgId)
  console.log('BOM deleted successfully')
} catch (error) {
  if (error.message.includes('Cannot delete BOM used in Work Orders')) {
    console.log('BOM is in use, cannot delete')
  } else {
    console.error('Unexpected error:', error)
  }
}
```

**Deletion Logic**:
1. Validates orgId presence
2. Retrieves BOM to verify existence (with org_id filter)
3. Checks for Work Order references using RPC
4. If Work Orders exist: throws error with WO numbers
5. Deletes BOM with org_id filter
6. Cascade deletes bom_items via FK constraints

**Security**:
- Validates orgId presence
- Explicit `.eq('org_id', orgId)` filter for getBOM
- Passes orgId to Work Order check RPC
- Only deletes if BOM belongs to user's organization

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- `BOM not found` - if BOM doesn't exist in org
- `Cannot delete BOM used in Work Orders: WO-001, WO-002` - if Work Orders reference BOM
- Supabase error messages if DELETE fails

---

### 8. getBOMTimeline()

**Signature**:
```typescript
async function getBOMTimeline(
  supabase: SupabaseClient,
  productId: string,
  orgId: string
): Promise<BOMTimelineResponse>
```

**Description**: Get all BOM versions for a product with timeline metadata.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `supabase` | SupabaseClient | Yes | Supabase client instance |
| `productId` | string | Yes | Product ID (UUID) |
| `orgId` | string | Yes | Organization ID |

**Returns**: `BOMTimelineResponse`
```typescript
interface BOMTimelineResponse {
  product: {
    id: string
    code: string
    name: string
  }
  versions: BOMTimelineVersion[]
  current_date: string
}

interface BOMTimelineVersion {
  id: string
  version: number
  status: BOMStatus
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  notes: string | null
  is_currently_active: boolean
  has_overlap: boolean
}
```

**Usage Example**:
```typescript
const timeline = await BOMService024.getBOMTimeline(supabase, productId, orgId)

console.log(`Product: ${timeline.product.name}`)
console.log(`Current date: ${timeline.current_date}`)

timeline.versions.forEach(version => {
  const status = version.is_currently_active ? '(ACTIVE)' : ''
  const overlap = version.has_overlap ? 'OVERLAP WARNING' : ''
  console.log(`v${version.version} ${status} ${overlap}`)
})
```

**Timeline Logic**:
1. Validates orgId presence
2. Calls RPC function `get_bom_timeline` with org_id
3. Returns all versions sorted by effective_from
4. Includes is_currently_active flag (calculated by RPC)
5. Includes has_overlap flag (calculated by RPC)

**Security**:
- Validates orgId presence
- Passes orgId to RPC function
- RPC enforces org_id isolation

**Errors Thrown**:
- `org_id is required for multi-tenant isolation` - if orgId not provided
- RPC error messages if query fails

---

## Service Export

The service is exported as a default object for easier testing:

```typescript
export const BOMService024 = {
  listBOMs,
  getBOM,
  createBOM,
  updateBOM,
  deleteBOM,
  getNextVersion,
  checkDateOverlap,
  getBOMTimeline,
}
```

**Usage**:
```typescript
import { BOMService024 } from '@/lib/services/bom-service-02-4'

// Use any method:
await BOMService024.listBOMs(supabase, filters, orgId)
await BOMService024.getBOM(supabase, id, orgId)
// etc...
```

---

## Error Handling Patterns

### Client-Side Validation (Zod)

```typescript
// Create request
try {
  const bom = await BOMService024.createBOM(supabase, input, orgId)
} catch (error) {
  if (error.message.includes('validation')) {
    // Display user-friendly validation error
    console.error('Invalid input:', error.message)
  }
}
```

### Date Overlap Handling

```typescript
const overlapCheck = await BOMService024.checkDateOverlap(
  supabase,
  productId,
  from,
  to,
  orgId
)

if (overlapCheck.overlaps) {
  const conflicting = overlapCheck.conflictingBom
  console.error(
    `Dates overlap with BOM v${conflicting?.version}` +
    `(${conflicting?.effective_from} to ${conflicting?.effective_to})`
  )
}
```

### Multi-Tenant Safety

```typescript
// ALWAYS pass orgId - never assume it
try {
  const bom = await BOMService024.getBOM(supabase, id, orgId)
} catch (error) {
  if (error.message === 'org_id is required for multi-tenant isolation') {
    // This should never happen in production
    console.error('SECURITY: orgId not provided')
  }
}
```

---

## Performance Considerations

### Indexes

The database has the following indexes to optimize queries:

```sql
CREATE INDEX idx_boms_org_product ON boms(org_id, product_id);
CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_effective ON boms(product_id, effective_from, effective_to);
CREATE INDEX idx_boms_status ON boms(org_id, status);
```

**Query Optimization**:
- `listBOMs()`: Uses org_product index for filtering
- `getNextVersion()`: Uses product index for MAX(version) query
- `checkDateOverlap()`: Uses effective index for date range queries
- `getBOMTimeline()`: Uses product index for all versions

### Pagination

Default page size is 50 records. Clients can adjust with `limit` parameter (max 100).

```typescript
const result = await listBOMs(supabase, { page: 1, limit: 100 }, orgId)
// Returns records 0-99
```

---

## Testing

### Unit Test Example

```typescript
describe('BOMService024', () => {
  describe('createBOM', () => {
    it('should create BOM with next version number', async () => {
      const bom = await BOMService024.createBOM(
        supabase,
        {
          product_id: testProductId,
          effective_from: '2025-01-01',
          output_qty: 100,
          output_uom: 'kg'
        },
        testOrgId
      )

      expect(bom.version).toBe(1)
      expect(bom.status).toBe('draft')
      expect(bom.org_id).toBe(testOrgId)
    })

    it('should prevent overlapping date ranges', async () => {
      await expect(
        BOMService024.createBOM(
          supabase,
          {
            product_id: testProductId,
            effective_from: '2025-01-01',
            effective_to: '2025-06-30',
            output_qty: 100,
            output_uom: 'kg'
          },
          testOrgId
        )
      ).rejects.toThrow('Date range overlaps')
    })
  })
})
```

---

## Related Documentation

- API Documentation: `docs/3-ARCHITECTURE/api/technical/boms.md`
- Component Documentation: `docs/3-ARCHITECTURE/components/bom-version-timeline.md`
- Database Schema: `docs/3-ARCHITECTURE/database/boms-schema.md`
- Security (ADR-013): `docs/3-ARCHITECTURE/decisions/ADR-013-rls-org-isolation-pattern.md`
- User Guide: `docs/4-USER-GUIDES/technical/bom-management.md`
