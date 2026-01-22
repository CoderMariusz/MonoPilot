# Customer Management Guide

**Story:** 07.1 - Customers CRUD
**Version:** 1.0
**Last Updated:** 2026-01-22

## Overview

This guide explains how to manage customers in MonoPilot, including creating customer records, managing contacts and addresses, and handling customer categories. Customers are the foundation of the Shipping module and must be set up before creating sales orders.

## Prerequisites

Before managing customers, ensure you have:

- An active MonoPilot account with appropriate permissions
- `sales`, `manager`, `admin`, or `owner` role for creating/editing customers
- At least one warehouse configured (for shipping address validation)

## Getting Started

### Accessing the Customers Page

1. Log in to MonoPilot
2. Navigate to **Shipping** in the main navigation
3. Click **Customers**

The Customers page displays a data table with all customer records, search functionality, and filters.

### Understanding Customer Categories

MonoPilot supports three customer categories:

| Category | Description | Typical Use Case |
|----------|-------------|------------------|
| **Retail** | Individual consumers or small businesses | Direct-to-consumer sales, small orders |
| **Wholesale** | Businesses buying in bulk | Distributors, resellers |
| **Distributor** | Large-scale distribution partners | Regional distribution, multi-location |

Categories help organize customers and can be used for reporting and filtering.

---

## Creating a Customer

### Step 1: Open the Create Modal

1. Click the **Create Customer** button (or press `Ctrl+N` / `Cmd+N`)
2. The customer creation modal opens

### Step 2: Enter Basic Information

**Required Fields:**

| Field | Description | Rules |
|-------|-------------|-------|
| **Customer Code** | Unique identifier | 3-20 characters, letters/numbers/dash/underscore only |
| **Name** | Customer display name | 1-255 characters |
| **Category** | Customer classification | Select: Retail, Wholesale, or Distributor |

**Example Customer Code Formats:**
- `ACME-001` - Company abbreviation with number
- `CUST_12345` - Generic prefix with ID
- `ABC123` - Simple alphanumeric

**Note:** Customer codes cannot be changed after creation. Choose a meaningful, permanent code.

### Step 3: Add Contact Information (Optional)

| Field | Description | Rules |
|-------|-------------|-------|
| **Email** | Primary email address | Valid email format |
| **Phone** | Primary phone number | Up to 50 characters |
| **Tax ID** | Tax identification number | Up to 50 characters |

### Step 4: Configure Payment Terms

| Field | Description | Default |
|-------|-------------|---------|
| **Credit Limit** | Maximum outstanding balance | No limit (null) |
| **Payment Terms** | Days until payment due | 30 days |

**Credit Limit Rules:**
- Must be a positive number
- Leave blank for no limit
- Used for credit hold decisions (future feature)

**Payment Terms Rules:**
- Minimum: 1 day
- Maximum: 365 days
- Default: 30 days

### Step 5: Set Allergen Restrictions (Food Safety)

If the customer has allergen restrictions for products they can receive:

1. Click the **Allergen Restrictions** field
2. Select applicable allergens from the dropdown
3. Up to 20 allergens can be selected

**Note:** Allergen restrictions are validated during sales order creation (Story 07.6).

### Step 6: Add Notes (Optional)

Use the Notes field for additional information:
- Special handling instructions
- Preferred carriers
- Contact preferences
- Internal reference information

### Step 7: Save the Customer

1. Review all entered information
2. Click **Create** (or **Save** when editing)
3. The customer record is created and appears in the list

---

## Managing Customer Contacts

Customers can have multiple contacts for different purposes.

### Adding a Contact

1. Open the customer detail view (click on a customer row)
2. Navigate to the **Contacts** tab
3. Click **Add Contact**
4. Enter contact information:

| Field | Description | Required |
|-------|-------------|----------|
| **Name** | Contact person's name | Yes |
| **Title** | Job title/position | No |
| **Email** | Contact email | No |
| **Phone** | Contact phone | No |
| **Primary** | Mark as primary contact | No |

5. Click **Save**

### Primary Contact

- Only one contact can be marked as primary
- The primary contact is shown on the customer list
- Used as default contact for orders and communications

### Editing/Deleting Contacts

- Click the edit icon to modify contact details
- Click the delete icon to remove a contact
- At least one contact is recommended but not required

---

## Managing Customer Addresses

Customers can have multiple billing and shipping addresses.

### Address Types

| Type | Purpose |
|------|---------|
| **Billing** | Invoice and payment address |
| **Shipping** | Delivery destination |

### Adding an Address

1. Open the customer detail view
2. Navigate to the **Addresses** tab
3. Click **Add Address**
4. Enter address details:

**Required Fields:**

| Field | Description |
|-------|-------------|
| **Address Type** | Billing or Shipping |
| **Address Line 1** | Street address |
| **City** | City name |
| **Postal Code** | ZIP/postal code |
| **Country** | Country name |

**Optional Fields:**

| Field | Description |
|-------|-------------|
| **Address Line 2** | Suite, unit, building |
| **State/Province** | State or province |
| **Dock Hours** | Receiving hours by day |
| **Notes** | Special delivery instructions |
| **Default** | Mark as default for type |

5. Click **Save**

### Dock Hours Configuration

For shipping addresses, configure receiving dock hours:

```json
{
  "mon": "08:00-17:00",
  "tue": "08:00-17:00",
  "wed": "08:00-17:00",
  "thu": "08:00-17:00",
  "fri": "08:00-16:00",
  "sat": null,
  "sun": null
}
```

- Use 24-hour format
- Set to `null` for closed days
- Used for delivery scheduling (future feature)

### Default Addresses

- Each address type (billing/shipping) can have one default
- Setting a new default automatically unsets the previous one
- Default addresses are pre-selected when creating sales orders

### Address Notes

Use address notes for:
- Specific dock numbers
- Security gate codes
- Contact at delivery
- Special unloading requirements

---

## Searching and Filtering Customers

### Search

The search box searches across:
- Customer code
- Customer name

Search is case-insensitive and supports partial matches.

**Example searches:**
- `ACME` - Finds ACME-001, ACME-002, etc.
- `corp` - Finds "Acme Corporation", "ABC Corp", etc.

### Filters

| Filter | Options | Description |
|--------|---------|-------------|
| **Category** | All, Retail, Wholesale, Distributor | Filter by customer type |
| **Status** | All, Active, Inactive | Filter by active status |

### Sorting

Click column headers to sort by:
- **Name** - Alphabetical order
- **Customer Code** - Code order
- **Created At** - Creation date

Click again to toggle ascending/descending.

---

## Editing Customers

### What Can Be Changed

| Field | Editable | Notes |
|-------|----------|-------|
| Customer Code | No | Immutable after creation |
| Name | Yes | |
| Category | Yes | |
| Contact Info | Yes | Email, phone, tax ID |
| Payment Terms | Yes | Credit limit, payment days |
| Allergen Restrictions | Yes | |
| Notes | Yes | |
| Active Status | Yes | See restrictions below |

### Deactivating Customers

To deactivate a customer:

1. Open the customer record
2. Toggle **Active** to off
3. Save changes

**Restrictions:**
- Cannot deactivate customers with open sales orders
- Deactivated customers do not appear in customer dropdowns
- Deactivated customers remain searchable with status filter

### Reactivating Customers

1. Filter by **Inactive** status
2. Find the customer
3. Toggle **Active** to on
4. Save changes

---

## Archiving (Deleting) Customers

MonoPilot uses soft delete for customers:

1. Click the delete action on a customer
2. Confirm the deletion
3. The customer is marked inactive (is_active=false)

**Restrictions:**
- Cannot archive customers with open orders (draft, confirmed, in_progress)
- Historical orders remain linked for traceability

**Recovery:**
- Archived customers can be reactivated
- Filter by inactive status to find archived customers

---

## Best Practices

### Customer Codes

**Do:**
- Use consistent naming conventions across organization
- Include meaningful prefixes (company abbreviation)
- Plan for growth (use numbers that can expand)

**Avoid:**
- Customer names as codes (names change)
- Special characters (%, @, spaces)
- Codes that are too short or too long

**Recommended Patterns:**
- `[COMPANY]-[NUMBER]`: ACME-001, ACME-002
- `[REGION]-[TYPE]-[ID]`: US-WH-0001, EU-RT-0001
- `[TYPE]-[NUMBER]`: CUST-10001, DIST-20001

### Contact Management

- Always add at least one primary contact
- Include email for order confirmations
- Include phone for urgent communications
- Update contacts promptly when personnel changes

### Address Management

- Add both billing and shipping addresses
- Set appropriate defaults
- Include dock hours for warehouses
- Add notes for delivery instructions

### Allergen Restrictions

- Review and update regularly
- Verify with customer documentation
- Train staff on allergen validation

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` / `Cmd+N` | Create new customer |
| `Escape` | Close modal |
| `Enter` | Submit form (when valid) |

---

## Troubleshooting

### "Customer code already exists"

The code is already used by another customer. Choose a unique code or check if the customer already exists.

### "Cannot deactivate customer with open orders"

Complete or cancel all open orders before deactivating:

1. Go to Sales Orders
2. Filter by this customer
3. Complete or cancel pending orders
4. Return to deactivate customer

### "Invalid character in customer_code"

Customer codes only allow:
- Letters: A-Z, a-z
- Numbers: 0-9
- Dash: -
- Underscore: _

Remove any other characters (spaces, @, %, etc.).

### "Invalid allergen ID"

Selected allergen no longer exists. Contact administrator to update allergen list.

---

## Related Topics

- [Customers API Reference](../../api/shipping/customers.md)
- [Sales Order Workflow](./sales-order-workflow.md)
- [Allergen Management](../../guides/settings/allergens.md)

---

## Support

For additional help:
- Check the API documentation for integration details
- Contact your system administrator for permission issues
- Review the PRD for feature specifications

**Story:** 07.1
**Last Updated:** 2026-01-22
