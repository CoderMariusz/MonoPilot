# SO Allergen Validation User Guide

> **Story**: 07.6 - SO Allergen Validation
> **Module**: Shipping
> **Version**: 1.0
> **Last Updated**: 2026-01-22

## Overview

The SO Allergen Validation feature ensures food safety compliance by automatically checking sales order products against customer allergen restrictions. Orders containing products with allergens that conflict with customer restrictions are flagged and blocked from confirmation until reviewed.

## Prerequisites

- Customer must have allergen restrictions configured (via Customer CRUD - Story 07.1)
- Products must have allergens defined (via Product Allergens - Story 02.3)
- User must have Sales Clerk, Manager, or Admin role

## Features

### 1. Automatic Allergen Validation

When you create or modify a sales order, the system automatically validates:

- **On SO confirmation**: Validation runs before status changes to "confirmed"
- **On line add/edit**: Real-time validation when adding or editing order lines
- **Manual validation**: Use the [Validate Allergens] button on the SO detail page

### 2. Allergen Conflict Detection

The system compares:

- **Customer allergen restrictions**: Stored in customer.allergen_restrictions as an array of allergen IDs
- **Product allergens**: Only "Contains" declarations trigger conflicts (not "May Contain")

### 3. Conflict Display

When conflicts are detected, an AllergenAlert banner displays:

**Red Banner (Blocking)**

```
Allergen Conflict Detected
- Line 1: Peanut Brittle (SKU-1234) - A05 Peanuts
- Line 2: Chocolate Milk (SKU-5678) - A07 Milk

[Override] (if Manager)
or
"Contact manager to override this allergen block." (if not Manager)
```

**Orange Banner (Override Approved)**

```
Allergen Override Approved
Approved by Jane Manager on Jan 22, 2026

"Customer confirmed they can accept milk products for this order per phone call on 2026-01-22"
```

### 4. Manager Override Workflow

When a manager needs to approve an allergen conflict:

1. Click [Override] button on the red alert banner
2. Modal opens with:
   - Summary of conflicts
   - Reason textarea (20-500 characters required)
   - Confirmation checkbox
3. Enter detailed reason (e.g., "Customer confirmed via phone call...")
4. Check "I confirm this override is authorized and documented"
5. Click [Confirm Override]
6. Banner changes to orange, order can now be confirmed

---

## User Workflows

### Workflow A: Sales Order with No Conflicts

1. Create new sales order
2. Add customer with allergen restrictions
3. Add order lines with products
4. Click [Confirm Order]
5. Validation passes automatically
6. Order status changes to "confirmed"

### Workflow B: Sales Order with Allergen Conflict

1. Create new sales order
2. Add customer with allergen_restrictions = ["A05"] (Peanuts)
3. Add order line with product containing peanuts
4. Red AllergenAlert banner appears immediately
5. Attempt to confirm order fails
6. Contact manager for override (or override if Manager)
7. Manager enters reason and confirms override
8. Order can now be confirmed

### Workflow C: Viewing Customer Order History

1. Navigate to Shipping > Customers
2. Click on a customer row to open detail view
3. Click "Order History" tab
4. View paginated table of orders:
   - Order Number (e.g., SO-2026-00001)
   - Date
   - Status (badge)
   - Total Amount
   - Lines count
   - [View] button
5. Click [View] to navigate to SO detail page
6. Use pagination to view more orders (20 per page)

---

## Components

### AllergenAlert

Alert banner showing allergen conflicts or override status.

**Props**

| Prop | Type | Description |
|------|------|-------------|
| conflicts | AllergenConflict[] | Array of detected conflicts |
| overrideApproved | boolean | Whether override is approved |
| overrideReason | string | Override reason text |
| overriddenBy | string | Name of approving user |
| overriddenAt | string | ISO timestamp of approval |
| canOverride | boolean | Whether user can override |
| onOverride | function | Callback when override clicked |

### AllergenOverrideModal

Modal for manager to enter override reason.

**Props**

| Prop | Type | Description |
|------|------|-------------|
| isOpen | boolean | Modal visibility |
| conflicts | AllergenConflict[] | Conflicts to display |
| onConfirm | function | Callback with reason string |
| onCancel | function | Cancel callback |
| isLoading | boolean | Submission loading state |
| error | string | Error message to display |

### CustomerOrderHistory

Paginated table of customer orders.

**Props**

| Prop | Type | Description |
|------|------|-------------|
| customerId | string | Customer UUID |

---

## Business Rules

| Rule | Behavior |
|------|----------|
| Only "Contains" triggers | "May Contain" allergens do not block orders |
| No restrictions = pass | Customers with no allergen restrictions auto-pass |
| Line changes reset | Any line add/edit/delete resets validation |
| Manager+ for override | Only Manager and Admin roles can override |
| Reason required | Override reason must be 20-500 characters |
| Audit trail | All validations and overrides are logged |
| Performance | Validation completes within 1 second for 50 lines |

---

## Troubleshooting

### "Cannot validate sales order in {status} status"

Validation only works for orders in draft or confirmed status. Shipped or cancelled orders cannot be validated.

### Override button not visible

Only users with Manager or Admin role can see the override button. Contact your manager for assistance.

### Validation taking too long

For orders with many lines, validation may take longer. The system targets under 1 second for 50 lines. If consistently slow, contact support.

### Customer restrictions not loading

Ensure the customer record has allergen_restrictions configured in the Customer detail page (Shipping > Customers).

---

## Related Documentation

- [SO Allergen Validation API Reference](../../api/shipping/allergen-validation.md)
- [Customer Management Guide](./customer-management.md)
- [Product Allergens Guide](../technical/product-allergens.md)
