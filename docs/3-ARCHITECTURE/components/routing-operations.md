# Routing Operations Components - Story 02.8

**Module**: Technical
**Feature**: Routing Operations Management
**Story**: 02.8
**Components**: 5
**Last Updated**: 2025-12-28

---

## Overview

Routing operations UI is built with:
- **OperationsTable**: Main list of operations with CRUD actions
- **CreateOperationModal**: Modal for adding new operations
- **EditOperationDrawer**: Drawer for editing existing operations
- **OperationsSummaryPanel**: Auto-calculated cost/duration totals
- **AttachmentUpload**: File upload for operation attachments

---

## OperationsTable

### Purpose

Display all operations in a sortable table with inline actions (edit, delete, reorder).

### Props

```typescript
interface OperationsTableProps {
  routingId: string
  operations: RoutingOperation[]
  isLoading: boolean
  onRefresh: () => void
  canEdit: boolean  // Permission-based visibility
  onOperationSelect?: (operation: RoutingOperation) => void
}
```

### Columns

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| Seq | 60px | Sequence number (1, 2, 3) | ✓ |
| Name | 200px | Operation name + (Parallel) indicator | ✓ |
| Machine | 150px | Machine name or "—" | ✓ |
| Line | 100px | Production line or "—" | ✓ |
| Duration | 100px | Minutes | ✓ |
| Setup | 100px | Setup time in minutes | ✓ |
| Yield | 80px | Expected yield % | ✓ |
| Labor Cost | 100px | Hourly rate in PLN | ✓ |
| Actions | 150px | Edit, Delete, Reorder buttons | ✗ |

### Row Features

**Empty State**:
- Icon: clipboard
- Message: "No operations yet"
- Action: "[+ Add First Operation]" button
- Help text: Example operations for bread workflow

**Loading State**:
- Show skeleton rows
- "Loading operations..." spinner

**Error State**:
- Alert banner with error message
- "[Retry]" button

### Row Actions

**Reorder** (only if canEdit):
- **[^]**: Move operation up (disabled on first row)
- **[v]**: Move operation down (disabled on last row)
- No confirmation, instant feedback

**Edit** (only if canEdit):
- **[Edit]**: Opens EditOperationDrawer
- Prefills all fields

**Delete** (only if canEdit):
- **[Delete]**: Confirmation dialog
- Deletes operation and attachments
- Refreshes table

### Parallel Operations Display

Operations with duplicate sequences show "(Parallel)" suffix:

```typescript
// Example row:
Seq 2 | Proofing (Parallel) | Proofer-A | 45 | 0 | 100% | 8.00 | [^ v E D]
Seq 2 | Heating (Parallel)  | Oven-01   | 40 | 2 | 100% | 10.00| [^ v E D]
```

Indicator is muted-foreground color (subtle visual cue).

### Usage Example

```typescript
import { OperationsTable } from '@/components/technical/routings/operations-table'

export function RoutingDetail({ routingId }: { routingId: string }) {
  const [operations, setOperations] = useState<RoutingOperation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { canEdit } = usePermissions('technical')

  const fetchOperations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/v1/technical/routings/${routingId}/operations`)
      const data = await res.json()
      setOperations(data.data.operations)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OperationsTable
      routingId={routingId}
      operations={operations}
      isLoading={isLoading}
      onRefresh={fetchOperations}
      canEdit={canEdit}
    />
  )
}
```

---

## CreateOperationModal

### Purpose

Modal form for creating new operation in routing. Auto-suggests next sequence number.

### Props

```typescript
interface CreateOperationModalProps {
  routingId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (operation: RoutingOperation) => void
  existingOperations: RoutingOperation[]
  machines: Machine[]
  productionLines: ProductionLine[]
}
```

### Form Fields

#### Required Fields

1. **Sequence** (Number)
   - Min: 1, Max: 999
   - Pre-filled: `MAX(existing sequences) + 1`
   - Validation: Must be integer
   - Help: "Order of operation in workflow"

2. **Operation Name** (Text)
   - Min: 3, Max: 100 characters
   - Validation: Required, bounded length
   - Placeholder: "e.g., Mixing, Baking, Cooling"
   - Help: "Name of the production step"

3. **Expected Duration** (Number)
   - Min: 1 minute
   - Validation: Required, positive integer
   - Help: "How long this operation takes (in minutes)"

#### Optional Fields

4. **Machine** (Dropdown Select)
   - Options: Populated from machines API
   - Placeholder: "Select machine..."
   - Default: null (optional)
   - Help: "Equipment used for this operation"

5. **Production Line** (Dropdown Select)
   - Options: Populated from production_lines API
   - Placeholder: "Select production line..."
   - Default: null (optional)
   - Help: "Line where operation occurs"

6. **Setup Time** (Number)
   - Min: 0 minutes
   - Default: 0
   - Help: "Time to prepare before operation"

7. **Cleanup Time** (Number)
   - Min: 0 minutes
   - Default: 0
   - Help: "Time to clean after operation"

8. **Expected Yield** (Decimal)
   - Min: 0%, Max: 100%
   - Default: 100.00
   - Help: "Expected output percentage (0-100)"

9. **Instructions** (Textarea)
   - Max: 2000 characters
   - Rows: 4
   - Optional
   - Help: "Step-by-step instructions for operators"

10. **Labor Cost per Hour** (Decimal)
    - Min: 0
    - Default: 0.00
    - Help: "Hourly labor rate for this operation"

### State Transitions

```
Modal Opens
  |
  v
Pre-fill sequence with nextSequence
Show help text about parallel ops if duplicate
  |
  v
User Fills Form
  |
  v [Check] Sequence already exists?
  |
  +--YES--> Show info message: "[i] Seq X already used. Will run in parallel."
  |
  v
User Clicks [Add Operation]
  |
  v
LOADING (disable buttons)
  |
  v
Validate fields (Zod schema)
  |--FAIL--> Show error banner
  |--PASS--> POST /api/v1/technical/routings/{id}/operations
  |
  v
SUCCESS
  |
  +--Close modal
  +--Call onSuccess()
  +--Show toast: "Operation created"
```

### Parallel Operations Info

When user enters a sequence number that exists:

```typescript
const duplicateSeq = existingOperations.find(
  op => op.sequence === formData.sequence
)

if (duplicateSeq) {
  showInfoMessage(
    `[i] Sequence ${formData.sequence} already used by "${duplicateSeq.name}". ` +
    `This operation will run in parallel.`
  )
}
```

This is **not an error**—parallel operations are intentional feature. Message informs user but doesn't block submission.

### Usage Example

```typescript
import { CreateOperationModal } from '@/components/technical/routings/create-operation-modal'

export function OperationsSection({
  routingId,
  operations
}: {
  routingId: string
  operations: RoutingOperation[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])

  const handleSuccess = () => {
    setIsOpen(false)
    fetchOperations()  // Refresh table
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        + Add Operation
      </Button>

      <CreateOperationModal
        routingId={routingId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        existingOperations={operations}
        machines={machines}
        productionLines={productionLines}
      />
    </>
  )
}
```

---

## EditOperationDrawer

### Purpose

Drawer panel for editing existing operation. Similar to CreateOperationModal but for updates.

### Props

```typescript
interface EditOperationDrawerProps {
  routingId: string
  operation: RoutingOperation | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (operation: RoutingOperation) => void
  machines: Machine[]
  productionLines: ProductionLine[]
}
```

### Differences from Create

- All fields pre-filled from operation
- Can't change sequence (prevents accidental reordering)
- Button text: "[Save Changes]" instead of "[Add Operation]"
- PUT request instead of POST

### Form Fields

Same 10 fields as CreateOperationModal, with:
- **Sequence**: Read-only (use reorder buttons instead)
- **Other fields**: Fully editable

### State Transitions

```
Drawer Opens
  |
  v
Pre-fill all fields from operation data
  |
  v
User Edits Fields
  |
  v
User Clicks [Save Changes]
  |
  v
LOADING (disable buttons)
  |
  v
Validate fields (Zod schema)
  |--FAIL--> Show error banner
  |--PASS--> PUT /api/v1/technical/routings/{id}/operations/{opId}
  |
  v
SUCCESS
  |
  +--Close drawer
  +--Call onSuccess()
  +--Show toast: "Operation updated"
```

### Usage Example

```typescript
const [editingOp, setEditingOp] = useState<RoutingOperation | null>(null)

return (
  <>
    <OperationsTable
      operations={operations}
      onEdit={(op) => setEditingOp(op)}
    />

    <EditOperationDrawer
      operation={editingOp}
      isOpen={!!editingOp}
      onClose={() => setEditingOp(null)}
      onSuccess={() => {
        setEditingOp(null)
        fetchOperations()
      }}
      machines={machines}
      productionLines={productionLines}
    />
  </>
)
```

---

## OperationsSummaryPanel

### Purpose

Display auto-calculated statistics (total duration, cost, yield) with expandable breakdown.

### Props

```typescript
interface OperationsSummaryPanelProps {
  operations: RoutingOperation[]
  isExpanded?: boolean
  onToggleExpand?: (expanded: boolean) => void
}
```

### Data Displayed

**Main Section** (always visible):

```
Cost & Duration Summary

┌─────────────────────────────────────────────┐
│ Total Operations:    4                      │
│                                             │
│ Total Duration:      110 minutes (1h 50m)   │
│ (uses MAX per sequence for parallel ops)    │
│                                             │
│ Total Labor Cost:    $40.00                 │
│ (sums all ops including parallel)           │
│                                             │
│ Average Yield:       98.25%                 │
│ (weighted by duration)                      │
└─────────────────────────────────────────────┘
```

**Breakdown Section** (expandable):

```
[i View Breakdown v]

Seq 1 - Mixing (15 min)
  Setup: 5 min, Duration: 15 min, Cleanup: 2 min = 22 total
  Cost: $12.00/hr × 0.37 hrs = $4.40
  Yield: 98%

Seq 2 - Proofing (45 min) [Parallel with Heating]
  Setup: 0 min, Duration: 45 min, Cleanup: 0 min = 45 total (using MAX)
  Cost: $8.00/hr × 0.75 hrs = $6.00
  Yield: 100%

Seq 2 - Heating (40 min) [Parallel with Proofing]
  Setup: 2 min, Duration: 40 min, Cleanup: 0 min = 42 total
  Cost: $10.00/hr × 0.67 hrs = $6.70
  Yield: 100%

Seq 3 - Baking (30 min)
  Setup: 10 min, Duration: 30 min, Cleanup: 3 min = 43 total
  Cost: $15.00/hr × 0.71 hrs = $10.75
  Yield: 95%
```

### Calculations

**Total Duration**:
```
Groups operations by sequence
For each group: calculates MAX(setup + duration + cleanup)
Returns: SUM of all group maxes

Example with parallel ops at Seq 2:
Seq 1: 15 + 5 + 2 = 22
Seq 2: MAX(45 + 0 + 0, 40 + 2 + 0) = MAX(45, 42) = 45
Seq 3: 30 + 10 + 3 = 43
Total: 22 + 45 + 43 = 110 minutes
```

**Total Labor Cost**:
```
Sums labor cost for all operations (including parallel)

Formula: SUM((duration / 60) * labor_cost_per_hour) for all ops

Seq 1: (22 / 60) * 12.00 = 4.40
Seq 2a: (45 / 60) * 8.00 = 6.00
Seq 2b: (42 / 60) * 10.00 = 7.00
Seq 3: (43 / 60) * 15.00 = 10.75
Total: 28.15
```

**Average Yield**:
```
Weighted by operation duration

Formula: SUM(operation_yield * operation_duration) / SUM(operation_duration)

Seq 1: 98% * 15 = 1470
Seq 2a: 100% * 45 = 4500
Seq 2b: 100% * 40 = 4000
Seq 3: 95% * 30 = 2850
Total yield: 12820
Total duration: 130
Average: 12820 / 130 = 98.6%
```

### Styling

- **Container**: Light gray background (bg-gray-50), padding 20px, rounded corners
- **Title**: H3 font-weight bold, mb-4
- **Grid**: 4 columns on desktop, 2 on tablet, 1 on mobile
- **Stat Box**: Border-left accent color, padding 12px
- **Number**: Large font (text-2xl), bold, primary color
- **Label**: Small gray text, mb-2
- **Helper Text**: Italic small gray text below number

### Empty State

If operations is empty or zero-length:

```
Summary not available

No operations have been added yet. Create your first operation to see calculations.
```

### Usage Example

```typescript
import { OperationsSummaryPanel } from '@/components/technical/routings/operations-summary'

export function RoutingDetail({ routingId }: { routingId: string }) {
  const [operations, setOperations] = useState<RoutingOperation[]>([])
  const [expandedBreakdown, setExpandedBreakdown] = useState(false)

  return (
    <>
      <OperationsTable operations={operations} />

      <OperationsSummaryPanel
        operations={operations}
        isExpanded={expandedBreakdown}
        onToggleExpand={setExpandedBreakdown}
      />
    </>
  )
}
```

---

## AttachmentUpload

### Purpose

File upload component for attaching documents/images to operations.

### Props

```typescript
interface AttachmentUploadProps {
  operationId: string
  routingId: string
  existingAttachments: OperationAttachment[]
  onUploadSuccess: (attachment: OperationAttachment) => void
  onDeleteSuccess: (attachmentId: string) => void
  maxAttachments?: number  // default 5
  maxFileSize?: number     // bytes, default 10MB
}
```

### Allowed File Types

- **PDF** (application/pdf)
- **PNG** (image/png)
- **JPG** (image/jpeg)
- **DOCX** (application/vnd.openxmlformats-officedocument.wordprocessingml.document)

### Limits

- Max 5 attachments per operation
- Max 10MB per file
- Total size limit enforced by API

### Upload Interface

**Drag & Drop**:
- User can drag files onto drop zone
- Visual feedback (highlight border)
- Shows file count

**File Input Button**:
- "[Choose File]" button opens file picker
- Filtered to allowed types

**Existing Attachments List**:
- Shows current attachments with filename and size
- Download icon: Click to download
- Delete icon: Click to remove

### State Transitions

```
User Selects File
  |
  v
Validate file locally
  - Check MIME type (must be allowed)
  - Check file size (<10MB)
  - Check count (< max 5)
  |--FAIL--> Show error toast
  |--PASS--> Upload
  |
  v
LOADING
  - Show progress bar
  - Disable upload button
  |
  v
POST /api/v1/technical/routings/{id}/operations/{opId}/attachments (FormData)
  |
  v
SUCCESS
  |
  +--Update attachment list
  +--Call onUploadSuccess()
  +--Show toast: "Attachment uploaded"
  |
ERROR
  |
  +--Show error toast with details
  +--Keep upload enabled
```

### Validation Rules

Client-side (pre-upload):
```typescript
const validateAttachment = (file: File) => {
  // MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Use PDF, PNG, JPG, or DOCX.')
  }

  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds 10MB limit.')
  }

  // Count check
  if (existingAttachments.length >= maxAttachments) {
    throw new Error(`Maximum ${maxAttachments} attachments reached.`)
  }

  return true
}
```

### Usage Example

```typescript
import { AttachmentUpload } from '@/components/technical/routings/attachment-upload'

export function OperationDetail({ operation }: { operation: RoutingOperation }) {
  const [attachments, setAttachments] = useState<OperationAttachment[]>([])

  const handleDeleteAttachment = async (attachmentId: string) => {
    const res = await fetch(
      `/api/v1/technical/routings/${operation.routing_id}/operations/${operation.id}/attachments/${attachmentId}`,
      { method: 'DELETE' }
    )
    if (res.ok) {
      setAttachments(attachments.filter(a => a.id !== attachmentId))
    }
  }

  return (
    <div>
      <h3>Operation Instructions & Documents</h3>

      <AttachmentUpload
        operationId={operation.id}
        routingId={operation.routing_id}
        existingAttachments={attachments}
        onUploadSuccess={(att) => setAttachments([...attachments, att])}
        onDeleteSuccess={handleDeleteAttachment}
        maxAttachments={5}
      />
    </div>
  )
}
```

---

## Integration Example

Complete routing detail page using all components:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { OperationsTable } from '@/components/technical/routings/operations-table'
import { CreateOperationModal } from '@/components/technical/routings/create-operation-modal'
import { EditOperationDrawer } from '@/components/technical/routings/edit-operation-drawer'
import { OperationsSummaryPanel } from '@/components/technical/routings/operations-summary'

export default function RoutingDetailPage({
  params: { id: routingId }
}: {
  params: { id: string }
}) {
  const [routing, setRouting] = useState(null)
  const [operations, setOperations] = useState<RoutingOperation[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingOp, setEditingOp] = useState<RoutingOperation | null>(null)
  const { canEdit } = usePermissions('technical')

  useEffect(() => {
    fetchData()
  }, [routingId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch routing
      const routingRes = await fetch(`/api/v1/technical/routings/${routingId}`)
      const routingData = await routingRes.json()
      setRouting(routingData.data)

      // Fetch operations
      const opsRes = await fetch(`/api/v1/technical/routings/${routingId}/operations`)
      const opsData = await opsRes.json()
      setOperations(opsData.data.operations)

      // Fetch machines
      const machinesRes = await fetch('/api/settings/machines')
      const machinesData = await machinesRes.json()
      setMachines(machinesData.data)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="p-6">
      {/* Routing Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{routing?.name}</h1>
        <p className="text-gray-600">{routing?.code}</p>
        <p className="mt-2">Used by {routing?.boms_count} BOMs</p>
      </div>

      {/* Operations Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Production Operations</h2>
          {canEdit && (
            <button onClick={() => setIsCreateModalOpen(true)}>
              + Add Operation
            </button>
          )}
        </div>

        <OperationsTable
          routingId={routingId}
          operations={operations}
          isLoading={isLoading}
          onRefresh={fetchData}
          canEdit={canEdit}
          onOperationSelect={setEditingOp}
        />
      </div>

      {/* Summary */}
      {operations.length > 0 && (
        <OperationsSummaryPanel operations={operations} />
      )}

      {/* Modals */}
      <CreateOperationModal
        routingId={routingId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          fetchData()
        }}
        existingOperations={operations}
        machines={machines}
      />

      <EditOperationDrawer
        routingId={routingId}
        operation={editingOp}
        isOpen={!!editingOp}
        onClose={() => setEditingOp(null)}
        onSuccess={() => {
          setEditingOp(null)
          fetchData()
        }}
        machines={machines}
      />
    </div>
  )
}
```

---

## References

- **Story**: 02.8 - Routing Operations Management
- **API**: [Routing Operations API](../api/technical/routing-operations.md)
- **Wireframe**: TEC-008a (Routing Detail Page)
- **Types**: `lib/types/routing-operation.ts`
- **Validation**: `lib/validation/operation-schemas.ts`

---

**Last Updated**: 2025-12-28
**Author**: TECH-WRITER
**Status**: Complete & Production-Ready
