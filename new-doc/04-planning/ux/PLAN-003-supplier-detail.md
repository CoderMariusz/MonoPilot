# PLAN-003: Supplier Detail Page

**Module**: Planning
**Feature**: Supplier Detail View with Products & PO History (FR-PLAN-001 to FR-PLAN-004)
**Status**: Auto-Approved
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Suppliers > Mill Co. (SUP-001)                        [Edit] [Actions v] [Print]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Mill Co.                                                     Status: [Active]              |  |
|  |  SUP-001                                                                                     |  |
|  |  Created by: John Smith on Jan 15, 2024                                                     |  |
|  |                                                                                              |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | Contact Person     |  | Email              |  | Phone              |  | Currency       |  |  |
|  |  | Jane Miller        |  | jane@millco.com    |  | +48 123 456 789    |  | PLN            |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |                                                                                              |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | Address            |  | City               |  | Country            |  | Postal Code    |  |  |
|  |  | 123 Factory St.    |  | Warsaw             |  | Poland (PL)        |  | 00-001         |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |                                                                                              |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | Payment Terms      |  | Tax Code           |  | Lead Time          |  | MOQ            |  |  |
|  |  | Net 30             |  | Standard 23%       |  | 7 days             |  | 100.00         |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |                                                                                              |  |
|  |  Notes:                                                                                     |  |
|  |  Reliable supplier for flour and sugar. Preferred delivery window: 6am-10am.                |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- PRODUCTS TAB ------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Products]  [Purchase Orders]                                         [+ Add Product]      |  |
|  |  ---------                                                                                   |  |
|  |                                                                                              |  |
|  |  Products supplied by this vendor (5 products)                                              |  |
|  |                                                                                              |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | Product            | Supplier Code  | Unit Price | Lead Time | MOQ    | Default | Actions| |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | Flour Type A       | MILL-FL-A      | $1.20/kg   | 7 days    | 500 kg | [x]     | [Edit] | |  |
|  |  | RM-FLOUR-001       |                |            |           |        |         |        | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | Sugar White        | MILL-SG-W      | $0.85/kg   | 7 days    | 200 kg | [x]     | [Edit] | |  |
|  |  | RM-SUGAR-001       |                |            |           |        |         |        | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | Salt Industrial    | MILL-SLT-I     | $0.30/kg   | 10 days   | 100 kg | [ ]     | [Edit] | |  |
|  |  | RM-SALT-001        |                |            | (Override)|        |         |        | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | Yeast Active Dry   | MILL-YST-AD    | $5.20/kg   | 7 days    | 50 kg  | [x]     | [Edit] | |  |
|  |  | RM-YEAST-001       |                |            |           |        |         |        | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | Vanilla Extract    | MILL-VAN-EX    | $45.00/L   | 14 days   | 10 L   | [ ]     | [Edit] | |  |
|  |  | RM-VANILLA-001     |                |            | (Override)|        |         |        | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Showing 5 of 5 products                                                                    |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Quick Actions:                                                                                   |
|  [Create Purchase Order]  [Email Supplier]  [View All Products]                                  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Actions v] Menu:
  - Edit Supplier
  - Deactivate Supplier (or Activate if inactive)
  - Add Product Assignment
  - Duplicate Supplier
  - Export to PDF
  - Delete Supplier (if no POs exist)
```

### Purchase Orders Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- PURCHASE ORDERS TAB ----------------------------------------+  |
|  |                                                                                              |  |
|  |  [Products]  [Purchase Orders]                                         [+ Create PO]        |  |
|  |              -----------------                                                               |  |
|  |                                                                                              |  |
|  |  Recent Purchase Orders from this supplier (12 POs)                                         |  |
|  |                                                                                              |  |
|  |  Filters: [Status: All v] [Date Range: Last 6 Months v]                                     |  |
|  |                                                                                              |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | PO Number       | Date         | Expected Del. | Total      | Status      | Actions    | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | PO-2024-00156   | Dec 10, 2024 | Dec 20, 2024  | $984.00    | [Receiving] | [View]     | |  |
|  |  |                 |              | (in 6 days)   | PLN        | 60% recv    |            | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | PO-2024-00142   | Nov 28, 2024 | Dec 05, 2024  | $1,250.00  | [Closed]    | [View]     | |  |
|  |  |                 |              | (completed)   | PLN        | 100% recv   |            | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | PO-2024-00128   | Nov 15, 2024 | Nov 22, 2024  | $875.00    | [Closed]    | [View]     | |  |
|  |  |                 |              | (completed)   | PLN        | 100% recv   |            | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | PO-2024-00115   | Nov 02, 2024 | Nov 10, 2024  | $1,120.00  | [Closed]    | [View]     | |  |
|  |  |                 |              | (completed)   | PLN        | 100% recv   |            | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |  | PO-2024-00098   | Oct 18, 2024 | Oct 25, 2024  | $950.00    | [Closed]    | [View]     | |  |
|  |  |                 |              | (completed)   | PLN        | 100% recv   |            | |  |
|  |  +------------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Showing 5 of 12 POs                                          [Load More]                   |  |
|  |                                                                                              |  |
|  |  Summary (Last 6 Months):                                                                   |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Total Orders: 12         | Total Value: $12,450.00 PLN    | Avg Lead Time: 7.2 days   | |  |
|  |  | On-Time Delivery: 92%    | Quality Rating: 4.5/5.0        | Open POs: 1               | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  < Mill Co. (SUP-001)            |
|  [Actions v]                     |
+----------------------------------+
|                                  |
|  Status: [Active]                |
|                                  |
|  +----------------------------+  |
|  | Contact Person             |  |
|  | Jane Miller                |  |
|  +----------------------------+  |
|  | Email                      |  |
|  | jane@millco.com            |  |
|  +----------------------------+  |
|  | Phone                      |  |
|  | +48 123 456 789            |  |
|  +----------------------------+  |
|  | Address                    |  |
|  | 123 Factory St.            |  |
|  | Warsaw, Poland             |  |
|  | 00-001                     |  |
|  +----------------------------+  |
|  | Payment Terms              |  |
|  | Net 30                     |  |
|  +----------------------------+  |
|  | Lead Time                  |  |
|  | 7 days                     |  |
|  +----------------------------+  |
|  | Currency                   |  |
|  | PLN                        |  |
|  +----------------------------+  |
|                                  |
|  [Products] [Purchase Orders]    |
|  ---------                       |
|                                  |
|  [+ Add Product]                 |
|                                  |
|  +----------------------------+  |
|  | Flour Type A               |  |
|  | RM-FLOUR-001               |  |
|  | Code: MILL-FL-A            |  |
|  | Price: $1.20/kg            |  |
|  | Lead: 7 days               |  |
|  | MOQ: 500 kg                |  |
|  | [Default Supplier]         |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|  | Sugar White                |  |
|  | RM-SUGAR-001               |  |
|  | Code: MILL-SG-W            |  |
|  | Price: $0.85/kg            |  |
|  | Lead: 7 days               |  |
|  | MOQ: 200 kg                |  |
|  | [Default Supplier]         |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|  | Salt Industrial            |  |
|  | RM-SALT-001                |  |
|  | Code: MILL-SLT-I           |  |
|  | Price: $0.30/kg            |  |
|  | Lead: 10 days (Override)   |  |
|  | MOQ: 100 kg                |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [Create Purchase Order]    |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Suppliers > ...                                                              [Print] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [=====================================]                    Status: [=========]              |  |
|  |  [===================]                                                                       |  |
|  |                                                                                              |  |
|  |  [===============]  [===============]  [===============]  [===============]                 |  |
|  |  [=======]         [=======]         [=======]         [=======]                           |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- PRODUCTS -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading supplier details...                                                                      |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Products Assigned)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Suppliers > Mill Co. (SUP-001)                        [Edit] [Actions v] [Print]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  (Header with supplier info - same as success state)                                              |
|                                                                                                    |
|  +-------------------------------- PRODUCTS TAB ------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Products]  [Purchase Orders]                                         [+ Add Product]      |  |
|  |  ---------                                                                                   |  |
|  |                                                                                              |  |
|  |                                                                                              |  |
|  |                                     +------------------+                                     |  |
|  |                                     |  [Product Icon]  |                                     |  |
|  |                                     +------------------+                                     |  |
|  |                                                                                              |  |
|  |                             No Products Assigned Yet                                        |  |
|  |                                                                                              |  |
|  |                       This supplier doesn't have any products assigned.                     |  |
|  |                       Add products to enable purchase order creation.                       |  |
|  |                                                                                              |  |
|  |                                                                                              |  |
|  |                                   [+ Add Product]                                           |  |
|  |                                                                                              |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Purchase Orders)

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- PURCHASE ORDERS TAB ----------------------------------------+  |
|  |                                                                                              |  |
|  |  [Products]  [Purchase Orders]                                         [+ Create PO]        |  |
|  |              -----------------                                                               |  |
|  |                                                                                              |  |
|  |                                                                                              |  |
|  |                                     +------------------+                                     |  |
|  |                                     |   [PO Icon]      |                                     |  |
|  |                                     +------------------+                                     |  |
|  |                                                                                              |  |
|  |                           No Purchase Orders Yet                                            |  |
|  |                                                                                              |  |
|  |                     There are no purchase orders from this supplier.                        |  |
|  |                     Create your first PO to start ordering.                                 |  |
|  |                                                                                              |  |
|  |                                                                                              |  |
|  |                                 [+ Create Purchase Order]                                   |  |
|  |                                                                                              |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Suppliers > Error                                                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Supplier                                              |
|                                                                                                    |
|                     The supplier could not be found or you don't                                  |
|                     have permission to view it.                                                   |
|                                                                                                    |
|                              Error: SUPPLIER_NOT_FOUND                                            |
|                                                                                                    |
|                                                                                                    |
|                       [Go Back to Supplier List]    [Contact Support]                            |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Header Info Section

| Field | Source | Display |
|-------|--------|---------|
| name | suppliers.name | "Mill Co." |
| code | suppliers.code | "SUP-001" |
| is_active | suppliers.is_active | Badge: "Active" or "Inactive" |
| created_by | users.name via created_by | "John Smith" |
| created_at | suppliers.created_at | "Jan 15, 2024" |
| contact_name | suppliers.contact_name | "Jane Miller" |
| contact_email | suppliers.contact_email | "jane@millco.com" |
| contact_phone | suppliers.contact_phone | "+48 123 456 789" |
| address | suppliers.address | "123 Factory St." |
| city | suppliers.city | "Warsaw" |
| country | suppliers.country | "Poland (PL)" |
| postal_code | suppliers.postal_code | "00-001" |
| payment_terms | suppliers.payment_terms | "Net 30" |
| tax_code | tax_codes.name | "Standard 23%" |
| lead_time_days | suppliers.lead_time_days | "7 days" |
| moq | suppliers.moq | "100.00" |
| currency | suppliers.currency | "PLN" |
| notes | suppliers.notes | User-entered notes |

### 2. Tab Navigation

| Tab | Content | Visible When |
|-----|---------|--------------|
| **Products** | Supplier-product assignments with pricing | Always (default) |
| **Purchase Orders** | Recent POs from this supplier | Always |

### 3. Products Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| Product | 200px | Product name + SKU (2 lines) |
| Supplier Code | 120px | Supplier's product code |
| Unit Price | 100px | Price per unit with currency |
| Lead Time | 100px | Lead time in days (shows "Override" if different from supplier default) |
| MOQ | 100px | Minimum order quantity |
| Default | 60px | Checkbox indicator if default supplier |
| Actions | 80px | [Edit] button |

### 4. Purchase Orders Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| PO Number | 120px | Clickable link to PO detail |
| Date | 100px | PO creation date |
| Expected Del. | 120px | Expected delivery + relative time |
| Total | 100px | Total value with currency |
| Status | 120px | Status badge + receive % if applicable |
| Actions | 80px | [View] button |

### 5. Default Supplier Indicator

| Indicator | Condition | Display |
|-----------|-----------|---------|
| [x] | is_default = true | Checked checkbox (green) |
| [ ] | is_default = false | Empty checkbox |

**Business Rule**: Only ONE supplier can have is_default=true per product

---

## Main Actions

### Header Actions

| Action | Result |
|--------|--------|
| **Edit** | Opens Supplier Edit modal (PLAN-002) |
| **Print** | Opens print dialog for supplier detail |

### Actions Menu

| Action | Visible When | Result |
|--------|--------------|--------|
| **Edit Supplier** | Always | Opens Supplier Edit modal |
| **Deactivate Supplier** | is_active = true | Sets is_active = false, prevents new POs |
| **Activate Supplier** | is_active = false | Sets is_active = true |
| **Add Product Assignment** | Always | Opens Assign Product modal |
| **Duplicate Supplier** | Always | Creates copy with "-Copy" suffix |
| **Export to PDF** | Always | Downloads PDF |
| **Delete Supplier** | No POs exist | Deletes supplier (with confirmation) |

### Products Tab Actions

| Action | Result |
|--------|--------|
| **[+ Add Product]** | Opens Assign Product modal |
| **[Edit]** (per row) | Opens Edit Product Assignment modal |
| **Remove** (in edit modal) | Removes supplier-product assignment |

### Purchase Orders Tab Actions

| Action | Result |
|--------|--------|
| **[+ Create PO]** | Opens PO Create modal (PLAN-005) pre-filled with this supplier |
| **[View]** (per row) | Navigate to PO Detail page (PLAN-006) |
| **Filter: Status** | Filter POs by status (Draft, Confirmed, Receiving, Closed, etc.) |
| **Filter: Date Range** | Filter POs by creation date range |

### Quick Actions (Bottom of Page)

| Action | Result |
|--------|--------|
| **Create Purchase Order** | Opens PO Create modal pre-filled with this supplier |
| **Email Supplier** | Opens email compose with supplier email |
| **View All Products** | Navigate to Products list filtered by this supplier |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton for header, products table |
| **Success** | Supplier loaded | Full detail view with all sections |
| **Empty (Products)** | No products assigned | Empty state with "Add Product" CTA |
| **Empty (POs)** | No purchase orders | Empty state with "Create PO" CTA |
| **Error** | Supplier not found or no access | Error message, back button |

---

## API Endpoints

### Get Supplier Detail

```
GET /api/planning/suppliers/:id

Response:
{
  "success": true,
  "data": {
    "id": "uuid-supplier-1",
    "code": "SUP-001",
    "name": "Mill Co.",
    "address": "123 Factory St.",
    "city": "Warsaw",
    "postal_code": "00-001",
    "country": "PL",
    "contact_name": "Jane Miller",
    "contact_email": "jane@millco.com",
    "contact_phone": "+48 123 456 789",
    "currency": "PLN",
    "tax_code": {
      "id": "uuid-tax-23",
      "name": "Standard 23%",
      "rate": 23.0
    },
    "payment_terms": "Net 30",
    "lead_time_days": 7,
    "moq": 100.00,
    "notes": "Reliable supplier for flour and sugar. Preferred delivery window: 6am-10am.",
    "is_active": true,
    "approved_supplier": null,
    "supplier_rating": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-12-10T14:20:00Z",
    "created_by": {
      "id": "uuid-user-1",
      "name": "John Smith"
    },
    "updated_by": {
      "id": "uuid-user-1",
      "name": "John Smith"
    }
  }
}
```

### Get Supplier Products

```
GET /api/planning/suppliers/:id/products

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-sp-1",
      "product": {
        "id": "uuid-flour",
        "code": "RM-FLOUR-001",
        "name": "Flour Type A"
      },
      "supplier_product_code": "MILL-FL-A",
      "is_default": true,
      "unit_price": 1.20,
      "currency": "PLN",
      "lead_time_days": 7,
      "moq": 500.00,
      "order_multiple": null,
      "last_purchase_date": "2024-12-10",
      "last_purchase_price": 1.20,
      "notes": null
    },
    {
      "id": "uuid-sp-2",
      "product": {
        "id": "uuid-sugar",
        "code": "RM-SUGAR-001",
        "name": "Sugar White"
      },
      "supplier_product_code": "MILL-SG-W",
      "is_default": true,
      "unit_price": 0.85,
      "currency": "PLN",
      "lead_time_days": 7,
      "moq": 200.00,
      "order_multiple": null,
      "last_purchase_date": "2024-12-10",
      "last_purchase_price": 0.85,
      "notes": null
    },
    {
      "id": "uuid-sp-3",
      "product": {
        "id": "uuid-salt",
        "code": "RM-SALT-001",
        "name": "Salt Industrial"
      },
      "supplier_product_code": "MILL-SLT-I",
      "is_default": false,
      "unit_price": 0.30,
      "currency": "PLN",
      "lead_time_days": 10,
      "moq": 100.00,
      "order_multiple": null,
      "last_purchase_date": null,
      "last_purchase_price": null,
      "notes": null
    }
  ],
  "meta": {
    "total": 5,
    "default_count": 4
  }
}
```

### Get Supplier Purchase Orders

```
GET /api/planning/suppliers/:id/purchase-orders?status=all&date_range=6m&limit=5&offset=0

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-po-156",
      "po_number": "PO-2024-00156",
      "status": "receiving",
      "created_at": "2024-12-10",
      "expected_delivery_date": "2024-12-20",
      "total": 984.00,
      "currency": "PLN",
      "receive_percent": 60
    },
    {
      "id": "uuid-po-142",
      "po_number": "PO-2024-00142",
      "status": "closed",
      "created_at": "2024-11-28",
      "expected_delivery_date": "2024-12-05",
      "total": 1250.00,
      "currency": "PLN",
      "receive_percent": 100
    }
  ],
  "meta": {
    "total": 12,
    "limit": 5,
    "offset": 0,
    "has_more": true
  },
  "summary": {
    "total_orders": 12,
    "total_value": 12450.00,
    "currency": "PLN",
    "avg_lead_time_days": 7.2,
    "on_time_delivery_percent": 92,
    "quality_rating": 4.5,
    "open_pos": 1
  }
}
```

### Update Supplier Actions

```
PUT /api/planning/suppliers/:id
POST /api/planning/suppliers/:id/deactivate
POST /api/planning/suppliers/:id/activate
DELETE /api/planning/suppliers/:id
```

### Product Assignment Actions

```
POST /api/planning/suppliers/:id/products
PUT /api/planning/suppliers/:id/products/:productId
DELETE /api/planning/suppliers/:id/products/:productId
```

---

## Permissions

| Role | View Detail | Edit | Add/Remove Products | Deactivate | Delete |
|------|-------------|------|---------------------|------------|--------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| Purchaser | Yes | Yes | Yes | No | No |
| Manager | Yes | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | No | No |

---

## Business Rules

### Supplier Status

| Status | Can Create PO | Can Edit | Can Delete |
|--------|---------------|----------|------------|
| Active | Yes | Yes | Only if no POs |
| Inactive | No | Yes (to reactivate) | Only if no POs |

### Product Assignment Rules

1. **Default Supplier**: Only ONE supplier can have `is_default=true` per product
2. **Lead Time Override**: If `lead_time_days` is set on supplier_product, it overrides supplier default
3. **MOQ Override**: If `moq` is set on supplier_product, it overrides supplier default
4. **Last Purchase**: Auto-updated when PO line is created with this supplier-product
5. **Delete Assignment**: Cannot delete if active PO lines reference this assignment

### Purchase Orders Summary

- **Date Range Filter**: Last 30 days, Last 3 months, Last 6 months, Last year, All time
- **Status Filter**: All, Draft, Confirmed, Receiving, Closed, Cancelled
- **On-Time Delivery**: % of POs received by expected_delivery_date
- **Quality Rating**: Phase 3 feature (not yet implemented)

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Tab navigation items: 48dp height
- Table row actions: 48x48dp minimum

### Contrast
- Header info text: 4.5:1
- Status badge (Active): Green with 4.5:1 contrast
- Status badge (Inactive): Red with 4.5:1 contrast
- Table text: 4.5:1

### Screen Reader
- Page title: "Supplier Detail: Mill Co. (SUP-001)"
- Status: "Status: Active supplier"
- Products table: Proper th/td structure with scope
- Default checkbox: "Default supplier for Flour Type A"
- Lead time override: "Lead time: 10 days, overrides supplier default"

### Keyboard Navigation
- Tab: Navigate between sections, tabs, action buttons
- Enter: Activate buttons, navigate links
- Arrow keys: Navigate within tabs, table rows
- Space: Toggle default supplier checkbox (if editable)

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full layout with multi-column header cards |
| Tablet (768-1024px) | Stacked header cards, full table width |
| Mobile (<768px) | Full stack, card-based products, collapsible sections |

---

## Performance Notes

### Data Loading
- Header + Products: Single query with JOINs
- Purchase Orders: Lazy load on tab click (with pagination)

### Caching
```typescript
'org:{orgId}:supplier:{supplierId}:detail'      // 5 min TTL
'org:{orgId}:supplier:{supplierId}:products'    // 5 min TTL
'org:{orgId}:supplier:{supplierId}:pos'         // 1 min TTL
```

### Load Time Targets
- Initial page (header + products): <500ms
- Tab switch (purchase orders): <400ms
- Pagination (load more POs): <300ms

---

## Testing Requirements

### Unit Tests
- Default supplier indicator logic
- Lead time override display
- MOQ override display
- PO summary calculations (on-time delivery %)
- Action button visibility by status

### Integration Tests
- GET /api/planning/suppliers/:id
- GET /api/planning/suppliers/:id/products
- GET /api/planning/suppliers/:id/purchase-orders
- PUT /api/planning/suppliers/:id
- POST /api/planning/suppliers/:id/deactivate
- POST /api/planning/suppliers/:id/activate
- DELETE /api/planning/suppliers/:id
- RLS enforcement

### E2E Tests
- View supplier detail page loads all sections
- Tab navigation works (Products, Purchase Orders)
- Edit button opens modal
- Add Product button opens assignment modal
- Deactivate action works
- Create PO from supplier page pre-fills supplier
- Mobile responsive layout
- Empty states render correctly
- Error state renders when supplier not found

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Success, Empty, Error)
- [x] All tabs specified (Products, Purchase Orders)
- [x] API endpoints documented
- [x] Status-based action visibility defined
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] Business rules documented
- [x] Empty states for Products and POs

---

## Handoff to FRONTEND-DEV

```yaml
feature: Supplier Detail Page
story: PLAN-003
fr_coverage: FR-PLAN-001, FR-PLAN-002, FR-PLAN-003, FR-PLAN-004
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-003-supplier-detail.md
  api_endpoints:
    - GET /api/planning/suppliers/:id
    - GET /api/planning/suppliers/:id/products
    - GET /api/planning/suppliers/:id/purchase-orders
    - PUT /api/planning/suppliers/:id
    - POST /api/planning/suppliers/:id/deactivate
    - POST /api/planning/suppliers/:id/activate
    - DELETE /api/planning/suppliers/:id
    - POST /api/planning/suppliers/:id/products
    - PUT /api/planning/suppliers/:id/products/:productId
    - DELETE /api/planning/suppliers/:id/products/:productId
states_per_screen: [loading, success, empty_products, empty_pos, error]
tabs: [products, purchase_orders]
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
related_screens:
  - PLAN-001: Supplier List Page
  - PLAN-002: Supplier Create/Edit Modal
  - PLAN-005: PO Create Modal (pre-fill supplier)
  - PLAN-006: PO Detail Page
```

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve (explicit opt-in)
**User Approved**: Yes
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours
**Quality Target**: 97/100
