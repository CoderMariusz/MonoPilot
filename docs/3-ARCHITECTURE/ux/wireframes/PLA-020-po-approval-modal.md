# PLA-020: Purchase Order Approval Modal

**Module**: Planning
**Story**: 03.5b - PO Approval Workflow
**Feature**: FR-PLAN-009 (PO Approval Workflow)
**Status**: Implemented & Documented
**Component**: `POApprovalModal.tsx`
**Last Updated**: 2026-01-02

---

## Overview

Modal component for approving or rejecting purchase orders. Implements two modes (approve/reject) with full PO context display including summary, lines, totals, and threshold indicators.

**Implementation Status**: ✅ Already implemented in `apps/frontend/components/planning/purchase-orders/POApprovalModal.tsx`

---

## Component States

### 1. Loading State
- Skeleton placeholders for PO header, summary, lines, and totals
- Loading message: "Loading purchase order details..."
- No interactive elements visible

### 2. Ready State (Approve Mode)
- Full PO summary with supplier, warehouse, delivery date, requestor
- Lines table with product, quantity, unit price, subtotal
- Totals breakdown: subtotal, tax, total
- Threshold indicator showing approval requirement context
- Optional approval notes textarea
- Action buttons: Cancel, Approve PO

### 3. Ready State (Reject Mode)
- Same PO summary and totals as approve mode
- Required rejection reason textarea (minimum 10 characters)
- Validation message: "Please provide a reason for rejection"
- Action buttons: Cancel, Reject PO (destructive style)

### 4. Submitting State
- Form disabled
- Processing indicator: spinner + "Processing..." message
- Buttons disabled with loading state

### 5. Success State
- Handled via toast notification
- Modal closes automatically
- Parent component refreshes data

### 6. Error State
- Error alert banner with icon
- Error message displayed inline
- Form remains editable for retry
- Toast notification with error details

---

## ASCII Wireframe

### Approve Mode - Desktop

```
+------------------------------------------------------------------+
|                   Approve Purchase Order                     [X] |
+------------------------------------------------------------------+
|                                                                   |
|  +---------------------------------------------------------+     |
|  | PO-2024-00156           [Pending Approval] (pulsing)    |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  SUMMARY                                                          |
|  +---------------------------------------------------------+     |
|  | Supplier:          Mill Co. (SUP-001)                   |     |
|  | Warehouse:         Main Warehouse                       |     |
|  | Expected Delivery: Dec 20, 2024                         |     |
|  | Requestor:         John Smith                           |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  LINES (3 items)                                                  |
|  +---------------------------------------------------------+     |
|  | Product         | Qty      | Unit Price | Subtotal     |     |
|  |-----------------|----------|------------|--------------|     |
|  | Flour Type A    | 500 kg   | $1.20      | $600.00      |     |
|  | Sugar White     | 200 kg   | $0.85      | $170.00      |     |
|  | Salt Industrial | 100 kg   | $0.30      | $30.00       |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  TOTALS                                                           |
|  +---------------------------------------------------------+     |
|  |                            Subtotal:        $800.00 PLN |     |
|  |                            Tax (23%):       $184.00 PLN |     |
|  |                            -------------------------    |     |
|  |                            Total:           $984.00 PLN |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  [!] PO total ($984.00) is below the approval threshold          |
|      ($1,000.00). Manually submitted.                            |
|                                                                   |
|  Approval Notes (optional)                                        |
|  +---------------------------------------------------------+     |
|  | Approved by finance committee                           |     |
|  |                                                         |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  [Cancel]                                    [Approve PO]        |
|                                                                   |
+------------------------------------------------------------------+
```

### Reject Mode - Desktop

```
+------------------------------------------------------------------+
|                    Reject Purchase Order                     [X] |
+------------------------------------------------------------------+
|                                                                   |
|  +---------------------------------------------------------+     |
|  | PO-2024-00157           [Pending Approval] (pulsing)    |     |
|  +---------------------------------------------------------+     |
|                                                                   |
|  [Same Summary, Lines, and Totals sections as Approve mode]      |
|                                                                   |
|  [!] PO total ($1,599.00) exceeds the approval threshold         |
|      ($1,000.00).                                                |
|                                                                   |
|  Rejection Reason *                                               |
|  +---------------------------------------------------------+     |
|  | Exceeds quarterly budget. Please reduce quantity or     |     |
|  | defer to Q2.                                            |     |
|  +---------------------------------------------------------+     |
|  Minimum 10 characters required                                   |
|                                                                   |
|  [Cancel]                                      [Reject PO]       |
|                                                                   |
+------------------------------------------------------------------+
```

### Loading State

```
+------------------------------------------------------------------+
|                   Approve Purchase Order                     [X] |
+------------------------------------------------------------------+
|                                                                   |
|  [========================================]                       |
|                                                                   |
|  [=======================]                                        |
|  [=============================]                                  |
|  [==================]                                             |
|                                                                   |
|  [=============================================]                  |
|  [=============================================]                  |
|  [=============================================]                  |
|                                                                   |
|  Loading purchase order details...                               |
|                                                                   |
+------------------------------------------------------------------+
```

### Error State

```
+------------------------------------------------------------------+
|                   Approve Purchase Order                     [X] |
+------------------------------------------------------------------+
|                                                                   |
|  [!] Access denied: You do not have permission to approve        |
|      purchase orders                                             |
|                                                                   |
|  [PO summary and form continue to display]                       |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Key Elements

### Header Section
| Element | Type | Source | Notes |
|---------|------|--------|-------|
| PO Number | Text | `po.po_number` | Font-mono, semibold |
| Status Badge | Badge | `po.status` | Yellow with pulse animation if pending |
| Close Button | IconButton | - | 48x48dp touch target |

### Summary Section
| Field | Source | Format |
|-------|--------|--------|
| Supplier | `po.supplier.name` + `code` | "Mill Co. (SUP-001)" |
| Warehouse | `po.warehouse.name` | "Main Warehouse" |
| Expected Delivery | `po.expected_delivery_date` | "Dec 20, 2024" |
| Requestor | `po.created_by.name` | "John Smith" |

### Lines Table
- Scrollable if > 3 lines (max-height: 160px)
- Columns: Product, Qty, Unit Price, Subtotal
- Right-aligned numeric values with tabular-nums
- Product name from `line.product_name` or `line.product.name`

### Totals Section
| Field | Calculation | Format |
|-------|-------------|--------|
| Subtotal | `po.subtotal` | Currency formatted |
| Tax | `po.tax_amount` | Currency formatted |
| Total | `po.total` | Currency formatted, bold |

### Threshold Indicator
| Condition | Color | Icon | Message |
|-----------|-------|------|---------|
| Below threshold (manual) | Blue | Clock | "PO total ($X) is below the threshold ($Y). Manually submitted." |
| Exceeds threshold | Yellow | AlertCircle | "PO total ($X) exceeds the approval threshold ($Y)." |
| No threshold set | Blue | Clock | "Approval required for all POs. Manual threshold review." |

### Form Input (Approve Mode)
- Label: "Approval Notes (optional)"
- Textarea: min-height 100px, max 1000 characters
- Placeholder: "Optional notes about this approval..."
- Validation: Max length only

### Form Input (Reject Mode)
- Label: "Rejection Reason *" (red asterisk)
- Textarea: min-height 100px, required, 10-1000 characters
- Placeholder: "Provide rejection reason (minimum 10 characters)..."
- Validation: Required, min 10 chars, max 1000 chars
- Error message shown inline below textarea

### Action Buttons
| Button | Mode | Variant | Icon | Behavior |
|--------|------|---------|------|----------|
| Cancel | Both | Outline | - | Close modal, no changes |
| Approve PO | Approve | Default (primary) | CheckCircle2 | Submit approval |
| Reject PO | Reject | Destructive (red) | XCircle | Submit rejection |

---

## Business Logic

### Permission Check
```typescript
// Only users with roles in po_approval_roles can approve
const canApprove = approvalRoles.includes(currentUserRole);
// If false, show error: "Access denied: You do not have permission to approve purchase orders"
```

### Threshold Logic
```typescript
// From po_approval_settings:
if (!requireApproval) {
  // No approval needed - direct submit
} else if (approvalThreshold === null) {
  // All POs require approval
  showThresholdIndicator("Approval required for all POs");
} else if (po.total >= approvalThreshold) {
  // Exceeds threshold
  showThresholdIndicator("Exceeds threshold", "warning");
} else {
  // Below threshold but manually submitted
  showThresholdIndicator("Below threshold. Manually submitted", "info");
}
```

### Approval Flow
1. User opens modal (mode: 'approve')
2. Hook `usePOApproval()` provides `approvePO` mutation
3. User enters optional notes
4. User clicks "Approve PO"
5. Form validation runs (max length check)
6. API call: `POST /api/planning/purchase-orders/:id/approve`
7. On success:
   - Toast: "Purchase order approved successfully"
   - Modal closes
   - Parent component refetches PO list
   - Email notification sent to PO creator (async)

### Rejection Flow
1. User opens modal (mode: 'reject')
2. Hook `usePOApproval()` provides `rejectPO` mutation
3. User enters rejection reason (required, min 10 chars)
4. User clicks "Reject PO"
5. Form validation runs (required, min/max length)
6. API call: `POST /api/planning/purchase-orders/:id/reject`
7. On success:
   - Toast: "Purchase order rejected. Creator has been notified."
   - Modal closes
   - Parent component refetches PO list
   - Email notification sent to PO creator (async)
   - PO status changes to "rejected" → "draft" for re-editing

---

## API Integration

### Endpoints Used

```typescript
// Get PO with full details
GET /api/planning/purchase-orders/:id
// Response includes: po, lines, supplier, warehouse, created_by

// Approve PO
POST /api/planning/purchase-orders/:id/approve
Body: { notes?: string }
Response: { status: 'approved', approved_by, approved_at, approval_notes }

// Reject PO
POST /api/planning/purchase-orders/:id/reject
Body: { rejection_reason: string }
Response: { status: 'rejected', rejected_by, rejected_at, rejection_reason }
```

---

## Validation Rules

### Approve Mode
| Field | Rule | Error Message |
|-------|------|---------------|
| notes | Optional | - |
| notes | Max 1000 chars | "Notes cannot exceed 1000 characters" |

### Reject Mode
| Field | Rule | Error Message |
|-------|------|---------------|
| rejection_reason | Required | "Rejection reason is required" |
| rejection_reason | Min 10 chars | "Reason must be at least 10 characters" |
| rejection_reason | Max 1000 chars | "Reason cannot exceed 1000 characters" |

### Pre-submission Validation
| Rule | Error |
|------|-------|
| PO status must be "pending_approval" | "Cannot approve: PO must be in pending approval status" |
| User must have approval permission | "Access denied: You do not have permission to approve purchase orders" |
| PO not already approved/rejected | Handled by API (409 Conflict) |

---

## Accessibility

### ARIA Attributes
- `role="dialog"` on modal
- `aria-modal="true"`
- `aria-describedby={undefined}` (no description needed)
- `aria-label` on action buttons
- `aria-required="true"` on rejection reason textarea
- `role="alert"` on error messages
- `aria-live="polite"` on validation errors

### Touch Targets
- All buttons: 48x48dp minimum
- Close button (X): 48x48dp
- Textarea: min-height 100px (48dp+ vertical target)

### Contrast
- Text on background: 4.5:1 minimum
- Status badges: Per POStatusBadge component (WCAG AA)
- Error messages: High contrast red
- Threshold indicators: Blue/yellow with sufficient contrast

### Keyboard Navigation
- Tab order: Close → Summary sections → Lines → Notes/Reason → Cancel → Approve/Reject
- Enter: Submit form (when focus on button)
- Escape: Close modal (with confirmation if text entered)

### Screen Reader
- Modal title announces: "Approve Purchase Order" or "Reject Purchase Order"
- Summary fields read in logical order
- Lines table with proper th/td markup
- Totals section with clear labels
- Required field announces: "Rejection Reason, required"
- Validation errors announced via aria-live

---

## Responsive Design

### Desktop (>1024px)
- Modal max-width: 640px (2xl)
- Centered on screen
- Lines table: Full 4-column layout
- Action buttons: Right-aligned, inline

### Tablet (768-1024px)
- Modal width: 90%
- Same layout as desktop
- Slightly smaller spacing

### Mobile (<768px)
- Modal: Full-screen or max-height 90vh
- Lines table: Responsive layout (cards or stacked)
- Action buttons: Full-width, stacked (Cancel above Approve/Reject)
- Summary fields: Stacked 1-column grid

---

## Performance

### Load Time
- Modal open animation: <200ms
- PO data already fetched from parent (no additional API call needed)
- Form renders synchronously

### Action Time
- Approve/Reject API call: <500ms target (P95)
- Optimistic UI: Disable buttons immediately
- Toast notification: Show on success/error
- Email notification: Queued async (doesn't block UI)

---

## Testing Requirements

### Unit Tests
- Renders correctly in approve mode
- Renders correctly in reject mode
- Displays PO summary, lines, totals correctly
- Calculates threshold indicator logic
- Validates approval notes (max length)
- Validates rejection reason (required, min/max length)
- Disables form during submission
- Shows error messages correctly

### Integration Tests
- Calls approvePO mutation with correct data
- Calls rejectPO mutation with correct data
- Closes modal on success
- Calls onSuccess callback
- Shows toast on success/error
- Handles permission denied error

### E2E Tests
- Manager can approve PO with optional notes
- Manager can reject PO with required reason
- Rejection without reason shows validation error
- Non-approver sees permission error
- Modal closes on cancel
- Toast notifications appear on success
- Email sent to PO creator (check logs)

---

## Implementation Notes

### Existing Component Path
```
apps/frontend/components/planning/purchase-orders/POApprovalModal.tsx
```

### Dependencies
- `@/hooks/use-toast` - Toast notifications
- `@/hooks/use-po-approval` - Approval/rejection mutations
- `@/components/ui/*` - ShadCN components (Dialog, Button, Textarea, Badge, Skeleton)
- `lucide-react` - Icons
- `react-hook-form` + `zod` - Form validation

### Key Features Implemented
- ✅ Dual mode (approve/reject) with single component
- ✅ Full PO context display (summary, lines, totals)
- ✅ Threshold indicator with dynamic messaging
- ✅ Form validation with Zod schemas
- ✅ Loading, error, success states
- ✅ Accessibility (ARIA, keyboard, screen reader)
- ✅ Responsive design (desktop/tablet/mobile)
- ✅ Toast notifications
- ✅ Permission checking

### Future Enhancements (Deferred)
- Multi-level approval chain support
- Approval delegation
- Conditional approval (approve with changes)
- Bulk approval from list
- Approval history inline in modal

---

## Quality Gates

- [x] All 4 states defined (Loading, Ready, Submitting, Error)
- [x] Approve and Reject modes documented
- [x] Validation rules specified
- [x] API endpoints documented
- [x] Accessibility requirements met (WCAG AA)
- [x] Responsive breakpoints defined
- [x] Touch targets 48x48dp minimum
- [x] Keyboard navigation support
- [x] Screen reader support
- [x] Permission checking documented
- [x] Component already implemented and tested

---

**Status**: ✅ Implemented & Documented
**Component**: `POApprovalModal.tsx`
**Story**: 03.5b
**Approved**: Auto-approved (existing implementation)
