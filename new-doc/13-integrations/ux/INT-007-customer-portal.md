# INT-007: Customer Portal

**Module**: Integrations
**Feature**: Public Customer Portal (Order Tracking)
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Customer View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Customer Portal                                                   │
│  ACME Manufacturing                                            [Help] [🌐 EN]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  👋 Welcome, Retail Store Co.                                                 │
│  Portal ID: CUST-RS-2026-045                          Last login: 30m ago    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Quick Stats                                                              │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 📋 Active Orders: 5     🚚 In Transit: 2     ✓ Delivered: 23            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Your Orders                                      [Filter: Active ▼]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Order #      Date       Items  Total      Delivery Date  Status        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ORD-008456   Jan 14     12     $8,450.00  Jan 18, 2026   🚚 Shipped    │ │
│  │                                            Track: FDX123  [View]        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ORD-008423   Jan 12     8      $5,230.00  Jan 17, 2026   🚚 Shipped    │ │
│  │                                            Track: UPS789  [View]        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ORD-008401   Jan 10     15     $12,890.00 Jan 16, 2026   📦 Processing │ │
│  │                                            Est. ship: Jan 15 [View]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ORD-008389   Jan 08     6      $3,120.00  Jan 14, 2026   ✓ Delivered   │ │
│  │                                            Delivered: Jan 14 [View]     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Shipment Tracking                                                        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ ORD-008456  │ FedEx #FDX123456789  │ In Transit │ Est. Jan 18 [Track] │ │
│  │ ORD-008423  │ UPS #1Z999AA1012345  │ In Transit │ Est. Jan 17 [Track] │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Order Detail View

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Order Details: ORD-008456                                  [← Back to List] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Order Information                                                         │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Order Number: ORD-008456                 Status: 🚚 Shipped               │ │
│  │ Order Date: Jan 14, 2026                 Expected Delivery: Jan 18, 2026  │ │
│  │ Delivery Address: Retail Store Co., 456 Commerce St, City, ZIP           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Shipment Tracking                                                         │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Carrier: FedEx Freight                  Tracking: FDX123456789            │ │
│  │ Shipped: Jan 15, 2026 at 10:30 AM       Est. Delivery: Jan 18, 2026      │ │
│  │                                                                           │ │
│  │ ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │ │ Tracking Timeline                                                    │  │ │
│  │ ├─────────────────────────────────────────────────────────────────────┤  │ │
│  │ │ ✓ Jan 15, 10:30 AM  │ Picked up from ACME Manufacturing            │  │ │
│  │ │ ✓ Jan 15, 04:15 PM  │ Departed FedEx facility (City A)             │  │ │
│  │ │ ● Jan 16, 08:45 AM  │ In transit to City B                         │  │ │
│  │ │ ○ Jan 17, 02:00 PM  │ Expected arrival at City B facility          │  │ │
│  │ │ ○ Jan 18, 09:00 AM  │ Out for delivery                             │  │ │
│  │ └─────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                           │ │
│  │ [Track on FedEx Website →]                                                │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Order Items                                                               │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Item Code   Description               Qty Ordered  Unit Price  Total     │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ PROD-123    Chocolate Bars 24pk       200 boxes    $18.50     $3,700.00  │ │
│  │ PROD-456    Gummy Bears 500g          150 bags     $12.30     $1,845.00  │ │
│  │ PROD-789    Hard Candy Mix 1kg        100 bags     $29.05     $2,905.00  │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │                                                     Subtotal:  $8,450.00  │ │
│  │                                                     Tax:       $0.00      │ │
│  │                                                     Shipping:  Included   │ │
│  │                                                     Total:     $8,450.00  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Documents                                                                 │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ 📄 Order Confirmation (PDF)                              [Download]      │ │
│  │ 📄 Packing Slip (PDF)                                    [Download]      │ │
│  │ 📄 Invoice #INV-2026-00456 (PDF)                         [Download]      │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [Download All Documents]                           [Report Issue]            │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Report Issue Modal

```
┌──────────────────────────────────────────┐
│  Report Order Issue             [X Close]│
├──────────────────────────────────────────┤
│                                          │
│  Order: ORD-008456                       │
│                                          │
│  Issue Type *                            │
│  [Select issue type...        ▼]        │
│    - Damaged items                      │
│    - Missing items                      │
│    - Wrong items received               │
│    - Delayed delivery                   │
│    - Quality issue                      │
│    - Other                              │
│                                          │
│  Description *                           │
│  [Please describe the issue in detail_]  │
│  [__________________________________]    │
│  [__________________________________]    │
│  [__________________________________]    │
│                                          │
│  Upload Photos (optional)                │
│  [Choose Files]                          │
│  Max 5 files, 10 MB each                 │
│                                          │
│  Contact Email *                         │
│  [your.email@retailstore.com_____]       │
│                                          │
│  Phone (optional)                        │
│  [(555) 123-4567_______________]         │
│                                          │
│  [Cancel]              [Submit Report]   │
│                                          │
└──────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Customer Portal                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
│  Loading your orders...                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Customer Portal                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [📦 Icon]                                            │
│                       No Orders Found                                         │
│       No active orders at this time.                                         │
│       Your orders will appear here once placed.                              │
│                                                                               │
│       Questions? Contact: sales@acme.com | (555) 123-4567                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot Customer Portal                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Access Link Invalid or Expired                             │
│        This customer portal link is invalid or has expired.                  │
│        Please contact ACME Manufacturing for a new link.                     │
│                                                                               │
│       Contact: sales@acme.com | Phone: (555) 123-4567                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Quick Stats Cards** - Active orders count, In Transit count, Delivered count
2. **Order Table** - Order #, Date, Items count, Total, Delivery Date, Status, Tracking info, [View] button
3. **Filter Dropdown** - All, Active (Processing + Shipped), Shipped, Delivered, Cancelled
4. **Shipment Tracking Cards** - Order #, Carrier + tracking #, Status, Est. delivery, [Track] button
5. **Order Detail View** - Full order info, tracking timeline, line items, documents
6. **Tracking Timeline** - Visual timeline with checkmarks (completed) and circles (pending)
7. **Documents Section** - Downloadable PDFs (order confirmation, packing slip, invoice)
8. **Report Issue Button** - Opens modal to report delivery/quality issues
9. **Status Badges** - Processing (blue), Shipped (yellow), Delivered (green), Cancelled (gray)

---

## Main Actions

### Primary
- **[View]** - Opens order detail view (full info + tracking + documents)
- **[Track]** - Opens tracking timeline or links to carrier website

### Secondary (Order Detail)
- **[Download]** - Downloads individual document (PDF)
- **[Download All Documents]** - Downloads all order documents as ZIP
- **[Track on {Carrier} Website]** - Opens external carrier tracking page (new tab)
- **[Report Issue]** - Opens issue report modal
- **[← Back to List]** - Returns to order list

### Secondary (Report Issue)
- **[Submit Report]** - Sends issue report to customer service (creates support ticket)
- **[Choose Files]** - Upload photos of damaged/wrong items
- **[Cancel]** - Closes modal without submitting

---

## States

- **Loading**: Skeleton cards + order rows, "Loading your orders..." text
- **Empty**: "No orders found" message, contact info
- **Error**: "Access link invalid or expired" warning, contact info
- **Success**: Quick stats + order table + shipment tracking cards
- **Order Detail**: Full order info + tracking timeline + line items + documents
- **Issue Submitted**: Toast "Issue reported. We'll contact you within 24 hours."

---

## Data Fields

**Orders**:
| Field | Type | Notes |
|-------|------|-------|
| order_number | string | Unique order identifier |
| order_date | date | Order placement date |
| delivery_date | date | Expected delivery date |
| status | enum | processing, shipped, delivered, cancelled |
| total_amount | decimal | Total order value |
| items_count | integer | Number of line items |
| delivery_address | text | Full delivery address |

**Shipments**:
| Field | Type | Notes |
|-------|------|-------|
| carrier | string | Carrier name (FedEx, UPS, etc.) |
| tracking_number | string | Carrier tracking number |
| shipped_at | timestamp | Shipment timestamp |
| tracking_events | jsonb | Timeline events from carrier API |

**Line Items**:
| Field | Type | Notes |
|-------|------|-------|
| item_code | string | Product SKU |
| description | string | Item description |
| qty_ordered | decimal | Quantity ordered |
| unit_price | decimal | Price per unit |
| line_total | decimal | Qty × Unit Price |

**Issue Reports**:
| Field | Type | Notes |
|-------|------|-------|
| issue_type | enum | damaged, missing, wrong_items, delayed, quality, other |
| description | text | Customer description |
| photos | jsonb | Uploaded photo URLs |
| contact_email | string | Customer email |
| contact_phone | string | Customer phone (optional) |

---

## Access Control

**Portal Access**:
- **No Login Required**: Magic link sent to customer email (tokenized URL)
- **Link Format**: `https://portal.monopilot.com/customer/{token}`
- **Token Expiry**: 90 days (renewable automatically when accessed)
- **Security**: Token scoped to specific customer + org_id
- **Multi-user**: Same token can be shared within customer organization

**Permissions**:
- View assigned orders only (filtered by customer_id)
- View shipment tracking (real-time updates from carrier APIs)
- Download documents (order confirmation, packing slip, invoice)
- Report issues (creates support ticket)
- Cannot edit orders or request cancellations (must contact sales)

---

## Tracking Integration

**Carrier APIs**:
- **FedEx**: Real-time tracking via FedEx API
- **UPS**: Real-time tracking via UPS API
- **USPS**: Real-time tracking via USPS API
- **Other**: Manual tracking updates (entered by warehouse staff)

**Tracking Events**:
- Picked up, In transit, Out for delivery, Delivered, Exception (delay/issue)

---

## Validation

- **Report Issue**: Issue type required, description required (min 10 chars, max 1000), contact email required (valid email format), photos max 5 files × 10 MB each (JPG, PNG, PDF)

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Order row announces "Order {number}, Placed {date}, {items_count} items, Total {amount}, Delivery expected {date}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open order detail/modal
- **Language Support**: Multi-language UI (English, Spanish, Polish)
- **Mobile Responsive**: Optimized for mobile (customers often check orders on phone)

---

## Related Screens

- **INT-001**: Integrations Dashboard (Customer Portal integration card)
- **INT-003**: Integration Logs (tracking updates logged)

---

## Technical Notes

- **RLS**: Orders filtered by `customer_id` from token
- **API** (Public - No Auth):
  - `GET /api/portal/customer/{token}/orders` (list orders)
  - `GET /api/portal/customer/{token}/orders/{order_id}` (order details)
  - `GET /api/portal/customer/{token}/orders/{order_id}/tracking` (tracking timeline)
  - `GET /api/portal/customer/{token}/orders/{order_id}/documents/{doc_id}` (download document)
  - `POST /api/portal/customer/{token}/orders/{order_id}/report-issue` (submit issue)
- **Token Generation**: Secure random token (32 bytes), stored hashed
- **Token Validation**: Check expiry, customer_id, org_id on every request
- **Tracking Updates**: Polling carrier APIs every 30 min (cache results)
- **Documents**: Stored in Supabase Storage (org bucket, customer subfolder)
- **Notifications**: Email customer when shipment status changes
- **Rate Limiting**: 100 requests per hour per token (prevent abuse)

---

**Status**: Draft - Ready for Review
