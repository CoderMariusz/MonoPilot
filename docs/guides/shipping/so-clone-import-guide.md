# SO Clone/Import User Guide

**Story:** 07.5 - SO Clone/Template + CSV Import
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

This guide explains how to quickly create sales orders by cloning existing orders or importing from CSV files. These features reduce order entry time from 5 minutes to under 30 seconds for repeat customers and bulk order creation.

**Who is this for:**
- Sales clerks creating repeat orders
- Sales managers handling bulk imports
- Data migration specialists
- System administrators setting up customer orders

---

## What You Can Do

### Clone Orders

Copy an existing sales order to create a new draft order instantly:

- **Same customer** - Customer and shipping address copied
- **Same products** - All line items with quantities and prices copied
- **Fresh start** - New order number, reset dates, cleared quantities
- **Any status** - Clone draft, confirmed, or even cancelled orders

### Import Orders

Create multiple orders at once from a CSV file:

- **Bulk creation** - Import hundreds of orders in seconds
- **Multi-customer** - One file creates separate orders per customer
- **Validation** - Preview errors before importing
- **Migration** - Perfect for legacy data import

---

## Prerequisites

Before using clone/import features:

1. **Proper role** - You need `sales`, `manager`, `admin`, or `owner` role
2. **For import:**
   - Customers must already exist in the system
   - Products must already exist in the system
   - CSV file in correct format

---

## Clone Order Workflow

### Step 1: Open Source Order

1. Navigate to **Shipping > Sales Orders**
2. Click on the order you want to clone
3. The order detail page opens

### Step 2: Click Clone

1. Locate the **Clone Order** button in the top-right area
2. Click the button
3. A confirmation dialog appears:
   > "Clone this order? A new draft order will be created with the same customer and products."

### Step 3: Confirm Clone

1. Review the confirmation message
2. Click **Clone** to proceed
3. The system creates the new order

### Step 4: Edit New Order

1. You are automatically redirected to the new order
2. A toast notification confirms: "Cloned from SO-2025-00123"
3. The new order is in **draft** status
4. Review and update as needed:
   - Enter new **Customer PO** number
   - Set **Promised Ship Date**
   - Adjust quantities or prices
   - Add or remove lines

### Step 5: Confirm When Ready

1. Make any necessary changes
2. Click **Confirm Order** when ready
3. The order moves to confirmed status

---

## What Gets Cloned

### Preserved

| Field | Behavior |
|-------|----------|
| Customer | Same customer |
| Shipping Address | Same address |
| Products | All line products |
| Quantities Ordered | Same quantities |
| Unit Prices | Same prices |
| Discounts | Same discounts |
| Line Notes | Same notes |
| Order Notes | Same notes |

### Reset

| Field | New Value |
|-------|-----------|
| Order Number | New auto-generated (SO-YYYY-NNNNN) |
| Status | 'draft' |
| Order Date | Today |
| Customer PO | Cleared (must re-enter) |
| Promised Ship Date | Cleared |
| Required Delivery Date | Cleared |
| Allergen Validated | false (must re-validate) |
| Quantities Allocated | 0 |
| Quantities Picked | 0 |
| Quantities Packed | 0 |
| Quantities Shipped | 0 |
| Line Numbers | Renumbered 1, 2, 3... |

---

## CSV Import Workflow

### Step 1: Prepare CSV File

Create a CSV file with your order data. The file must have:

**Required columns:**
- `customer_code` - Customer code (e.g., "ACME001")
- `product_code` - Product code (e.g., "FLOUR-25KG")
- `quantity` - Quantity to order (e.g., 100)

**Optional columns:**
- `unit_price` - Price per unit (defaults to product standard price)
- `customer_po` - Customer PO reference
- `promised_ship_date` - Promised ship date (YYYY-MM-DD)
- `required_delivery_date` - Required delivery date (YYYY-MM-DD)
- `notes` - Order or line notes

**Example CSV:**

```csv
customer_code,product_code,quantity,unit_price,customer_po,notes
ACME001,FLOUR-25KG,100,10.50,PO-12345,Rush order
ACME001,SUGAR-10KG,50,25.00,,
BETA002,FLOUR-25KG,200,10.00,PO-67890,Standard delivery
BETA002,SALT-1KG,150,2.50,,
GAMMA003,FLOUR-25KG,300,9.50,,Bulk order
```

This CSV creates 3 orders:
- ACME001: 2 lines (flour + sugar)
- BETA002: 2 lines (flour + salt)
- GAMMA003: 1 line (flour)

### Step 2: Open Import Dialog

1. Navigate to **Shipping > Sales Orders**
2. Click the **Import Orders** button
3. The import dialog opens

### Step 3: Upload File

1. Drag and drop your CSV file onto the upload area
   - Or click **Browse** to select the file
2. The file must be .csv format, max 5MB
3. The system parses and validates the file

### Step 4: Review Preview

After upload, a preview table displays:

| Row | Customer | Product | Qty | Price | Status |
|-----|----------|---------|-----|-------|--------|
| 1 | ACME001 | FLOUR-25KG | 100 | $10.50 | Valid |
| 2 | ACME001 | SUGAR-10KG | 50 | $25.00 | Valid |
| 3 | BETA002 | FLOUR-25KG | 200 | $10.00 | Valid |
| 4 | INVALID | FLOUR-25KG | 100 | $10.00 | Error: Customer not found |

- **Green checkmark** = Valid row, will be imported
- **Red X** = Invalid row with error message

### Step 5: Import Valid Rows

1. Review the preview carefully
2. Note any errors - fix them in your CSV and re-upload if needed
3. Click **Import X Orders** button
4. The system creates orders for all valid rows

### Step 6: Review Results

After import completes, a summary displays:

```
Import Complete

2 orders created
3 lines imported
1 row skipped due to errors

Created Orders:
- SO-2026-00100 (ACME001) - 2 lines
- SO-2026-00101 (BETA002) - 1 line

Errors:
- Row 4: Customer 'INVALID' not found

[View Orders] [Close]
```

Click **View Orders** to see your newly created orders filtered by today's date.

---

## CSV Format Details

### Column Requirements

| Column | Required | Type | Max Length | Description |
|--------|----------|------|------------|-------------|
| `customer_code` | Yes | string | 100 | Must match existing customer |
| `product_code` | Yes | string | 100 | Must match existing product |
| `quantity` | Yes | number | - | Must be > 0 |
| `unit_price` | No | number | - | >= 0, defaults to product price |
| `customer_po` | No | string | 100 | Customer PO reference |
| `promised_ship_date` | No | date | - | Format: YYYY-MM-DD |
| `required_delivery_date` | No | date | - | Format: YYYY-MM-DD |
| `notes` | No | string | 1000 | Order or line notes |

### Customer Grouping

Rows are grouped by `customer_code`. All rows for the same customer become one order.

**CSV:**
```csv
customer_code,product_code,quantity
ACME001,FLOUR-25KG,100
ACME001,SUGAR-10KG,50
ACME001,SALT-1KG,200
```

**Result:** One order for ACME001 with 3 lines.

### Order-Level vs Line-Level Fields

Some fields apply at the order level:

| Field | Behavior |
|-------|----------|
| `customer_po` | First non-empty value used for order |
| `promised_ship_date` | First non-empty value used for order |
| `required_delivery_date` | First non-empty value used for order |
| `notes` | First row notes become order notes |

---

## Validation Errors

### Customer Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Customer 'X' not found" | Customer code doesn't exist | Check spelling, create customer first |
| "Customer 'X' is inactive" | Customer is deactivated | Reactivate customer or use different one |

### Product Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Product 'X' not found" | Product code doesn't exist | Check spelling, create product first |
| "Product 'X' is inactive" | Product is deactivated | Reactivate product or use different one |

### Quantity Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Quantity must be greater than zero" | Quantity <= 0 | Enter positive quantity |
| "Invalid quantity format" | Non-numeric value | Enter valid number |

### Price Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Unit price cannot be negative" | Price < 0 | Enter non-negative price |
| "Invalid unit price format" | Non-numeric value | Enter valid number |

### Date Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid date format (use YYYY-MM-DD)" | Wrong date format | Use ISO format: 2026-02-15 |

### File Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "CSV file is empty" | File has no data | Add data rows to CSV |
| "Missing required columns: X" | Header row incomplete | Add missing columns |
| "Only CSV files (.csv) are supported" | Wrong file type | Convert to .csv format |
| "File size must be between 1 byte and 5MB" | File too large | Split into smaller files |

---

## Sample CSV Templates

### Minimal Template

Download: [minimal-import-template.csv](../../templates/minimal-import-template.csv)

```csv
customer_code,product_code,quantity
ACME001,FLOUR-25KG,100
ACME001,SUGAR-10KG,50
```

### Full Template

Download: [full-import-template.csv](../../templates/full-import-template.csv)

```csv
customer_code,product_code,quantity,unit_price,customer_po,promised_ship_date,required_delivery_date,notes
ACME001,FLOUR-25KG,100,10.50,PO-12345,2026-02-01,2026-02-03,Rush delivery requested
ACME001,SUGAR-10KG,50,25.00,,,,
BETA002,FLOUR-25KG,200,10.00,PO-67890,2026-02-15,2026-02-20,Standard order
```

---

## Component Reference

### Clone Order Dialog

```
+------------------------------------------+
|           Clone Order?                    |
|                                          |
|  A new draft order will be created with  |
|  the same customer and products.         |
|                                          |
|  Source: SO-2025-00123                   |
|  Customer: ACME Corporation              |
|  Lines: 5                                |
|  Total: $2,500.00                        |
|                                          |
|               [Cancel] [Clone]           |
+------------------------------------------+
```

### Import Orders Dialog

```
+------------------------------------------+
|           Import Orders                   |
|                                          |
|  +----------------------------------+    |
|  |                                  |    |
|  |    Drag CSV file here            |    |
|  |    or click to browse            |    |
|  |                                  |    |
|  +----------------------------------+    |
|                                          |
|  Required columns:                       |
|  customer_code, product_code, quantity   |
|                                          |
|  [Download Template]                     |
|                                          |
|                            [Cancel]      |
+------------------------------------------+
```

### Import Preview Table

```
+-----+----------+-----------+-----+--------+--------+
| Row | Customer | Product   | Qty | Price  | Status |
+-----+----------+-----------+-----+--------+--------+
|  1  | ACME001  | FLOUR-25  | 100 | $10.50 |   OK   |
|  2  | ACME001  | SUGAR-10  |  50 | $25.00 |   OK   |
|  3  | INVALID  | FLOUR-25  | 100 | $10.00 |  Error |
+-----+----------+-----------+-----+--------+--------+
                                   Error: Customer not found

Orders to create: 1
Lines to import: 2
Rows with errors: 1

              [Cancel] [Import 1 Order]
```

### Import Result Summary

```
+------------------------------------------+
|         Import Complete                   |
|                                          |
|  Orders created: 2                       |
|  Lines imported: 5                       |
|  Rows skipped: 1                         |
|                                          |
|  Created Orders:                         |
|  - SO-2026-00100 (ACME) - 3 lines       |
|  - SO-2026-00101 (BETA) - 2 lines       |
|                                          |
|  Errors:                                 |
|  - Row 6: Customer 'INVALID' not found  |
|                                          |
|           [View Orders] [Close]          |
+------------------------------------------+
```

---

## Best Practices

### For Sales Clerks

1. **Use clone for repeat orders** - Faster than creating from scratch
2. **Update customer PO** - Always enter the new PO number
3. **Check quantities** - Verify quantities match the new order
4. **Re-validate allergens** - Cloned orders need allergen re-check
5. **Review before confirm** - Double-check cloned order details

### For Bulk Imports

1. **Test with small file first** - Import 5-10 rows to verify format
2. **Use preview** - Always preview before final import
3. **Fix errors in source** - Correct CSV and re-upload for error rows
4. **Group by customer** - Keep all lines for one customer together
5. **Verify customer/product codes** - Export codes from system to ensure match

### For Data Migration

1. **Map codes carefully** - Ensure legacy codes map to MonoPilot codes
2. **Import in batches** - Split large files into 500-row batches
3. **Validate totals** - Compare imported totals with source system
4. **Document mapping** - Keep record of code translations
5. **Run in off-hours** - Large imports during low-usage periods

---

## Troubleshooting

### Clone Button Not Visible

**Symptom:** No "Clone Order" button on SO detail page

**Causes:**
1. User lacks permission
2. Page not fully loaded

**Solutions:**
1. Ensure you have sales, manager, admin, or owner role
2. Refresh the page

### Import Button Not Visible

**Symptom:** No "Import Orders" button on SO list page

**Causes:**
1. User lacks permission

**Solutions:**
1. Ensure you have sales, manager, admin, or owner role
2. Contact administrator for permission

### CSV Not Parsing

**Symptom:** Error "CSV file is empty" or parse errors

**Causes:**
1. File encoded incorrectly
2. Wrong delimiter
3. Special characters in data

**Solutions:**
1. Save as UTF-8 encoded CSV
2. Use comma delimiter (not semicolon)
3. Remove or escape special characters

### All Rows Show Errors

**Symptom:** Every row fails validation

**Causes:**
1. Wrong customer/product codes
2. Columns in wrong order
3. Missing header row

**Solutions:**
1. Export customer/product codes from system
2. Check header row matches expected columns
3. Ensure header is first row

### Orders Created But Missing Lines

**Symptom:** Order has fewer lines than expected

**Causes:**
1. Some rows had validation errors
2. Rows were skipped

**Solutions:**
1. Check import summary for errors
2. Review skipped rows
3. Fix CSV and import missing items separately

---

## Permissions Reference

| Action | Roles |
|--------|-------|
| View Clone button | sales, manager, admin, owner |
| Clone order | sales, manager, admin, owner |
| View Import button | sales, manager, admin, owner |
| Import orders | sales, manager, admin, owner |
| Download template | Any authenticated |

---

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/shipping/sales-orders/:id/clone` | POST | Clone an order |
| `/api/shipping/sales-orders/import` | POST | Import from CSV |
| `/api/shipping/sales-orders/import/preview` | POST | Preview CSV import |

---

## Related Documentation

- [SO Clone/Import API Reference](../../api/shipping/so-clone-import.md)
- [Sales Orders API Reference](../../api/shipping/sales-orders.md)
- [Sales Order Workflow Guide](./sales-order-workflow.md)
- [Pricing and Discounts Guide](./pricing-discounts.md)

---

## Support

**Story:** 07.5
**Last Updated:** 2026-01-22
