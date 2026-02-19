# UX Verification Report - Story 02.8
**Story**: Routing Operations Management
**Verification Date**: 2025-12-26
**Wireframes**: TEC-008a (PRIMARY), TEC-008 (context)
**Status**: VERIFIED WITH GAPS

---

## 1. VERIFICATION SUMMARY

### Wireframe Coverage
- ✅ **TEC-008a**: Routing detail page with operations table - COMPLETE
- ✅ **TEC-008**: Routing header modal (context only) - COMPLETE
- ⚠️ **MISSING**: Attachment upload/list components (FR-2.45)

### Component Completeness: 85%
**Verified**: 9/11 required components specified
**Missing**: 2 attachment components (AttachmentUpload, AttachmentList)

### States Coverage: 100%
All 4 states (loading, empty, error, success) defined for each component

---

## 2. VERIFIED COMPONENTS

### 2.1 Core Page Components

#### RoutingDetailHeader
**Props**:
- routing: Routing
- onEdit: () => void

**States**:
- ✅ Loading: Skeleton for header fields
- ✅ Success: Display code, name, status badge, version, reusable flag, usage count
- ✅ Error: Error banner with "Back to Routings" link
- ✅ N/A Empty: Header always present if routing exists

**Key Interactions**:
- Click "Edit Routing" → Opens TEC-008 modal
- Click "← Back to Routings" → Navigate to TEC-007 list

---

#### OperationsTable
**Props**:
- operations: RoutingOperation[]
- routingId: string
- onEdit: (op: RoutingOperation) => void
- onDelete: (op: RoutingOperation) => void
- onReorder: (opId: string, direction: 'up' | 'down') => void
- isLoading: boolean
- canEdit: boolean

**States**:
- ✅ Loading: Spinner with "Loading operations..." message
- ✅ Empty: OperationsEmptyState component (clipboard icon, CTA, example banner)
- ✅ Success: Table with operations, inline actions
- ✅ Error: Error banner with retry button

**Columns**:
1. Seq (60px) - Sequence number
2. Operation Name (200px) - Name + "(Parallel)" suffix if duplicate sequence
3. Machine (150px) - Machine name or "-" if null
4. Line (100px) - Production line name
5. Duration (100px) - Expected duration in minutes
6. Setup (100px) - Setup time in minutes
7. Sub-row: "Yield: X% | Labor: $X.XX/hr"
8. Actions (120px) - [^] [v] [Edit] [Del] buttons

**Key Interactions**:
- [^]: Move operation up (disabled on first)
- [v]: Move operation down (disabled on last)
- [Edit]: Open OperationModal in edit mode
- [Del]: Show confirmation dialog, then delete

**Parallel Operations Handling**:
- Detect duplicate sequences: `sequenceCounts[op.sequence] > 1`
- Display: `${op.name} (Parallel)` suffix
- No blocking validation - info message only

---

#### OperationRow
**Props**:
- operation: RoutingOperation
- isFirst: boolean
- isLast: boolean
- isParallel: boolean
- onEdit: () => void
- onDelete: () => void
- onMoveUp: () => void
- onMoveDown: () => void
- canEdit: boolean

**States**: Inherited from parent table

**Key Interactions**:
- Inline display of all operation fields
- Action buttons conditionally enabled/disabled

---

#### OperationsEmptyState
**Props**:
- onAddFirst: () => void

**States**:
- ✅ Success: Always displayed when operations.length === 0

**Content**:
- Clipboard icon (center-aligned)
- "No operations yet" heading
- "Add your first production step..." message
- "[+ Add First Operation]" button (primary CTA)
- Blue info banner: "[i] Example operations for a bread routing: 1. Mixing (15 min) -> 2. Proofing (45 min) -> 3. Baking (30 min)"

---

### 2.2 Modal Components

#### OperationModal
**Props**:
- open: boolean
- onClose: () => void
- routingId: string
- operation: RoutingOperation | null
- existingSequences: number[]
- onSuccess: () => void

**States**:
- ✅ Loading: Spinner overlay, disabled form fields
- ✅ Success (Create): Empty form with auto-suggested sequence
- ✅ Success (Edit): Pre-populated form + attachments section
- ✅ Error: Error banner in modal, keep open

**Fields** (11 total):
1. Sequence (number, required) - Auto-suggest max+1 in create mode
2. Operation Name (text, required) - 3-100 chars
3. Machine (dropdown, optional) - MachineDropdown component
4. Production Line (dropdown, optional) - from production_lines table
5. Expected Duration (number, required) - minutes, min 1
6. Setup Time (number, optional) - default 0, min 0
7. Cleanup Time (number, optional) - default 0, min 0
8. Expected Yield (decimal, optional) - default 100, 0-100%
9. Instructions (textarea, optional) - max 2000 chars
10. Labor Cost per Hour (decimal, optional) - default 0, min 0
11. Attachments (file upload, edit mode only) - **SEE GAP BELOW**

**Validation**:
- Sequence: Required, int, min 1
- Name: Required, 3-100 chars
- Duration: Required, int, min 1
- Setup/Cleanup: Optional, int, min 0
- Yield: Optional, 0-100
- Instructions: Optional, max 2000 chars
- Labor Cost: Optional, min 0

**Parallel Operations Logic**:
- If sequence already exists: Show info message "[i] Sequence X is already used by 'Operation Name'. This operation will run in parallel."
- Info message is NOT a blocking error - allow save

**Key Interactions**:
- [Cancel]: Close modal with dirty check
- [Add Operation] / [Save Changes]: Submit form
- On success: Close modal, refresh operations table, show toast

---

#### MachineDropdown
**Props**:
- value: string | null
- onChange: (machineId: string | null) => void
- disabled: boolean

**States**:
- ✅ Loading: Spinner in dropdown
- ✅ Empty: "No machines configured" with link to Settings
- ✅ Success: List of machines formatted as "{code} - {name}"
- ✅ Error: Error message inline

**Options**:
1. "None / Not assigned" (saves NULL)
2. Machine list from machines table (filtered by org_id)

**Key Interactions**:
- Select "None" → machine_id = NULL
- Select machine → machine_id = selected ID
- Empty state link → Navigate to /settings/machines

---

### 2.3 Summary & Related Components

#### OperationsSummaryPanel
**Props**:
- operations: RoutingOperation[]

**States**:
- ✅ Success: Display calculated summary
- ✅ N/A Loading/Empty/Error: Panel always visible if page loaded

**Calculated Fields**:
1. Total Operations: Count
2. Total Duration: SUM with parallel ops handling (MAX per sequence group)
3. Total Setup Time: SUM
4. Total Cleanup Time: SUM
5. Total Labor Cost: SUM (all ops including parallel)
6. Average Yield: Weighted average

**Parallel Operations Calculation**:
```typescript
// Duration: Use MAX for parallel ops
const groupedBySequence = operations.reduce((acc, op) => {
  if (!acc[op.sequence]) acc[op.sequence] = [];
  acc[op.sequence].push(op);
  return acc;
}, {});

const totalDuration = Object.values(groupedBySequence).reduce((sum, group) => {
  const maxDuration = Math.max(...group.map(op =>
    op.setup_time + op.duration + op.cleanup_time
  ));
  return sum + maxDuration;
}, 0);

// Cost: SUM all ops (parallel ops both incur cost)
const totalCost = operations.reduce((sum, op) => {
  const opCost = (op.expected_duration / 60) * op.labor_cost_per_hour;
  return sum + opCost;
}, 0);
```

**Expandable Breakdown**:
- Default: Collapsed
- Click "[i View Breakdown v]" to expand
- Shows per-operation breakdown with setup/cleanup times and labor cost calculations

**Display Formats**:
- Duration: formatDuration(minutes) → "Xh Ym" (e.g., "1h 50m")
- Cost: "$X.XX" with 2 decimal places
- Yield: "X.XX%" with 2 decimal places

---

#### RelatedBOMsSection
**Props**:
- boms: RelatedBOM[]
- maxDisplay: number (default 5)

**States**:
- ✅ Empty: "Not used yet" message
- ✅ Success: List of BOM codes with product names

**Display**:
- Format: "BOM-CODE (Product Name) vX.X"
- Max 5 shown, "[View All BOMs ->]" link if more
- Empty state: "Not used yet" in routing header usage count

---

## 3. IDENTIFIED GAPS

### GAP-1: Attachment Components (CRITICAL)
**Priority**: P1
**FR Reference**: FR-2.45

**Missing Components**:
1. **AttachmentUpload** - File upload with drag-and-drop
2. **AttachmentList** - Display/download/delete attachments

**Required Specs**:

#### AttachmentUpload
**Props**:
- operationId: string
- routingId: string
- currentCount: number
- maxCount: number (5)
- onUploadComplete: (attachment: OperationAttachment) => void

**States**:
- ✅ Loading: Upload progress indicator
- ✅ Success: Upload zone ready
- ✅ Error: Validation error (file size, type)
- ✅ Disabled: When currentCount >= maxCount

**Features**:
- Drag-and-drop zone
- File type validation: PDF, PNG, JPG, DOCX only
- Size validation: 10MB max per file
- Progress indicator during upload
- Disabled state when max (5) reached

**Validation Messages**:
- "File size must be less than 10MB"
- "File type not allowed (PDF, PNG, JPG, DOCX only)"
- "Maximum 5 attachments per operation"

#### AttachmentList
**Props**:
- attachments: OperationAttachment[]
- onDelete: (attachId: string) => void
- onDownload: (attachId: string) => void
- canDelete: boolean

**States**:
- ✅ Empty: "No attachments" message
- ✅ Success: List of attachments with actions

**Features**:
- Display: File name, type icon, size
- Actions: Download (opens in new tab for PDF), Delete (with confirmation)
- Type icons: PDF (red), PNG/JPG (blue), DOCX (blue)

**Interactions**:
- Click filename or download icon → Download file (signed URL)
- Click delete icon → Confirmation dialog → DELETE /api/.../attachments/{id}

**Note**: Attachment section visible in edit mode ONLY (operation must exist first)

---

### GAP-2: Production Line Dropdown
**Priority**: P2
**FR Reference**: FR-2.44

**Status**: Specified in frontend.yaml but NOT in wireframe TEC-008a

**Required**:
- Similar to MachineDropdown
- Options from production_lines table
- Allow null/"None" selection
- Empty state handling (if no lines configured)

**Recommendation**: Create ProductionLineDropdown component (mirror MachineDropdown pattern)

---

## 4. COMPONENT SPECIFICATIONS

### Component Tree
```
RoutingDetailPage
├── RoutingDetailHeader
│   └── Edit Routing button → Opens TEC-008 modal
├── OperationsTable
│   ├── OperationsEmptyState (if no operations)
│   └── OperationRow (per operation)
│       ├── Sequence display with "(Parallel)" suffix
│       ├── Machine display (from machines table join)
│       ├── Line display (from production_lines table join)
│       └── Action buttons [^] [v] [Edit] [Del]
├── OperationModal (Add/Edit)
│   ├── All operation fields (11 total)
│   ├── MachineDropdown
│   ├── ProductionLineDropdown (GAP-2)
│   └── AttachmentUpload + AttachmentList (GAP-1) - edit mode only
├── OperationsSummaryPanel
│   └── Expandable breakdown (click to expand)
└── RelatedBOMsSection
```

---

## 5. DATA FLOW

### API Endpoints Required
1. `GET /api/v1/technical/routings/:id` - Fetch routing + operations
2. `POST /api/v1/technical/routings/:id/operations` - Create operation
3. `PUT /api/v1/technical/routings/:routingId/operations/:id` - Update operation
4. `DELETE /api/v1/technical/routings/:routingId/operations/:id` - Delete operation
5. `PATCH /api/v1/technical/routings/:routingId/operations/:id/reorder` - Reorder operation
6. `POST /api/v1/technical/routings/:routingId/operations/:opId/attachments` - Upload attachment (GAP-1)
7. `GET /api/v1/technical/routings/:routingId/operations/:opId/attachments/:id/download` - Download attachment (GAP-1)
8. `DELETE /api/v1/technical/routings/:routingId/operations/:opId/attachments/:id` - Delete attachment (GAP-1)
9. `GET /api/settings/machines?org_id={orgId}` - Machines dropdown
10. `GET /api/settings/production-lines?org_id={orgId}` - Production lines dropdown (GAP-2)

**Note**: Endpoints 6-8 (attachments) are specified in api.yaml but NOT in wireframe

---

## 6. STATE MANAGEMENT

### Page-Level States
- `routing: Routing | null` - Current routing data
- `operations: RoutingOperation[]` - Operations list
- `isLoadingRouting: boolean` - Routing header loading
- `isLoadingOperations: boolean` - Operations table loading
- `error: string | null` - Error message
- `isModalOpen: boolean` - Operation modal state
- `editingOperation: RoutingOperation | null` - Operation being edited
- `expandedSummary: boolean` - Summary breakdown expanded state

### Modal States
- `isSubmitting: boolean` - Form submission loading
- `validationErrors: Record<string, string>` - Field validation errors
- `isDirty: boolean` - Unsaved changes flag
- `infoMessage: string | null` - Parallel operation info message

---

## 7. VALIDATION RULES

### Operation Form Schema (Zod)
```typescript
export const operationFormSchema = z.object({
  sequence: z.number().int().min(1, "Sequence must be at least 1"),
  name: z.string().min(3).max(100),
  description: z.string().max(500).nullable().optional(),
  machine_id: z.string().uuid().nullable().optional(),
  production_line_id: z.string().uuid().nullable().optional(),  // GAP-2
  setup_time: z.number().int().min(0).default(0),
  duration: z.number().int().min(1, "Duration must be at least 1 minute"),
  cleanup_time: z.number().int().min(0).default(0),
  labor_cost_per_hour: z.number().min(0).default(0),
  instructions: z.string().max(2000).nullable().optional(),
});

// Attachment validation (GAP-1)
export const attachmentSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(file => ALLOWED_MIME_TYPES.includes(file.type), "File type not allowed"),
});
```

---

## 8. ACCESSIBILITY REQUIREMENTS

### Keyboard Navigation
- Tab order: Header → Add Operation button → Table rows → Summary panel → Related BOMs
- Enter on table row: Open edit modal
- Delete key on table row: Delete operation (with confirmation)
- Arrow keys: Navigate table rows

### Screen Reader
- All buttons have aria-labels:
  - [^]: "Move operation up"
  - [v]: "Move operation down"
  - [Edit]: "Edit operation"
  - [Del]: "Delete operation"
- Info banners: role="status" aria-live="polite"
- Error banners: aria-live="assertive"
- Loading states: aria-busy="true" with descriptive label

### Touch Targets
- All action buttons >= 48x48dp
- Modal close button >= 48x48dp
- Expandable summary toggle >= 48x48dp

### Color Contrast
- Text: >= 4.5:1
- UI components: >= 3:1
- Status badges: High contrast (Active: green, Inactive: gray)

---

## 9. IMPLEMENTATION NOTES FOR FRONTEND-DEV

### Priority 1 (Core Functionality)
1. ✅ RoutingDetailHeader - READY
2. ✅ OperationsTable - READY
3. ✅ OperationRow - READY
4. ✅ OperationModal (without attachments) - READY
5. ✅ OperationsEmptyState - READY
6. ✅ MachineDropdown - READY
7. ✅ OperationsSummaryPanel - READY
8. ✅ RelatedBOMsSection - READY

### Priority 2 (Enhancements)
9. ⚠️ AttachmentUpload - MISSING SPEC (GAP-1)
10. ⚠️ AttachmentList - MISSING SPEC (GAP-1)
11. ⚠️ ProductionLineDropdown - MISSING SPEC (GAP-2)

### Utility Functions Required
```typescript
// Detect parallel operations
const detectParallelOperations = (operations: RoutingOperation[]) => {...};

// Calculate total duration with parallel ops (MAX per sequence)
const calculateTotalDuration = (operations: RoutingOperation[]) => {...};

// Format duration as "Xh Ym"
const formatDuration = (minutes: number): string => {...};

// Get storage path for attachment (GAP-1)
const getStoragePath = (orgId, routingId, operationId, fileName): string => {...};
```

### React Query Hooks Required
```typescript
// Operations CRUD
useRoutingOperations(routingId: string)
useCreateOperation()
useUpdateOperation()
useDeleteOperation()
useReorderOperation()

// Dropdowns
useMachines()
useHasMachines()
useProductionLines()  // GAP-2

// Attachments (GAP-1)
useUploadAttachment()
useDeleteAttachment()
```

---

## 10. HANDOFF CHECKLIST

### Before Implementation
- [ ] Resolve GAP-1: Create AttachmentUpload + AttachmentList wireframes
- [ ] Resolve GAP-2: Create ProductionLineDropdown spec (or confirm not needed)
- [ ] Verify parallel operations calculation logic with PM
- [ ] Confirm attachment storage bucket configuration (Supabase storage)

### During Implementation
- [ ] All 11 components implemented
- [ ] All 4 states defined per component
- [ ] Parallel operations detection working
- [ ] Duration calculation correct (MAX per sequence)
- [ ] Cost calculation correct (SUM all ops)
- [ ] Reorder (up/down) swapping sequences correctly
- [ ] Attachment upload/delete working (after GAP-1 resolved)
- [ ] Permission checks hiding unauthorized actions

### Before QA Handoff
- [ ] All acceptance criteria met (see tests.yaml)
- [ ] Unit tests for routing-operations-service (>80% coverage)
- [ ] Integration tests for all API endpoints
- [ ] E2E test for full operations workflow
- [ ] Accessibility audit passed (WCAG 2.1 AA)

---

## 11. NEXT STEPS

1. **UX-DESIGNER**: Create wireframe specs for GAP-1 (AttachmentUpload + AttachmentList)
2. **UX-DESIGNER**: Clarify GAP-2 (ProductionLineDropdown) - is it in scope for 02.8?
3. **BACKEND-DEV**: Verify attachment API endpoints ready (api.yaml specifies them)
4. **FRONTEND-DEV**: Begin implementation of P1 components (8/11 ready)
5. **PM-AGENT**: Confirm parallel operations calculation logic is correct

---

**Verification Status**: 85% COMPLETE
**Blocking Gaps**: 1 (GAP-1 - Attachments)
**Ready for Implementation**: P1 components only (8/11)
**Full Implementation Blocked Until**: GAP-1 resolved
