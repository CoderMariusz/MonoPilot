# Purchase Orders User Guide

## Overview

The Purchase Order module helps you create, manage, and track purchase orders for suppliers. You can create purchase orders in draft status, add line items with products and pricing, and submit them for confirmation. The system automatically calculates totals, manages status transitions, and provides a complete audit trail of all changes.

This guide covers all common workflows for working with purchase orders in MonoPilot.

## Quick Start

### Creating a Purchase Order

1. Navigate to **Planning** > **Purchase Orders**
2. Click **New Purchase Order** button
3. Select a supplier from the dropdown (required)
4. Select the warehouse for delivery (required)
5. Enter the expected delivery date (required, must be today or later)
6. Add optional payment terms or shipping method
7. Click **Save as Draft**

The system automatically:
- Generates a unique PO number (PO-YYYY-NNNNN format, example: PO-2025-00001)
- Inherits currency and payment terms from the supplier
- Sets status to "Draft"

### Adding Line Items to a Purchase Order

Once you've created a PO, you can add line items:

1. Click the **Add Line** button in the Lines section
2. Search for and select a product
3. Enter the quantity (required)
4. Enter the unit price (required)
5. Optionally enter:
   - Discount percentage (0-100)
   - Expected delivery date for this line
   - Notes
6. Click **Add Line**

The system automatically:
- Calculates line subtotal (quantity × unit price)
- Calculates discount amount
- Calculates line total after discount
- Applies tax based on supplier's tax code
- Updates PO totals in real-time

### Editing Line Items

To edit a line item:

1. Find the line in the Lines table
2. Click the **Edit** icon (pencil) on the right
3. Update the quantity, unit price, or discount
4. Click **Save**

**Note**: You can only edit lines when the PO status is "Draft" or "Submitted". Once a PO is "Confirmed" or "Receiving", lines are locked.

### Deleting Line Items

To remove a line from a PO:

1. Find the line in the Lines table
2. Click the **Delete** icon (trash) on the right
3. Confirm the deletion

**Note**: You can only delete lines when the PO status is "Draft" or "Submitted".

## Status Lifecycle

Purchase orders follow a defined status workflow:

```
Draft → Submitted → Confirmed → Receiving → Closed
   ↓         ↓           ↓           ↓          ↓
   └─────────────────────────────────────────Cancelled
```

### Status Descriptions

| Status | Meaning | Can Edit? | Can Delete? |
|--------|---------|-----------|------------|
| **Draft** | Initial status, PO is being prepared | Yes | Yes |
| **Submitted** | PO submitted for review/approval | Partially | No |
| **Confirmed** | PO approved and confirmed with supplier | No | No |
| **Receiving** | Goods are being received against this PO | No | No |
| **Closed** | PO fully received or completed | No | No |
| **Cancelled** | PO was cancelled (no longer valid) | No | No |

### Submitting a Purchase Order

When your PO is ready:

1. Open the PO detail page
2. Review all lines and totals
3. Click **Submit for Approval** button
4. The system validates:
   - PO has at least one line item
   - All required fields are filled
5. Status changes to "Submitted"

### Confirming a Purchase Order

Once approved (if approval is required):

1. Click **Confirm PO** button
2. Supplier is now notified of the order
3. Status changes to "Confirmed"

### Cancelling a Purchase Order

To cancel a PO before receiving:

1. Click **Cancel PO** button
2. Optionally enter a cancellation reason
3. Click **Confirm**
4. Status changes to "Cancelled"

**Note**: You cannot cancel a PO that has been fully received.

## Viewing Purchase Orders

### List View

The Purchase Orders list shows:

- **PO Number**: Unique identifier (PO-YYYY-NNNNN)
- **Supplier**: Name of the supplier
- **Status**: Current status with color coding
- **Total**: PO total amount in the supplier's currency
- **Expected Delivery**: Delivery date
- **Created**: When the PO was created

### Filters and Search

You can filter the list by:

- **Search**: Search by PO number or supplier name
- **Status**: Filter by single status (Draft, Submitted, Confirmed, etc.)
- **Supplier**: Filter by supplier
- **Warehouse**: Filter by receiving warehouse
- **Date Range**: Filter by expected delivery date

### KPI Cards

At the top of the list, you see summary cards:

- **Total Orders**: Count of all POs
- **Draft**: Count of Draft status POs
- **Awaiting Approval**: Count of Submitted POs
- **Active**: Count of Confirmed + Receiving POs

### Detail View

Click any PO to view full details:

- **Header**: PO number, supplier, warehouse, dates, status
- **Lines Tab**: All line items with products and pricing
- **History Tab**: Status change audit trail
- **Documents Tab**: Attached files (future feature)

## Pricing and Currency

### Price Lookup

When adding a line, the system can pre-fill unit prices from:

1. **Supplier Product Price** (if configured in supplier settings)
2. **Product Standard Price** (fallback)
3. **Manual entry** (you can override any price)

### Currency

POs are created in the supplier's currency and cannot be changed after creation. To order in a different currency, create a new PO with a supplier in that currency.

Supported currencies: PLN, EUR, USD, GBP

### Discount

You can apply a percentage discount on any line:

- Discount percentage is calculated on the line subtotal
- Discount amount is shown in the table
- Line total = Subtotal - Discount - (applies to totals calculation)

## Totals and Tax

### Automatic Calculation

The system automatically calculates:

- **Subtotal**: Sum of all line totals before discount
- **Discount Total**: Sum of all line discounts
- **Tax Amount**: Applied based on supplier's tax code
- **Total**: Subtotal - Discount + Tax

### Tax Codes

Tax is applied at the PO level based on the supplier's assigned tax code:

- Each supplier has a default tax code
- Tax rate is applied to all line items
- Tax code can be overridden when creating the PO
- Tax recalculates automatically when lines change

## Common Workflows

### Creating a Quote-to-Order Flow

1. Create a new PO in Draft status
2. Add all required lines
3. Review totals and pricing
4. Submit for approval (if required)
5. Confirm when supplier confirms
6. Once goods arrive, status moves to Receiving

### Bulk Update of Delivery Dates

To change the expected delivery date for the entire PO:

1. Edit the PO (only in Draft or Submitted status)
2. Change the "Expected Delivery Date" field
3. Click **Update**
4. All lines without a specific line-level date inherit this date

### Tracking PO History

To see all changes made to a PO:

1. Open the PO detail page
2. Click the **History** tab
3. View all status changes with timestamps and user information

## Permissions

Your ability to perform actions depends on your role:

| Action | Purchaser | Buyer | Manager | Viewer |
|--------|-----------|-------|---------|--------|
| Create PO | Yes | Yes | Yes | No |
| Edit Draft PO | Yes | Yes | Yes | No |
| Submit PO | Yes | Yes | Yes | No |
| Confirm PO | No | Yes | Yes | No |
| Cancel PO | Yes | Yes | Yes | No |
| View All | Yes | Yes | Yes | Yes |
| Delete Draft PO | Yes | Yes | Yes | No |

## Error Messages

### "PO must have at least one line"

You tried to submit a PO with no line items. Add at least one product line before submitting.

### "Cannot edit PO in Closed or Receiving status"

POs in Closed or Receiving status are locked for editing. If you need to modify the order, contact your manager to reopen it.

### "Cannot add lines to PO in Closed or Receiving status"

The PO status prevents adding new lines. Create a new PO if you need additional items.

### "Supplier not found"

The selected supplier no longer exists. Select a different supplier.

### "Warehouse not found"

The selected warehouse no longer exists. Select a different warehouse.

### "Expected delivery date must be today or later"

You entered a past date. Enter a date today or in the future.

## Tips and Best Practices

1. **Always review totals**: Before submitting, verify that the total is correct and all lines are included.

2. **Use clear notes**: Add line notes for any special instructions or delivery requirements.

3. **Leverage supplier defaults**: Set up supplier payment terms and tax codes once so they auto-populate on new POs.

4. **Archive completed POs**: Once a PO is fully received and closed, it no longer appears in draft/active filters.

5. **Set realistic delivery dates**: Choose expected delivery dates that account for supplier lead times.

6. **Monitor awaiting approval**: Keep an eye on the "Awaiting Approval" card to catch POs pending approval.

7. **Use search for quick lookup**: The search function finds POs by number or supplier name quickly.

## Frequently Asked Questions

### Q: Can I edit a PO after submitting it?

A: Yes, you can edit POs in Draft or Submitted status. Once Confirmed, the PO is locked.

### Q: What happens if I cancel a PO?

A: The PO status changes to Cancelled and all line items are preserved for record-keeping. No goods should be received against a cancelled PO.

### Q: Can I create a PO without a warehouse?

A: No, warehouse is required to know where goods will be received.

### Q: What is the PO number format?

A: PO numbers follow the format PO-YYYY-NNNNN (example: PO-2025-00001). Each organization gets its own numbering sequence per year.

### Q: Can I duplicate an existing PO?

A: This feature is planned for a future release. For now, you can create a new PO and manually add the same lines.

### Q: How do I export a PO?

A: Export functionality is available through the Documents/Attachments feature (coming soon).

---

**Last Updated**: January 2, 2026
**Module**: Planning - Story 03.3
**For Help**: Contact your Administrator or MonoPilot Support
