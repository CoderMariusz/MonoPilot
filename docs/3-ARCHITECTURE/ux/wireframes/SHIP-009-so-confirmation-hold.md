# SHIP-009: Sales Order Confirmation with Hold Logic

**Module**: Shipping Management
**Feature**: SO Confirmation Dialog with Inventory Hold Logic, Override Permissions, & Notifications
**Scope**: FR-7.13 (SO Confirmation/Hold Logic)
**Status**: Ready for Review
**Last Updated**: 2025-12-15

---

## Overview

Sales Order confirmation with intelligent hold logic. When confirming a sales order, the system validates inventory availability, credit limits, and allergen restrictions. If validation fails, the order is placed "On Hold - Awaiting Stock" with clear hold reason and manager override option. Authorized users can override holds and confirm anyway. Notifications sent to relevant stakeholders on hold placement.

**Key Flows:**
1. Confirm SO → Validate inventory/credit/allergen → Confirmed OR On Hold
2. View hold reason (dropdown with specific cause)
3. Manager override (permitted roles only)
4. Notification dispatch to warehouse manager, sales manager
5. Resume from hold (reassign, reallocate, override)

---

## ASCII Wireframe

### Empty State (No SO Selected / Already Confirmed)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Confirm Sales Order                                    [×]      │
│  [role="alertdialog" aria-labelledby="confirm-title"]             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ℹ No Order Selected                                               │
│                                                                    │
│  [aria-label="illustration: empty state"]                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  No sales order is currently selected for confirmation.       │  │
│  │                                                                │  │
│  │  To confirm a sales order:                                   │  │
│  │  1. Go to Sales Orders list                                  │  │
│  │  2. Select an order with status "Draft" or "Pending"         │  │
│  │  3. Click the [✓ Confirm Order] button                       │  │
│  │                                                                │  │
│  │  If the order is already confirmed, you can:                 │  │
│  │  • View order details                                        │  │
│  │  • Generate pick list                                        │  │
│  │  • Cancel or modify (if not picking started)                 │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [← Go to Sales Orders]  [🏠 Home]                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**ARIA Attributes:**
- `role="alertdialog"` - Dialog announces important information
- `aria-labelledby="confirm-title"` - Dialog title identified as label
- `aria-label="illustration: empty state"` - Icon accessibility

---

### Already Confirmed State

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Order Already Confirmed                                [×]      │
│  [role="alertdialog" aria-labelledby="status-title"]              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ✅ SO-2025-001234 is Already Confirmed                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Order Details:                                               │  │
│  │                                                               │  │
│  │ Order Number: SO-2025-001234                                │  │
│  │ Status: 🟢 Confirmed                                         │  │
│  │ Confirmed At: 2025-12-15 09:30 AM                            │  │
│  │ Confirmed By: John Smith (Shipping Manager)                 │  │
│  │                                                               │  │
│  │ Customer: Acme Foods Inc. (CUST-001)                        │  │
│  │ Order Total: $1,512.04                                       │  │
│  │ Promised Delivery: 2025-12-20                                │  │
│  │                                                               │  │
│  │ Current Status:                                              │  │
│  │ • Allocations: ✓ Locked and Reserved                        │  │
│  │ • Pick List: Not yet generated                              │  │
│  │ • Picking Status: Ready to start                            │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Next Actions:                                                     │
│  [🔄 Generate Pick List]  [🔍 View Order Details]                │
│  [← Back to Orders]                                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**ARIA Attributes:**
- `aria-label="Status badge: Order confirmed, green indicator"`
- `aria-live="polite"` - Updates announced as they occur

---

### Success State (Desktop - Confirmation Dialog - Normal)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Confirm Sales Order                                    [×]      │
│  [role="alertdialog" aria-labelledby="confirm-title"]             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🟢 Ready to Confirm: SO-2025-001234                              │
│     [aria-label="Status: Ready to confirm (green indicator)"]      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Order Summary:                                               │  │
│  │ [aria-label="Order summary section"]                         │  │
│  │                                                               │  │
│  │ Customer: Acme Foods Inc. (CUST-001)                        │  │
│  │ Order Total: $1,512.04                                       │  │
│  │ Promised Delivery: 2025-12-20                                │  │
│  │ Line Items: 3 products, 180 units total                     │  │
│  │                                                               │  │
│  │ Validation Checks:                                           │  │
│  │ [role="table" aria-label="Validation results table"]         │  │
│  │ ✓ Inventory Available: All items in stock                   │  │
│  │ ✓ Credit Limit: OK ($5,000 remaining)                       │  │
│  │ ✓ Allergen Check: No customer restrictions                  │  │
│  │ ✓ Allocations: Locked and reserved                          │  │
│  │                                                               │  │
│  │ All checks passed! Order ready for confirmation.             │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Notes (optional):                                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ [aria-label="Additional notes textarea"]                    │   │
│  │ [Priority order - expedited shipment requested]             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  Notifications:                                                    │
│  [aria-label="Notification preferences"]                           │
│  ☑ Notify Warehouse Manager                                      │
│  ☑ Notify Sales Manager                                          │
│  ☐ Notify Customer (via email)                                   │
│                                                                    │
│                [✓ Confirm Order]  [✕ Cancel]                     │
│                (Keyboard: Ctrl+Enter to confirm)                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**ARIA Attributes:**
- `role="alertdialog"` - Dialog with alert semantics
- `aria-labelledby="confirm-title"` - Main heading identifies dialog
- `aria-label` - Applied to status badge, sections, form fields
- `role="table"` - Validation results structured as table

---

### Timeout Handling State (Validation Exceeds Threshold)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Confirm Sales Order                                    [×]      │
│  [role="alertdialog" aria-labelledby="timeout-title"]             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Validating SO-2025-001234...                                      │
│                                                                    │
│  [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 45%       │
│  Elapsed Time: 6.3 seconds                                         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Inventory Check   │  │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░] Credit Validation  │  │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Allergen Review   │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ⚠ Validation taking longer than expected.                        │
│                                                                    │
│  This is unusual. Typical validation takes 1-3 seconds.           │
│                                                                    │
│  The system is still validating your order. This may be due to:   │
│  • Network delays                                                 │
│  • System load                                                    │
│  • Large inventory dataset being checked                          │
│                                                                    │
│  You can:                                                          │
│  • [⧖ Keep Waiting] (recommended) - Let validation complete      │
│  • [✕ Cancel] - Cancel this validation and try again             │
│                                                                    │
│  If validation continues beyond 15 seconds, please contact        │
│  support@monopilot.app                                             │
│                                                                    │
│  Timeout Protection: Auto-cancel in 30 seconds if no response     │
│                                                                    │
│  [⧖ Keep Waiting]  [✕ Cancel Validation]                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**ARIA Attributes:**
- `role="alertdialog"` - Timeout warning is important alert
- `aria-label="Validation timeout warning at 6.3 seconds"`
- `aria-live="assertive"` - Announce timeout status immediately
- `aria-label="Progress indicator showing 45% complete"`

**Performance Notes:**
- Timeout threshold: 5 seconds (show warning)
- Auto-cancel threshold: 30 seconds (hard stop)
- Retry mechanism: Allow user to restart validation
- Network timeout: 15 second request timeout on API calls
- UI rendering: <300ms to display timeout message

---

### Session Timeout Warning (2 Minutes Before Expiration)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⏱ Session Expiring Soon                                  [×]      │
│  [role="alertdialog" aria-labelledby="session-title"]             │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ⚠ Your session will expire in 2 minutes                          │
│  [aria-label="Session timeout warning"]                            │
│  [aria-live="assertive"]                                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Your session is expiring due to inactivity.                  │  │
│  │                                                               │  │
│  │ Session Expires In: 2:00 minutes                             │  │
│  │ [aria-label="Countdown timer"]                               │  │
│  │                                                               │  │
│  │ To continue working in MonoPilot, please:                   │  │
│  │ • Click [Extend Session] below, OR                           │  │
│  │ • Interact with the page to auto-extend                      │  │
│  │                                                               │  │
│  │ If your session expires, you'll be logged out and will       │  │
│  │ need to log in again. Order notes will be preserved.         │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [✓ Extend Session]  [📧 Log Out Now]                             │
│  [aria-label="Action buttons: extend session or log out"]         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**ARIA Attributes:**
- `role="alertdialog"` - Important session alert
- `aria-labelledby="session-title"` - Dialog title
- `aria-live="assertive"` - Announce countdown urgently
- `aria-label="Countdown timer"` - Screen reader announces time remaining

**Behavior:**
- Modal appears 2 minutes before session expiration (30-min total timeout)
- Countdown timer updates every second
- [✓ Extend Session] button extends session by 30 minutes
- User interaction anywhere on page auto-extends session
- If user doesn't interact, auto-logout after 2 minutes
- Order notes preserved in browser localStorage during logout
- User can log back in and resume confirmation if needed

---

### Validation Failure State (Desktop - Hold Dialog - Insufficient Stock)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠ Order On Hold                                         [×]       │
│  [role="alertdialog" aria-labelledby="hold-title"]                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🟡 Order Placed On Hold: SO-2025-001234                          │
│     [aria-label="Order on hold status"]                            │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Hold Details:                                                │  │
│  │ [aria-label="Hold details section, updates when reason..."]  │  │
│  │                                                               │  │
│  │ Customer: Acme Foods Inc. (CUST-001)                        │  │
│  │ Order Total: $1,512.04                                       │  │
│  │ Promised Delivery: 2025-12-20 (5 days remaining)             │  │
│  │ Hold Time: 2025-12-15 11:15 AM                              │  │
│  │                                                               │  │
│  │ Validation Results:                                          │  │
│  │ ✓ Inventory Available: FAILED (1 item insufficient)         │  │
│  │ ✓ Credit Limit: OK ($5,000 remaining)                       │  │
│  │ ✓ Allergen Check: OK                                        │  │
│  │                                                               │  │
│  │ Hold Reason: Insufficient Stock                              │  │
│  │ [aria-label="Primary hold reason: insufficient stock"]       │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Insufficient Inventory Details:                          │ │  │
│  │ ├──────────────────────────────────────────────────────────┤ │  │
│  │ │ [aria-label="Inventory shortage details"]                │ │  │
│  │ │                                                            │ │  │
│  │ │ Line 2: Fresh Basil 100g                                 │ │  │
│  │ │ Ordered: 50 units                                         │ │  │
│  │ │ Available: 30 units (in warehouse)                       │ │  │
│  │ │ Shortage: 20 units                                        │ │  │
│  │ │ Status: Partial allocation (30 of 50)                   │ │  │
│  │ │                                                            │ │  │
│  │ │ Production Impact:                                        │ │  │
│  │ │ ⏳ Scheduled Production: 1 batch (50 units) due 12-20     │ │  │
│  │ │ ⏳ Expected Availability: 2025-12-22 (2 days after due)   │ │  │
│  │ │                                                            │ │  │
│  │ │ Options:                                                  │ │  │
│  │ │ □ Wait for production (automatic resume on 12-22)        │ │  │
│  │ │ □ Partial shipment (ship 30 units, backorder 20)         │ │  │
│  │ │ □ Override hold (manager only, requires approval)        │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │ ⚠ Automatic Hold Actions:                                    │  │
│  │ • Order status: "On Hold - Awaiting Stock"                  │  │
│  │ • Allocations: Partially reserved (30 units locked)        │  │
│  │ • Hold escalation: Auto-resume on 2025-12-22 when stock ok │  │
│  │ • Notifications: Sent to warehouse & sales managers         │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Manager Override (Requires "Confirm Override" permission) │ │  │
│  │ │ [aria-label="Manager override section, visible if..."]    │ │  │
│  │ │                                                            │ │  │
│  │ │ [✓] I acknowledge the shortage and authorize confirmation│ │  │
│  │ │     [aria-label="Checkbox to acknowledge shortage"]      │ │  │
│  │ │                                                            │ │  │
│  │ │ Override Notes (required if overriding):                  │ │  │
│  │ │ ┌─────────────────────────────────────────────────────┐  │ │  │
│  │ │ │ [Customer willing to accept 30 units + backorder]  │  │ │  │
│  │ │ │ [aria-label="Required notes for override decision"]│  │ │  │
│  │ │ └─────────────────────────────────────────────────────┘  │ │  │
│  │ │                                                            │ │  │
│  │ │ [✓ Override & Confirm]  [Save as Draft Hold] [✕ Cancel]  │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Notifications on Confirmation/Hold:                              │
│  ☑ Notify Warehouse Manager                                      │
│  ☑ Notify Sales Manager                                          │
│  ☑ Create Hold Ticket (auto-escalation)                          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Validation Failure State (Desktop - Hold Dialog - Credit Limit Exceeded)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠ Order On Hold                                         [×]       │
│  [role="alertdialog" aria-labelledby="hold-title"]                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🟡 Order Placed On Hold: SO-2025-001235                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Hold Details:                                                │  │
│  │ Customer: Best Foods Wholesale (CUST-002)                   │  │
│  │ Order Total: $8,500.00                                       │  │
│  │ Promised Delivery: 2025-12-18                                │  │
│  │ Hold Time: 2025-12-15 11:20 AM                              │  │
│  │                                                               │  │
│  │ Validation Results:                                          │  │
│  │ ✓ Inventory Available: OK (all items in stock)              │  │
│  │ ✗ Credit Limit: EXCEEDED                                    │  │
│  │ ✓ Allergen Check: OK                                        │  │
│  │                                                               │  │
│  │ Hold Reason: Credit Limit Exceeded                           │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Credit Limit Analysis:                                   │ │  │
│  │ ├──────────────────────────────────────────────────────────┤ │  │
│  │ │                                                            │ │  │
│  │ │ Customer Credit Status:                                   │ │  │
│  │ │ Credit Limit: $10,000.00                                 │ │  │
│  │ │ Current A/R Balance: $8,500.00 (30 days outstanding)     │ │  │
│  │ │ Available Credit: $1,500.00                               │ │  │
│  │ │ This Order: $8,500.00                                     │ │  │
│  │ │ ─────────────────────────────                             │ │  │
│  │ │ Would Exceed By: $7,000.00                                │ │  │
│  │ │                                                            │ │  │
│  │ │ Recent Payment History:                                   │ │  │
│  │ │ Last Payment: 2025-12-01 ($5,000)                        │  │
│  │ │ Payment Status: On time (no late payments)               │  │
│  │ │ Days Since Last Payment: 14 days                          │  │
│  │ │                                                            │ │  │
│  │ │ Actions Available:                                        │ │  │
│  │ │ □ Request credit limit increase (requires approval)       │ │  │
│  │ │ □ Place on credit review (manager decision)              │ │  │
│  │ │ □ Override hold (requires approval from finance)          │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │ ⚠ Automatic Hold Actions:                                    │  │
│  │ • Order status: "On Hold - Credit Limit"                    │  │
│  │ • Allocations: Released (no inventory reserved)             │  │
│  │ • Hold escalation: Requires manual credit review            │  │
│  │ • Notifications: Sent to sales & finance managers           │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Manager Override (Requires "Credit Override" permission)  │ │  │
│  │ │                                                            │ │  │
│  │ │ [✓] I authorize this order despite credit limit exceeded  │ │  │
│  │ │                                                            │ │  │
│  │ │ Override Justification (required):                        │ │  │
│  │ │ ┌─────────────────────────────────────────────────────┐  │ │  │
│  │ │ │ [Customer payment due today, credit will be restored]│ │  │
│  │ │ └─────────────────────────────────────────────────────┘  │ │  │
│  │ │                                                            │ │  │
│  │ │ [✓ Override & Confirm]  [Save as Draft Hold] [✕ Cancel]  │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Notifications on Hold/Override:                                  │
│  ☑ Notify Sales Manager                                          │
│  ☑ Notify Finance Manager                                        │
│  ☑ Create Credit Review Task (auto-ticket)                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Validation Failure State (Desktop - Hold Dialog - Allergen Conflict)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠ Order On Hold                                         [×]       │
│  [role="alertdialog" aria-labelledby="hold-title"]                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🟡 Order Placed On Hold: SO-2025-001236                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Hold Details:                                                │  │
│  │ Customer: Fresh Market Retail (CUST-003)                    │  │
│  │ Order Total: $3,250.00                                       │  │
│  │ Promised Delivery: 2025-12-19                                │  │
│  │ Hold Time: 2025-12-15 11:25 AM                              │  │
│  │                                                               │  │
│  │ Validation Results:                                          │  │
│  │ ✓ Inventory Available: OK (all items in stock)              │  │
│  │ ✓ Credit Limit: OK ($2,000 remaining)                       │  │
│  │ ✗ Allergen Check: CONFLICT DETECTED                         │  │
│  │                                                               │  │
│  │ Hold Reason: Allergen Conflict / Food Safety Issue           │  │
│  │ [aria-label="Critical allergen conflict - requires QA..."]   │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Allergen Conflict Analysis:                              │ │  │
│  │ ├──────────────────────────────────────────────────────────┤ │  │
│  │ │ [aria-label="Detailed allergen conflict matrix"]          │ │  │
│  │ │                                                            │ │  │
│  │ │ Customer Allergen Restrictions:                          │ │  │
│  │ │ ⛔ Peanuts (critical - nut-free facility)               │ │  │
│  │ │ ⛔ Tree Nuts (critical - nut-free facility)             │ │  │
│  │ │ ⛔ Sesame (label requirement)                            │ │  │
│  │ │                                                            │ │  │
│  │ │ Order Contains Conflicts:                                │ │  │
│  │ │ Line 3: Mixed Granola 500g                               │ │  │
│  │ │   ⚠ Contains: Tree Nuts (almonds), Sesame Seeds          │ │  │
│  │ │   Product Allergen Profile: [Tree Nuts, Sesame]          │ │  │
│  │ │   Match: [Tree Nuts, Sesame] ✗ CONFLICT (2 items)       │ │  │
│  │ │   Produced in facility: "May contain peanuts"            │ │  │
│  │ │                                                            │ │  │
│  │ │ ⚠ Risk Assessment:                                        │ │  │
│  │ │ CRITICAL: Customer has nut-free facility requirement.    │ │  │
│  │ │ Product tree nuts + peanut warning makes this unsafe.    │ │  │
│  │ │                                                            │ │  │
│  │ │ Required Actions:                                         │ │  │
│  │ │ • Quality Manager must review before override             │ │  │
│  │ │ • Customer must confirm acceptance in writing             │ │  │
│  │ │ • Incident must be logged for traceability                │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │ ⚠ Automatic Hold Actions:                                    │  │
│  │ • Order status: "On Hold - Allergen Review"                │  │
│  │ • Allocations: Released (no inventory reserved)             │  │
│  │ • Hold escalation: Requires Quality Manager approval        │  │
│  │ • Notifications: Sent to quality & sales managers           │  │
│  │ • Audit trail: Logged for food safety compliance            │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Manager Override (Requires "Quality Approval" permission) │ │  │
│  │ │ [aria-label="Quality manager approval section"]           │ │  │
│  │ │                                                            │ │  │
│  │ │ ☐ Quality Manager has reviewed and approved this override │ │  │
│  │ │   [aria-label="Quality manager approval checkbox"]        │ │  │
│  │ │                                                            │ │  │
│  │ │ Quality Manager Name: [________]                          │ │  │
│  │ │ Quality Manager Signature/Approval: [________]            │ │  │
│  │ │                                                            │ │  │
│  │ │ Customer Confirmation (required):                         │ │  │
│  │ │ [✓] Customer acknowledges allergen conflict and accepts  │ │  │
│  │ │     [aria-label="Customer acknowledgment checkbox"]       │ │  │
│  │ │                                                            │ │  │
│  │ │ Customer Acknowledgment Notes (required):                 │ │  │
│  │ │ ┌─────────────────────────────────────────────────────┐  │ │  │
│  │ │ │ [Customer confirmed acceptance via email 12-15-2025]│  │ │  │
│  │ │ │ [aria-label="Customer acknowledgment proof textarea"]│  │ │  │
│  │ │ └─────────────────────────────────────────────────────┘  │ │  │
│  │ │                                                            │ │  │
│  │ │ [✓ Quality Approved - Confirm] [Save Hold] [✕ Cancel]    │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Notifications on Override:                                        │
│  ☑ Notify Quality Manager                                        │
│  ☑ Notify Sales Manager                                          │
│  ☑ Create Audit Log Entry (food safety record)                  │
│  ☑ Send to Customer (acknowledgment email)                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Multiple Hold Reasons State (Desktop - Hold Dialog - Combined Issues)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⚠ Order On Hold - Multiple Issues                     [×]       │
│  [role="alertdialog" aria-labelledby="multi-hold-title"]          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🔴 Order Placed On Hold: SO-2025-001237                          │
│     [aria-label="Critical: Multiple hold reasons require action"]  │
│                                                                    │
│  ⚠ WARNING: Order has MULTIPLE hold reasons. Resolution required.│
│  [aria-live="assertive"]                                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Hold Details:                                                │  │
│  │ Customer: Acme Foods Wholesale (CUST-004)                   │  │
│  │ Order Total: $12,500.00                                      │  │
│  │ Promised Delivery: 2025-12-18                                │  │
│  │ Hold Time: 2025-12-15 11:30 AM                              │  │
│  │                                                               │  │
│  │ Validation Results (Multiple Failures):                       │  │
│  │ ✗ Inventory Available: FAILED (2 items insufficient)        │  │
│  │ ✗ Credit Limit: EXCEEDED by $5,000                          │  │
│  │ ✓ Allergen Check: OK                                        │  │
│  │                                                               │  │
│  │ Priority Hold Reason: [Inventory + Credit ▼]                 │  │
│  │ [aria-label="Dropdown showing primary reason as inventory"]  │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ ISSUE #1: Insufficient Inventory (BLOCKS SHIPMENT)       │ │  │
│  │ ├──────────────────────────────────────────────────────────┤ │  │
│  │ │ Line 1: Classic Meatballs 500g                           │ │  │
│  │ │   Ordered: 200 | Available: 100 | Shortage: 100         │ │  │
│  │ │   Expected Stock: 2025-12-22                              │ │  │
│  │ │                                                            │ │  │
│  │ │ Line 3: Organic Vegetables Mix 1kg                       │ │  │
│  │ │   Ordered: 150 | Available: 75 | Shortage: 75           │ │  │
│  │ │   Expected Stock: 2025-12-23                              │ │  │
│  │ │                                                            │ │  │
│  │ │ Action: [⧖ Wait for Production] [⧖ Partial Ship]        │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ ISSUE #2: Credit Limit Exceeded (REQUIRES APPROVAL)     │ │  │
│  │ ├──────────────────────────────────────────────────────────┤ │  │
│  │ │ Credit Limit: $10,000                                    │ │  │
│  │ │ A/R Balance: $10,500 (45 days outstanding)              │ │  │
│  │ │ Available Credit: -$500 (already exceeded)               │ │  │
│  │ │ This Order: $12,500                                      │ │  │
│  │ │ Total Excess: $13,000                                    │ │  │
│  │ │                                                            │ │  │
│  │ │ Action: [⧖ Contact Finance] [⧖ Request Increase]        │ │  │
│  │ │                                                            │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │ ⚠ Resolution Path:                                          │  │
│  │                                                               │  │
│  │ You must resolve BOTH issues to confirm:                    │  │
│  │                                                               │  │
│  │ 1. [📞] Contact warehouse about stock ETA                   │  │
│  │ 2. [💳] Contact customer for payment commitment             │  │
│  │ 3. [🔄] Reallocate & update order once resolved             │  │
│  │ 4. [✓] Confirm when both issues are clear                  │  │
│  │                                                               │  │
│  │ ┌──────────────────────────────────────────────────────────┐ │  │
│  │ │ Hold Status: ESCALATED - Requires Multi-Department Action │ │  │
│  │ │ Escalation Level: High                                    │ │  │
│  │ │ Assigned To: Sales Manager (awaiting resolution)          │ │  │
│  │ └──────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │ [✓ Confirm Anyway] (requires both inventory & credit auth)   │  │
│  │ [📋 Save as Draft Hold] [✕ Cancel Order]                    │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Notifications Sent:                                              │
│  ☑ Sales Manager (primary escalation)                            │
│  ☑ Warehouse Manager (inventory issue)                           │
│  ☑ Finance Manager (credit issue)                                │
│  ☑ Order Assigned: Sales Manager                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Tablet State (768-1024px)

```
┌──────────────────────────────────────────────────────┐
│  ✓ Confirm Sales Order                    [×]        │
│  [role="alertdialog"]                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🟡 Order On Hold: SO-2025-001234                   │
│                                                      │
│  Customer: Acme Foods Inc. (CUST-001)               │
│  Total: $1,512.04 | Promised: Dec 20                │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Hold Reason: Insufficient Stock              │   │
│  │ [aria-label="Hold reason section"]           │   │
│  │                                               │   │
│  │ Fresh Basil 100g:                             │   │
│  │ Ordered: 50 | Available: 30 | Short: 20     │   │
│  │ ETA: Dec 22                                  │   │
│  │                                               │   │
│  │ [⧖ Wait] [⧖ Partial] [⧖ Override]          │   │
│  │                                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Manager Override                              │   │
│  │ [aria-label="Manager override section"]      │   │
│  │                                               │   │
│  │ [✓] I authorize this confirmation            │   │
│  │                                               │   │
│  │ Justification:                                │   │
│  │ ┌──────────────────────────────────────────┐ │   │
│  │ │ [Customer accepts backorder]              │ │   │
│  │ └──────────────────────────────────────────┘ │   │
│  │                                               │   │
│  │ [✓ Override] [Save Hold] [✕ Cancel]         │   │
│  │                                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Notifications:                                      │
│  ☑ Warehouse Manager  ☑ Sales Manager              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Mobile State (<768px)

```
┌──────────────────────────────────────────────────────┐
│  ✓ Confirm SO      [×]                               │
│  [role="alertdialog" aria-modal="true"]              │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🟡 Order On Hold                                   │
│  SO-2025-001234                                     │
│                                                      │
│  Acme Foods Inc.                                    │
│  $1,512.04 | Dec 20                                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Hold: Insufficient Stock                     │   │
│  │ [aria-label="Hold reason on mobile"]         │   │
│  │                                              │   │
│  │ Fresh Basil                                  │   │
│  │ Ordered: 50                                  │   │
│  │ Available: 30                                │   │
│  │ Short: 20                                    │   │
│  │ ETA: Dec 22                                  │   │
│  │                                              │   │
│  │ [⧖ Wait]                                    │   │
│  │ [⧖ Partial]                                 │   │
│  │ [⧖ Override]                                │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Manager Override:                                   │
│  [✓] Authorize                                      │
│                                                      │
│  Notes:                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ [Customer accepts...]                        │   │
│  │ [aria-label="Override notes textarea"]       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [✓ Override & Confirm]                             │
│  [Save Hold]                                         │
│  [✕ Cancel]                                         │
│                                                      │
│  Notify:                                             │
│  ☑ Warehouse Mgr                                    │
│  ☑ Sales Mgr                                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Loading State (Validation in Progress)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Confirm Sales Order                                    [×]      │
│  [role="alertdialog" aria-label="Validation in progress..."]       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Validating SO-2025-001234...                                      │
│  [aria-live="polite" aria-atomic="true"]                           │
│                                                                    │
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 30%                   │
│  [aria-label="Progress: 30 percent complete"]                      │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Inventory Check   │  │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░] Credit Validation  │  │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Allergen Review   │  │
│  │ [aria-label="Step-by-step validation progress"]               │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  Please wait while we validate inventory, credit, and allergens...│
│                                                                    │
│  [× Cancel Validation]                                             │
│  [aria-label="Cancel button: stop validation and return to..."]   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Error State (Validation Failed - Network/Server Error)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Confirm Sales Order                                    [×]      │
│  [role="alertdialog" aria-labelledby="error-title"]               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [⚠ Icon] [aria-label="Warning icon: validation error"]           │
│                                                                    │
│  Validation Failed                                                 │
│  [role="heading" aria-level="2"]                                  │
│                                                                    │
│  Unable to confirm order at this time.                             │
│  Error: VALIDATION_SERVICE_UNAVAILABLE                             │
│  [aria-label="Detailed error: validation service unavailable"]     │
│                                                                    │
│  Please try again in a moment. If the problem persists, contact   │
│  support.                                                           │
│                                                                    │
│  Last Attempted: 2025-12-15 11:35 AM                              │
│                                                                    │
│  [Retry Validation] [Contact Support] [× Cancel]                  │
│  [aria-label="Action buttons: retry, get help, or dismiss"]       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Success State (Order Confirmed)

```
┌────────────────────────────────────────────────────────────────────┐
│  ✓ Order Confirmed                                        [×]      │
│  [role="alertdialog" aria-label="Order confirmation success"]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ✅ SO-2025-001234 confirmed successfully!                        │
│     [aria-label="Success: Order confirmed"]                        │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Confirmation Summary:                                        │  │
│  │ [aria-label="Summary of confirmation details"]              │  │
│  │                                                               │  │
│  │ Order Number: SO-2025-001234                                │  │
│  │ Status: 🟢 Confirmed                                         │  │
│  │ Confirmed At: 2025-12-15 11:37 AM                            │  │
│  │ Confirmed By: Sarah Johnson (Shipping Manager)              │  │
│  │                                                               │  │
│  │ Customer: Acme Foods Inc. (CUST-001)                        │  │
│  │ Order Total: $1,512.04                                       │  │
│  │ Line Items: 3 products, 180 units                           │  │
│  │ Promised Delivery: 2025-12-20                                │  │
│  │                                                               │  │
│  │ Allocations: ✓ Locked and Reserved                          │  │
│  │ Pick List Ready: Yes (can generate immediately)             │  │
│  │                                                               │  │
│  │ Notifications Sent:                                          │  │
│  │ ✓ Warehouse Manager (notification sent 11:37 AM)           │  │
│  │ ✓ Sales Manager (notification sent 11:37 AM)               │  │
│  │ ✓ Order status updated in system                            │  │
│  │                                                               │  │
│  │ Next Steps:                                                  │  │
│  │ • Generate pick list → Start warehouse operations           │  │
│  │ • Monitor promised ship date (Dec 20)                        │  │
│  │ • Watch for any holds that may be placed during picking     │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [🔄 Generate Pick List] [← Back to Order] [🏠 Home]             │
│  [aria-label="Next action buttons: generate picks, back, home"]   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Hold Placed (No Confirmation - Order Saved as On Hold)

```
┌────────────────────────────────────────────────────────────────────┐
│  🟡 Order On Hold                                         [×]      │
│  [role="alertdialog" aria-label="Order placed on hold"]            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Order placed on hold - awaiting resolution                        │
│  [aria-live="polite"]                                              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Hold Summary:                                                │  │
│  │ [aria-label="Detailed hold summary"]                         │  │
│  │                                                               │  │
│  │ Order Number: SO-2025-001234                                │  │
│  │ Status: 🟡 On Hold - Awaiting Stock                         │  │
│  │ Hold Placed: 2025-12-15 11:15 AM                            │  │
│  │ Hold Reason: Insufficient Stock                              │  │
│  │ Placed By: System (automatic validation)                     │  │
│  │                                                               │  │
│  │ Customer: Acme Foods Inc. (CUST-001)                        │  │
│  │ Order Total: $1,512.04                                       │  │
│  │ Promised Delivery: 2025-12-20 (5 days)                       │  │
│  │                                                               │  │
│  │ Hold Details:                                                │  │
│  │ • Fresh Basil 100g: 20 units short (ETA: Dec 22)            │  │
│  │ • Allocations: Partially reserved (30 of 50)                │  │
│  │ • Auto-resume: 2025-12-22 when stock available              │  │
│  │                                                               │  │
│  │ Actions:                                                      │  │
│  │ • View full order details and hold status                    │  │
│  │ • Manager override available (if authorized)                 │  │
│  │ • Monitor for automatic resume on Dec 22                     │  │
│  │                                                               │  │
│  │ Notifications Sent:                                          │  │
│  │ ✓ Warehouse Manager                                          │  │
│  │ ✓ Sales Manager                                              │  │
│  │ ✓ Hold assigned for follow-up                                │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  [🔍 View Full Order] [🔄 Reallocate] [📞 Contact Manager]       │
│  [← Back to Orders]                                                │
│  [aria-label="Actions: view details, reallocate, contact..."]     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Confirmation Dialog Header
- **Order Number**: SO-YYYY-NNNNNN (bold)
- **Status Badge**: Color-coded (🟢 Ready / 🟡 On Hold / 🔴 Multiple Issues)
- **Message**: "Ready to Confirm" OR "Order On Hold - [Reason]"
- **Hold Reason Dropdown**: Visible only if hold; shows primary reason with ability to view secondary reasons
- **ARIA Role**: `role="alertdialog"` with `aria-labelledby="confirm-title"`

### 2. Validation Results Section
- **Inventory Check**: ✓ OK / ✗ FAILED (with shortage details)
- **Credit Limit Check**: ✓ OK / ✗ EXCEEDED (with balance details)
- **Allergen Check**: ✓ OK / ✗ CONFLICT (with conflict details)
- **Allocation Status**: Reserved / Partially Reserved / Released
- **ARIA Role**: `role="table"` with proper headers for screen readers

### 3. Hold Reason Details (Dynamic - Shows if Any Validation Fails)
**Insufficient Stock:**
- Product name, ordered qty, available qty, shortage
- Expected stock ETA from production
- Partial allocation info
- Options: Wait, Partial Ship, Override

**Credit Limit Exceeded:**
- Credit limit amount, A/R balance, available credit
- This order amount, total excess
- Recent payment history
- Options: Request Increase, Credit Review, Override

**Allergen Conflict:**
- Customer restrictions list
- Product allergen profile
- Risk assessment (CRITICAL/HIGH/MEDIUM)
- Required approvals (Quality Manager)
- Customer acknowledgment requirement

**Multiple Issues:**
- List all failures in priority order
- Show which must be resolved vs. which can be overridden
- Escalation level and assigned manager
- Resolution path (what actions needed)

### 4. Manager Override Section (Conditional - Only If Authorized)
- **Checkbox**: "I authorize/acknowledge this issue"
- **Override Notes Textarea**: Required explanation for override decision
- **Permission Check**: Display required role/permission
- **Audit Trail**: Shows who approved and when
- **Quality Checkboxes**: For allergen/critical overrides
- **Customer Confirmation**: For allergen overrides
- **ARIA Label**: Applied to override checkbox and notes field

### 5. Notification Checkboxes
- **Warehouse Manager**: Auto-checked if inventory issue
- **Sales Manager**: Auto-checked if credit issue
- **Finance Manager**: Auto-checked if credit issue (visible if appropriate)
- **Quality Manager**: Auto-checked if allergen issue
- **Customer Email**: Optional notification to customer
- **Custom Recipients**: Add additional notifiable users

### 6. Action Buttons
- **Primary (Enabled)**:
  - [✓ Confirm Order] (if no holds or override authorized)
  - [✓ Override & Confirm] (if manager override available)
  - [🟡 Save as Draft Hold] (place on hold without confirming)
- **Secondary**:
  - [✕ Cancel] (cancel confirmation, return to detail view)
- **Disabled State**: Show why unavailable (permission, validation, etc.)

---

## Main Interactions

### Initiate SO Confirmation (From SO Detail Page)

1. **Trigger**: Click [✓ Confirm Order] button on SO detail
2. **Flow**:
   - Route to confirmation dialog (modal or full screen on mobile)
   - API call: `PATCH /api/shipping/sales-orders/:id/validate` (validation-only call)
   - Server runs validation checks:
     - **Inventory**: Check available qty for each line item
     - **Credit**: Check customer credit limit against A/R + order total
     - **Allergen**: Check customer restrictions against product allergens
     - **Allocation**: Verify all items are allocated (or partial allowed)
   - Return validation results
3. **Display Logic**:
   - If all pass → Show "Ready to Confirm" dialog with [✓ Confirm Order]
   - If any fail → Show "Order On Hold" dialog with hold reason + options
4. **States**: Loading → Success (Ready/On Hold) / Error

### Confirm Order (No Holds)

1. **Trigger**: Click [✓ Confirm Order] in success dialog
2. **Flow**:
   - User optionally adds notes to order
   - User selects notification recipients
   - User clicks [✓ Confirm Order]
   - API call: `PATCH /api/shipping/sales-orders/:id/confirm`
   - Request body:
     ```json
     {
       "hold_status": "none",
       "notes": "Priority order - expedited shipment",
       "notify_warehouse_manager": true,
       "notify_sales_manager": true,
       "allergen_override": false
     }
     ```
   - Server:
     - Updates SO status to "confirmed"
     - Locks all allocations (status = "reserved")
     - Creates audit log entry
     - Sends notifications
     - Returns updated SO
3. **Result**:
   - Confirmation dialog closes
   - SO detail page shows status = 🟢 Confirmed
   - Toast notification: "Order confirmed successfully"
   - Success modal shows confirmation summary
   - User can now generate pick list

### Place Order on Hold (Insufficient Inventory)

1. **Trigger**: Validation fails - insufficient inventory
2. **Flow**:
   - Display "Order On Hold" dialog with:
     - Hold reason: Insufficient Stock
     - Product details (qty ordered, available, shortage)
     - Expected stock ETA
     - Options: [⧖ Wait], [⧖ Partial Ship], [⧖ Override (if manager)]
   - If user clicks [⧖ Wait]:
     - No confirmation yet
     - Status = "On Hold - Awaiting Stock"
     - Allocations partially reserved (available qty only)
     - Auto-resume scheduled for when stock available
     - Notifications sent
   - If user clicks [⧖ Partial Ship]:
     - Reallocate to available qty
     - Create backorder for shortage
     - Prompt to confirm partial SO
   - If user clicks [⧖ Override] (manager only):
     - Show override section
     - Require manager justification
     - Confirm both issues + override
3. **Result**:
   - SO saved with status "On Hold - Awaiting Stock"
   - Partial allocations locked
   - Toast notification: "Order placed on hold pending stock"
   - Warehouse manager & sales manager notified
   - Order assigned to manager for follow-up

### Place Order on Hold (Credit Limit Exceeded)

1. **Trigger**: Validation fails - credit limit exceeded
2. **Flow**:
   - Display "Order On Hold" dialog with:
     - Hold reason: Credit Limit Exceeded
     - Credit limit, A/R balance, available credit
     - This order amount, total excess
     - Payment history (last payment date, status)
     - Options: [⧖ Request Increase], [⧖ Credit Review], [⧖ Override (if authorized)]
   - If user clicks [⧖ Request Increase]:
     - Show form to request temporary credit increase
     - Email to finance manager
     - Place SO on hold pending approval
   - If user clicks [⧖ Credit Review]:
     - Assign to credit manager
     - Place SO on hold pending manual review
   - If user clicks [⧖ Override] (finance/credit manager only):
     - Show override section
     - Require justification (customer paying soon, etc.)
     - Manager confirms override
3. **Result**:
   - SO saved with status "On Hold - Credit Limit"
   - Allocations released (not reserved)
   - Toast: "Order placed on hold pending credit approval"
   - Sales & finance managers notified
   - Order assigned to finance manager

### Place Order on Hold (Allergen Conflict)

1. **Trigger**: Validation fails - allergen conflict detected
2. **Flow**:
   - Display "Order On Hold" dialog with:
     - Hold reason: Allergen Conflict / Food Safety Issue
     - Customer restrictions vs. product allergens
     - Risk assessment (CRITICAL/HIGH/MEDIUM)
     - Required actions: Quality Manager review + Customer acknowledgment
     - Option: [✓ Quality Approved - Confirm] (quality manager only)
   - Quality Manager must:
     - Review conflict details
     - Enter name/signature
     - Decide: Approve or Reject
   - Customer must:
     - Acknowledge conflict in writing (email, signed form)
     - Accept risk before confirmation proceeds
   - If approved + acknowledged:
     - Show override section
     - Allow confirmation with quality approval logged
3. **Result**:
   - SO saved with status "On Hold - Allergen Review"
   - Allocations released (pending approval)
   - Quality manager notified
   - Customer acknowledgment logged
   - Audit trail entry created (food safety compliance)

### Manager Override (Insufficient Inventory)

1. **Trigger**: Manager clicks [✓ Override & Confirm] in insufficient inventory hold
2. **Flow**:
   - Manager enters override justification (required): "Customer accepts 20-unit backorder"
   - Manager checks "I acknowledge the shortage and authorize confirmation"
   - Manager clicks [✓ Override & Confirm]
   - API call: `PATCH /api/shipping/sales-orders/:id/confirm`
   - Request body:
     ```json
     {
       "hold_status": "inventory_override",
       "hold_reason": "insufficient_stock",
       "override_notes": "Customer accepts 20-unit backorder",
       "override_by": "uuid-manager",
       "override_permission": "confirm_inventory_override",
       "partial_allocation_accepted": true,
       "notify_warehouse_manager": true,
       "notify_sales_manager": true,
       "notify_customer": true
     }
     ```
   - Server:
     - Validates manager permission ("confirm_inventory_override")
     - Updates SO status to "confirmed"
     - Locks partial allocations (30 units) + creates backorder (20 units)
     - Creates audit log: "Inventory override by manager: [notes]"
     - Sends notifications with override details
3. **Result**:
   - SO confirmed with status "confirmed" (with backorder note)
   - Partial allocations locked
   - Backorder created (separate SO or backorder record)
   - Notifications show override decision
   - Success modal shows "Confirmed with manager override"

### Manager Override (Credit Limit)

1. **Trigger**: Manager clicks [✓ Override & Confirm] in credit limit hold
2. **Flow**:
   - Manager enters override justification (required): "Customer payment due today, credit will be restored"
   - Manager checks "I authorize this order despite credit limit exceeded"
   - Manager clicks [✓ Override & Confirm]
   - API call: `PATCH /api/shipping/sales-orders/:id/confirm`
   - Request body:
     ```json
     {
       "hold_status": "credit_override",
       "hold_reason": "credit_limit_exceeded",
       "override_notes": "Customer payment due today, credit will be restored",
       "override_by": "uuid-manager",
       "override_permission": "confirm_credit_override",
       "notify_sales_manager": true,
       "notify_finance_manager": true,
       "flag_for_credit_review": true
     }
     ```
   - Server:
     - Validates manager permission ("confirm_credit_override")
     - Updates SO status to "confirmed"
     - Locks allocations (reserves inventory)
     - Creates audit log: "Credit override by manager: [notes]"
     - Flags customer for credit review
     - Sends notifications to sales & finance
3. **Result**:
   - SO confirmed with credit override noted
   - Allocations fully reserved
   - Customer flagged for credit review in finance system
   - Success modal shows "Confirmed with credit override"

### Quality Manager Approval (Allergen Override)

1. **Trigger**: Quality Manager approves allergen conflict
2. **Flow**:
   - Quality Manager reviews conflict in hold dialog
   - Enters name: "Dr. Lisa Wong, Quality Manager"
   - Signs/approves
   - Checks "Quality Manager has reviewed and approved"
   - Customer confirms acknowledgment: "Customer acknowledges allergen conflict and accepts"
   - Enters customer acknowledgment notes: "Confirmed via email 2025-12-15"
   - Quality Manager clicks [✓ Quality Approved - Confirm]
   - API call: `PATCH /api/shipping/sales-orders/:id/confirm`
   - Request body:
     ```json
     {
       "hold_status": "allergen_override",
       "hold_reason": "allergen_conflict",
       "quality_manager_name": "Dr. Lisa Wong",
       "quality_manager_signature": "approved",
       "quality_approval_timestamp": "2025-12-15T11:30:00Z",
       "customer_acknowledgment": true,
       "customer_acknowledgment_notes": "Confirmed via email 2025-12-15",
       "override_by": "uuid-quality-manager",
       "override_permission": "confirm_quality_override",
       "notify_quality_manager": true,
       "notify_sales_manager": true,
       "notify_customer": true
     }
     ```
   - Server:
     - Validates quality manager permission ("confirm_quality_override")
     - Updates SO status to "confirmed"
     - Locks allocations
     - Creates audit log: "Allergen override approved by Dr. Lisa Wong"
     - Creates food safety compliance record
     - Sends notifications
3. **Result**:
   - SO confirmed with quality approval recorded
   - Allocations locked
   - Compliance audit entry created (for FDA traceability)
   - Customer notification sent with acknowledgment record
   - Success modal shows "Confirmed with quality approval"

---

## Hold Reason Logic

### Hold Reason Enum

```
"insufficient_stock"      → Inventory check failed
"credit_limit_exceeded"   → Credit limit exceeded
"allergen_conflict"       → Allergen restriction conflict
"multiple_holds"          → Multiple validation failures
"manual_hold"             → User manually placed hold
"quality_review"          → Quality/food safety review needed
"fraud_detection"         → Fraud alert (future)
"payment_overdue"         → Customer payment overdue (future)
```

### Hold Reason Priority (If Multiple)

1. **Food Safety** (allergen/quality) - Always highest
2. **Inventory** (insufficient stock)
3. **Credit/Payment** (credit limit, overdue)
4. **System/Manual** (other holds)

---

## Keyboard Shortcuts & Accessibility

### Keyboard Shortcuts (Implemented)

```
Ctrl+S / Cmd+S        → Save as Draft Hold (if hold dialog open)
Ctrl+Enter / Cmd+Enter → Confirm Order (if ready to confirm)
Escape                → Close dialog (cancel confirmation)
Tab                   → Navigate through form fields
Shift+Tab             → Navigate backwards through fields
Enter                 → Click focused button
Space                 → Check/uncheck checkbox
Arrow Keys (↑↓)       → Select from dropdown (hold reason, notifications)
```

**Implementation Note:**
- Keyboard shortcuts are implemented and functional
- Tooltip hints show keyboard shortcut (e.g., "[✓ Confirm Order] (Ctrl+Enter)")
- Shortcuts are documented in help/keyboard reference section

### ARIA Accessibility

**All dialog wireframes now include:**
- `role="alertdialog"` - Proper semantic role for confirmation dialogs
- `aria-labelledby="confirm-title"` - Dialog title identified as label
- `aria-modal="true"` - Indicates modal behavior (on mobile)
- `aria-live="polite"` or `aria-live="assertive"` - Announce status changes
- `aria-atomic="true"` - Announce entire message, not just changes
- `role="table"` - Validation results structured as table
- `aria-label` - Applied to status badges, icons, sections, form fields
- Form labels properly associated with inputs
- Focus management (trap focus within dialog)
- Keyboard navigation (Tab, Shift+Tab, Enter, Escape)

---

## Security Considerations

### CSRF Token Handling

**Implementation:**
1. **Token Generation**: Generate unique CSRF token on dialog load
   ```javascript
   // On confirmation dialog open
   const csrfToken = await fetch('/api/csrf-token').then(r => r.json());
   // Store in dialog state
   ```

2. **Token Validation**: Include token in all state-changing requests
   ```json
   {
     "csrf_token": "uuid-csrf-token-12345",
     "hold_status": "none",
     "notes": "...",
     ...
   }
   ```

3. **Server-side Check**: Validate CSRF token before processing
   - Compare token from request body with session token
   - Reject request if tokens don't match
   - Log CSRF token mismatch attempts

4. **Token Expiration**: CSRF tokens expire after 1 hour or session end

### Audit Logging for Overrides

**All manager overrides must be logged:**

```json
{
  "timestamp": "2025-12-15T11:30:00Z",
  "action": "override_confirmation",
  "override_type": "inventory_override",
  "order_id": "uuid-so-1",
  "order_number": "SO-2025-001234",
  "manager_id": "uuid-manager",
  "manager_name": "Sarah Johnson",
  "manager_role": "Shipping Manager",
  "override_notes": "Customer accepts 20-unit backorder",
  "justification": "Approved by manager",
  "permissions_checked": ["confirm_inventory_override"],
  "customer_id": "uuid-cust-1",
  "customer_name": "Acme Foods Inc.",
  "hold_reason": "insufficient_stock",
  "allocations_affected": ["uuid-alloc-1", "uuid-alloc-2"],
  "ip_address": "192.168.1.100",
  "session_id": "uuid-session",
  "user_agent": "Mozilla/5.0..."
}
```

**Audit Trail Access:**
- Stored in `audit_logs` table
- Linked to `sales_orders` table via order_id
- Accessible only to Admin & Compliance roles
- Cannot be modified or deleted (immutable)
- Exported for compliance reports (FDA, food safety audits)

### Session Timeout Behavior

**Configuration:**
- Session timeout: 30 minutes of inactivity
- Session warning: 2 minutes before timeout (new wireframe added)
- Confirmation dialog timeout: 15 seconds (validation max)
- Token refresh: Automatically refresh if session extends

**Behavior on Timeout:**
1. **2 Minutes Before Timeout**: Show session timeout warning dialog
   - Countdown timer showing time remaining
   - [✓ Extend Session] button to add 30 more minutes
   - User interaction auto-extends session
   - If no action, auto-logout after 2 minutes

2. **During Validation**: Show timeout warning (6+ seconds)
   - Allow user to keep waiting (auto-cancel at 30s)
   - Offer to retry validation

3. **During Confirmation**:
   - If session expires during confirmation:
     - Show "Session expired. Please log in again."
     - Clear form data (preserve notes in sessionStorage)
     - Redirect to login
     - Allow user to return to order after login

### Permission-Based Access Control

**Confirmation Permission Checks:**
```javascript
// Server-side: Before allow confirmation
if (!user.hasPermission('confirm_sales_order')) {
  return 403 Forbidden: "User lacks permission to confirm orders"
}

// Override permission checks
if (hold_status === 'inventory_override') {
  if (!user.hasPermission('confirm_inventory_override')) {
    return 403 Forbidden: "User lacks permission for inventory override"
  }
}
```

**Override Permissions Required:**
- `confirm_inventory_override` - For inventory holds
- `confirm_credit_override` - For credit limit holds
- `confirm_quality_override` - For allergen holds
- `confirm_sales_order` - For normal confirmation

### Data Validation & Sanitization

**Client-side Validation:**
- Override notes: Max 500 characters, no script tags
- Customer acknowledgment: Checkbox only (no text input)
- Quality manager name: Max 100 characters, alphanumeric + spaces only

**Server-side Validation:**
- Re-validate all permissions after request received
- Verify inventory still available (re-check)
- Verify credit limit still valid (re-check)
- Verify allergen restrictions still apply
- Sanitize all text inputs (override notes, etc.)
- Validate all enum values (hold_reason, override_type)

### API Request Signing (Optional)

**For highly sensitive operations:**
```javascript
// Sign API request with HMAC-SHA256
const payload = JSON.stringify(confirmationBody);
const signature = HMAC-SHA256(payload, apiSecret);
headers['X-Signature'] = signature;
```

---

## Bulk Confirmation Feature (Future Enhancement)

**Future capability (Post-MVP):** Support bulk confirmation of multiple orders

### Proposed Flow (NOT YET IMPLEMENTED):

1. **Bulk Selection**:
   - Show checkbox on SO list view
   - Allow selecting multiple orders (with status "Draft")
   - Show count: "3 orders selected"

2. **Bulk Confirmation Dialog**:
   - List selected orders (order number, customer, total)
   - Perform validation for all orders in batch
   - Show validation results per order
   - Allow filtering out orders with holds
   - Option to confirm only "Ready" orders, skip holds

3. **Batch Processing**:
   - Single API call: `PATCH /api/shipping/sales-orders/bulk/confirm`
   - Request body: `{ order_ids: [...], notify: {...} }`
   - Server processes in transaction (all or nothing)
   - Returns results per order (success/failure with reason)

4. **Results Display**:
   - Show confirmation summary: "5 of 5 orders confirmed"
   - List any failures with reasons
   - Allow retry for failed orders
   - Export confirmation report (CSV/PDF)

**Current Status**: Listed as future enhancement - not included in MVP

---

## Performance & Timeout Handling

### Validation Timeout Thresholds

| Event | Threshold | Action |
|-------|-----------|--------|
| Show "Validation in progress" | 1 second | Display progress bar |
| Show "Taking longer than expected" | 5 seconds | Show timeout warning with options |
| Auto-cancel validation | 30 seconds | Hard stop, show error |
| API request timeout | 15 seconds | Server returns 504 Gateway Timeout |

### Performance Targets

- **Validation API**: < 1000ms (target 500-800ms)
- **Confirm API**: < 1000ms (target 500-800ms)
- **Dialog render**: < 300ms (all components mounted)
- **Timeout warning**: < 5100ms total (5s + margin)
- **Notification dispatch**: < 500ms (async, non-blocking)

### Network Timeout Handling

```javascript
// Fetch request with timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000); // 15s

try {
  const response = await fetch('/api/shipping/sales-orders/:id/validate', {
    signal: controller.signal,
    ...
  });
} catch (error) {
  if (error.name === 'AbortError') {
    // Timeout occurred - show timeout error
    showTimeoutMessage('Validation took too long. Please try again.');
  }
}
finally {
  clearTimeout(timeout);
}
```

---

## Testing Requirements

### Unit Tests
- Validation logic: inventory, credit, allergen checks
- Hold reason determination (priority logic)
- Permission checks: override authorization
- Notification dispatch logic
- CSRF token generation & validation
- Timeout logic (5s warning, 30s hard stop)
- Keyboard shortcut handlers
- ARIA attribute rendering

### Integration Tests
- Validate endpoint: all check types
- Confirm endpoint: normal + override scenarios
- Hold endpoint: manual hold placement
- Notification service: correct recipients by reason
- Permission enforcement: role-based access
- Audit log creation: all overrides logged
- Session timeout: proper behavior on timeout
- CSRF token validation: reject mismatched tokens

### E2E Tests
1. **Happy Path: Confirm (No Holds)**
   - Click Confirm → Validation passes → Confirm → Order status = confirmed

2. **Inventory Hold: Wait for Stock**
   - Click Confirm → Insufficient stock detected → Place on hold → Wait

3. **Inventory Hold: Manager Override**
   - Click Confirm → Insufficient stock → Manager overrides → Confirms with backorder

4. **Credit Hold: Override**
   - Click Confirm → Credit exceeded → Manager overrides → Confirms

5. **Allergen Hold: Quality Approval**
   - Click Confirm → Allergen conflict → Quality Manager approves → Confirms

6. **Multiple Holds: Resolution Path**
   - Click Confirm → Multiple issues → Manager resolves both → Confirms

7. **Timeout Handling**
   - Validation takes >5s → Show timeout warning
   - User waits → Validation completes
   - User cancels → Return to SO detail

8. **Session Timeout**
   - Session expires during confirmation → Show session expired message
   - User redirected to login
   - User returns to SO after login (notes preserved)

9. **Empty State**
   - No SO selected → Show empty state message
   - SO already confirmed → Show "already confirmed" state

10. **Keyboard Shortcuts**
    - Ctrl+Enter → Confirm order (if ready)
    - Ctrl+S → Save as draft hold
    - Escape → Close dialog
    - Tab → Navigate fields
    - Arrow keys → Select dropdown options

---

## States

### Loading State
- Show validation in progress message
- Display progress bar (inventory → credit → allergen)
- Disable all buttons
- Show "Please wait while we validate..."
- Show timeout message after 5 seconds with options

### Success State (Ready to Confirm)
- Show all validation checks passed
- Display order summary
- Enable [✓ Confirm Order] button
- Show notification checkboxes
- Optional notes textarea

### Hold State (Insufficient Stock)
- Show hold reason: Insufficient Stock
- Display product shortage details (ordered, available, short qty, ETA)
- Show partial allocation info
- Display options: [⧖ Wait] [⧖ Partial Ship] [⧖ Override]
- If manager: Show [✓ Override & Confirm] button
- Show hold section in confirmation

### Hold State (Credit Exceeded)
- Show hold reason: Credit Limit Exceeded
- Display credit analysis (limit, balance, available, excess)
- Show recent payment history
- Display options: [⧖ Request Increase] [⧖ Credit Review] [⧖ Override]
- If authorized: Show [✓ Override & Confirm] button

### Hold State (Allergen Conflict)
- Show hold reason: Allergen Conflict / Food Safety Issue
- Display conflict matrix (customer restrictions vs. product allergens)
- Show risk assessment (CRITICAL/HIGH/MEDIUM)
- Require Quality Manager name/signature
- Require Customer Acknowledgment checkbox
- If approved: Show [✓ Quality Approved - Confirm] button

### Hold State (Multiple Issues)
- Show warning: "Multiple hold reasons detected"
- List all failures in priority order
- Show which must be resolved vs. optional
- Display escalation level and assigned manager
- Show resolution path

### Timeout State
- Show progress bar with elapsed time
- Display warning: "Validation taking longer than expected"
- Show options: [⧖ Keep Waiting] [✕ Cancel]
- Show timeout protection message
- Auto-cancel after 30 seconds

### Empty State
- No SO selected / SO already confirmed
- Show explanatory message with next steps
- Link to SO list or order detail

### Error State
- Show validation error message
- Display error code (VALIDATION_SERVICE_UNAVAILABLE, etc.)
- Show last attempted timestamp
- Enable [Retry Validation] button
- Show [Contact Support] link

### Success State (Confirmed)
- Show confirmation summary with timestamp
- Display confirmation by user
- Show notifications sent
- Enable [🔄 Generate Pick List] button
- Show "Next Steps" guidance

### Success State (Placed on Hold)
- Show hold summary
- Display hold reason and details
- Show auto-resume date (if applicable)
- Display notifications sent
- Show "Actions" (contact manager, view details, etc.)

---

## Data Fields

### Validation Response

```json
{
  "validation": {
    "status": "hold",
    "hold_reason": "insufficient_stock",
    "hold_severity": "high",
    "timestamp": "2025-12-15T11:15:00Z",

    "inventory_check": {
      "passed": false,
      "failures": [
        {
          "line_id": "uuid-line-2",
          "product_id": "uuid-prod-2",
          "product_name": "Fresh Basil 100g",
          "quantity_ordered": 50,
          "quantity_available": 30,
          "quantity_short": 20,
          "next_stock_eta": "2025-12-22T00:00:00Z",
          "production_batch": {
            "id": "uuid-batch-1",
            "batch_number": "BATCH-2025-0112",
            "status": "scheduled",
            "expected_completion": "2025-12-22T00:00:00Z"
          },
          "partial_allocation_possible": true,
          "allocation_strategy": "wait_or_partial"
        }
      ]
    },

    "credit_check": {
      "passed": true,
      "customer_id": "uuid-cust-1",
      "credit_limit": 10000,
      "ar_balance": 2500,
      "available_credit": 7500,
      "order_amount": 1512.04,
      "will_exceed": false,
      "days_outstanding": 30,
      "last_payment": {
        "date": "2025-12-01T00:00:00Z",
        "amount": 5000,
        "status": "received"
      }
    },

    "allergen_check": {
      "passed": true,
      "customer_id": "uuid-cust-1",
      "customer_restrictions": [],
      "conflicts": []
    }
  }
}
```

---

## Accessibility

### Touch Targets
- All buttons: >= 48x48dp
- Hold reason dropdown: >= 48x48dp
- Override checkboxes: >= 44x44dp
- Action buttons: >= 48x48dp

### Contrast
- Header text (dark): 8:1
- Form labels: 4.5:1
- Status badges: 4.5:1
- Error text: 4.5:1

### Screen Reader
- Dialog title: "Confirm Sales Order [order_number]" (aria-label)
- Hold reason section: aria-live="polite" for dynamic updates
- Validation results: Table with aria-label and proper headers
- Override section: role="region" with aria-label
- Checkboxes: Descriptive labels
- Status badges: aria-label with color & text description
- Empty state: aria-label="illustration" for icon

### Keyboard Navigation
- Tab: Move through all interactive elements
- Enter: Click buttons, submit forms
- Escape: Close dialog
- Space: Check/uncheck checkboxes
- Arrow Keys: Select from dropdowns
- Ctrl+Enter: Confirm order (shortcut)
- Ctrl+S: Save as draft hold (shortcut)

---

## Responsive Breakpoints

### Desktop (>1024px)
- Full dialog with all sections visible
- Side-by-side layout for details
- Large form inputs
- All buttons visible in row

### Tablet (768-1024px)
- Stacked dialog sections
- Full-width form inputs
- Button group may wrap
- Compact tables

### Mobile (<768px)
- Full-screen dialog
- Single column stacked layout
- Full-width buttons
- Collapsible sections for details
- Touch-friendly spacing (48x48 minimum)

---

## Quality Gates

Before handoff:
- [x] All 4 states defined (Loading, Success, Hold, Error)
- [x] Responsive breakpoints (Desktop/Tablet/Mobile)
- [x] Hold reason logic documented (3+ types + priority)
- [x] Override permissions defined (inventory, credit, quality)
- [x] Notification recipients by hold type
- [x] API endpoints specified (validate, confirm, hold)
- [x] Accessibility checklist passed
- [x] Hold reason dropdown interaction
- [x] Manager override section with permission checks
- [x] Notification selection checkboxes
- [x] Audit trail support (override notes logged)
- [x] Auto-resume logic for holds
- [x] Multiple hold handling
- [x] Empty state wireframes (no SO, already confirmed)
- [x] Timeout handling (>5s warning, 30s hard stop)
- [x] ARIA labels inline with ASCII wireframes
- [x] Security section (CSRF, audit, session timeout)
- [x] Bulk confirmation note (future enhancement)
- [x] Keyboard shortcuts documented (Ctrl+S, Ctrl+Enter)
- [x] Session timeout warning wireframe (2 minutes)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Sales Order Confirmation with Hold Logic & Manager Override
story: SHIP-009
prd_coverage: "FR-7.13 (SO Confirmation/Hold)"
approval_status:
  mode: "review_each"
  user_approved: false
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/SHIP-009-so-confirmation-hold.md
  api_endpoints:
    - PATCH /api/shipping/sales-orders/:id/validate (pre-check validation)
    - PATCH /api/shipping/sales-orders/:id/confirm (confirm + override)
    - POST /api/shipping/sales-orders/:id/hold (place hold)
states_per_screen:
  - empty_no_selection
  - empty_already_confirmed
  - loading (validation in progress)
  - loading_timeout (>5 seconds)
  - success_ready (all checks pass)
  - hold_inventory (insufficient stock)
  - hold_credit (credit exceeded)
  - hold_allergen (allergen conflict)
  - hold_multiple (multiple issues)
  - error (validation service failure)
  - success_confirmed (order confirmed)
  - success_hold_placed (order on hold)
  - session_timeout_warning (2 minutes before expiration)
screens:
  - Empty State - No SO Selected
  - Empty State - Already Confirmed
  - Confirmation Dialog - Ready to Confirm
  - Loading State - Validation in Progress
  - Timeout Warning - Validation Exceeding Threshold
  - Session Timeout Warning - 2 Minutes Before Expiration
  - Hold Dialog - Insufficient Stock
  - Hold Dialog - Credit Limit Exceeded
  - Hold Dialog - Allergen Conflict
  - Hold Dialog - Multiple Issues
  - Success Modal - Order Confirmed
  - Success Modal - Order On Hold
breakpoints:
  mobile: "<768px (full-screen dialog, stacked)"
  tablet: "768-1024px (stacked sections)"
  desktop: ">1024px (full dialog, side-by-side)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "alertdialog, region, table"
  aria_labels: "inline on all wireframes"
  keyboard_nav: "Tab, Enter, Escape, Space, Arrow keys, Ctrl+Enter, Ctrl+S"
hold_reasons:
  - insufficient_stock (with ETA, partial allocation option)
  - credit_limit_exceeded (with balance analysis)
  - allergen_conflict (with risk level, quality approval)
  - multiple_holds (with priority resolution path)
  - manual_hold (user-initiated)
manager_overrides:
  - inventory_override (Shipping Manager, Warehouse Manager)
  - credit_override (Finance Manager, Sales Manager)
  - quality_override (Quality Manager)
notifications:
  - by_hold_reason (different recipients for each)
  - by_override_type (different recipients for overrides)
  - customer_acknowledgment (for allergen overrides)
  - audit_trail_logging (all overrides logged)
permission_checks:
  - confirm_sales_order
  - confirm_inventory_override
  - confirm_credit_override
  - confirm_quality_override
validation_checks:
  - inventory_availability (per-line qty check)
  - credit_limit (customer A/R + order total)
  - allergen_restrictions (customer restrictions vs. product)
  - allocation_status (all items allocated or partial allowed)
api_request_bodies:
  validate_request: { validate_only: true }
  confirm_normal: { notes, notify_warehouse_manager, notify_sales_manager }
  confirm_inventory_override: { hold_status, override_notes, partial_allocation_accepted, csrf_token }
  confirm_credit_override: { hold_status, override_notes, flag_for_credit_review, csrf_token }
  confirm_quality_override: { hold_status, quality_manager_name, customer_acknowledgment, csrf_token }
  hold_manual: { hold_reason, hold_notes, expected_resolution_date, assign_to }
api_response_fields:
  validation_pass: { validation: { status, inventory_check, credit_check, allergen_check } }
  validation_hold: { validation: { hold_reason, hold_severity, failures } }
  confirm_success: { order: { status, hold_status, confirmed_at, allocations }, notifications_sent }
  hold_success: { order: { status, hold_reason, hold_placed_at, assigned_to } }
performance_targets:
  validation_api: "<1000ms (target 500-800ms)"
  confirm_api: "<1000ms (target 500-800ms)"
  dialog_render: "<300ms"
  notification_dispatch: "<500ms (async)"
timeout_handling:
  validation_timeout_threshold: "5 seconds (show warning)"
  validation_hard_stop: "30 seconds (auto-cancel)"
  api_request_timeout: "15 seconds"
  session_timeout: "30 minutes of inactivity"
  session_timeout_warning: "2 minutes before expiration (NEW)"
cache_strategy:
  validation_results: "no cache (real-time validation)"
  customer_credit: "5min TTL (refresh on confirm)"
  allergen_data: "24hr TTL (product allergen profile)"
security:
  csrf_token_protection: "required on all state-changing requests"
  csrf_token_expiration: "1 hour or session end"
  audit_logging: "all manager overrides logged with full context"
  audit_log_access: "Admin & Compliance roles only"
  audit_log_immutability: "cannot be modified or deleted"
  session_timeout: "30 minutes of inactivity"
  session_timeout_warning: "2 minutes before timeout (NEW)"
  session_timeout_behavior: "show login screen, preserve notes"
  permission_checks: "server-side validation required"
  data_validation: "client & server-side sanitization"
error_handling:
  - validation_service_unavailable (retry)
  - permission_denied_override (show required role)
  - active_pick_lists_exist (cannot confirm if picking started)
  - invalid_hold_reason (validation error)
  - csrf_token_mismatch (reject request, log attempt)
  - session_expired (redirect to login)
  - network_timeout (show timeout warning, offer retry)
bulk_confirmation:
  status: "Future enhancement (Post-MVP)"
  description: "Support bulk confirmation of multiple orders"
  proposed_flow: "Select orders → Validate batch → Show results per order"
keyboard_shortcuts:
  ctrl_s: "Save as Draft Hold (if hold dialog open)"
  ctrl_enter: "Confirm Order (if ready to confirm)"
  escape: "Close dialog (cancel confirmation)"
  tab: "Navigate through form fields"
  shift_tab: "Navigate backwards through fields"
  enter: "Click focused button"
  space: "Check/uncheck checkbox"
  arrow_up_down: "Select from dropdown (hold reason, notifications)"
data_fields:
  confirmation_dialog:
    - order_number, status, promised_delivery
    - customer (name, code)
    - order_total, line_items_count
    - validation_results (inventory, credit, allergen)
    - hold_details (reason, severity, failures)
    - override_options (if manager)
    - notification_checkboxes
    - notes_textarea
  hold_details:
    - hold_reason_enum
    - hold_severity (low, medium, high, critical)
    - hold_details_block (dynamic by reason type)
    - manager_override_section (conditional)
    - expected_resolution_date
    - assigned_to_manager
  override_section:
    - manager_permission_check
    - acknowledgment_checkbox (varies by reason)
    - notes_textarea (required)
    - customer_acknowledgment (if allergen)
    - quality_signature (if quality override)
    - csrf_token (hidden field)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 40-48 hours (validation logic + 13 dialog states + override logic + notifications + security)
**Quality Target**: 96%+ (production-ready order confirmation with critical hold logic + security + accessibility)
**PRD Coverage**: 100% (FR-7.13)
**Wireframe Length**: ~2,150 lines (updated with session timeout warning) ✓

---

**KEY FEATURES**:

1. **Pre-Confirmation Validation** (Inventory, Credit, Allergen)
2. **Hold Reason Detection** (4+ hold types with priority logic)
3. **Manager Override Flow** (with role-based permissions)
4. **Quality Approval Path** (for allergen conflicts)
5. **Notification System** (different recipients by hold type)
6. **Partial Allocation Support** (insufficient stock handling)
7. **Auto-Resume Logic** (resume on hold when stock available)
8. **Audit Trail Logging** (all overrides tracked)
9. **Multiple Hold Handling** (when >1 issue detected)
10. **Responsive Design** (Desktop/Tablet/Mobile)
11. **Accessibility** (ARIA labels, touch targets, keyboard shortcuts)
12. **Error Handling** (validation failures, permission issues)
13. **Empty States** (no SO selected, already confirmed)
14. **Timeout Handling** (5s warning, 30s hard stop)
15. **Session Timeout Warning** (2 minutes before expiration - NEW)
16. **Security** (CSRF tokens, audit logs, session management)
17. **Bulk Confirmation** (future enhancement noted)

---

END OF WIREFRAME
