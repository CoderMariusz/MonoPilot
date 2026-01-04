# PO Status Service - Developer Documentation

**Story:** 03.7 - PO Status Lifecycle (Configurable Statuses)
**Service:** `POStatusService`
**Location:** `apps/frontend/lib/services/po-status-service.ts`
**Version:** 1.0
**Last Updated:** 2026-01-02

## Overview

`POStatusService` provides business logic for PO status management, including:
- Status CRUD operations (create, read, update, delete)
- Transition rule configuration
- Status change validation and execution
- Status history tracking
- Default status creation for new organizations

All methods are **static** and return `Promise<T>` or `Promise<ServiceResult<T>>`.

---

## Service Result Type

All mutating operations return a `ServiceResult<T>`:

```typescript
interface ServiceResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?:
    | 'NOT_FOUND'
    | 'DUPLICATE_CODE'
    | 'INVALID_INPUT'
    | 'DATABASE_ERROR'
    | 'UNAUTHORIZED'
    | 'SYSTEM_STATUS'
    | 'STATUS_IN_USE'
    | 'INVALID_TRANSITION'
    | 'SELF_LOOP'
    | 'SYSTEM_TRANSITION'
    | 'NO_LINES'
}
```

**Usage:**

```typescript
const result = await POStatusService.createStatus(orgId, data)
if (!result.success) {
  console.error(result.error, result.code)
  return
}
const status = result.data // Type: POStatus
```

---

## API Reference

### Status CRUD Operations

#### `listStatuses()`

List all statuses for an organization, ordered by `display_order` ascending.

```typescript
static async listStatuses(
  orgId: string,
  options?: { includeUsageCount?: boolean }
): Promise<POStatus[]>
```

**Parameters:**
- `orgId` (string): Organization UUID
- `options.includeUsageCount` (boolean, optional): If true, includes `po_count` for each status

**Returns:** Array of `POStatus` objects

**Example:**

```typescript
const statuses = await POStatusService.listStatuses(orgId, { includeUsageCount: true })

statuses.forEach(s => {
  console.log(`${s.name} (${s.code}): ${s.po_count} POs`)
})
```

**Error Handling:**

Returns empty array `[]` on error (logs to console).

---

#### `getStatus()`

Get a single status by ID.

```typescript
static async getStatus(
  id: string,
  orgId: string
): Promise<POStatus | null>
```

**Parameters:**
- `id` (string): Status UUID
- `orgId` (string): Organization UUID (for isolation)

**Returns:** `POStatus` or `null` if not found

**Example:**

```typescript
const status = await POStatusService.getStatus(statusId, orgId)
if (!status) {
  throw new Error('Status not found')
}
```

---

#### `getStatusByCode()`

Get a status by its code.

```typescript
static async getStatusByCode(
  code: string,
  orgId: string
): Promise<POStatus | null>
```

**Parameters:**
- `code` (string): Status code (e.g., `'draft'`, `'submitted'`)
- `orgId` (string): Organization UUID

**Returns:** `POStatus` or `null`

**Example:**

```typescript
const draftStatus = await POStatusService.getStatusByCode('draft', orgId)
```

**Use Cases:**
- Convert status code from PO to status details
- Lookup status for transition validation

---

#### `createStatus()`

Create a new custom status.

```typescript
static async createStatus(
  orgId: string,
  data: CreatePOStatusInput
): Promise<ServiceResult<POStatus>>
```

**Parameters:**
- `orgId` (string): Organization UUID
- `data` (CreatePOStatusInput):
  ```typescript
  {
    code: string         // 2-50 chars, lowercase + underscores
    name: string         // 2-100 chars
    color?: StatusColor  // Default: 'gray'
    display_order?: number  // Auto-assigned if omitted
    description?: string | null  // Max 500 chars
  }
  ```

**Returns:** `ServiceResult<POStatus>`

**Validation:**
- Checks for duplicate `code` within organization
- Auto-assigns `display_order` to last + 1 if not provided
- Sets `is_system = false`, `is_active = true`

**Example:**

```typescript
const result = await POStatusService.createStatus(orgId, {
  code: 'awaiting_vendor',
  name: 'Awaiting Vendor Confirmation',
  color: 'orange',
  description: 'Waiting for vendor to confirm order',
})

if (!result.success) {
  if (result.code === 'DUPLICATE_CODE') {
    alert('Status code already exists')
  } else {
    alert(result.error)
  }
  return
}

console.log('Created:', result.data.id)
```

**Error Codes:**
- `DUPLICATE_CODE`: Status code already exists
- `DATABASE_ERROR`: Database operation failed

---

#### `updateStatus()`

Update an existing status. System statuses cannot have their `name` changed.

```typescript
static async updateStatus(
  id: string,
  orgId: string,
  data: UpdatePOStatusInput
): Promise<ServiceResult<POStatus>>
```

**Parameters:**
- `id` (string): Status UUID
- `orgId` (string): Organization UUID
- `data` (UpdatePOStatusInput): All fields optional
  ```typescript
  {
    name?: string
    color?: StatusColor
    display_order?: number
    description?: string | null
    is_active?: boolean
  }
  ```

**Returns:** `ServiceResult<POStatus>`

**Business Rules:**
- Cannot change `name` of system status (`is_system = true`)
- Can change `color` and `display_order` of system statuses
- Auto-updates `updated_at` timestamp

**Example:**

```typescript
const result = await POStatusService.updateStatus(statusId, orgId, {
  name: 'Vendor Review',
  color: 'amber',
})

if (!result.success) {
  if (result.code === 'SYSTEM_STATUS') {
    alert('Cannot rename system status')
  } else if (result.code === 'NOT_FOUND') {
    alert('Status not found')
  }
  return
}
```

**Error Codes:**
- `NOT_FOUND`: Status not found
- `SYSTEM_STATUS`: Attempted to modify system status name
- `DATABASE_ERROR`: Database operation failed

---

#### `deleteStatus()`

Delete a status. Cannot delete system statuses or statuses in use.

```typescript
static async deleteStatus(
  id: string,
  orgId: string
): Promise<ServiceResult<null>>
```

**Parameters:**
- `id` (string): Status UUID
- `orgId` (string): Organization UUID

**Returns:** `ServiceResult<null>`

**Business Rules:**
1. Cannot delete if `is_system = true`
2. Cannot delete if any POs use this status
3. Cascades to delete related transitions

**Example:**

```typescript
const result = await POStatusService.deleteStatus(statusId, orgId)

if (!result.success) {
  if (result.code === 'SYSTEM_STATUS') {
    alert('Cannot delete system status')
  } else if (result.code === 'STATUS_IN_USE') {
    alert(result.error) // "Cannot delete. 5 POs use this status..."
  }
  return
}

console.log('Status deleted')
```

**Error Codes:**
- `SYSTEM_STATUS`: Cannot delete system status
- `STATUS_IN_USE`: Status is used by POs
- `DATABASE_ERROR`: Database operation failed

---

#### `reorderStatuses()`

Bulk update `display_order` for all statuses.

```typescript
static async reorderStatuses(
  orgId: string,
  statusIds: string[]
): Promise<ServiceResult<POStatus[]>>
```

**Parameters:**
- `orgId` (string): Organization UUID
- `statusIds` (string[]): Array of status UUIDs in new order

**Returns:** `ServiceResult<POStatus[]>` with updated statuses

**Behavior:**
- Sets `display_order = index + 1` for each status in array
- Verifies all status IDs belong to org
- Returns full list of statuses after reorder

**Example:**

```typescript
// Move "pending_approval" from position 3 to position 2
const statusIds = [
  draftId,
  pendingApprovalId,  // Now position 2
  submittedId,        // Now position 3
  confirmedId,
  // ...
]

const result = await POStatusService.reorderStatuses(orgId, statusIds)

if (!result.success) {
  alert(result.error)
  return
}

// Updated statuses with new display_order
const reordered = result.data
```

**Error Codes:**
- `NOT_FOUND`: One or more status IDs not found
- `DATABASE_ERROR`: Database operation failed

---

### Transition Rules

#### `getStatusTransitions()`

Get allowed transitions from a status.

```typescript
static async getStatusTransitions(
  statusId: string,
  orgId: string
): Promise<TransitionWithTarget[]>
```

**Parameters:**
- `statusId` (string): Source status UUID
- `orgId` (string): Organization UUID

**Returns:** Array of `TransitionWithTarget` (includes populated `to_status`)

**Type:**

```typescript
interface TransitionWithTarget extends POStatusTransition {
  to_status: POStatus  // Joined from po_statuses table
}
```

**Example:**

```typescript
const transitions = await POStatusService.getStatusTransitions(draftId, orgId)

transitions.forEach(t => {
  console.log(`Can transition to: ${t.to_status.name} (${t.to_status.code})`)
  if (t.is_system) {
    console.log('  (system-required)')
  }
})
```

**Use Cases:**
- Display allowed next statuses in dropdown
- Validate transition before attempting
- Show transition rules in admin UI

---

#### `updateStatusTransitions()`

Configure which statuses can be transitioned to from a given status.

```typescript
static async updateStatusTransitions(
  statusId: string,
  orgId: string,
  allowedToStatusIds: string[]
): Promise<ServiceResult<TransitionWithTarget[]>>
```

**Parameters:**
- `statusId` (string): Source status UUID
- `orgId` (string): Organization UUID
- `allowedToStatusIds` (string[]): Array of target status UUIDs

**Returns:** `ServiceResult<TransitionWithTarget[]>` with updated transitions

**Business Rules:**
1. Cannot create self-loop (statusId → statusId)
2. Cannot remove system-required transitions (`is_system = true`)
3. Deletes non-system transitions not in new list
4. Adds new transitions not in current list
5. Preserves system transitions

**Example:**

```typescript
// Allow draft -> submitted, cancelled (remove any others)
const result = await POStatusService.updateStatusTransitions(
  draftId,
  orgId,
  [submittedId, cancelledId]
)

if (!result.success) {
  if (result.code === 'SELF_LOOP') {
    alert('Cannot create transition to same status')
  } else if (result.code === 'SYSTEM_TRANSITION') {
    alert('Cannot remove system-required transition')
  }
  return
}

console.log('Transitions updated:', result.data)
```

**Error Codes:**
- `SELF_LOOP`: Attempted to create statusId → statusId
- `SYSTEM_TRANSITION`: Attempted to remove system transition
- `DATABASE_ERROR`: Database operation failed

---

### Status Operations

#### `getAvailableTransitions()`

Get allowed next statuses for a specific PO.

```typescript
static async getAvailableTransitions(
  poId: string,
  orgId: string
): Promise<POStatus[]>
```

**Parameters:**
- `poId` (string): Purchase Order UUID
- `orgId` (string): Organization UUID

**Returns:** Array of `POStatus` objects representing valid next statuses

**Example:**

```typescript
const availableStatuses = await POStatusService.getAvailableTransitions(poId, orgId)

// Render dropdown
availableStatuses.forEach(s => {
  console.log(`<option value="${s.code}">${s.name}</option>`)
})
```

**Use Cases:**
- Populate status dropdown on PO detail page
- Check if specific transition is available

---

#### `validateTransition()`

Validate if a status transition is allowed, including business rules.

```typescript
static async validateTransition(
  poId: string,
  toStatusCode: string,
  orgId: string
): Promise<TransitionValidationResult>
```

**Parameters:**
- `poId` (string): Purchase Order UUID
- `toStatusCode` (string): Target status code
- `orgId` (string): Organization UUID

**Returns:**

```typescript
interface TransitionValidationResult {
  valid: boolean
  reason?: string    // If invalid, reason why
  warnings?: string[] // If valid but has warnings
}
```

**Business Rules Checked:**
1. Transition exists in configuration
2. Cannot submit PO without line items (`draft/pending_approval → submitted`)
3. Warning if PO total > $10,000

**Example:**

```typescript
const validation = await POStatusService.validateTransition(poId, 'submitted', orgId)

if (!validation.valid) {
  alert(validation.reason) // "Cannot submit PO without line items"
  return
}

if (validation.warnings && validation.warnings.length > 0) {
  if (!confirm(`Warning: ${validation.warnings.join(', ')}. Continue?`)) {
    return
  }
}

// Proceed with transition
await POStatusService.transitionStatus(poId, 'submitted', userId, orgId)
```

**Use Cases:**
- Pre-validate before showing confirmation dialog
- Display validation errors to user
- Show warnings for high-value POs

---

#### `transitionStatus()`

Execute a status transition for a PO.

```typescript
static async transitionStatus(
  poId: string,
  toStatusCode: string,
  userId: string | null,
  orgId: string,
  notes?: string
): Promise<ServiceResult<{ id: string; status: string }>>
```

**Parameters:**
- `poId` (string): Purchase Order UUID
- `toStatusCode` (string): Target status code
- `userId` (string | null): User performing transition (null for system)
- `orgId` (string): Organization UUID
- `notes` (string, optional): Reason/notes for transition

**Returns:** `ServiceResult<{ id, status }>`

**Side Effects:**
1. Updates `purchase_orders.status`
2. Updates `purchase_orders.updated_at` and `updated_by`
3. Creates `po_status_history` record

**Example:**

```typescript
const result = await POStatusService.transitionStatus(
  poId,
  'submitted',
  currentUser.id,
  orgId,
  'Ready for processing'
)

if (!result.success) {
  if (result.code === 'INVALID_TRANSITION') {
    alert(result.error) // "Invalid transition: confirmed -> draft"
  } else if (result.code === 'NO_LINES') {
    alert(result.error) // "Cannot submit PO without line items"
  }
  return
}

console.log('PO status changed to:', result.data.status)
```

**Error Codes:**
- `INVALID_TRANSITION`: Transition not allowed
- `NO_LINES`: Cannot submit without line items
- `NOT_FOUND`: PO not found
- `DATABASE_ERROR`: Database operation failed

**System Transitions:**

For system-triggered transitions (e.g., auto-transition to `receiving` on first receipt):

```typescript
await POStatusService.transitionStatus(
  poId,
  'receiving',
  null, // System user
  orgId,
  'Auto-transitioned: first receipt recorded'
)
```

---

### Status History

#### `getStatusHistory()`

Get complete status change history for a PO.

```typescript
static async getStatusHistory(
  poId: string,
  orgId: string
): Promise<POStatusHistory[]>
```

**Parameters:**
- `poId` (string): Purchase Order UUID
- `orgId` (string): Organization UUID

**Returns:** Array of `POStatusHistory` objects, sorted by `changed_at` descending

**Type:**

```typescript
interface POStatusHistory {
  id: string
  po_id: string
  from_status: string | null  // null for PO creation
  to_status: string
  changed_by: string | null   // null for system
  changed_at: string
  notes: string | null
  transition_metadata?: Record<string, unknown> | null
  user?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}
```

**Example:**

```typescript
const history = await POStatusService.getStatusHistory(poId, orgId)

history.forEach(entry => {
  const user = entry.user
    ? `${entry.user.first_name} ${entry.user.last_name}`
    : 'System'

  console.log(
    `${entry.changed_at}: ${entry.from_status || '(created)'} → ${entry.to_status} by ${user}`
  )
  if (entry.notes) {
    console.log(`  Notes: ${entry.notes}`)
  }
})
```

**Use Cases:**
- Display timeline on PO detail page
- Audit trail for compliance
- Troubleshooting status issues

---

#### `recordStatusHistory()`

Manually record a status change (usually called internally by `transitionStatus()`).

```typescript
static async recordStatusHistory(
  poId: string,
  fromStatus: string | null,
  toStatus: string,
  userId: string | null,
  notes?: string
): Promise<POStatusHistory | null>
```

**Parameters:**
- `poId` (string): Purchase Order UUID
- `fromStatus` (string | null): Previous status (null for creation)
- `toStatus` (string): New status
- `userId` (string | null): User who made change (null for system)
- `notes` (string, optional): Reason/notes

**Returns:** `POStatusHistory` record or `null` on error

**Example:**

```typescript
// Manually log PO creation
await POStatusService.recordStatusHistory(
  poId,
  null, // from_status
  'draft',
  userId,
  'PO created'
)

// Log system transition
await POStatusService.recordStatusHistory(
  poId,
  'confirmed',
  'receiving',
  null, // System user
  'Auto-transitioned: first receipt recorded'
)
```

---

### Business Rules

#### `canDeleteStatus()`

Check if a status can be deleted.

```typescript
static async canDeleteStatus(
  statusId: string,
  orgId: string
): Promise<CanDeleteStatusResult>
```

**Parameters:**
- `statusId` (string): Status UUID
- `orgId` (string): Organization UUID

**Returns:**

```typescript
interface CanDeleteStatusResult {
  allowed: boolean
  reason?: string
  poCount?: number
}
```

**Business Rules:**
1. Cannot delete system statuses
2. Cannot delete statuses in use

**Example:**

```typescript
const canDelete = await POStatusService.canDeleteStatus(statusId, orgId)

if (!canDelete.allowed) {
  if (canDelete.poCount && canDelete.poCount > 0) {
    alert(`Cannot delete. ${canDelete.poCount} POs use this status.`)
  } else {
    alert(canDelete.reason)
  }
  return
}

// Proceed with delete
await POStatusService.deleteStatus(statusId, orgId)
```

**Use Cases:**
- Pre-check before showing delete confirmation
- Display usage count in admin UI
- Disable delete button if not allowed

---

#### `getStatusUsageCount()`

Get count of POs using a status.

```typescript
static async getStatusUsageCount(
  statusId: string,
  orgId: string
): Promise<number>
```

**Parameters:**
- `statusId` (string): Status UUID
- `orgId` (string): Organization UUID

**Returns:** Number of POs using this status

**Example:**

```typescript
const count = await POStatusService.getStatusUsageCount(statusId, orgId)

console.log(`${count} POs currently use this status`)
```

**Use Cases:**
- Display usage count in admin UI
- Determine if status can be deleted
- Metrics and reporting

---

### Setup

#### `createDefaultStatuses()`

Create default statuses and transitions for a new organization.

```typescript
static async createDefaultStatuses(orgId: string): Promise<void>
```

**Parameters:**
- `orgId` (string): Organization UUID

**Behavior:**
- Checks if statuses already exist (idempotent)
- Creates 7 default statuses (draft, submitted, pending_approval, confirmed, receiving, closed, cancelled)
- Creates 11 default transitions
- Uses `DEFAULT_PO_STATUSES` and `DEFAULT_PO_TRANSITIONS` from validation schemas

**Example:**

```typescript
// Call during organization onboarding
await POStatusService.createDefaultStatuses(newOrgId)

console.log('Default PO statuses created')
```

**Use Cases:**
- Organization creation flow
- Backfill for existing orgs after migration

---

## Constants

### Default Statuses

From `lib/validation/po-status-schemas.ts`:

```typescript
export const DEFAULT_PO_STATUSES = [
  { code: 'draft', name: 'Draft', color: 'gray', display_order: 1, is_system: true },
  { code: 'submitted', name: 'Submitted', color: 'blue', display_order: 2, is_system: true },
  { code: 'pending_approval', name: 'Pending Approval', color: 'yellow', display_order: 3, is_system: false },
  { code: 'confirmed', name: 'Confirmed', color: 'green', display_order: 4, is_system: true },
  { code: 'receiving', name: 'Receiving', color: 'purple', display_order: 5, is_system: true },
  { code: 'closed', name: 'Closed', color: 'emerald', display_order: 6, is_system: true },
  { code: 'cancelled', name: 'Cancelled', color: 'red', display_order: 7, is_system: true },
]
```

### Default Transitions

```typescript
export const DEFAULT_PO_TRANSITIONS = [
  { from_code: 'draft', to_code: 'submitted', is_system: false },
  { from_code: 'draft', to_code: 'cancelled', is_system: false },
  { from_code: 'submitted', to_code: 'pending_approval', is_system: false },
  { from_code: 'submitted', to_code: 'confirmed', is_system: false },
  { from_code: 'submitted', to_code: 'cancelled', is_system: false },
  { from_code: 'pending_approval', to_code: 'confirmed', is_system: false },
  { from_code: 'pending_approval', to_code: 'cancelled', is_system: false },
  { from_code: 'confirmed', to_code: 'receiving', is_system: true },
  { from_code: 'confirmed', to_code: 'cancelled', is_system: false },
  { from_code: 'receiving', to_code: 'closed', is_system: true },
  { from_code: 'receiving', to_code: 'cancelled', is_system: false },
]
```

---

## Testing

### Unit Tests

See `apps/frontend/lib/services/__tests__/po-status-service.test.ts`

**Coverage:**
- All CRUD operations
- Transition validation
- Business rule enforcement
- Error handling

**Example Test:**

```typescript
describe('POStatusService.validateTransition', () => {
  it('should block invalid transition', async () => {
    const result = await POStatusService.validateTransition(
      poId,
      'draft', // Cannot go back to draft from confirmed
      orgId
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Invalid transition')
  })

  it('should enforce no-lines rule', async () => {
    // PO has 0 lines
    const result = await POStatusService.validateTransition(
      emptyPoId,
      'submitted',
      orgId
    )

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('without line items')
  })
})
```

---

## Common Patterns

### Pattern: Status Dropdown

```typescript
const availableStatuses = await POStatusService.getAvailableTransitions(poId, orgId)

return (
  <Select value={currentStatus} onChange={handleStatusChange}>
    {availableStatuses.map(status => (
      <Option key={status.id} value={status.code}>
        <StatusBadge color={status.color}>{status.name}</StatusBadge>
      </Option>
    ))}
  </Select>
)
```

### Pattern: Status Change with Validation

```typescript
async function handleStatusChange(toStatus: string, notes: string) {
  // 1. Validate
  const validation = await POStatusService.validateTransition(poId, toStatus, orgId)

  if (!validation.valid) {
    toast.error(validation.reason)
    return
  }

  if (validation.warnings) {
    if (!confirm(`Warnings: ${validation.warnings.join(', ')}. Continue?`)) {
      return
    }
  }

  // 2. Execute
  const result = await POStatusService.transitionStatus(
    poId,
    toStatus,
    currentUser.id,
    orgId,
    notes
  )

  if (!result.success) {
    toast.error(result.error)
    return
  }

  // 3. Refresh
  toast.success('Status updated')
  router.refresh()
}
```

### Pattern: Status Timeline

```typescript
const history = await POStatusService.getStatusHistory(poId, orgId)

return (
  <Timeline>
    {history.map(entry => (
      <TimelineItem key={entry.id}>
        <div>
          {entry.from_status && <StatusBadge>{entry.from_status}</StatusBadge>}
          {entry.from_status && <ArrowRight />}
          <StatusBadge>{entry.to_status}</StatusBadge>
        </div>
        <div>
          {formatDate(entry.changed_at)} by {entry.user?.first_name || 'System'}
        </div>
        {entry.notes && <div>{entry.notes}</div>}
      </TimelineItem>
    ))}
  </Timeline>
)
```

---

## Performance Tips

1. **Batch Operations:** Reorder statuses updates multiple rows, but service handles it efficiently
2. **Cache Statuses:** Status list rarely changes, consider caching in component state
3. **Lazy Load History:** Only fetch history when timeline is expanded
4. **Optimize Queries:** Service uses indexed columns for all queries

---

## Related Documentation

- [API Documentation](../api/po-status-lifecycle.md)
- [Database Schema](./po-status-database.md)
- [Validation Schemas](../../apps/frontend/lib/validation/po-status-schemas.ts)
- [Admin Configuration Guide](./po-status-admin-guide.md)
