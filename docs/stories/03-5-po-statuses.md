# Story 3.5: Configurable PO Statuses

**Epic:** 3 - Planning Operations (Batch 3A)
**Story ID:** 3.5
**Priority:** P1
**Effort:** 5 points
**Status:** Ready for Development

---

## User Story

**As an** Admin,
**I want to** configure PO status workflow,
**So that** it matches our procurement process.

---

## Acceptance Criteria

### AC-5.1: Settings Page - PO Statuses

**Given** Admin navigates to `/settings/planning`
**Then** see "PO Statuses" section with:
- Table of current statuses with columns:
  - Code
  - Label
  - Color (badge preview)
  - Default (checkbox, only one can be default)
  - Sequence (drag-drop to reorder)
  - Actions (Edit, Delete icons)

**Default Statuses** (preloaded on org creation):
```typescript
[
  { code: 'draft', label: 'Draft', color: 'gray', is_default: true, sequence: 1 },
  { code: 'submitted', label: 'Submitted', color: 'blue', is_default: false, sequence: 2 },
  { code: 'confirmed', label: 'Confirmed', color: 'green', is_default: false, sequence: 3 },
  { code: 'receiving', label: 'Receiving', color: 'yellow', is_default: false, sequence: 4 },
  { code: 'closed', label: 'Closed', color: 'purple', is_default: false, sequence: 5 },
]
```

**And** "Add Status" button at bottom

### AC-5.2: Add Custom Status

**When** clicking "Add Status" button
**Then** modal opens with fields:
- `code`: Text input (lowercase, no spaces, e.g., "approved")
- `label`: Text input (display name, e.g., "Approved")
- `color`: Dropdown (gray, blue, green, yellow, red, purple, orange)
- `is_default`: Checkbox (unsets previous default if checked)
- `sequence`: Number (auto-incremented to last + 1, editable)

**When** saving
**Then** status added to list
**And** saved to `planning_settings.po_statuses` JSONB array
**And** success toast: "Status added"

### AC-5.3: Edit Status

**When** clicking Edit icon on status
**Then** edit modal opens (same fields as Add)

**Can Edit:**
- `label` (display name)
- `color`
- `is_default` (if checked, unsets previous default)
- `sequence`

**Cannot Edit:**
- `code` (immutable, used in business logic)

**When** saving
**Then** status updated
**And** POs using this status see updated label/color

### AC-5.4: Delete Status

**When** clicking Delete icon on status
**Then** check if any POs exist with this status

**If** POs exist → show error: "Cannot delete status: {X} POs are using it. Change their status first."

**If** no POs exist → show confirmation: "Delete status '{label}'?"

**When** confirmed
**Then** status removed from list
**And** saved to `planning_settings.po_statuses`

### AC-5.5: Reorder Statuses

**When** dragging status row
**Then** can reorder statuses (drag-drop)

**When** dropping
**Then** `sequence` updated dla all affected statuses
**And** order saved to `planning_settings.po_statuses`

**And** PO status dropdowns show statuses in new order

### AC-5.6: Default Status Logic

**Only one status can be `is_default = true`**

**When** setting new default
**Then** previous default unset automatically

**And** default status used when creating new POs (Story 3.1)

### AC-5.7: Status Lifecycle in PO Detail

**Given** PO exists
**When** viewing PO detail page
**Then** see "Change Status" dropdown with all statuses (ordered by sequence)

**When** selecting new status
**Then** API call: `PUT /api/planning/purchase-orders/:id/status`
**And** PO status updated
**And** Audit log entry created: "Status changed from {old} to {new} by {user}"
**And** Success toast: "Status updated"

**Validation:**
- Cannot change status if PO is `closed`
- Cannot change status if approval is pending (Story 3.4)

### AC-5.8: Status Badge Display

**In PO list and detail views:**
- Status shown as **badge** with configured color
- Label text from `label` field
- Color from `color` field

**Example:**
- Draft → Gray badge "Draft"
- Submitted → Blue badge "Submitted"
- Confirmed → Green badge "Confirmed"

---

## Technical Implementation

### Database Schema

```sql
-- planning_settings table (partial)
CREATE TABLE planning_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- PO Statuses (JSONB array)
  po_statuses JSONB NOT NULL DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "submitted", "label": "Submitted", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "confirmed", "label": "Confirmed", "color": "green", "is_default": false, "sequence": 3},
    {"code": "receiving", "label": "Receiving", "color": "yellow", "is_default": false, "sequence": 4},
    {"code": "closed", "label": "Closed", "color": "purple", "is_default": false, "sequence": 5}
  ]'::jsonb,

  po_default_status VARCHAR(50) DEFAULT 'draft',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one row per org
CREATE UNIQUE INDEX idx_planning_settings_org ON planning_settings(org_id);

-- RLS Policy
ALTER TABLE planning_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_settings_isolation ON planning_settings
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### API Routes

```typescript
// apps/frontend/app/api/planning/settings/route.ts

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const { data: user } = await supabase.auth.getUser()
  const org_id = user.user.user_metadata.org_id

  const { data, error } = await supabase
    .from('planning_settings')
    .select('*')
    .eq('org_id', org_id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { po_statuses, po_default_status } = body

  // Validate: Exactly one default
  const defaults = po_statuses.filter((s: any) => s.is_default)
  if (defaults.length !== 1) {
    return NextResponse.json({ error: 'Exactly one default status required' }, { status: 400 })
  }

  const { data: user } = await supabase.auth.getUser()
  const org_id = user.user.user_metadata.org_id

  const { data, error } = await supabase
    .from('planning_settings')
    .update({
      po_statuses,
      po_default_status: po_default_status || defaults[0].code,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', org_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

```typescript
// apps/frontend/app/api/planning/purchase-orders/[id]/status/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseAdminClient()
  const body = await request.json()
  const { status } = body

  // Validate: Check if status exists in planning_settings
  const { data: settings } = await supabase
    .from('planning_settings')
    .select('po_statuses')
    .single()

  const validStatuses = settings.po_statuses.map((s: any) => s.code)
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Update PO status
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create audit log entry (future enhancement)

  return NextResponse.json(data)
}
```

---

## Testing Requirements

### Unit Tests
- Status validation (exactly one default)
- Status reorder logic

### Integration Tests
- Add status → saved to JSONB
- Edit status → label/color updated
- Delete status with POs → error
- Delete status without POs → success

### E2E Tests
- Add custom status
- Edit status → verify PO badge updates
- Reorder statuses → verify dropdown order
- Change PO status via dropdown

---

## Definition of Done

- [ ] Database migration (planning_settings table with po_statuses JSONB)
- [ ] API routes (GET/PUT /settings, PUT /status)
- [ ] Settings page (statuses table, add/edit/delete modals, drag-drop)
- [ ] PO detail page (Change Status dropdown)
- [ ] Status badge component (dynamic color)
- [ ] Validation (exactly one default, cannot delete if in use)
- [ ] E2E test (status management flow)
- [ ] Code reviewed and approved

---

## Dependencies

- Story 3.1 (PO CRUD) - requires PO base
- Epic 1 (Settings) - requires planning_settings pattern

---

## Notes

- Statuses stored as **JSONB array** dla flexibility
- **Code is immutable** (used in business logic, cannot change)
- **Default status** used when creating new POs
- **Drag-drop reordering** dla better UX
- Cannot delete status if **POs exist** with that status
