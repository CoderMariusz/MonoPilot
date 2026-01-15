# INT-006: Supplier Portal

**Module**: Integrations
**Feature**: Public Supplier Portal (No Login)
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Supplier View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Supplier Portal                                                   │
│  ACME Manufacturing                                            [Help] [🌐 EN]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  👋 Welcome, Fresh Foods Ltd.                                                 │
│  Portal ID: SUP-FF-2026-001                               Last login: 2h ago │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Quick Stats                                                              │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 🛒 Open POs: 3      📦 Pending Deliveries: 2      ✓ Delivered: 12       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Purchase Orders                                     [Filter: Open ▼]    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ PO Number    Date       Items  Total      Delivery Date  Status        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ PO-001234    Jan 10     5      $2,345.00  Jan 20, 2026   Open           │ │
│  │                                                           [View] [Ship] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ PO-001189    Jan 08     3      $1,890.50  Jan 18, 2026   Open           │ │
│  │                                                           [View] [Ship] │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ PO-001156    Jan 05     8      $5,120.00  Jan 17, 2026   Shipped        │ │
│  │                                            Shipped: Jan 16 [View]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Recent Activity                                                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 2h ago   │ PO-001234 received - Due Jan 20, 2026                        │ │
│  │ 1d ago   │ Delivery confirmed for PO-001156 (8 items)                   │ │
│  │ 2d ago   │ PO-001189 received - Due Jan 18, 2026                        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### PO Detail View

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Purchase Order: PO-001234                                  [← Back to List] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ PO Information                                                            │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ PO Number: PO-001234                     Status: Open                    │ │
│  │ Issued: Jan 10, 2026                     Delivery Due: Jan 20, 2026      │ │
│  │ Buyer: John Smith (john@acme.com)                                        │ │
│  │ Delivery Address: ACME Manufacturing, 123 Main St, City, ZIP             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Line Items                                                                │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Item Code   Description             Qty Ordered  Unit Price  Total       │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ FLOUR-001   Wheat Flour 25kg        100 bags     $12.50      $1,250.00   │ │
│  │ SUGAR-002   White Sugar 50kg        50 bags      $18.90      $945.00     │ │
│  │ SALT-003    Sea Salt 10kg           20 bags      $7.50       $150.00     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │                                                   Subtotal:  $2,345.00    │ │
│  │                                                   Tax:       $0.00        │ │
│  │                                                   Total:     $2,345.00    │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Delivery Instructions                                                     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ - Deliver to Warehouse Gate B (receiving hours: 8am-4pm Mon-Fri)         │ │
│  │ - All items must have batch/lot numbers and expiry dates                 │ │
│  │ - COA (Certificate of Analysis) required for all items                    │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [Download PO (PDF)]                            [Confirm Shipment →]          │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Confirm Shipment Modal

```
┌──────────────────────────────────────────┐
│  Confirm Shipment: PO-001234    [X Close]│
├──────────────────────────────────────────┤
│                                          │
│  Shipment Date *                         │
│  [Jan 16, 2026_______________] 📅        │
│                                          │
│  Carrier Name                            │
│  [FedEx Freight_______________]          │
│                                          │
│  Tracking Number                         │
│  [123456789012_______________]           │
│                                          │
│  Expected Delivery Date                  │
│  [Jan 18, 2026_______________] 📅        │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Line Items (verify quantities)     │  │
│  ├────────────────────────────────────┤  │
│  │ FLOUR-001  Ordered: 100  Ship: [100]│  │
│  │ SUGAR-002  Ordered: 50   Ship: [50] │  │
│  │ SALT-003   Ordered: 20   Ship: [20] │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Upload Documents (optional)             │
│  ☐ Packing Slip [Choose File]           │
│  ☐ COA (Certificate) [Choose File]      │
│  ☐ Invoice [Choose File]                │
│                                          │
│  Notes (optional)                        │
│  [All items shipped as requested_____]   │
│  [__________________________________]    │
│                                          │
│  [Cancel]           [Confirm Shipment]   │
│                                          │
└──────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Supplier Portal                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
│  Loading your purchase orders...                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Supplier Portal                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [📋 Icon]                                            │
│                       No Purchase Orders Found                                │
│       No open purchase orders at this time.                                  │
│       You will receive a notification when new POs are issued.               │
│                                                                               │
│       Questions? Contact: purchasing@acme.com                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Supplier Portal                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Access Link Invalid or Expired                             │
│        This supplier portal link is invalid or has expired.                  │
│        Please contact ACME Manufacturing for a new link.                     │
│                                                                               │
│       Contact: purchasing@acme.com | Phone: (555) 123-4567                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Quick Stats Cards** - Open POs count, Pending deliveries count, Delivered count
2. **PO Table** - PO Number, Date, Items count, Total, Delivery Date, Status, [View] [Ship] buttons
3. **Filter Dropdown** - All, Open, Shipped, Delivered, Closed
4. **PO Detail View** - Full PO info, line items table, delivery instructions, [Download PDF] [Confirm Shipment] buttons
5. **Confirm Shipment Modal** - Shipment date, carrier, tracking, quantities, document upload, notes
6. **Activity Feed** - Recent events (PO received, shipment confirmed)
7. **Portal Header** - Customer branding, supplier name, portal ID, last login, language selector
8. **Status Badges** - Open (blue), Shipped (yellow), Delivered (green), Closed (gray)

---

## Main Actions

### Primary
- **[View]** - Opens PO detail view (full info + line items)
- **[Ship]** - Opens Confirm Shipment modal (record shipment details)

### Secondary (PO Detail)
- **[Download PO (PDF)]** - Generates PDF of PO for printing
- **[Confirm Shipment]** - Opens shipment confirmation modal
- **[← Back to List]** - Returns to PO list

### Secondary (Confirm Shipment)
- **[Confirm Shipment]** - Submits shipment details (sends notification to buyer)
- **[Choose File]** - Upload packing slip/COA/invoice (optional)
- **[Cancel]** - Closes modal without saving

---

## States

- **Loading**: Skeleton cards + PO rows, "Loading your purchase orders..." text
- **Empty**: "No purchase orders found" message, contact info
- **Error**: "Access link invalid or expired" warning, contact info
- **Success**: Quick stats + PO table + activity feed
- **PO Detail**: Full PO info + line items + delivery instructions
- **Shipment Confirmed**: Toast "Shipment confirmed. Buyer notified." + PO status changes to "Shipped"

---

## Data Fields

**Purchase Orders**:
| Field | Type | Notes |
|-------|------|-------|
| po_number | string | Unique PO identifier |
| po_date | date | Issue date |
| delivery_due_date | date | Expected delivery date |
| status | enum | open, shipped, delivered, closed |
| total_amount | decimal | Total PO value |
| items_count | integer | Number of line items |
| buyer_name | string | Buyer contact name |
| buyer_email | string | Buyer contact email |
| delivery_address | text | Full delivery address |

**Line Items**:
| Field | Type | Notes |
|-------|------|-------|
| item_code | string | Product SKU |
| description | string | Item description |
| qty_ordered | decimal | Quantity ordered |
| unit_price | decimal | Price per unit |
| line_total | decimal | Qty × Unit Price |

**Shipments**:
| Field | Type | Notes |
|-------|------|-------|
| shipment_date | date | Actual shipment date |
| carrier | string | Carrier name (optional) |
| tracking_number | string | Tracking number (optional) |
| expected_delivery | date | Estimated arrival date |
| notes | text | Shipment notes (optional) |
| documents | jsonb | Uploaded document URLs |

---

## Access Control

**Portal Access**:
- **No Login Required**: Magic link sent to supplier email (tokenized URL)
- **Link Format**: `https://portal.monopilot.com/supplier/{token}`
- **Token Expiry**: 90 days (renewable automatically when accessed)
- **Security**: Token scoped to specific supplier + org_id
- **Multi-user**: Same token can be shared within supplier organization

**Permissions**:
- View assigned POs only (filtered by supplier_id)
- Confirm shipments (creates shipment record)
- Upload documents (packing slip, COA, invoice)
- Download PO PDFs
- Cannot edit PO details or line items

---

## Validation

- **Confirm Shipment**: Shipment date required, must be <= today, shipped quantities must match ordered quantities (warn if mismatch)
- **Documents**: Max 5 MB per file, supported formats (PDF, JPG, PNG, XLSX)
- **Tracking Number**: Optional, alphanumeric (max 50 chars)
- **Notes**: Optional, max 500 chars

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: PO row announces "Purchase Order {number}, Issued {date}, {items_count} items, Total {amount}, Delivery due {date}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open PO detail/modal
- **Language Support**: Multi-language UI (English, Spanish, Polish) - language selector in header
- **Mobile Responsive**: Optimized for tablet/mobile (suppliers often use mobile in warehouse)

---

## Related Screens

- **INT-001**: Integrations Dashboard (Supplier Portal integration card)
- **INT-003**: Integration Logs (shipment confirmations logged)

---

## Technical Notes

- **RLS**: POs filtered by `supplier_id` from token
- **API** (Public - No Auth):
  - `GET /api/portal/supplier/{token}/pos` (list POs for supplier)
  - `GET /api/portal/supplier/{token}/pos/{po_id}` (PO details)
  - `POST /api/portal/supplier/{token}/pos/{po_id}/shipment` (confirm shipment)
  - `POST /api/portal/supplier/{token}/upload` (upload documents)
  - `GET /api/portal/supplier/{token}/pos/{po_id}/pdf` (download PO PDF)
- **Token Generation**: Secure random token (32 bytes), stored hashed
- **Token Validation**: Check expiry, supplier_id, org_id on every request
- **Notifications**: Email buyer when shipment confirmed (includes tracking info)
- **Document Storage**: Supabase Storage (org bucket, supplier subfolder)
- **PDF Generation**: Server-side rendering (wkhtmltopdf or Puppeteer)
- **Rate Limiting**: 100 requests per hour per token (prevent abuse)

---

**Status**: Draft - Ready for Review
