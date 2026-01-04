# PO Status Configuration - Administrator Guide

**Story:** 03.7 - PO Status Lifecycle (Configurable Statuses)
**Audience:** System Administrators, Operations Managers
**Version:** 1.0
**Last Updated:** 2026-01-02

## Overview

This guide explains how administrators can customize purchase order status workflows to match your organization's procurement process. You can:

- Add custom statuses for your unique workflow
- Configure which status transitions are allowed
- Reorder statuses for better UX
- Track complete status history for every PO

---

## Prerequisites

To access PO Status configuration, you must have one of these roles:
- **Owner**
- **Admin**
- **Super Admin**

Users with **Planner** or **Viewer** roles cannot access this page.

---

## Accessing Status Configuration

1. Navigate to **Settings** in the main menu
2. Click **Planning** in the settings sidebar
3. Select **PO Statuses**

**URL:** `/settings/planning/po-statuses`

---

## Understanding Default Statuses

Every new organization starts with 7 default statuses:

| Status | Color | Description | System Status |
|--------|-------|-------------|---------------|
| **Draft** | Gray | PO is being prepared | Yes |
| **Submitted** | Blue | PO has been submitted for processing | Yes |
| **Pending Approval** | Yellow | PO is awaiting approval | No (can customize) |
| **Confirmed** | Green | PO has been confirmed by supplier | Yes |
| **Receiving** | Purple | Goods are being received | Yes |
| **Closed** | Emerald | PO is complete | Yes |
| **Cancelled** | Red | PO has been cancelled | Yes |

### What is a System Status?

**System statuses** are core to MonoPilot's workflow and cannot be deleted or renamed. You can:
- ✅ Change their color
- ✅ Change their display order
- ❌ Change their name
- ❌ Delete them

**Why?** System statuses are referenced in code and integrations. Changing their names or deleting them would break functionality.

**Non-system statuses** (like Pending Approval) can be fully customized or deleted if not in use.

---

## Adding a Custom Status

### When to Add Custom Statuses

Consider adding custom statuses for:
- **Vendor-specific workflows**: "Awaiting Vendor Confirmation", "Vendor Review"
- **Compliance steps**: "Compliance Review", "Legal Approval"
- **Internal processes**: "Manager Approval", "Budget Verification"
- **Multi-location workflows**: "Transfer in Transit", "Awaiting Pickup"

### Steps to Add a Status

1. Click **+ Add Status** button
2. Fill in the form:
   - **Code**: Unique identifier (lowercase, underscores only)
     - ✅ Good: `awaiting_vendor`, `manager_approval`, `legal_review`
     - ❌ Bad: `Awaiting Vendor`, `manager-approval`, `_draft`
   - **Name**: Display name shown to users
     - Example: "Awaiting Vendor Confirmation"
   - **Color**: Choose from 11 badge colors (see color guide below)
   - **Display Order**: Position in dropdowns (leave blank to add at end)
   - **Description**: Optional explanation of when to use this status
3. Click **Save**

### Status Code Rules

- Must start with a lowercase letter
- Can contain lowercase letters, numbers, and underscores
- 2-50 characters
- **Must be unique** within your organization
- Cannot be changed after creation (immutable)

**Why is code immutable?** Status codes are stored in historical records and changing them would break audit trails.

---

## Editing Statuses

### Edit a Custom Status

1. Click the **Edit** icon (pencil) next to the status
2. Modify fields:
   - **Name**: Change display name
   - **Color**: Update badge color
   - **Display Order**: Change position in lists
   - **Description**: Update or add description
3. Click **Save**

### Edit a System Status

For system statuses, you can only edit:
- **Color**: Change badge appearance
- **Display Order**: Reorder in dropdowns

The **Name** field will be disabled with a warning: "System statuses cannot be renamed".

---

## Deleting Statuses

### When Can You Delete a Status?

You can delete a status only if:
1. ✅ It is **not a system status**
2. ✅ **No POs** are currently using it

### Steps to Delete

1. Click the **Delete** icon (trash) next to the status
2. Review the confirmation dialog
3. Click **Confirm Delete**

### If Delete is Blocked

**Error:** "Cannot delete. 5 POs use this status. Change their status first."

**Solution:**
1. Go to **Planning > Purchase Orders**
2. Filter by the status you want to delete
3. Change each PO to a different status
4. Return to status configuration and delete

**Tip:** Use bulk actions to change multiple POs at once (future feature).

### System Status Delete Attempts

If you try to delete a system status, you'll see:
- Delete icon is disabled/hidden
- Tooltip: "System statuses cannot be deleted"

---

## Reordering Statuses

Status order affects:
- **Dropdown menus** on PO forms
- **Filter lists** in PO tables
- **Default sort order** in reports

### Drag-to-Reorder

1. Hover over a status row
2. Click and hold the **drag handle** (⋮⋮ icon)
3. Drag the row to new position
4. Release to drop
5. Auto-saves immediately

**Example:** Move "Pending Approval" from position 3 to position 2 (between Draft and Submitted).

### Manual Reorder (Alternative)

1. Click **Reorder** button
2. Use up/down arrows or input fields
3. Click **Save Order**

---

## Choosing Status Colors

11 colors available, each with semantic meaning:

| Color | CSS Preview | Best For |
|-------|-------------|----------|
| **Gray** | <span style="background:#e5e7eb; color:#1f2937; padding:2px 8px; border-radius:4px;">Gray</span> | Draft, inactive, initial state |
| **Blue** | <span style="background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:4px;">Blue</span> | Submitted, in progress, active |
| **Yellow** | <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px;">Yellow</span> | Pending, awaiting action, attention |
| **Green** | <span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px;">Green</span> | Confirmed, approved, success |
| **Purple** | <span style="background:#e9d5ff; color:#6b21a8; padding:2px 8px; border-radius:4px;">Purple</span> | Receiving, active work, processing |
| **Emerald** | <span style="background:#d1fae5; color:#065f46; padding:2px 8px; border-radius:4px;">Emerald</span> | Closed, completed, final |
| **Red** | <span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:4px;">Red</span> | Cancelled, rejected, error |
| **Orange** | <span style="background:#fed7aa; color:#9a3412; padding:2px 8px; border-radius:4px;">Orange</span> | Warning, review needed, vendor action |
| **Amber** | <span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px;">Amber</span> | Caution, conditional approval |
| **Teal** | <span style="background:#ccfbf1; color:#115e59; padding:2px 8px; border-radius:4px;">Teal</span> | Info, special handling |
| **Indigo** | <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:4px;">Indigo</span> | Priority, VIP, special |

**Color Changes Apply Immediately:** All existing POs using the status will show the new color.

---

## Configuring Status Transitions

### What Are Transitions?

Transitions define **which status changes are allowed**. For example:
- ✅ `draft → submitted` (allowed)
- ❌ `confirmed → draft` (not allowed)

### Default Transition Rules

| From Status | Allowed To |
|-------------|------------|
| Draft | Submitted, Cancelled |
| Submitted | Pending Approval, Confirmed, Cancelled |
| Pending Approval | Confirmed, Cancelled |
| Confirmed | **Receiving** (auto), Cancelled |
| Receiving | **Closed** (auto), Cancelled |

**System Transitions** (bold) are auto-triggered:
- `Confirmed → Receiving`: When first receipt is recorded
- `Receiving → Closed`: When all items are fully received

### Steps to Configure Transitions

1. Click **Configure Transitions** (gear icon) next to a status
2. Modal opens showing "Allowed Transitions from [Status]"
3. Checkboxes for all other statuses:
   - ✅ Checked = Transition allowed
   - ☐ Unchecked = Transition blocked
   - 🔒 Disabled = System-required (cannot change)
4. Check/uncheck desired transitions
5. Click **Save**

### Example: Add Custom Transition

**Scenario:** Add "Vendor Review" status between Submitted and Confirmed.

1. Create "Vendor Review" status (code: `vendor_review`, color: orange)
2. Configure transitions for **Submitted**:
   - Check: Pending Approval, **Vendor Review**, Cancelled
   - (Removes: Confirmed)
3. Configure transitions for **Vendor Review**:
   - Check: Confirmed, Cancelled
4. Save both

**Result:** Workflow is now `Submitted → Vendor Review → Confirmed`

### Transition Validation Errors

**Self-Loop Error:**
- Cannot allow `draft → draft`
- System prevents transitioning to the same status

**System Transition Locked:**
- Cannot remove `confirmed → receiving` (system-required)
- Checkbox will be disabled with tooltip

---

## Business Rules

### Cannot Submit Without Line Items

**Rule:** POs cannot transition to `submitted` or `pending_approval` if they have zero line items.

**User Experience:**
1. User tries to change status to "Submitted"
2. Validation error: "Cannot submit PO without line items"
3. Must add at least one line item first

**Why?** Prevents submitting empty POs to suppliers.

### High-Value PO Warning

**Rule:** POs with total > $10,000 show a warning during status change.

**User Experience:**
1. User changes status of $15,000 PO
2. Warning dialog: "PO total exceeds $10,000. Continue?"
3. User can proceed or cancel

**Why?** Alerts users to high-value transactions that may need extra approval.

### Cannot Delete Status in Use

**Rule:** Statuses used by any POs cannot be deleted.

**User Experience:**
1. Admin tries to delete "Vendor Review"
2. Error: "Cannot delete. 5 POs use this status. Change their status first."
3. Must reassign those 5 POs before deleting

**Why?** Prevents orphaning POs with invalid statuses.

---

## Viewing Status History

Every status change is tracked for audit purposes.

### On PO Detail Page

1. Navigate to **Planning > Purchase Orders > [PO Number]**
2. Scroll to **Status History** section
3. Timeline shows all changes:
   - **From** status → **To** status
   - **When** (timestamp with timezone)
   - **Who** (user name or "System")
   - **Notes** (if provided)

### Example Timeline

```
Dec 5, 2024 9:00 AM - System
  Confirmed → Receiving
  "Auto-transitioned: first receipt recorded"

Dec 2, 2024 2:00 PM - John Doe
  Submitted → Confirmed
  "Supplier confirmed order via email"

Dec 2, 2024 11:30 AM - Jane Smith
  Draft → Submitted
  "Ready for vendor"

Dec 1, 2024 10:00 AM - Jane Smith
  (created) → Draft
  "PO created"
```

### Filter POs by Status History

**Use Case:** Find all POs that were cancelled in the last month.

1. Go to **Planning > Purchase Orders**
2. Click **Advanced Filters**
3. Add filter: "Status History Contains: Cancelled"
4. Date range: Last 30 days

*(Future feature - not yet implemented)*

---

## Common Workflows

### Workflow 1: Simple Approval

**Steps:** Draft → Submitted → Confirmed → Receiving → Closed

**Configuration:**
- Draft → Submitted, Cancelled
- Submitted → Confirmed, Cancelled
- Confirmed → Receiving (auto), Cancelled
- Receiving → Closed (auto)

**Use Case:** Small org, no formal approval process.

---

### Workflow 2: Manager Approval

**Steps:** Draft → Submitted → Pending Approval → Confirmed → Receiving → Closed

**Configuration:**
1. Default configuration (already includes Pending Approval)
2. Train planners to use "Pending Approval" for POs > $1,000
3. Managers review and change to "Confirmed"

**Use Case:** Medium org with spending limits.

---

### Workflow 3: Multi-Step Approval

**Steps:** Draft → Submitted → Manager Approval → Budget Approval → Confirmed → Receiving → Closed

**Configuration:**
1. Create custom statuses:
   - `manager_approval` (yellow)
   - `budget_approval` (amber)
2. Configure transitions:
   - Submitted → Manager Approval, Cancelled
   - Manager Approval → Budget Approval, Cancelled
   - Budget Approval → Confirmed, Cancelled
3. Set up approval workflows (Story 03.5b - future)

**Use Case:** Large org with multi-tier approvals.

---

### Workflow 4: Vendor Coordination

**Steps:** Draft → Submitted → Awaiting Vendor → Confirmed → Receiving → Closed

**Configuration:**
1. Create custom status: `awaiting_vendor` (orange)
2. Configure transitions:
   - Submitted → Awaiting Vendor, Cancelled
   - Awaiting Vendor → Confirmed, Cancelled
3. Add notes when transitioning to "Awaiting Vendor" (e.g., "Sent quote request")

**Use Case:** Orgs that wait for vendor quotes/confirmations.

---

## Troubleshooting

### Problem: Cannot See Status Configuration Page

**Symptoms:**
- 403 Forbidden error
- Redirect to dashboard
- Toast: "Admin access required"

**Solution:**
- Check your role in **Settings > Users > [Your Name]**
- If Planner or Viewer, ask an Admin to upgrade your role
- Only Owner/Admin/Super Admin can access status configuration

---

### Problem: Status Not Appearing in Dropdown

**Symptoms:**
- Added custom status
- Not showing in PO status dropdown

**Possible Causes:**
1. **Not Active:** Status has `is_active = false`
   - Solution: Edit status, check "Active" checkbox
2. **No Transition Rule:** Current PO status has no transition to custom status
   - Solution: Configure transitions (see above)
3. **Cache Issue:** Browser cached old status list
   - Solution: Hard refresh (Ctrl+Shift+R)

---

### Problem: Cannot Delete Custom Status

**Error:** "Cannot delete. 3 POs use this status. Change their status first."

**Solution:**
1. Note the PO count (3 in this example)
2. Go to **Planning > Purchase Orders**
3. Filter by status: Select the custom status
4. For each PO:
   - Open PO detail
   - Change status to another valid status
   - Save
5. Return to status configuration
6. Delete custom status (should now succeed)

**Tip:** Export the PO list first so you can track which ones were changed.

---

### Problem: System Status Won't Delete

**Symptoms:**
- Delete icon is grayed out
- Tooltip: "System statuses cannot be deleted"

**Explanation:**
- This is by design
- System statuses (Draft, Submitted, Confirmed, Receiving, Closed, Cancelled) are core to MonoPilot
- You cannot delete them

**Workaround:**
- If you don't use a system status, simply don't configure any transitions TO it
- It will effectively be hidden from users (cannot be selected)

---

### Problem: Transition Checkbox is Disabled

**Symptoms:**
- Trying to configure transitions for "Confirmed"
- Checkbox for "Receiving" is disabled (locked icon)
- Tooltip: "System-required transition"

**Explanation:**
- `Confirmed → Receiving` is auto-triggered when first receipt is recorded
- This transition cannot be removed (system enforces it)

**Workaround:**
- None - this is by design for warehouse integration

---

## Best Practices

### 1. Keep It Simple

**Anti-pattern:** 15 custom statuses with complex transitions
- Hard for users to understand
- Slows down workflow
- Maintenance burden

**Best practice:** 7-10 total statuses
- Clear, distinct purposes
- Linear workflow when possible
- Document each custom status

---

### 2. Use Descriptive Names

**Anti-pattern:** "Status 1", "Review", "Pending"

**Best practice:**
- "Awaiting Vendor Confirmation" (clear who is waiting)
- "Manager Approval Required" (clear action needed)
- "Budget Verification in Progress" (clear what is happening)

---

### 3. Color Code Consistently

**Pattern:**
- Gray = Initial/draft
- Blue = Submitted/in progress
- Yellow/Amber = Awaiting action
- Green = Approved/success
- Red = Cancelled/error
- Purple = Active processing

**Why?** Users learn to recognize status at a glance.

---

### 4. Document Custom Statuses

**Best practice:**
- Use the **Description** field for every custom status
- Example: "Awaiting Vendor Confirmation - Use when PO is sent to vendor and we are waiting for them to confirm availability and pricing"
- Consider creating a wiki page with your org's status workflow diagram

---

### 5. Audit Status Changes Regularly

**Best practice:**
- Monthly review of status history
- Look for patterns:
  - Are POs getting stuck in certain statuses?
  - Are statuses being skipped?
  - Are cancelled POs increasing?
- Adjust workflow as needed

---

### 6. Train Users on New Statuses

**When adding custom statuses:**
1. Send email notification to all Planners
2. Update internal documentation
3. Provide examples of when to use new status
4. Monitor adoption (check status history)

---

## FAQ

**Q: Can I rename a status code after creation?**
A: No, status codes are immutable. You can change the display name, but not the code. This preserves historical data integrity.

**Q: What happens to old POs if I delete a custom status?**
A: You cannot delete a status that is in use. You must first change all POs to a different status.

**Q: Can I restore a deleted status?**
A: No, deletions are permanent. If you delete a custom status, you'll need to recreate it (with the same code) to restore it.

**Q: How many custom statuses can I add?**
A: No hard limit, but we recommend 10-15 total statuses max for usability.

**Q: Can different organizations have the same status code?**
A: Yes, status codes are unique per organization. Org A and Org B can both have `awaiting_vendor`.

**Q: Who can change PO statuses?**
A: Any authenticated user with Planner role or above can change PO statuses (within allowed transitions). Viewers cannot.

**Q: Can I require approval for certain status changes?**
A: Not yet. This feature is planned for Story 03.5b (PO Approval Workflow).

**Q: Can I automate status changes based on events?**
A: Partially. System transitions (Confirmed → Receiving, Receiving → Closed) are automated. Custom automation is planned for Phase 2.

**Q: Can I export status configuration?**
A: Not currently. Future feature for backup/restore.

**Q: Can I undo a status change?**
A: No automatic undo, but you can manually change the status back. The history will show both transitions.

---

## Related Documentation

- [API Documentation](../api/po-status-lifecycle.md) (for developers)
- [Database Schema](./po-status-database.md) (for developers)
- [Service Layer](./po-status-service.md) (for developers)
- [Story 03.7 Specification](../2-MANAGEMENT/epics/current/03-planning/03.7.po-status-lifecycle.md)

---

## Support

**Questions?** Contact your system administrator or MonoPilot support:
- **Email:** support@monopilot.com
- **Docs:** https://docs.monopilot.com
- **Chat:** In-app support widget

**Feature Requests:** Submit via **Settings > Feedback** or email support@monopilot.com
