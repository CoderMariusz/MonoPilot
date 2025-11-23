# Story 3.4: PO Approval Workflow

**Epic:** 3 - Planning Operations (Batch 3A)
**Story ID:** 3.4
**Priority:** P1
**Effort:** 5 points
**Status:** Ready for Development

---

## User Story

**As a** Manager,
**I want to** approve POs before sending to suppliers,
**So that** we have control over spending.

---

## Acceptance Criteria

### AC-4.1: Enable Approval in Settings

**Given** Admin navigates to `/settings/planning`
**Then** see "PO Approval" section with:
- `po_require_approval`: Toggle (default false)
- `po_approval_threshold`: Number input (optional, e.g., 10000)
  - If set, only POs with `total > threshold` require approval
  - If not set, all POs require approval (if toggle is on)

**When** enabling approval
**Then** show confirmation: "All new POs will require Manager/Admin approval"

### AC-4.2: Automatic Pending Approval

**Given** approval is enabled
**When** PO is created with `total > threshold`
**Then** `approval_status = 'pending'`
**And** PO shown in "Pending Approval" list
**And** status badge shows "⏳ Pending Approval" (yellow)

**If** `total <= threshold` (or no threshold set and approval disabled)
**Then** `approval_status = null` (no approval needed)

### AC-4.3: Pending Approval List

**Given** Manager/Admin navigates to `/planning/purchase-orders`
**Then** see filter: "Pending Approval"
**When** selecting filter
**Then** show only POs where `approval_status = 'pending'`

**Table columns:**
- PO Number
- Supplier
- Total (with currency)
- Created By
- Created Date
- Actions (Approve/Reject buttons)

### AC-4.4: Approve PO

**Given** Manager/Admin viewing pending PO
**When** clicking "Approve" button
**Then** show confirmation modal:
- PO summary (number, supplier, total)
- Optional comment field
- "Confirm Approval" button

**When** confirming
**Then** API call: `PUT /api/planning/purchase-orders/:id/approve`
**And** `approval_status = 'approved'`
**And** `approved_by` = current user ID
**And** `approved_at` = current timestamp
**And** Audit record created in `po_approvals` table
**And** Success toast: "PO approved successfully"
**And** PO removed from Pending Approval list

**And** PO can now proceed (status → Submitted)

### AC-4.5: Reject PO

**Given** Manager/Admin viewing pending PO
**When** clicking "Reject" button
**Then** show rejection modal:
- PO summary
- **Rejection reason** field (required, max 500 chars)
- Optional comment field
- "Confirm Rejection" button

**When** confirming with reason
**Then** API call: `PUT /api/planning/purchase-orders/:id/reject`
**And** `approval_status = 'rejected'`
**And** `rejection_reason` = user input
**And** Audit record created in `po_approvals` table
**And** PO status back to 'Draft'
**And** Success toast: "PO rejected"

**And** Purchasing user notified (future: email notification)

### AC-4.6: Approval History Audit Trail

**Given** PO has been approved or rejected
**When** viewing PO detail page
**Then** see "Approval" tab with history table:
- Timestamp
- Action (Approved/Rejected)
- User (approved_by)
- Reason (if rejected)
- Comments

**And** full audit trail preserved in `po_approvals` table

### AC-4.7: Permission Enforcement

**Only** Manager and Admin roles can approve/reject POs

**When** Purchasing user (non-manager) tries to approve
**Then** API returns 403: "Insufficient permissions. Only Manager/Admin can approve POs"
**And** Approve/Reject buttons hidden in UI dla non-managers

### AC-4.8: Approval Status Badge

**In PO list and detail views:**
- `null` → No badge (no approval needed)
- `pending` → Yellow badge "⏳ Pending Approval"
- `approved` → Green badge "✅ Approved by {Name}"
- `rejected` → Red badge "❌ Rejected by {Name}"

---

## Technical Implementation

### Database Schema Updates

```sql
-- Add approval fields to purchase_orders table
ALTER TABLE purchase_orders
ADD COLUMN approval_status VARCHAR(20), -- null, 'pending', 'approved', 'rejected'
ADD COLUMN approved_by UUID REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Create po_approvals audit table
CREATE TABLE po_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rejection_reason TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_po_approvals_po ON po_approvals(po_id);
CREATE INDEX idx_po_approvals_status ON po_approvals(approval_status);
```

### API Routes

```typescript
// apps/frontend/app/api/planning/purchase-orders/[id]/approve/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { action, rejection_reason, comments } = body // action: 'approve' | 'reject'

  // Check user role
  const { data: user } = await supabase.auth.getUser()
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.user.id)
    .single()

  if (!['manager', 'admin'].includes(userRecord.role.toLowerCase())) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Check PO approval_status
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('approval_status')
    .eq('id', params.id)
    .single()

  if (po.approval_status !== 'pending') {
    return NextResponse.json({ error: 'PO is not pending approval' }, { status: 400 })
  }

  // Approve or Reject
  if (action === 'approve') {
    await supabase
      .from('purchase_orders')
      .update({
        approval_status: 'approved',
        approved_by: user.user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    // Create audit record
    await supabase.from('po_approvals').insert({
      org_id: user.user.user_metadata.org_id,
      po_id: params.id,
      status: 'approved',
      approved_by: user.user.id,
      comments,
    })

    return NextResponse.json({ success: true, message: 'PO approved' })
  }

  if (action === 'reject') {
    if (!rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
    }

    await supabase
      .from('purchase_orders')
      .update({
        approval_status: 'rejected',
        rejection_reason,
        status: 'draft', // Back to draft
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    // Create audit record
    await supabase.from('po_approvals').insert({
      org_id: user.user.user_metadata.org_id,
      po_id: params.id,
      status: 'rejected',
      approved_by: user.user.id,
      rejection_reason,
      comments,
    })

    return NextResponse.json({ success: true, message: 'PO rejected' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
```

---

## Testing Requirements

### Unit Tests
- Approval threshold logic
- Role permission check

### Integration Tests
- Approve PO → status updated, audit record created
- Reject PO → status back to draft, reason saved
- Non-manager tries to approve → 403 error

### E2E Tests
- Enable approval in settings
- Create PO >threshold → pending approval
- Manager approves → PO approved
- Manager rejects → PO back to draft

---

## Definition of Done

- [ ] Database schema updated (approval fields, po_approvals table)
- [ ] API route (PUT /approve)
- [ ] Settings page (approval toggle, threshold)
- [ ] Frontend components (Approve/Reject modals, Pending Approval list)
- [ ] Permission enforcement (Manager/Admin only)
- [ ] Audit trail (po_approvals table)
- [ ] E2E test (approval workflow)
- [ ] Code reviewed and approved

---

## Dependencies

- Story 3.1 (PO CRUD) - requires PO base
- Epic 1 (Users) - requires role check

---

## Notes

- Approval is **optional** (disabled by default)
- Threshold is **configurable** (admin sets in settings)
- Only **Manager/Admin** can approve/reject
- Full **audit trail** preserved in `po_approvals` table
