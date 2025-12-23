# Frontend Integration Fix - Story 01.11

## Critical Issues Found

### BUG-01.11-003: Component Naming Mismatch
**File:** `apps/frontend/app/(authenticated)/settings/production-lines/page.tsx`

**Problem:**
- Page imports `ProductionLineFormModal` from old location (deprecated component)
- Should import `ProductionLineModal` and optionally `ProductionLineDataTable` from new components

**Current (Line 34):**
```typescript
import { ProductionLineFormModal } from '@/components/settings/ProductionLineFormModal'
```

**Should be:**
```typescript
import { ProductionLineModal } from '@/components/settings/production-lines'
```

**Usage Update Required (Line 330):**
```typescript
// OLD:
<ProductionLineFormModal
  line={editingLine}
  onClose={() => { ... }}
  onSuccess={() => { ... }}
/>

// NEW:
<ProductionLineModal
  mode={editingLine ? 'edit' : 'create'}
  productionLine={editingLine}
  open={showCreateModal || !!editingLine}
  onClose={() => { ... }}
  onSubmit={handleSubmit}  // Different callback!
  warehouses={warehouses}
  availableMachines={[]}   // Need to fetch
  availableProducts={[]}   // Need to fetch
/>
```

### BUG-01.11-004: Wrong Story ID in Header
**File:** Same file, lines 1-7

**Current:**
```typescript
/**
 * Production Line Management Page
 * Story: 1.8 Production Line Configuration
 * Task: BATCH 2 - List Page
 * AC-007.4: Lines list view with search, filters, sort
 * AC-007.2: Delete production line with FK validation
 */
```

**Should be:**
```typescript
/**
 * Production Line Management Page
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Main page for production line CRUD operations
 */
```

### BUG-01.11-005: Wrong API Paths
**File:** Same file

**Current API calls use:**
- `/api/settings/lines` (Line 82)
- `/api/settings/lines/${line.id}` (Line 129)
- `/api/settings/warehouses` (Line 104)

**Should use (correct v1 paths):**
- `/api/v1/settings/production-lines`
- `/api/v1/settings/production-lines/${line.id}`
- `/api/v1/settings/warehouses`

## Component Interface Differences

### Old: ProductionLineFormModal
```typescript
interface Props {
  line?: ProductionLine | null
  onClose: () => void
  onSuccess: () => void
}
```

### New: ProductionLineModal
```typescript
interface Props {
  mode: 'create' | 'edit'
  productionLine: ProductionLine | null
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>  // Different!
  warehouses: Warehouse[]
  availableMachines: MachineForSelection[]
  availableProducts: Product[]
}
```

## Fix Strategy

**SIMPLE FIX (Minimal changes to existing page):**

1. Update import statement (Line 34)
2. Fix story ID in header
3. Fix API paths (3 locations)
4. Keep using simplified inline table (current implementation)
5. Update modal usage to match new interface

**COMPLETE FIX (Use new DataTable component):**

Replace entire page.tsx with the version that uses ProductionLineDataTable.

## Manual Fix Steps

Since the file is being watched by Next.js dev server, follow these steps:

1. **Stop dev server if running**: `Ctrl+C` in terminal
2. **Edit the file**:
   - Line 1-7: Update header comment
   - Line 34: Update import
   - Line 82: Change API path
   - Line 104: Change API path
   - Line 129: Change API path
   - Lines 329-342: Update modal component usage
3. **Restart dev server**: `pnpm dev`

## Verification

After fixes:

1. Navigate to `http://localhost:3000/settings/production-lines`
2. Click "Add Production Line"
3. Verify modal opens with 3 tabs (Basic, Machines, Products)
4. Fill form and submit
5. Verify line appears in table
6. Check browser console for errors

## Test Status

Component tests: **30/30 GREEN**

Integration test: **Manual verification required**

Files affected:
- `apps/frontend/app/(authenticated)/settings/production-lines/page.tsx` - NEEDS FIX
- `apps/frontend/components/settings/production-lines/*` - ALL CORRECT
