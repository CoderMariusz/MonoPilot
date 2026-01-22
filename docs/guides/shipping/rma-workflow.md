# RMA (Returns) Workflow Guide

**Story:** 07.16 - RMA Core CRUD + Approval
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

Return Merchandise Authorization (RMA) is the process for managing customer returns. This guide covers the complete RMA workflow from creation through approval to closure.

## Prerequisites

Before you begin:

- Customer must exist in the system (Story 07.1)
- Products must exist in product master (Epic 02)
- User must have `sales`, `manager`, `admin`, or `owner` role to create RMAs
- User must have `manager`, `admin`, or `owner` role to approve RMAs

## RMA Workflow Overview

```
+--------+    +----------+    +-----------+    +----------+    +-----------+    +--------+
| Create | -> | Pending  | -> | Approved  | -> | Receiving| -> | Received  | -> | Closed |
+--------+    +----------+    +-----------+    +----------+    +-----------+    +--------+
                  ^
                  |
              Edit/Delete
              (allowed here)
```

## Step 1: Navigate to RMA Module

1. From the main navigation, go to **Shipping > RMA Returns**
2. The RMA list page displays all RMAs for your organization
3. Use filters to find specific RMAs:
   - **Status:** pending, approved, receiving, received, processed, closed
   - **Customer:** Filter by customer name
   - **Date Range:** Filter by creation date
   - **Search:** Find by RMA number (e.g., RMA-2026-00001)

## Step 2: Create New RMA

### Open Create Form

1. Click **Create RMA** button in the top right
2. The RMA creation form opens

### Enter RMA Header Information

| Field | Required | Description |
|-------|----------|-------------|
| Customer | Yes | Select the customer returning products |
| Sales Order | No | Link to original sales order (if applicable) |
| Reason Code | Yes | Why the products are being returned |
| Disposition | No | What to do with returned products (auto-suggested based on reason) |
| Notes | No | Additional details about the return |

### Reason Codes Explained

| Reason | Description | Default Disposition |
|--------|-------------|---------------------|
| **Damaged** | Products damaged during shipping or storage | Scrap |
| **Expired** | Products past expiration date | Scrap |
| **Wrong Product** | Incorrect product shipped to customer | Restock |
| **Quality Issue** | Product quality below standards | Quality Hold |
| **Customer Change** | Customer changed their mind | Restock |
| **Other** | Other reason (specify in notes) | (none) |

### Add RMA Lines

At least one line is required to create an RMA.

1. Click **Add Line** button
2. Enter line details:

| Field | Required | Description |
|-------|----------|-------------|
| Product | Yes | Select the product being returned |
| Quantity Expected | Yes | Number of units expected to receive |
| Lot Number | No | Lot/batch number for traceability |
| Reason Notes | No | Specific notes about this line item |
| Disposition | No | Override RMA-level disposition for this line |

3. Click **Add** to save the line
4. Repeat for additional products

### Save RMA

1. Review all information
2. Click **Create RMA**
3. RMA is created with:
   - Status: `pending`
   - Auto-generated RMA number (RMA-YYYY-NNNNN)
4. You are redirected to the RMA detail page

## Step 3: Review and Edit Pending RMA

While an RMA is in `pending` status, you can:

### Edit RMA Header

1. Click **Edit RMA** button
2. Modify reason code, disposition, or notes
3. Click **Save**

**Note:** RMA number and customer cannot be changed after creation.

### Edit RMA Lines

1. Click the **Edit** icon on a line row
2. Modify quantity, lot number, reason notes, or disposition
3. Click **Save**

### Delete Lines

1. Click the **Delete** icon on a line row
2. Confirm deletion
3. Line is removed from RMA

### Add More Lines

1. Click **Add Line** button
2. Enter line details
3. Click **Add**

### Delete Entire RMA

1. Click **Delete RMA** button
2. Confirm deletion
3. RMA and all lines are deleted
4. You are redirected to the RMA list

## Step 4: Approve RMA

**Required Role:** Manager, Admin, or Owner

### Approval Prerequisites

- RMA must be in `pending` status
- RMA must have at least one line item

### Approve Process

1. Open the RMA detail page
2. Review all lines and details
3. Click **Approve** button
4. Confirm in the dialog: "Approve this RMA? This will enable receiving workflow."
5. RMA status changes to `approved`

### What Approval Does

- Sets status to `approved`
- Records `approved_at` timestamp
- Records `approved_by` user ID
- Locks the RMA from further editing
- Enables receiving workflow (Story 07.17)

### Approval Info Display

After approval, the detail page shows:
- "Approved by [User Name] on [Date/Time]"
- All edit/delete buttons are disabled
- Status badge shows "Approved" in green

## Step 5: Close RMA (Future)

**Required Role:** Manager, Admin, or Owner

After all processing is complete, an RMA can be closed:

1. Open the RMA detail page
2. Click **Close RMA** button
3. Confirm closure
4. Status changes to `closed`

**Note:** RMAs can only be closed from `approved`, `receiving`, `received`, or `processed` status.

## Viewing RMA Details

The RMA detail page displays:

### Header Section

- RMA number with status badge
- Customer name (linked to customer record)
- Sales order number (if linked)
- Reason code badge
- Disposition badge
- Notes
- Created date and user
- Approval info (if approved)

### Lines Section

| Column | Description |
|--------|-------------|
| Product | Product name and code |
| Qty Expected | Quantity customer is returning |
| Qty Received | Quantity actually received (Story 07.17) |
| Lot Number | Batch/lot identifier |
| Reason Notes | Line-specific notes |
| Disposition | Line-level disposition (if different from RMA) |
| Actions | Edit/Delete (if pending) |

## Status Reference

| Status | Description | Actions Available |
|--------|-------------|-------------------|
| `pending` | Newly created, awaiting review | Edit, Delete, Approve |
| `approved` | Approved, ready for receiving | Close |
| `receiving` | Receiving in progress | Close |
| `received` | All items received | Close |
| `processed` | Dispositions complete | Close |
| `closed` | Finalized | None |

## Disposition Reference

| Disposition | Description | Inventory Impact |
|-------------|-------------|------------------|
| `restock` | Return to saleable inventory | Creates new LP (Story 07.18) |
| `scrap` | Dispose of product | Records waste transaction |
| `quality_hold` | Hold for QC inspection | Creates QC hold (Epic 06) |
| `rework` | Send for reprocessing | Creates rework WO |

## Best Practices

### Creating RMAs

1. Always link to the original sales order when possible for traceability
2. Include lot numbers for food safety tracking
3. Use specific reason notes to help with root cause analysis
4. Review disposition suggestions but adjust as needed

### Approving RMAs

1. Verify customer and product information
2. Check quantities against original order
3. Confirm disposition is appropriate
4. Review notes for any special handling instructions

### Managing Returns

1. Process pending RMAs promptly
2. Monitor approved RMAs waiting for receiving
3. Close RMAs after all processing is complete
4. Use filters to track RMAs by status

## Troubleshooting

### Cannot Create RMA

**Problem:** Error when trying to create RMA

**Solutions:**
1. Verify you have `sales`, `manager`, `admin`, or `owner` role
2. Ensure customer is selected
3. Ensure at least one line is added
4. Check that products exist and are active

### Cannot Edit RMA

**Problem:** Edit button is disabled

**Solutions:**
1. Check RMA status - only `pending` RMAs can be edited
2. Verify you have appropriate role permissions
3. If RMA has received quantities, editing is blocked

### Cannot Approve RMA

**Problem:** Approve button not visible

**Solutions:**
1. Verify you have `manager`, `admin`, or `owner` role
2. Check RMA status - must be `pending`
3. Ensure RMA has at least one line item

### Cannot Delete RMA

**Problem:** Delete button is disabled

**Solutions:**
1. Check RMA status - only `pending` RMAs can be deleted
2. Once approved, RMAs cannot be deleted (only closed)

## Integration with Other Modules

### Shipping (Epic 07)

- RMAs can be linked to Sales Orders
- Customer information pulled from Customers module

### Warehouse (Epic 05)

- Story 07.17: Receiving workflow creates license plates for returned items
- Story 07.18: Disposition processing handles putaway and inventory updates

### Quality (Epic 06)

- `quality_hold` disposition triggers QC workflow
- Quality findings may change final disposition

### Finance (Epic 09)

- Phase 3: Credit memo generation for processed returns
- Return value tracking for financial reporting

## Related Documentation

- [RMA API Reference](../../api/shipping/rma.md)
- [Customer Management Guide](./customer-management.md)
- [Sales Order Workflow](./sales-order-workflow.md)

---

## Support

**Story:** 07.16
**Last Updated:** 2026-01-22
