# PLAN-008: Purchase Order Approval Modal

**Module**: Planning
**Feature**: PO Approval Workflow (FR-PLAN-009)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Approve Mode - Desktop

```
+------------------------------------------------------------------+
|                     Approve Purchase Order                   [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |  PO-2024-00156                          Status: [Submitted]  | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +---------- PO SUMMARY ------------------------------------------+ |
|  |                                                                | |
|  |  Supplier:           Mill Co. (SUP-001)                       | |
|  |  Warehouse:          Main Warehouse                           | |
|  |  Expected Delivery:  Dec 20, 2024 (in 6 days)                 | |
|  |  Requestor:          John Smith                               | |
|  |  Submitted:          Dec 10, 2024 at 4:25 PM                  | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- LINES SUMMARY ---------------------------------------+ |
|  |                                                                | |
|  |  3 Line Items                                                 | |
|  |                                                                | |
|  |  | Product            | Qty      | Unit Price | Subtotal     | |
|  |  |--------------------|----------|------------|--------------|  |
|  |  | Flour Type A       | 500 kg   | $1.20      | $600.00      | |
|  |  | Sugar White        | 200 kg   | $0.85      | $170.00      | |
|  |  | Salt Industrial    | 100 kg   | $0.30      | $30.00       | |
|  |                                                                | |
|  |  [View Full PO Details]                                       | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- TOTALS ----------------------------------------------+ |
|  |                                                                | |
|  |                              Subtotal:        $800.00   PLN   | |
|  |                              Tax (23%):       $184.00   PLN   | |
|  |                              -----------------------------    | |
|  |                              Total:           $984.00   PLN   | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- APPROVAL THRESHOLD ----------------------------------+ |
|  |                                                                | |
|  |  [!] Approval Required: PO total ($984.00) is below the       | |
|  |      approval threshold ($1,000.00).                          | |
|  |                                                                | |
|  |      Note: This PO was manually submitted for approval.       | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- APPROVAL NOTES --------------------------------------+ |
|  |                                                                | |
|  |  Approval Notes (optional)                                    | |
|  |  +----------------------------------------------------------+ | |
|  |  | Approved for Q4 stock replenishment. Good pricing from   | | |
|  |  | Mill Co.                                                  | | |
|  |  +----------------------------------------------------------+ | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +----------------------------------------------------------------+ |
|  |                                                                | |
|  |              [Cancel]            [Approve PO]                 | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Reject Mode - Desktop

```
+------------------------------------------------------------------+
|                      Reject Purchase Order                   [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |  PO-2024-00157                    Status: [Pending Approval] | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +---------- PO SUMMARY ------------------------------------------+ |
|  |                                                                | |
|  |  Supplier:           Sugar Inc. (SUP-002)                     | |
|  |  Warehouse:          Secondary Warehouse                      | |
|  |  Expected Delivery:  Dec 18, 2024 (in 4 days)                 | |
|  |  Requestor:          Jane Doe                                 | |
|  |  Submitted:          Dec 12, 2024 at 2:30 PM                  | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- LINES SUMMARY ---------------------------------------+ |
|  |                                                                | |
|  |  2 Line Items                                                 | |
|  |                                                                | |
|  |  | Product            | Qty      | Unit Price | Subtotal     | |
|  |  |--------------------|----------|------------|--------------|  |
|  |  | Sugar White        | 1000 kg  | $0.85      | $850.00      | |
|  |  | Sugar Brown        | 500 kg   | $0.90      | $450.00      | |
|  |                                                                | |
|  |  [View Full PO Details]                                       | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- TOTALS ----------------------------------------------+ |
|  |                                                                | |
|  |                              Subtotal:      $1,300.00   EUR   | |
|  |                              Tax (23%):       $299.00   EUR   | |
|  |                              -----------------------------    | |
|  |                              Total:         $1,599.00   EUR   | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- APPROVAL THRESHOLD ----------------------------------+ |
|  |                                                                | |
|  |  [!] Approval Required: PO total ($1,599.00) exceeds the      | |
|  |      approval threshold ($1,000.00).                          | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- REJECTION REASON ------------------------------------+ |
|  |                                                                | |
|  |  Rejection Reason *                                           | |
|  |  +----------------------------------------------------------+ | |
|  |  | Quantity too high for current inventory capacity.        | | |
|  |  | Please reduce to 500kg Sugar White and 250kg Brown.      | | |
|  |  +----------------------------------------------------------+ | |
|  |  [!] Reason is required to reject                             | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +----------------------------------------------------------------+ |
|  |                                                                | |
|  |              [Cancel]              [Reject PO]                | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### Mobile View - Approve Mode (<768px)

```
+----------------------------------+
|       Approve PO            [X]  |
+----------------------------------+
|                                  |
|  PO-2024-00156                   |
|  Status: [Submitted]             |
|                                  |
|  +----------------------------+  |
|  | Supplier                   |  |
|  | Mill Co. (SUP-001)         |  |
|  +----------------------------+  |
|  | Expected Delivery          |  |
|  | Dec 20, 2024 (6 days)      |  |
|  +----------------------------+  |
|  | Requestor                  |  |
|  | John Smith                 |  |
|  +----------------------------+  |
|  | Submitted                  |  |
|  | Dec 10, 2024 4:25 PM       |  |
|  +----------------------------+  |
|                                  |
|  Lines (3 items)                 |
|  +----------------------------+  |
|  | Flour Type A               |  |
|  | 500 kg x $1.20 = $600.00   |  |
|  +----------------------------+  |
|  | Sugar White                |  |
|  | 200 kg x $0.85 = $170.00   |  |
|  +----------------------------+  |
|  | Salt Industrial            |  |
|  | 100 kg x $0.30 = $30.00    |  |
|  +----------------------------+  |
|                                  |
|  [View Full PO]                  |
|                                  |
|  +----------------------------+  |
|  | Subtotal:      $800.00     |  |
|  | Tax:           $184.00     |  |
|  | Total:         $984.00 PLN |  |
|  +----------------------------+  |
|                                  |
|  [!] Below threshold ($1,000)    |
|                                  |
|  Approval Notes (optional)       |
|  +----------------------------+  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [Cancel]     [Approve PO]  |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+------------------------------------------------------------------+
|                     Approve Purchase Order                   [X]  |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |  [===========================================]               | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +---------- PO SUMMARY ------------------------------------------+ |
|  |                                                                | |
|  |  [=====================================]                      | |
|  |  [======================]                                     | |
|  |  [================================]                           | |
|  |  [===================]                                        | |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  +---------- LINES SUMMARY ---------------------------------------+ |
|  |                                                                | |
|  |  [============================================================]| |
|  |  [============================================================]| |
|  |  [============================================================]| |
|  |                                                                | |
|  +----------------------------------------------------------------+ |
|                                                                    |
|  Loading purchase order details...                                |
|                                                                    |
+------------------------------------------------------------------+
```

### Error State

```
+------------------------------------------------------------------+
|                     Approve Purchase Order                   [X]  |
+------------------------------------------------------------------+
|                                                                    |
|                          +------------------+                      |
|                          |   [Error Icon]   |                      |
|                          +------------------+                      |
|                                                                    |
|                    Failed to Load Purchase Order                  |
|                                                                    |
|           The purchase order could not be loaded or has           |
|           already been approved/rejected by another user.         |
|                                                                    |
|                       Error: PO_APPROVAL_FAILED                   |
|                                                                    |
|                                                                    |
|                  [Retry]         [Close]                          |
|                                                                    |
+------------------------------------------------------------------+
```

### Confirmation State - After Approve

```
+------------------------------------------------------------------+
|                     Approve Purchase Order                   [X]  |
+------------------------------------------------------------------+
|                                                                    |
|                          +------------------+                      |
|                          |  [Success Icon]  |                      |
|                          +------------------+                      |
|                                                                    |
|                  Purchase Order Approved Successfully             |
|                                                                    |
|               PO-2024-00156 has been approved.                    |
|               Requestor (John Smith) has been notified.           |
|                                                                    |
|                                                                    |
|                 [View PO]         [Close]                         |
|                                                                    |
+------------------------------------------------------------------+
```

### Confirmation State - After Reject

```
+------------------------------------------------------------------+
|                      Reject Purchase Order                   [X]  |
+------------------------------------------------------------------+
|                                                                    |
|                          +------------------+                      |
|                          |  [Warning Icon]  |                      |
|                          +------------------+                      |
|                                                                    |
|                  Purchase Order Rejected                          |
|                                                                    |
|               PO-2024-00157 has been rejected.                    |
|               Requestor (Jane Doe) has been notified.             |
|                                                                    |
|               Reason: Quantity too high for current inventory     |
|                       capacity.                                   |
|                                                                    |
|                                                                    |
|                 [View PO]         [Close]                         |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Key Components

### 1. Header Section

| Field | Source | Display |
|-------|--------|---------|
| po_number | purchase_orders.po_number | "PO-2024-00156" |
| status | purchase_orders.status | Badge: [Submitted] or [Pending Approval] |

### 2. PO Summary Section

| Field | Source | Display |
|-------|--------|---------|
| supplier_name | suppliers.name | "Mill Co." |
| supplier_code | suppliers.code | "(SUP-001)" |
| warehouse_name | warehouses.name | "Main Warehouse" |
| expected_delivery_date | purchase_orders.expected_delivery_date | "Dec 20, 2024" |
| relative_date | Calculated | "(in 6 days)" |
| requestor_name | users.name via created_by | "John Smith" |
| submitted_at | Derived from status history | "Dec 10, 2024 at 4:25 PM" |

### 3. Lines Summary Table

| Column | Width | Description |
|--------|-------|-------------|
| Product | 200px | Product name |
| Qty | 80px | Quantity + UoM |
| Unit Price | 100px | Price per unit |
| Subtotal | 100px | Line total |

- Shows all lines (scrollable if > 5 lines)
- "View Full PO Details" link opens PLAN-006 in new tab/modal

### 4. Totals Section

| Field | Calculation | Display |
|-------|-------------|---------|
| Subtotal | SUM(line.quantity * line.unit_price) | "$800.00 PLN" |
| Tax | Subtotal * tax_rate | "$184.00 PLN" |
| **Total** | Subtotal + Tax | "$984.00 PLN" |

### 5. Approval Threshold Indicator

| Condition | Display | Style |
|-----------|---------|-------|
| total < threshold AND manually submitted | "Below threshold ($X). Manually submitted for approval." | Info (blue) |
| total >= threshold | "Exceeds threshold ($X). Approval required." | Warning (yellow) |
| threshold = null (all require approval) | "Approval required for all POs." | Info (blue) |

### 6. Notes/Reason Input

| Mode | Field | Required | Placeholder |
|------|-------|----------|-------------|
| Approve | Approval Notes | No | "Optional notes about this approval..." |
| Reject | Rejection Reason | Yes | "Please provide reason for rejection..." |

---

## Main Actions

### Modal Actions

| Action | Mode | Enabled When | Result |
|--------|------|--------------|--------|
| **Cancel** | Both | Always | Close modal without action |
| **Approve PO** | Approve | Always (notes optional) | Approve PO, notify requestor |
| **Reject PO** | Reject | Reason provided (required) | Reject PO, notify requestor |

### Post-Action

| Action | Description |
|--------|-------------|
| **View PO** | Navigate to PLAN-006 detail page |
| **Close** | Close modal, return to list |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Fetching PO data | Skeleton loaders |
| **Approve Ready** | PO loaded, approve mode | Full summary + optional notes |
| **Reject Ready** | PO loaded, reject mode | Full summary + required reason |
| **Submitting** | Action in progress | Disabled buttons + spinner |
| **Success - Approved** | Approval completed | Success message, next actions |
| **Success - Rejected** | Rejection completed | Warning message, next actions |
| **Error** | Action failed | Error message, retry option |

---

## API Endpoints

### Get PO for Approval

```
GET /api/planning/purchase-orders/:id?context=approval

Response:
{
  "success": true,
  "data": {
    "id": "uuid-po-156",
    "po_number": "PO-2024-00156",
    "status": "submitted",
    "approval_status": "pending",
    "supplier": {
      "id": "uuid-supplier-1",
      "code": "SUP-001",
      "name": "Mill Co."
    },
    "warehouse": {
      "id": "uuid-wh-main",
      "name": "Main Warehouse"
    },
    "expected_delivery_date": "2024-12-20",
    "currency": "PLN",
    "subtotal": 800.00,
    "tax_amount": 184.00,
    "total": 984.00,
    "lines": [
      {
        "id": "uuid-line-1",
        "product_name": "Flour Type A",
        "quantity": 500,
        "uom": "kg",
        "unit_price": 1.20,
        "line_total": 600.00
      },
      {
        "id": "uuid-line-2",
        "product_name": "Sugar White",
        "quantity": 200,
        "uom": "kg",
        "unit_price": 0.85,
        "line_total": 170.00
      },
      {
        "id": "uuid-line-3",
        "product_name": "Salt Industrial",
        "quantity": 100,
        "uom": "kg",
        "unit_price": 0.30,
        "line_total": 30.00
      }
    ],
    "created_by": {
      "id": "uuid-user-1",
      "name": "John Smith"
    },
    "submitted_at": "2024-12-10T16:25:00Z",
    "approval_settings": {
      "require_approval": true,
      "threshold": 1000.00,
      "exceeds_threshold": false,
      "manually_submitted": true
    }
  }
}
```

### Approve PO

```
POST /api/planning/purchase-orders/:id/approve
Body: {
  "notes": "Approved for Q4 stock replenishment. Good pricing from Mill Co."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-po-156",
    "po_number": "PO-2024-00156",
    "status": "approved",
    "approval_status": "approved",
    "approved_by": {
      "id": "uuid-manager-1",
      "name": "Mary Johnson"
    },
    "approved_at": "2024-12-14T10:30:00Z",
    "approval_notes": "Approved for Q4 stock replenishment. Good pricing from Mill Co.",
    "notification_sent": true,
    "notification_recipient": {
      "id": "uuid-user-1",
      "name": "John Smith",
      "email": "john.smith@company.com"
    }
  }
}
```

### Reject PO

```
POST /api/planning/purchase-orders/:id/reject
Body: {
  "reason": "Quantity too high for current inventory capacity. Please reduce to 500kg Sugar White and 250kg Brown."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-po-157",
    "po_number": "PO-2024-00157",
    "status": "rejected",
    "approval_status": "rejected",
    "rejected_by": {
      "id": "uuid-manager-1",
      "name": "Mary Johnson"
    },
    "rejected_at": "2024-12-14T10:35:00Z",
    "rejection_reason": "Quantity too high for current inventory capacity. Please reduce to 500kg Sugar White and 250kg Brown.",
    "notification_sent": true,
    "notification_recipient": {
      "id": "uuid-user-2",
      "name": "Jane Doe",
      "email": "jane.doe@company.com"
    }
  }
}
```

---

## Validation Rules

### Approve Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| notes | Max 1000 chars | "Notes cannot exceed 1000 characters" |

### Reject Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| reason | Required | "Rejection reason is required" |
| reason | Min 10 chars | "Please provide a more detailed reason" |
| reason | Max 1000 chars | "Reason cannot exceed 1000 characters" |

### Pre-Action Validation

| Rule | Error |
|------|-------|
| PO status must be 'submitted' or 'pending_approval' | "This PO cannot be approved/rejected from its current status" |
| User must have approval permission | "You do not have permission to approve/reject POs" |
| PO not already approved/rejected | "This PO has already been approved/rejected" |

---

## Business Rules

### Who Can Approve

```typescript
// Defined in planning settings
const canApprove = (user: User, settings: PlanningSettings): boolean => {
  return settings.po_approval_roles.includes(user.role);
};

// Default approval roles: ['admin', 'manager']
```

### Approval Notification Flow

1. User approves/rejects PO
2. System updates PO status
3. System sends email notification to requestor (created_by)
4. Email includes: PO number, action (approved/rejected), notes/reason, approver name

### Rejected PO Handling

After rejection:
- PO status changes to 'rejected'
- Requestor can edit PO and resubmit
- Resubmission creates new approval request
- Previous rejection preserved in history

### Concurrent Approval Prevention

- If two managers open same PO for approval, first to submit wins
- Second gets error: "This PO has already been approved by Mary Johnson"
- Modal shows current status on error

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Close button: 48x48dp
- Text inputs: 48dp height
- Lines table rows: 48dp minimum

### Contrast
- Modal text: 4.5:1
- Status badges: WCAG AA
- Threshold warnings: High contrast yellow/blue

### Screen Reader
- Modal: role="dialog" aria-modal="true" aria-labelledby="modal-title"
- Summary section: Proper heading structure (h2, h3)
- Lines table: Proper table markup with th/td
- Required field: aria-required="true"
- Error messages: aria-live="polite"

### Keyboard Navigation
- Tab: Navigate between sections
- Enter: Submit form
- Escape: Close modal (with confirmation if reason entered)

### Focus Management
- On modal open: Focus on first focusable element
- On success: Focus on View PO or Close button
- On error: Focus on error message

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Centered modal (max 600px width) |
| Tablet (768-1024px) | Centered modal (90% width) |
| Mobile (<768px) | Full-screen modal, stacked layout |

### Mobile-Specific
- Header section simplified
- Lines shown as cards
- Totals at bottom before actions
- Action buttons full-width stacked

---

## Performance Notes

### Data Loading
- Single API call for PO + lines data
- No additional queries needed

### Optimistic UI
- Disable buttons immediately on click
- Show spinner on action button
- Don't wait for notification send confirmation

### Load Time Targets
- Modal open: <300ms
- Approve/Reject action: <500ms
- Notification send: Background (async)

---

## Testing Requirements

### Unit Tests
- Approval threshold logic
- Rejection reason validation (min/max length)
- Permission check (can user approve?)
- Status transition validation

### Integration Tests
- GET /api/planning/purchase-orders/:id?context=approval
- POST /api/planning/purchase-orders/:id/approve
- POST /api/planning/purchase-orders/:id/reject
- Email notification sent to requestor

### E2E Tests
- Manager approves PO with notes
- Manager rejects PO with reason
- Rejection validation (empty reason blocked)
- View PO link opens detail page
- Mobile responsive layout
- Concurrent approval prevention (two managers)
- Requestor receives email notification

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] Both modes defined (Approve, Reject)
- [x] All states documented
- [x] API endpoints specified
- [x] Validation rules documented
- [x] Notification flow specified
- [x] Permission logic documented
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] Concurrent approval handling defined

---

## Handoff to FRONTEND-DEV

```yaml
feature: PO Approval Modal
story: PLAN-008
fr_coverage: FR-PLAN-009
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-008-po-approval-modal.md
  api_endpoints:
    - GET /api/planning/purchase-orders/:id?context=approval
    - POST /api/planning/purchase-orders/:id/approve
    - POST /api/planning/purchase-orders/:id/reject
modes: [approve, reject]
states_per_mode: [loading, ready, submitting, success, error]
breakpoints:
  mobile: "<768px (full-screen)"
  tablet: "768-1024px (90% width)"
  desktop: ">1024px (max 600px)"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "dialog, required, live"
notifications:
  type: "email"
  recipient: "PO requestor (created_by)"
  content: "PO number, action, notes/reason, approver"
related_screens:
  - PLAN-004: PO List Page (bulk approve triggers this)
  - PLAN-006: PO Detail Page (View PO link)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours
**Quality Target**: 97/100
