# Purchase Order Approval Workflow - API Documentation

**Story**: 03.5b - PO Approval Workflow
**Version**: 1.0
**Last Updated**: 2026-01-02

## Overview

The PO Approval Workflow API provides endpoints for submitting purchase orders for approval, approving/rejecting them, and tracking approval history. The workflow integrates with configurable approval settings (Story 03.5a) to enforce financial controls and authorization requirements.

## Architecture

### Workflow State Machine

```
draft
  ├─> pending_approval (if approval required)
  │     ├─> approved
  │     │     └─> confirmed
  │     └─> rejected
  │           └─> draft (for re-editing)
  └─> submitted (if approval NOT required)
        └─> confirmed
```

### Approval Logic

**Approval Required When**:
- `po_require_approval = true` AND
- (`po_approval_threshold = null` OR `total >= po_approval_threshold`)

**Direct Submission When**:
- `po_require_approval = false` OR
- (`po_require_approval = true` AND `total < po_approval_threshold`)

## API Endpoints

### 1. Submit Purchase Order

Submit a purchase order for approval or direct submission based on configured settings.

**Endpoint**: `POST /api/planning/purchase-orders/:id/submit`

**Authentication**: Required (Bearer token)

**Authorization**:
- User must have permission to submit POs
- Enforced via `checkPOPermission(user, 'submit')`

#### Request

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Purchase Order ID |

**Request Body**: Empty

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "po_number": "PO-2024-00123",
    "status": "pending_approval",
    "approval_required": true,
    "approval_status": "pending",
    "notification_sent": true,
    "notification_count": 5
  },
  "message": "Purchase order submitted for approval"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | New PO status (`pending_approval` or `submitted`) |
| `approval_required` | boolean | Whether approval was required |
| `approval_status` | string\|null | Approval status (`pending` or null) |
| `notification_sent` | boolean | Whether notifications were sent |
| `notification_count` | number | Number of approvers notified |

#### Error Responses

**400 Bad Request** - PO Not in Draft Status:
```json
{
  "error": "Cannot submit: PO must be in draft status",
  "code": "PO_NOT_DRAFT"
}
```

**400 Bad Request** - No Line Items:
```json
{
  "error": "Cannot submit PO: Purchase order must have at least one line item",
  "code": "PO_NO_LINES"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "error": "Forbidden: planner or purchaser role required"
}
```

**404 Not Found**:
```json
{
  "error": "Purchase order not found",
  "code": "PO_NOT_FOUND"
}
```

#### Example Usage

```bash
# Submit PO for approval
curl -X POST https://api.monopilot.com/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Business Rules

1. **BR-01**: PO must be in `draft` status
2. **BR-02**: PO must have at least one line item
3. **BR-03**: If total >= threshold (or threshold is null), status changes to `pending_approval`
4. **BR-04**: If total < threshold (or approval disabled), status changes to `submitted`
5. **BR-05**: Approval history record created with action `submitted`
6. **BR-06**: Email notifications sent to all users with approval roles (async)

---

### 2. Approve Purchase Order

Approve a purchase order that is pending approval.

**Endpoint**: `POST /api/planning/purchase-orders/:id/approve`

**Authentication**: Required (Bearer token)

**Authorization**:
- User must have approval permission
- User role must be in `po_approval_roles` setting
- Enforced via `canUserApprove(userId, orgId, userRole)`

#### Request

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Purchase Order ID |

**Request Body**:
```json
{
  "notes": "Budget approved by finance committee. Proceed with order."
}
```

**Body Fields**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `notes` | string | No | Max 1000 chars | Optional approval notes |

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "po_number": "PO-2024-00123",
    "status": "approved",
    "approval_status": "approved",
    "approved_by": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "John Smith"
    },
    "approved_at": "2024-01-15T14:32:00Z",
    "approval_notes": "Budget approved by finance committee. Proceed with order.",
    "notification_sent": true,
    "notification_recipient": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Jane Doe",
      "email": "jane.doe@example.com"
    }
  },
  "message": "Purchase order approved successfully"
}
```

#### Error Responses

**400 Bad Request** - PO Not Pending Approval:
```json
{
  "error": "Cannot approve: PO must be in pending approval status",
  "code": "PO_NOT_PENDING_APPROVAL"
}
```

**400 Bad Request** - Notes Too Long:
```json
{
  "error": "Notes cannot exceed 1000 characters"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - Not an Approver:
```json
{
  "error": "Access denied: You do not have permission to approve purchase orders",
  "code": "NOT_APPROVER"
}
```

**404 Not Found**:
```json
{
  "error": "Purchase order not found",
  "code": "PO_NOT_FOUND"
}
```

**409 Conflict** - Already Approved:
```json
{
  "error": "This PO has already been approved by John Smith",
  "code": "PO_ALREADY_PROCESSED"
}
```

#### Example Usage

```bash
# Approve PO with notes
curl -X POST https://api.monopilot.com/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Budget approved by finance committee. Proceed with order."
  }'
```

#### Business Rules

1. **BR-01**: User must have approval permission (role in `po_approval_roles`)
2. **BR-02**: PO must be in `pending_approval` status
3. **BR-03**: Status changes to `approved`, approval_status set to `approved`
4. **BR-04**: `approved_by`, `approved_at`, and `approval_notes` fields populated
5. **BR-05**: Approval history record created with action `approved`
6. **BR-06**: Email notification sent to PO creator (async)
7. **BR-07**: Concurrent approval detection prevents double-approval

---

### 3. Reject Purchase Order

Reject a purchase order that is pending approval.

**Endpoint**: `POST /api/planning/purchase-orders/:id/reject`

**Authentication**: Required (Bearer token)

**Authorization**:
- User must have approval permission
- User role must be in `po_approval_roles` setting
- Enforced via `canUserApprove(userId, orgId, userRole)`

#### Request

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Purchase Order ID |

**Request Body**:
```json
{
  "rejection_reason": "Exceeds quarterly budget. Please reduce quantity or defer to Q2."
}
```

**Body Fields**:
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `rejection_reason` | string | **Yes** | Min 10 chars, Max 1000 chars | Reason for rejection |

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "po_number": "PO-2024-00123",
    "status": "rejected",
    "approval_status": "rejected",
    "rejected_by": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "John Smith"
    },
    "rejected_at": "2024-01-15T14:35:00Z",
    "rejection_reason": "Exceeds quarterly budget. Please reduce quantity or defer to Q2.",
    "notification_sent": true,
    "notification_recipient": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "Jane Doe",
      "email": "jane.doe@example.com"
    }
  },
  "message": "Purchase order rejected"
}
```

#### Error Responses

**400 Bad Request** - Missing Rejection Reason:
```json
{
  "error": "Rejection reason is required",
  "code": "REJECTION_REASON_REQUIRED"
}
```

**400 Bad Request** - Rejection Reason Too Short:
```json
{
  "error": "Rejection reason must be at least 10 characters",
  "code": "REJECTION_REASON_TOO_SHORT"
}
```

**400 Bad Request** - Rejection Reason Too Long:
```json
{
  "error": "Rejection reason must not exceed 1000 characters"
}
```

**400 Bad Request** - PO Not Pending Approval:
```json
{
  "error": "Cannot reject: PO must be in pending approval status",
  "code": "PO_NOT_PENDING_APPROVAL"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden** - Not an Approver:
```json
{
  "error": "Access denied: You do not have permission to reject purchase orders",
  "code": "NOT_APPROVER"
}
```

**404 Not Found**:
```json
{
  "error": "Purchase order not found",
  "code": "PO_NOT_FOUND"
}
```

#### Example Usage

```bash
# Reject PO with reason
curl -X POST https://api.monopilot.com/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "Exceeds quarterly budget. Please reduce quantity or defer to Q2."
  }'
```

#### Business Rules

1. **BR-01**: User must have approval permission (role in `po_approval_roles`)
2. **BR-02**: PO must be in `pending_approval` status
3. **BR-03**: Rejection reason is required (min 10 characters)
4. **BR-04**: Status changes to `rejected`, approval_status set to `rejected`
5. **BR-05**: `approved_by` (rejecter), `approved_at`, `rejection_reason`, and `approval_notes` fields populated
6. **BR-06**: Approval history record created with action `rejected`
7. **BR-07**: Email notification sent to PO creator (async)
8. **BR-08**: PO can be edited and resubmitted from rejected status

---

### 4. Get Approval History

Retrieve the approval history for a purchase order.

**Endpoint**: `GET /api/planning/purchase-orders/:id/approval-history`

**Authentication**: Required (Bearer token)

**Authorization**: User must belong to the same organization as the PO

#### Request

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Purchase Order ID |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `limit` | integer | No | 10 | Items per page (max 50) |

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "po_id": "550e8400-e29b-41d4-a716-446655440000",
        "action": "approved",
        "user_id": "660e8400-e29b-41d4-a716-446655440001",
        "user_name": "John Smith",
        "user_role": "manager",
        "notes": "Budget approved by finance committee.",
        "created_at": "2024-01-15T14:32:00Z"
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "po_id": "550e8400-e29b-41d4-a716-446655440000",
        "action": "rejected",
        "user_id": "660e8400-e29b-41d4-a716-446655440001",
        "user_name": "John Smith",
        "user_role": "manager",
        "notes": "Exceeds budget. Reduce quantity.",
        "created_at": "2024-01-14T10:15:00Z"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "po_id": "550e8400-e29b-41d4-a716-446655440000",
        "action": "submitted",
        "user_id": "770e8400-e29b-41d4-a716-446655440002",
        "user_name": "Jane Doe",
        "user_role": "planner",
        "notes": null,
        "created_at": "2024-01-14T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "total_pages": 1
    }
  }
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `history` | array | Array of approval history entries |
| `history[].action` | string | Action type: `submitted`, `approved`, or `rejected` |
| `history[].user_name` | string | Denormalized user name (historical accuracy) |
| `history[].user_role` | string | Denormalized user role (historical accuracy) |
| `history[].notes` | string\|null | Approval/rejection notes |
| `history[].created_at` | timestamp | When the action occurred |
| `pagination.total` | number | Total number of history entries |
| `pagination.total_pages` | number | Total number of pages |

#### Error Responses

**401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**404 Not Found**:
```json
{
  "error": "Purchase order not found",
  "code": "PO_NOT_FOUND"
}
```

#### Example Usage

```bash
# Get approval history (first page)
curl -X GET https://api.monopilot.com/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/approval-history \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get approval history (page 2, 20 items per page)
curl -X GET 'https://api.monopilot.com/api/planning/purchase-orders/550e8400-e29b-41d4-a716-446655440000/approval-history?page=2&limit=20' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Business Rules

1. **BR-01**: History entries ordered by `created_at` DESC (newest first)
2. **BR-02**: Pagination enforced (max 50 items per page)
3. **BR-03**: User names and roles denormalized for historical accuracy
4. **BR-04**: History persists even if PO is later deleted (via cascade rules)
5. **BR-05**: Empty array returned if no history exists (not an error)

---

## Database Schema

### Table: `po_approval_history`

Tracks all approval-related actions for purchase orders.

```sql
CREATE TABLE po_approval_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID NOT NULL REFERENCES organizations(id),
  po_id             UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  action            TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected')),
  user_id           UUID NOT NULL REFERENCES users(id),
  user_name         TEXT NOT NULL,  -- Denormalized for historical accuracy
  user_role         TEXT NOT NULL,  -- Denormalized for historical accuracy
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, id)
);

CREATE INDEX idx_po_approval_history_po ON po_approval_history(po_id);
CREATE INDEX idx_po_approval_history_created ON po_approval_history(created_at DESC);
```

**RLS Policy**:
```sql
CREATE POLICY "PO approval history org isolation"
ON po_approval_history FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Extended Fields: `purchase_orders`

The following fields in the `purchase_orders` table support the approval workflow:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `approval_status` | TEXT | Yes | Current approval status: `pending`, `approved`, `rejected`, or null |
| `approved_by` | UUID | Yes | User ID who approved/rejected the PO |
| `approved_at` | TIMESTAMPTZ | Yes | Timestamp of approval/rejection |
| `approval_notes` | TEXT | Yes | Notes from approver |
| `rejection_reason` | TEXT | Yes | Reason for rejection (required if rejected) |

---

## Validation Schemas (Zod)

### Approve PO Schema

```typescript
export const approvePoSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export type ApprovePoInput = z.infer<typeof approvePoSchema>;
```

### Reject PO Schema

```typescript
export const rejectPoSchema = z.object({
  rejection_reason: z
    .string({ required_error: 'Rejection reason is required' })
    .min(1, 'Rejection reason is required')
    .refine((val) => val.length >= 10, {
      message: 'Rejection reason must be at least 10 characters',
    })
    .refine((val) => val.length <= 1000, {
      message: 'Rejection reason must not exceed 1000 characters',
    }),
});

export type RejectPoInput = z.infer<typeof rejectPoSchema>;
```

### Submit PO Schema

```typescript
export const submitPoSchema = z.object({
  // No body needed - action is idempotent
});
```

---

## Performance Considerations

### Response Time Targets

| Endpoint | P95 Target | Notes |
|----------|-----------|-------|
| `/submit` | <300ms | Notification queuing async |
| `/approve` | <500ms | Notification queuing async |
| `/reject` | <500ms | Notification queuing async |
| `/approval-history` | <200ms | With pagination |

### Optimization Strategies

1. **Async Notifications**: Email notifications queued in background, don't block API response
2. **Denormalized Data**: User names/roles stored in history for fast reads
3. **Indexed Queries**: Indexes on `po_id` and `created_at` for fast history retrieval
4. **Pagination**: Max 50 items per page prevents large result sets
5. **RLS Optimization**: Single-table RLS policies for fast org isolation

---

## Error Handling

### Error Code Reference

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|-----------|
| `PO_NOT_FOUND` | 404 | PO doesn't exist or belongs to different org | Verify PO ID and org context |
| `PO_NOT_DRAFT` | 400 | PO not in draft status | Only draft POs can be submitted |
| `PO_NO_LINES` | 400 | PO has no line items | Add at least one line before submitting |
| `PO_NOT_PENDING_APPROVAL` | 400 | PO not in pending approval status | Only pending POs can be approved/rejected |
| `NOT_APPROVER` | 403 | User lacks approval permission | User role must be in `po_approval_roles` |
| `REJECTION_REASON_REQUIRED` | 400 | Rejection reason missing | Provide a reason (min 10 chars) |
| `REJECTION_REASON_TOO_SHORT` | 400 | Rejection reason < 10 chars | Provide a meaningful explanation |
| `PO_ALREADY_PROCESSED` | 409 | PO already approved/rejected | Concurrent approval detected |

### Common Error Scenarios

**Scenario 1**: User tries to submit PO in wrong status
```json
{
  "error": "Cannot submit: PO must be in draft status",
  "code": "PO_NOT_DRAFT"
}
```
**Solution**: Check PO status before submitting.

**Scenario 2**: Non-approver tries to approve
```json
{
  "error": "Access denied: You do not have permission to approve purchase orders",
  "code": "NOT_APPROVER"
}
```
**Solution**: Ensure user role is in `po_approval_roles` setting.

**Scenario 3**: Concurrent approval attempt
```json
{
  "error": "This PO has already been approved by John Smith",
  "code": "PO_ALREADY_PROCESSED"
}
```
**Solution**: Refresh PO status before attempting approval.

---

## Testing

### Test Coverage

- **Unit Tests**: 27 tests covering workflow logic, permission checks, validation
- **Integration Tests**: 12 tests covering API endpoints end-to-end
- **E2E Tests**: 5 scenarios covering full approval workflow

### Example Test Scenarios

```typescript
// Unit test: Submit with approval required
it('should submit to pending_approval if total >= threshold', async () => {
  const result = await submitPO(poId, orgId, userId);
  expect(result.status).toBe('pending_approval');
  expect(result.approvalRequired).toBe(true);
});

// Integration test: Approve PO
it('should approve PO successfully with notes', async () => {
  const response = await POST('/api/planning/purchase-orders/:id/approve', {
    notes: 'Approved by finance',
  });
  expect(response.status).toBe(200);
  expect(response.data.approval_status).toBe('approved');
});

// E2E test: Full workflow
test('Full approval workflow: submit → approve → confirm', async ({ page }) => {
  // Submit PO for approval
  await page.click('[data-testid="submit-po"]');
  await expect(page.locator('.status-badge')).toHaveText('Pending Approval');

  // Approve as manager
  await loginAs('manager');
  await page.click('[data-testid="approve-po"]');
  await expect(page.locator('.status-badge')).toHaveText('Approved');
});
```

---

## Security

### Authentication & Authorization

1. **Authentication**: All endpoints require valid Bearer token
2. **Organization Isolation**: RLS policies enforce org_id filtering
3. **Role-Based Access**: Approval actions restricted to configured roles
4. **Permission Checks**: Centralized permission validation via `checkPOPermission`

### Data Protection

1. **User Data Denormalization**: User names/roles frozen in history for audit trail
2. **Immutable History**: Approval history records are append-only
3. **Concurrent Approval Detection**: Prevents double-approval race conditions
4. **Input Validation**: All inputs validated via Zod schemas

---

## Migration

### Migration: `082_create_po_approval_history.sql`

```sql
-- Create approval history table
CREATE TABLE po_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected')),
  user_id UUID NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, id)
);

-- Indexes
CREATE INDEX idx_po_approval_history_po ON po_approval_history(po_id);
CREATE INDEX idx_po_approval_history_created ON po_approval_history(created_at DESC);

-- RLS
ALTER TABLE po_approval_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PO approval history org isolation"
ON po_approval_history FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

---

## Related Documentation

- [PO Approval Settings API](./po-approval-settings.md) - Configure approval workflow
- [Purchase Order CRUD API](./purchase-orders.md) - Main PO operations
- [PO Status Lifecycle](../../architecture/planning/po-status-lifecycle.md) - Complete status flow
- [Component Documentation](../components/planning/po-approval-workflow.md) - UI components

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial API documentation for Story 03.5b |
