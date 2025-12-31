# Work Order Developer Guide

**Story**: 03.10
**Module**: Planning (03)
**Last Updated**: 2025-12-31

---

## Quick Start

### 1. Install Dependencies

```bash
cd /workspaces/MonoPilot
pnpm install
```

### 2. Start Development Server

```bash
# Terminal 1: Frontend
cd apps/frontend
pnpm dev

# Terminal 2: Supabase (if running locally)
supabase start
```

### 3. Test API Endpoints

```bash
# List work orders
curl -X GET "http://localhost:3000/api/planning/work-orders?page=1&limit=20" \
  -H "Authorization: Bearer {token}"

# Create work order
curl -X POST "http://localhost:3000/api/planning/work-orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "product_id": "prod-uuid",
    "planned_quantity": 1000,
    "planned_start_date": "2024-12-20"
  }'
```

---

## Architecture Overview

### File Structure

```
apps/frontend/
├── app/
│   ├── (authenticated)/
│   │   └── planning/
│   │       └── work-orders/
│   │           ├── page.tsx          (List page)
│   │           └── [id]/
│   │               └── page.tsx      (Detail page)
│   └── api/
│       └── planning/
│           └── work-orders/
│               ├── route.ts          (GET list, POST create)
│               ├── next-number/route.ts
│               ├── bom-for-date/route.ts
│               ├── available-boms/route.ts
│               ├── [id]/
│               │   ├── route.ts      (GET, PUT, DELETE)
│               │   ├── plan/route.ts
│               │   ├── release/route.ts
│               │   ├── cancel/route.ts
│               │   └── history/route.ts
│               └── summary/route.ts
├── lib/
│   ├── services/
│   │   └── work-order-service.ts     (Business logic)
│   ├── hooks/
│   │   ├── use-work-orders.ts        (List query)
│   │   ├── use-work-order.ts         (Detail query)
│   │   └── use-work-order-mutations.ts (CRUD ops)
│   ├── validation/
│   │   └── work-order.ts             (Zod schemas)
│   └── types/
│       └── work-order.ts             (TypeScript types)
└── components/
    └── planning/
        └── work-orders/
            ├── WODataTable.tsx
            ├── WOForm.tsx
            ├── WOFilters.tsx
            ├── WOKPICards.tsx
            ├── WOStatusBadge.tsx
            ├── WOPriorityBadge.tsx
            └── ... (other components)
```

---

## Service Layer

### WorkOrderService

All business logic is centralized in `lib/services/work-order-service.ts`.

**Key Methods**

```typescript
// CRUD operations
WorkOrderService.list(supabase, orgId, params)      // List with filters
WorkOrderService.getById(supabase, id)               // Get single
WorkOrderService.create(supabase, orgId, userId, input) // Create
WorkOrderService.update(supabase, id, userId, input) // Update
WorkOrderService.delete(supabase, id)                // Delete

// Status transitions
WorkOrderService.plan(supabase, id, userId, notes)   // draft → planned
WorkOrderService.release(supabase, id, userId, notes) // planned → released
WorkOrderService.cancel(supabase, id, userId, reason) // → cancelled

// BOM/Routing utilities
WorkOrderService.getActiveBomForDate(supabase, productId, orgId, date)
WorkOrderService.getAvailableBoms(supabase, productId, orgId)
WorkOrderService.previewNextNumber(supabase, orgId, date)
WorkOrderService.getStatusHistory(supabase, woId)
```

### Service Error Handling

All service methods throw `WorkOrderError` with code and status:

```typescript
export class WorkOrderError extends Error {
  code: string      // 'PRODUCT_NOT_FOUND', 'INVALID_BOM', etc.
  status: number    // 400, 404, 500
}
```

**Catch in API routes**:

```typescript
try {
  const wo = await WorkOrderService.create(supabase, orgId, userId, input)
  return successResponse(wo, { status: 201 })
} catch (error) {
  return handleApiError(error, 'POST /api/planning/work-orders')
}
```

---

## API Routes

### Pattern: REST with org_id Isolation

All routes follow standardized pattern:

1. **Create Supabase client** for authenticated user
2. **Get auth context** (org_id, userId, role)
3. **Validate input** with Zod schema
4. **Call service** with isolated org_id
5. **Return standardized response**

**Example Route**:

```typescript
// POST /api/planning/work-orders
export async function POST(request: NextRequest) {
  try {
    // 1. Create client
    const supabase = await createServerSupabase()

    // 2. Get context with permission check
    const { orgId, userId } = await getAuthContextWithRole(
      supabase,
      RoleSets.WORK_ORDER_WRITE
    )

    // 3. Validate input
    const body = await request.json()
    const validated = createWOSchema.parse(body)

    // 4. Call service
    const workOrder = await WorkOrderService.create(
      supabase,
      orgId,
      userId,
      validated
    )

    // 5. Return response
    return successResponse(workOrder, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders')
  }
}
```

### Auth Helpers

```typescript
// Check auth only (read permission)
const { orgId, userId } = await getAuthContextOrThrow(supabase)

// Check auth + specific role permission
const { orgId, userId } = await getAuthContextWithRole(
  supabase,
  RoleSets.WORK_ORDER_WRITE  // Check 'write' permission
)
```

---

## React Query Integration

### Custom Hooks Pattern

All data operations use React Query hooks for caching and synchronization.

**useWorkOrders() - List with pagination**

```typescript
export const workOrderKeys = {
  all: ['work-orders'] as const,
  lists: () => [...workOrderKeys.all, 'list'] as const,
  list: (params: WOListParams) => [...workOrderKeys.lists(), params] as const,
  details: () => [...workOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...workOrderKeys.details(), id] as const,
}

export function useWorkOrders(params: WOListParams = {}) {
  return useQuery({
    queryKey: workOrderKeys.list(params),
    queryFn: () => fetchWorkOrders(params),
    staleTime: 30 * 1000,  // 30 seconds
  })
}
```

**Mutations with automatic cache invalidation**

```typescript
export function useCreateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      // Invalidate all lists to fetch fresh data
      queryClient.invalidateQueries({
        queryKey: workOrderKeys.lists()
      })
    },
  })
}
```

---

## How to Create a Work Order

### Scenario: User creates new WO from UI

**1. Frontend calls hook**

```typescript
const { mutate: createWO, isPending } = useCreateWorkOrder()

const handleCreate = async (input: CreateWOInput) => {
  createWO(input, {
    onSuccess: (wo) => {
      console.log('Created:', wo.wo_number)
      navigateToDetail(wo.id)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}
```

**2. Hook calls API endpoint**

```typescript
// POST /api/planning/work-orders
async function createWorkOrder(input: CreateWOInput): Promise<WorkOrder> {
  const response = await fetch('/api/planning/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message)
  }

  return response.json()
}
```

**3. API route processes creation**

```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { orgId, userId } = await getAuthContextWithRole(
      supabase,
      RoleSets.WORK_ORDER_WRITE
    )

    const body = await request.json()
    const validated = createWOSchema.parse(body)

    // Service handles BOM auto-selection
    const workOrder = await WorkOrderService.create(
      supabase,
      orgId,
      userId,
      validated
    )

    return successResponse(workOrder, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders')
  }
}
```

**4. Service layer handles business logic**

```typescript
export async function create(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  input: CreateWOInput
): Promise<WorkOrder> {
  // 1. Verify product exists
  const { data: product } = await supabase
    .from('products')
    .select('id, code, name, base_uom')
    .eq('id', input.product_id)
    .eq('org_id', orgId)
    .single()

  if (!product) {
    throw new WorkOrderError('Product not found', 'PRODUCT_NOT_FOUND', 404)
  }

  // 2. Auto-select BOM if not provided
  let bomId = input.bom_id
  if (!bomId) {
    const activeBom = await getActiveBomForDate(
      supabase,
      input.product_id,
      orgId,
      new Date(input.planned_start_date)
    )
    if (activeBom) {
      bomId = activeBom.bom_id
    }
  }

  // 3. Validate BOM if provided
  if (bomId) {
    const { data: bom } = await supabase
      .from('boms')
      .select('id, product_id, org_id, status')
      .eq('id', bomId)
      .single()

    if (!bom || bom.product_id !== input.product_id) {
      throw new WorkOrderError('Invalid BOM', 'INVALID_BOM', 400)
    }
  }

  // 4. Generate WO number
  const woNumber = await supabase.rpc('generate_wo_number', {
    p_org_id: orgId,
    p_date: input.planned_start_date
  })

  // 5. Create work order
  const { data: workOrder, error } = await supabase
    .from('work_orders')
    .insert({
      org_id: orgId,
      wo_number: woNumber,
      product_id: input.product_id,
      bom_id: bomId,
      planned_quantity: input.planned_quantity,
      produced_quantity: 0,
      uom: input.uom || product.base_uom,
      status: 'draft',
      planned_start_date: input.planned_start_date,
      priority: input.priority || 'normal',
      created_by: userId,
      updated_by: userId
    })
    .select()
    .single()

  return workOrder as WorkOrder
}
```

**5. Database transaction**

```sql
-- Generated WO number
SELECT generate_wo_number('org-uuid', '2024-12-20')
-- Returns: 'WO-20241220-0001'

-- Insert work order (status = 'draft')
INSERT INTO work_orders (org_id, wo_number, product_id, bom_id, status, ...)
VALUES (...)

-- RLS policy automatically filters by org_id
-- Audit columns (created_at, created_by) auto-populated
-- Status history trigger (optional) logs creation
```

---

## How to Extend Status Transitions

### Add New Status

**1. Update service enum**:

```typescript
// lib/services/work-order-service.ts
export type WOStatus =
  | 'draft'
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'closed'
  | 'cancelled'
  | 'archived'  // NEW
```

**2. Update status transition matrix**:

```typescript
export const VALID_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['released', 'draft', 'cancelled'],
  released: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed', 'archived'],  // NEW
  closed: ['archived'],               // NEW
  archived: [],
  cancelled: [],
}
```

**3. Create new API endpoint** (optional):

```typescript
// POST /api/planning/work-orders/[id]/archive
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()
    const { userId } = await getAuthContextWithRole(
      supabase,
      RoleSets.WORK_ORDER_TRANSITION
    )

    // Get current WO
    const { data: wo } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single()

    // Validate transition
    if (!validateStatusTransition(wo.status, 'archived')) {
      throw new WorkOrderError(
        'Cannot archive from current status',
        'INVALID_TRANSITION',
        400
      )
    }

    // Update status
    const { data: updated } = await supabase
      .from('work_orders')
      .update({ status: 'archived', updated_by: userId })
      .eq('id', id)
      .select()
      .single()

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error, 'POST /api/planning/work-orders/[id]/archive')
  }
}
```

**4. Update UI to show new action button**:

```typescript
function getActionsForStatus(status: WOStatus) {
  const actions: Action[] = []

  if (status === 'closed') {
    actions.push({
      label: 'Archive',
      action: 'archive',
      icon: 'archive'
    })
  }

  return actions
}
```

---

## Testing

### Run Tests

```bash
# Unit tests
pnpm test

# E2E tests
pnpm playwright test

# Specific test file
pnpm test work-order-service.test.ts
```

### Unit Test Example

```typescript
// lib/services/__tests__/work-order-service.test.ts
describe('WorkOrderService.create', () => {
  it('should auto-select BOM for scheduled date', async () => {
    // Arrange
    const productId = 'prod-123'
    const scheduledDate = '2024-12-20'

    // Act
    const wo = await WorkOrderService.create(
      supabase,
      'org-123',
      'user-123',
      {
        product_id: productId,
        planned_quantity: 1000,
        planned_start_date: scheduledDate
        // No bom_id provided
      }
    )

    // Assert
    expect(wo.bom_id).toBeDefined()  // Should be auto-selected
    expect(wo.wo_number).toMatch(/^WO-20241220-/)
  })

  it('should throw error if product not found', async () => {
    await expect(
      WorkOrderService.create(supabase, 'org-123', 'user-123', {
        product_id: 'nonexistent',
        planned_quantity: 1000,
        planned_start_date: '2024-12-20'
      })
    ).rejects.toThrow('Product not found')
  })
})
```

### E2E Test Example

```typescript
// e2e/work-orders.spec.ts
test('Create and complete work order', async ({ page }) => {
  // Navigate to work orders
  await page.goto('/planning/work-orders')

  // Click create button
  await page.click('[data-testid="create-wo-button"]')

  // Fill form
  await page.fill('[data-testid="product-select"]', 'Chocolate Bar')
  await page.fill('[data-testid="quantity-input"]', '1000')
  await page.fill('[data-testid="date-picker"]', '2024-12-20')

  // Submit
  await page.click('[data-testid="submit-button"]')

  // Verify creation
  await expect(page.locator('text=WO-')).toBeVisible()
})
```

---

## Common Tasks

### Task: Filter work orders by status

```typescript
// Frontend
const { data } = useWorkOrders({
  status: 'in_progress,on_hold',
  limit: 20
})

// API automatically passes to service
// Service filters: .in('status', ['in_progress', 'on_hold'])
```

### Task: Bulk release work orders

```typescript
// Endpoint: POST /api/planning/work-orders/bulk-release
const response = await fetch('/api/planning/work-orders/bulk-release', {
  method: 'POST',
  body: JSON.stringify({
    wo_ids: ['wo-1', 'wo-2', 'wo-3'],
    notes: 'Batch release'
  })
})
```

### Task: Get KPI summary

```typescript
// Endpoint: GET /api/planning/work-orders/summary
const response = await fetch('/api/planning/work-orders/summary')
const { data } = await response.json()

console.log(data.scheduled_today_count)    // 12
console.log(data.in_progress_count)        // 8
console.log(data.on_hold_count)            // 2
console.log(data.this_week_count)          // 42
```

### Task: Auto-select BOM for date

```typescript
// Endpoint: GET /api/planning/work-orders/bom-for-date?product_id=xxx&scheduled_date=yyyy-mm-dd
const response = await fetch(
  '/api/planning/work-orders/bom-for-date?product_id=prod-123&scheduled_date=2024-12-20'
)

const { data: bom } = await response.json()
if (bom) {
  console.log(`Selected BOM v${bom.bom_version}`)
} else {
  console.log('No active BOM found')
}
```

---

## Troubleshooting

### Issue: "Product not found" error on create

**Cause**: Product is deleted or doesn't belong to org

**Fix**:
```typescript
// Verify product exists and is active
SELECT * FROM products WHERE id = 'prod-123' AND org_id = 'org-123' AND deleted_at IS NULL

// Use product selector instead of free-form input
<ProductSelect orgId={orgId} onSelect={setProductId} />
```

### Issue: BOM not auto-selecting

**Cause**: No active BOMs for product on scheduled date

**Fix**:
```typescript
// Check BOM effectiveness dates
SELECT * FROM boms
WHERE product_id = 'prod-123'
  AND status = 'active'
  AND effective_from <= '2024-12-20'
  AND (effective_to IS NULL OR effective_to >= '2024-12-20')

// Create active BOM if missing
// Or use manual BOM selection in UI
```

### Issue: Status transition fails

**Cause**: Invalid status transition

**Fix**:
```typescript
// Check valid transitions
SELECT VALID_TRANSITIONS FROM work_order_service

// draft can only go to: planned, cancelled
// planned can only go to: released, draft, cancelled

// Use correct endpoint for transition
POST /api/planning/work-orders/{id}/plan     // draft → planned
POST /api/planning/work-orders/{id}/release  // planned → released
```

### Issue: RLS policy blocks access

**Cause**: User's org_id doesn't match work order org_id

**Fix**:
```typescript
// Verify user's org in session
const { data: session } = await supabase.auth.getSession()
const userOrgId = session?.user.user_metadata.org_id

// Verify WO belongs to same org
SELECT org_id FROM work_orders WHERE id = 'wo-123'

// Ensure createServerSupabase() uses correct org context
```

---

## Performance Tips

### Optimize List Queries

```typescript
// Good: Specific filters reduce data
useWorkOrders({
  status: 'in_progress',
  limit: 20,
  sort: 'planned_start_date'
})

// Bad: No filters loads all WOs
useWorkOrders({
  limit: 1000  // Too much data
})
```

### Cache Management

```typescript
const queryClient = useQueryClient()

// Prefetch next page
queryClient.prefetchInfiniteQuery({
  queryKey: workOrderKeys.list({ page: 2 }),
  queryFn: () => fetchWorkOrders({ page: 2 })
})

// Invalidate only affected queries
queryClient.invalidateQueries({
  queryKey: workOrderKeys.lists()  // Resets all list queries
})

// Don't invalidate single detail queries on list update
```

### N+1 Query Prevention

```typescript
// Bad: Fetches product separately for each WO
const wos = await fetch('/api/planning/work-orders')
for (const wo of wos) {
  const product = await fetch(`/api/products/${wo.product_id}`)
}

// Good: Use single query with JOINs
const { data } = await supabase
  .from('work_orders')
  .select(`
    *,
    product:products(id, code, name),
    bom:boms(id, version),
    production_line:production_lines(id, name)
  `)
```

---

## Debugging

### Enable Query Logging

```typescript
import { devtools } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
})

devtools(queryClient)  // Enable React Query DevTools
```

### Check API Response

```bash
# List WOs
curl -X GET "http://localhost:3000/api/planning/work-orders" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  | jq '.'

# Check error details
curl -X POST "http://localhost:3000/api/planning/work-orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -d '{"invalid": "input"}' \
  | jq '.'
```

### Check Service Logs

```typescript
// Add console.log in service
export async function create(...) {
  console.log('[WorkOrderService.create] Input:', input)
  console.log('[WorkOrderService.create] Product:', product)
  console.log('[WorkOrderService.create] BOM:', bom)
  // ... rest of function
}

// Check browser console and server logs
```

---

## Related Files

- Implementation: `/workspaces/MonoPilot/apps/frontend/lib/services/work-order-service.ts`
- API Routes: `/workspaces/MonoPilot/apps/frontend/app/api/planning/work-orders/`
- Components: `/workspaces/MonoPilot/apps/frontend/components/planning/work-orders/`
- Hooks: `/workspaces/MonoPilot/apps/frontend/lib/hooks/use-work-*.ts`
- Tests: `/workspaces/MonoPilot/apps/frontend/__tests__/work-order.spec.ts`

---

## Related Documentation

- [Work Order API Reference](./API-WORK-ORDERS.md)
- [Work Order Database Schema](./DATABASE-WORK-ORDERS.md)
- [Work Order Components](./COMPONENTS-WORK-ORDERS.md)
- [PLAN-013 (List Page)](../../3-ARCHITECTURE/ux/wireframes/PLAN-013-work-order-list.md)
- [PLAN-014 (Create Modal)](../../3-ARCHITECTURE/ux/wireframes/PLAN-014-work-order-create-modal.md)
- [PLAN-015 (Detail Page)](../../3-ARCHITECTURE/ux/wireframes/PLAN-015-work-order-detail.md)

---

**Last Reviewed**: 2025-12-31
**Version**: 1.0
**Status**: Complete
