# Work Order Components Documentation

**Story**: 03.10
**Module**: Planning (03)
**Last Updated**: 2025-12-31

---

## Overview

This document describes the React component hierarchy, props interfaces, and usage patterns for the Work Order CRUD module. All components use React 19, TypeScript, TailwindCSS, and ShadCN UI.

**Component Directory**: `/workspaces/MonoPilot/apps/frontend/components/planning/work-orders/`

---

## Component Hierarchy

```
WorkOrderPage (Page Component)
├── WOKPICards (4 summary cards)
├── WOFilters (Filter controls)
├── WODataTable (List view table)
│   ├── WOStatusBadge (Inline status indicator)
│   ├── WOPriorityBadge (Inline priority indicator)
│   └── Row Actions Menu
├── WOBomSelectionModal (BOM selection flow)
├── WOForm (Create/Edit modal form)
│   ├── BOM Preview
│   ├── Material Availability Check
│   ├── Operations Preview (optional)
│   └── BOM/Routing Auto-population Logic
├── WOStatusTimeline (Status history)
├── WODeleteConfirmDialog (Deletion confirmation)
├── WOCancelConfirmDialog (Cancellation dialog)
├── WOBomPreview (Material details)
├── WOEmptyState (No data state)
└── WOErrorState (Error handling)

DetailPage (Work Order Detail)
├── WOStatusBadge (Header status)
├── Tab Navigation
│   ├── Materials Tab
│   │   ├── WOBomPreview (Material table)
│   │   └── Material Actions
│   ├── Operations Tab
│   │   └── Operations Timeline
│   ├── Output Tab
│   │   └── Batch Records
│   └── History Tab
│       └── WOStatusTimeline
└── Action Buttons
```

---

## Core Components

### 1. WOKPICards

Displays 4 KPI summary cards at top of list page.

**File**: `WOKPICards.tsx`

**Props**

```typescript
interface WOKPICardsProps {
  scheduledTodayCount: number
  inProgressCount: number
  onHoldCount: number
  thisWeekCount: number
  onCardClick?: (status: string) => void
  isLoading?: boolean
}
```

**Usage**

```typescript
<WOKPICards
  scheduledTodayCount={12}
  inProgressCount={8}
  onHoldCount={2}
  thisWeekCount={42}
  onCardClick={(status) => filterByStatus(status)}
/>
```

**Renders**

- Card 1: "Scheduled Today" (12) - Ready to start
- Card 2: "In Progress" (8) - Active production
- Card 3: "On Hold" (2) - Awaiting resolution
- Card 4: "This Week" (42) - Created this week

---

### 2. WOFilters

Multi-select filter controls for work order list.

**File**: `WOFilters.tsx`

**Props**

```typescript
interface WOFiltersProps {
  filters: WOListParams
  onFiltersChange: (filters: WOListParams) => void
  isLoading?: boolean
}

interface WOListParams {
  page?: number
  limit?: number
  search?: string
  product_id?: string
  status?: string
  line_id?: string
  machine_id?: string
  priority?: WOPriority
  date_from?: string
  date_to?: string
  sort?: string
  order?: 'asc' | 'desc'
}
```

**Usage**

```typescript
const [filters, setFilters] = useState<WOListParams>({
  status: 'planned,released',
  limit: 20
})

<WOFilters
  filters={filters}
  onFiltersChange={setFilters}
/>
```

**Filter Controls**

- Status (multi-select): draft, planned, released, in_progress, on_hold, completed, closed, cancelled
- Product (searchable dropdown)
- Machine (searchable dropdown)
- Priority (multi-select): Low, Normal, High, Critical
- Date Range: Today, This Week, This Month, Custom
- Search: WO number, product name (min 2 chars)

---

### 3. WODataTable

Main list view table displaying work orders.

**File**: `WODataTable.tsx`

**Props**

```typescript
interface WODataTableProps {
  data: WOListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading?: boolean
  onRowClick?: (wo: WOListItem) => void
  onDelete?: (woId: string) => Promise<void>
  onStatusChange?: (woId: string, newStatus: WOStatus) => Promise<void>
  onSelectRows?: (selectedIds: string[]) => void
}

interface WOListItem {
  id: string
  wo_number: string
  product_code: string
  product_name: string
  planned_quantity: number
  uom: string
  status: WOStatus
  planned_start_date: string | null
  production_line_name: string | null
  priority: WOPriority
  created_at: string
}
```

**Usage**

```typescript
const { data, isLoading } = useWorkOrders({
  page: currentPage,
  status: 'planned,released'
})

<WODataTable
  data={data.data}
  pagination={data.pagination}
  isLoading={isLoading}
  onRowClick={(wo) => navigateToDetail(wo.id)}
  onDelete={handleDelete}
  onStatusChange={handleStatusChange}
/>
```

**Table Columns**

1. **Checkbox** - Row selection for bulk actions
2. **WO Number** - With priority badge inline
3. **Product** - Name + code + line assignment
4. **Status** - Color-coded badge
5. **Quantity** - With UoM
6. **Scheduled Date** - With relative time
7. **Progress** - % or yield %
8. **Actions** - Quick menu

**Row Actions Menu**

```
- View Details
- Edit (if Draft)
- Plan (if Draft)
- Release (if Planned + materials ok)
- Start (if Released)
- Pause (if In Progress)
- Resume (if On Hold)
- Complete (if In Progress)
- Cancel (if not Completed/Closed)
- View Status History
- Duplicate WO
- Print WO
- Delete (if Draft only)
```

---

### 4. WOStatusBadge

Inline status indicator component (reusable).

**File**: `WOStatusBadge.tsx`

**Props**

```typescript
interface WOStatusBadgeProps {
  status: WOStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

**Usage**

```typescript
<WOStatusBadge status="in_progress" size="md" showLabel={true} />
```

**Status Colors**

| Status | Background | Text |
|--------|------------|------|
| draft | Gray (#F3F4F6) | #374151 |
| planned | Blue (#DBEAFE) | #1E40AF |
| released | Cyan (#CFFAFE) | #155E75 |
| in_progress | Purple (#EDE9FE) | #5B21B6 |
| on_hold | Orange (#FED7AA) | #C2410C |
| completed | Green (#D1FAE5) | #065F46 |
| closed | Green (#10B981) | White |
| cancelled | Red (#FEE2E2) | #B91C1C |

---

### 5. WOPriorityBadge

Inline priority indicator component (reusable).

**File**: `WOPriorityBadge.tsx`

**Props**

```typescript
interface WOPriorityBadgeProps {
  priority: WOPriority
  size?: 'sm' | 'md'
  showIcon?: boolean
}

type WOPriority = 'low' | 'normal' | 'high' | 'critical'
```

**Usage**

```typescript
<WOPriorityBadge priority="critical" showIcon={true} />
```

**Visual Indicators**

- Low: No badge (default)
- Normal: No badge (default)
- High: Orange badge [!] + "High"
- Critical: Red badge [!] + "Critical"

---

### 6. WOForm (Create/Edit Modal)

Complete form for creating or editing work orders.

**File**: `WOForm.tsx`

**Props**

```typescript
interface WOFormProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  workOrder?: WorkOrder
  onSubmit: (input: CreateWOInput | UpdateWOInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface CreateWOInput {
  product_id: string
  bom_id?: string | null
  planned_quantity: number
  uom?: string
  planned_start_date: string
  planned_end_date?: string | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  production_line_id?: string | null
  machine_id?: string | null
  priority?: WOPriority
  source_of_demand?: string | null
  source_reference?: string | null
  expiry_date?: string | null
  notes?: string | null
}
```

**Usage**

```typescript
const { mutate: createWO } = useCreateWorkOrder()

<WOForm
  isOpen={isCreateOpen}
  mode="create"
  onSubmit={async (input) => createWO(input)}
  onCancel={() => setIsCreateOpen(false)}
/>
```

**Form Sections**

1. **Basic Info**
   - Product (required, searchable dropdown)
   - Scheduled Date (required, date picker)
   - Quantity (required, number input)
   - BOM Version (auto-selected or manual)
   - Routing (inherited from BOM or manual)
   - Production Line (optional)
   - Machine (optional)
   - Priority (optional, default: normal)
   - Scheduled Times (optional)

2. **BOM Preview**
   - Material list from selected BOM
   - Required qty vs available qty
   - Material availability status indicators
   - Reservation status per material

3. **Availability Check**
   - Summary of material status
   - Warnings for shortages
   - Allows proceeding with shortages

4. **Operations Preview** (if routing present)
   - List of operations from routing
   - Expected duration
   - Estimated end time calculation

5. **Notes & Settings**
   - Production notes (textarea)
   - Source of demand (radio group)

---

### 7. WOBomSelectionModal

Modal for manual BOM selection flow.

**File**: `WOBomSelectionModal.tsx`

**Props**

```typescript
interface WOBomSelectionModalProps {
  isOpen: boolean
  productId: string
  scheduledDate: string
  onSelect: (bomId: string) => void
  onCancel: () => void
  isLoading?: boolean
}
```

**Usage**

```typescript
<WOBomSelectionModal
  isOpen={showBomSelector}
  productId={selectedProductId}
  scheduledDate={plannedDate}
  onSelect={(bomId) => setBomId(bomId)}
  onCancel={() => setShowBomSelector(false)}
/>
```

**BOM Selection Flow**

1. Query all active BOMs for product
2. Display with radio buttons
3. Show effectiveness dates and routing info
4. Auto-select recommended BOM (marked with star)
5. Show warning if selected BOM not effective on scheduled date
6. Allow override with confirmation

---

### 8. WOBomPreview

Detailed BOM materials table (reusable in form and detail).

**File**: `WOBomPreview.tsx`

**Props**

```typescript
interface WOBomPreviewProps {
  materials: WOMaterial[]
  showReservationStatus?: boolean
  onReserve?: (materialId: string) => void
  isLoading?: boolean
}

interface WOMaterial {
  id: string
  product_id: string
  product_code: string
  product_name: string
  required_qty: number
  uom: string
  available_qty?: number
  consumption_percent?: number
  reservation_status?: 'not_reserved' | 'partially_reserved' | 'fully_reserved'
  is_by_product?: boolean
  scrap_percent?: number
}
```

**Usage**

```typescript
<WOBomPreview
  materials={woMaterials}
  showReservationStatus={true}
  onReserve={(matId) => openReservationModal(matId)}
/>
```

**Columns**

| Column | Display |
|--------|---------|
| # | Material sequence number |
| Material | Name + code |
| Required | Required quantity |
| Available | Available in warehouse |
| Reservation | Reserved qty + LP count |
| Consumed | Actually consumed qty |
| Remaining | Reserved - Consumed |
| Status | % or By-Product indicator |
| Actions | Reserve, View |

---

### 9. WODeleteConfirmDialog

Delete confirmation dialog (draft WOs only).

**File**: `WODeleteConfirmDialog.tsx`

**Props**

```typescript
interface WODeleteConfirmDialogProps {
  isOpen: boolean
  woNumber: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}
```

**Usage**

```typescript
<WODeleteConfirmDialog
  isOpen={showDeleteConfirm}
  woNumber="WO-20241220-0001"
  onConfirm={handleDelete}
  onCancel={() => setShowDeleteConfirm(false)}
/>
```

---

### 10. WOCancelConfirmDialog

Cancel confirmation dialog with reason input.

**File**: `WOCancelConfirmDialog.tsx`

**Props**

```typescript
interface WOCancelConfirmDialogProps {
  isOpen: boolean
  woNumber: string
  onConfirm: (reason: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}
```

**Usage**

```typescript
<WOCancelConfirmDialog
  isOpen={showCancelConfirm}
  woNumber="WO-20241220-0001"
  onConfirm={(reason) => handleCancel(reason)}
  onCancel={() => setShowCancelConfirm(false)}
/>
```

---

### 11. WOStatusTimeline

Timeline view of status history events.

**File**: `WOStatusTimeline.tsx`

**Props**

```typescript
interface WOStatusTimelineProps {
  events: WOStatusHistory[]
  isLoading?: boolean
}

interface WOStatusHistory {
  id: string
  wo_id: string
  from_status: WOStatus | null
  to_status: WOStatus
  changed_by: string
  changed_at: string
  notes: string | null
  changed_by_user?: {
    name: string
  }
}
```

**Usage**

```typescript
const { data: history } = useQuery(() =>
  fetch(`/api/planning/work-orders/${woId}/history`).then(r => r.json())
)

<WOStatusTimeline events={history} />
```

---

### 12. WOEmptyState

Empty state when no work orders exist.

**File**: `WOEmptyState.tsx`

**Props**

```typescript
interface WOEmptyStateProps {
  hasFilters?: boolean
  onCreateClick?: () => void
  onClearFilters?: () => void
}
```

**Usage**

```typescript
{workOrders.length === 0 && (
  <WOEmptyState
    hasFilters={Object.keys(filters).length > 0}
    onCreateClick={() => setShowCreate(true)}
    onClearFilters={() => resetFilters()}
  />
)}
```

**States**

1. **No WOs**: Icon + "Create your first work order" + BOMs tip
2. **Filtered Empty**: Icon + "No WOs match your filters" + active filters + clear button

---

### 13. WOErrorState

Error state when data fails to load.

**File**: `WOErrorState.tsx`

**Props**

```typescript
interface WOErrorStateProps {
  error: Error
  onRetry?: () => void
}
```

**Usage**

```typescript
{isError && (
  <WOErrorState
    error={error}
    onRetry={() => refetch()}
  />
)}
```

---

## React Query Hooks

All data fetching uses React Query with custom hooks.

### useWorkOrders()

List work orders with pagination and filters.

**File**: `lib/hooks/use-work-orders.ts`

**Signature**

```typescript
function useWorkOrders(params: WOListParams = {}): UseQueryResult<PaginatedWOResult>

interface PaginatedWOResult {
  data: WOListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

**Usage**

```typescript
const { data, isLoading, error } = useWorkOrders({
  page: 1,
  status: 'planned,released',
  limit: 20
})
```

**Query Key**: `['work-orders', 'list', params]`

**Cache TTL**: 30 seconds

**Features**

- Automatic refetch on params change
- Placeholder data between requests
- Optimistic updates support

---

### useWorkOrder()

Get single work order detail with relations.

**File**: `lib/hooks/use-work-order.ts`

**Signature**

```typescript
function useWorkOrder(id: string): UseQueryResult<WorkOrderWithRelations>
```

**Usage**

```typescript
const { data: wo, isLoading } = useWorkOrder('wo-uuid-001')
```

**Query Key**: `['work-orders', 'detail', id]`

**Cache TTL**: 30 seconds

---

### Mutations

All mutations are in `lib/hooks/use-work-order-mutations.ts`

**useCreateWorkOrder()**

```typescript
function useCreateWorkOrder(): UseMutationResult<WorkOrder, Error, CreateWOInput>

const { mutate, isPending } = useCreateWorkOrder()
mutate({ product_id, planned_quantity, ... })
```

**useUpdateWorkOrder()**

```typescript
function useUpdateWorkOrder(): UseMutationResult<WorkOrder, Error, { id: string; data: UpdateWOInput }>

const { mutate } = useUpdateWorkOrder()
mutate({ id: woId, data: { priority: 'high' } })
```

**useDeleteWorkOrder()**

```typescript
function useDeleteWorkOrder(): UseMutationResult<void, Error, string>

const { mutate } = useDeleteWorkOrder()
mutate(woId)
```

**usePlanWorkOrder()**

```typescript
function usePlanWorkOrder(): UseMutationResult<WorkOrder, Error, { id: string; notes?: string }>

const { mutate } = usePlanWorkOrder()
mutate({ id: woId, notes: 'Ready to plan' })
```

**useReleaseWorkOrder()**

```typescript
function useReleaseWorkOrder(): UseMutationResult<WorkOrder, Error, { id: string; notes?: string }>

const { mutate } = useReleaseWorkOrder()
mutate({ id: woId })
```

**useCancelWorkOrder()**

```typescript
function useCancelWorkOrder(): UseMutationResult<WorkOrder, Error, { id: string; reason?: string }>

const { mutate } = useCancelWorkOrder()
mutate({ id: woId, reason: 'Customer cancelled' })
```

---

## Validation Schema

All inputs validated with Zod schemas.

**File**: `lib/validation/work-order.ts`

**Key Schemas**

```typescript
export const createWOSchema = z.object({
  product_id: z.string().uuid(),
  planned_quantity: z.number().positive(),
  planned_start_date: z.string().date(),
  bom_id: z.string().uuid().nullable().optional(),
  production_line_id: z.string().uuid().nullable().optional(),
  machine_id: z.string().uuid().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  notes: z.string().max(1000).optional()
})

export const updateWOSchema = createWOSchema.partial()

export const woListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  // ... other filters
})
```

---

## State Management

### React Context (if needed for complex state)

```typescript
interface WorkOrderContextType {
  selectedWO: WorkOrder | null
  filters: WOListParams
  setSelectedWO: (wo: WorkOrder | null) => void
  updateFilters: (filters: Partial<WOListParams>) => void
}

const WorkOrderContext = createContext<WorkOrderContextType>(...)
```

### Local Component State

Most state is local to components using `useState` with React Query integration.

---

## Code Examples

### Complete List Page Example

```typescript
import { useWorkOrders } from '@/lib/hooks/use-work-orders'
import { WOKPICards } from '@/components/planning/work-orders/WOKPICards'
import { WOFilters } from '@/components/planning/work-orders/WOFilters'
import { WODataTable } from '@/components/planning/work-orders/WODataTable'

export function WorkOrderListPage() {
  const [filters, setFilters] = useState<WOListParams>({
    status: 'planned,released',
    limit: 20,
    page: 1
  })

  const { data, isLoading } = useWorkOrders(filters)

  return (
    <div className="space-y-6">
      <WOKPICards
        scheduledTodayCount={12}
        inProgressCount={8}
        onCardClick={(status) => setFilters({ ...filters, status })}
      />

      <WOFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      <WODataTable
        data={data?.data || []}
        pagination={data?.pagination}
        isLoading={isLoading}
      />
    </div>
  )
}
```

### Create WO Form Example

```typescript
import { useCreateWorkOrder } from '@/lib/hooks/use-work-order-mutations'
import { WOForm } from '@/components/planning/work-orders/WOForm'

export function CreateWorkOrderModal({ isOpen, onClose }) {
  const { mutate: createWO, isPending } = useCreateWorkOrder()

  return (
    <WOForm
      isOpen={isOpen}
      mode="create"
      onSubmit={async (input) => {
        await createWO(input)
        onClose()
      }}
      onCancel={onClose}
      isLoading={isPending}
    />
  )
}
```

---

## Responsive Breakpoints

All components use TailwindCSS responsive utilities:

```typescript
// Example: KPI cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards adjust from 1 column (mobile) to 4 columns (desktop) */}
</div>

// Example: Table to cards
<div className="hidden lg:table">
  {/* Full table on desktop */}
</div>
<div className="lg:hidden">
  {/* Card layout on mobile */}
</div>
```

---

## Accessibility

All components implement:

- Proper semantic HTML (button, dialog, table)
- ARIA labels and roles
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management
- Color contrast compliance (4.5:1)
- Screen reader support

**Example**:

```typescript
<button
  aria-label="Release work order WO-20241220-0001"
  className="..."
  onClick={handleRelease}
>
  Release
</button>
```

---

## Performance Optimization

### Memoization

```typescript
import { memo } from 'react'

export const WOStatusBadge = memo(function WOStatusBadge(props) {
  // Component only re-renders if props change
})
```

### Lazy Loading

```typescript
const WOFormModal = lazy(() => import('./WOForm'))

<Suspense fallback={<Spinner />}>
  <WOFormModal {...props} />
</Suspense>
```

### Query Caching

```typescript
const queryClient = useQueryClient()

// Prefetch future pages
queryClient.prefetchInfiniteQuery({
  queryKey: ['work-orders', { page: 2 }],
  queryFn: () => fetchWorkOrders({ page: 2 })
})
```

---

## Related Documentation

- [Work Order API Reference](./API-WORK-ORDERS.md)
- [Work Order Database Schema](./DATABASE-WORK-ORDERS.md)
- [Work Order Developer Guide](./DEV-GUIDE-WORK-ORDERS.md)
- [PLAN-013 Wireframe (List)](../../3-ARCHITECTURE/ux/wireframes/PLAN-013-work-order-list.md)
- [PLAN-014 Wireframe (Create)](../../3-ARCHITECTURE/ux/wireframes/PLAN-014-work-order-create-modal.md)
- [PLAN-015 Wireframe (Detail)](../../3-ARCHITECTURE/ux/wireframes/PLAN-015-work-order-detail.md)

---

**Last Reviewed**: 2025-12-31
**Version**: 1.0
**Status**: Complete
