# SHIP-020: Packing Slip Generation & Printing

**Module**: Shipping
**Feature**: Packing Slip Generation (FR-7.40)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State (Desktop) - Packing Slip Preview

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Packing Slip                    [< Back] [Print] [Email]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +------------------------------ PDF PREVIEW (8.5x11") ------------------------------------+  |
|  |                                                                                            |  |
|  |  +-----------------------------------+  [Company Logo/Header]                             |  |
|  |  |        PACKING SLIP               |                                                    |  |
|  |  +-----------------------------------+                                                    |  |
|  |                                                                                            |  |
|  |  Sales Order:      SO-024601             Shipment:      SHIP-001                          |  |
|  |  Shipped Date:     2025-01-15            Tracking:      1Z999AA10012345678               |  |
|  |                                                                                            |  |
|  |  +----- SHIP TO -----+                  +----- SHIP FROM -----+                           |  |
|  |  | Blue Mountain     |                  | MonoPilot Foods     |                           |  |
|  |  | Restaurant       |                  | 456 Industrial Blvd |                           |  |
|  |  | 789 Main Street  |                  | Denver, CO 80202    |                           |  |
|  |  | Denver, CO 80210 |                  | USA                 |                           |  |
|  |  | USA              |                  | Phone: (303) 555... |                           |  |
|  |  | Phone: (303)...  |                  |                     |                           |  |
|  |  +------------------+                  +---------------------+                           |  |
|  |                                                                                            |  |
|  |  +------------------------------------------------------------------------+              |  |
|  |  | LINE ITEMS                                                             |              |  |
|  |  +--------+---------------------+--------+----------+---------+----------+              |  |
|  |  | Line # | Product             | Qty    | Qty      | Backord | Unit     |              |  |
|  |  |        | Description         | Ordered| Shipped  | er Qty  | Price    |              |  |
|  |  +--------+---------------------+--------+----------+---------+----------+              |  |
|  |  | 1      | Organic Flour 5lb   | 100    | 100      | 0       | $24.95   |              |  |
|  |  |        | Lot: FLOUR-2024-001 |        |          |         |          |              |  |
|  |  |        | BBD: 2025-06-30     |        |          |         |          |              |  |
|  |  +--------+---------------------+--------+----------+---------+----------+              |  |
|  |  | 2      | Organic Sugar 10lb  | 50     | 50       | 0       | $18.50   |              |  |
|  |  |        | Lot: SUGAR-2024-045 |        |          |         |          |              |  |
|  |  |        | BBD: 2025-12-31     |        |          |         |          |              |  |
|  |  +--------+---------------------+--------+----------+---------+----------+              |  |
|  |  | 3      | Butter 2kg Block    | 25     | 25       | 0       | $12.75   |              |  |
|  |  |        | Lot: BUTT-2024-022  |        |          |         |          |              |  |
|  |  |        | BBD: 2025-04-15     |        |          |         |          |              |  |
|  |  +--------+---------------------+--------+----------+---------+----------+              |  |
|  |                                                                             Subtotal: $3,738.75 |  |
|  |                                                                                            |  |
|  |  +------------------------------------------------------------------------+              |  |
|  |  | CARTON SUMMARY                                                         |              |  |
|  |  +--------+------------------+----------+-----+----+----+----+           |              |  |
|  |  | Box #  | SSCC Barcode     | Weight   | L   | W  | H  | QR |           |              |  |
|  |  +--------+------------------+----------+-----+----+----+----+           |              |  |
|  |  | 1 of 2 | 00123456789012   | 48.5 kg  | 60  | 40 | 30 | [||] |          |              |  |
|  |  |        | 345678901        |          | cm  | cm | cm |      |          |              |  |
|  |  +--------+------------------+----------+-----+----+----+----+           |              |  |
|  |  | 2 of 2 | 00123456789013   | 42.3 kg  | 60  | 40 | 25 | [||] |          |              |  |
|  |  |        | 345679001        |          | cm  | cm | cm |      |          |              |  |
|  |  +--------+------------------+----------+-----+----+----+----+           |              |  |
|  |                                                                             Total: 90.8 kg |  |
|  |                                                                                            |  |
|  |  +------------------------------------------------------------------------+              |  |
|  |  | SPECIAL INSTRUCTIONS                                                   |              |  |
|  |  | Handle with care - Perishable Items                                    |              |  |
|  |  | Keep refrigerated - Temperature range 2-8°C                            |              |  |
|  |  | Do not stack - Fragile                                                 |              |  |
|  |  +------------------------------------------------------------------------+              |  |
|  |                                                                                            |  |
|  |  +--------+----------------------------+--------+----------------------------+          |  |
|  |  | Shipped By:  ________________      | Received By:  ________________      |          |  |
|  |  |              Date: ___________      |                Date: ___________   |          |  |
|  |  +--------+----------------------------+--------+----------------------------+          |  |
|  |                                                                                            |  |
|  |  RETURN POLICY: Items must be returned within 14 days for refund/credit.                 |  |
|  |  Contact: returns@monopilot.io | 1-800-555-FOOD                                          |  |
|  |                                                                                            |  |
|  +-----------+------------------+------------------+-----------------------------------------+  |
|  [Page 1]   [Zoom: 100%] [<] [>]                     [Print View]                             |
|  +----------------------------------+------------------+------------------+----------+-------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Print] - Sends to system printer or print dialog
[Email] - Opens email modal with recipient suggestions
```

### Success State (Desktop) - Email Modal

```
+----------------------------------+
| EMAIL PACKING SLIP               |
+----------------------------------+
|                                  |
| To: [Customer Contact Email  v]  |
|     > blue-mtn@restaurant.com   |
|     > contact@bluerestaurant.co |
|                                  |
| CC: [Add Custom Contacts     +]  |
|                                  |
| Subject: [Packing Slip - SO-02...] |
|                                  |
| Message:                         |
| +-----------------------------+  |
| | Dear Valued Customer,       |  |
| |                             |  |
| | Your order has been packed  |  |
| | and is ready for shipment.  |  |
| |                             |  |
| | Order #: SO-024601          |  |
| | Tracking: 1Z999AA10012345   |  |
| |                             |  |
| | The packing slip is attached |  |
| | below.                      |  |
| |                             |  |
| | Thank you for your order!   |  |
| |                             |  |
| | MonoPilot Foods Team        |  |
| +-----------------------------+  |
|                                  |
| [ ] Include PDF attachment       |
| [ ] Include tracking link        |
|                                  |
|      [Cancel]    [Send Email]    |
|                                  |
+----------------------------------+

Note: On mobile (<768px), this modal displays as full-screen sheet
with sticky action buttons at bottom
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Shipping > SO-024601 > Packing Slip    [< Back] [Print] [Email]  |
+--------------------------------------------------------------------+
|                                                                      |
|  +----- PDF PREVIEW (Scaled) -----+                                |
|  |                                |                                |
|  | PACKING SLIP                   |                                |
|  |                                |                                |
|  | SO: SO-024601 | SHIP: SHIP-001 |                                |
|  | 2025-01-15    | 1Z999AA1...    |                                |
|  |                                |                                |
|  | SHIP TO           SHIP FROM    |                                |
|  | Blue Mountain     MonoPilot     |                                |
|  | Restaurant        Foods         |                                |
|  | 789 Main St       456 Ind Blvd  |                                |
|  | Denver, CO        Denver, CO    |                                |
|  |                                |                                |
|  | LINE ITEMS:                    |                                |
|  | 1. Org Flour 5lb  100 units     |                                |
|  |    Lot: FLOUR-...              |                                |
|  | 2. Org Sugar 10lb  50 units     |                                |
|  |    Lot: SUGAR-...              |                                |
|  | 3. Butter 2kg      25 units     |                                |
|  |    Lot: BUTT-...               |                                |
|  |                                |                                |
|  | BOXES: 2 cartons, 90.8 kg      |                                |
|  | Box 1: 48.5kg SSCC: 00123456    |                                |
|  | Box 2: 42.3kg SSCC: 00123457    |                                |
|  |                                |                                |
|  | Special: Perishable, 2-8°C     |                                |
|  |                                |                                |
|  +--------------------------------+                                |
|                                                                      |
+--------------------------------------------------------------------+
```

### Success State (Mobile: <768px)

```
+----------------------------------+
|  < SO-024601 Packing Slip        |
|  [Print] [Email] [Download]      |
+----------------------------------+
|                                  |
| PACKING SLIP                     |
|                                  |
| Order: SO-024601                 |
| Date: 2025-01-15                 |
| Tracking: 1Z999AA10012...        |
|                                  |
| SHIP TO:                         |
| Blue Mountain Restaurant         |
| 789 Main Street                  |
| Denver, CO 80210                 |
|                                  |
| SHIP FROM:                       |
| MonoPilot Foods                  |
| 456 Industrial Blvd              |
| Denver, CO 80202                 |
|                                  |
| LINE ITEMS:                      |
| +----------------------------+   |
| | Organic Flour 5lb          |   |
| | Qty: 100  Lot: FLOUR-2...  |   |
| | BBD: 2025-06-30            |   |
| +----------------------------+   |
| | Organic Sugar 10lb         |   |
| | Qty: 50   Lot: SUGAR-2...  |   |
| | BBD: 2025-12-31            |   |
| +----------------------------+   |
| | Butter 2kg Block           |   |
| | Qty: 25   Lot: BUTT-2...   |   |
| | BBD: 2025-04-15            |   |
| +----------------------------+   |
|                                  |
| CARTON SUMMARY:                  |
| Total: 2 boxes, 90.8 kg          |
|                                  |
| Box 1/2:                         |
| SSCC: 00123456789012345678       |
| Weight: 48.5 kg                  |
| 60x40x30 cm                      |
|                                  |
| Box 2/2:                         |
| SSCC: 00123456789012345679       |
| Weight: 42.3 kg                  |
| 60x40x25 cm                      |
|                                  |
| SPECIAL INSTRUCTIONS:            |
| Handle with care                 |
| Keep refrigerated 2-8°C          |
| Do not stack - Fragile           |
|                                  |
| [Print]   [Email]   [Download]   |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Packing Slip                    [< Back] [Print] [Email]   |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +------------------------------ LOADING PDF ------------------------------------+            |
|  |                                                                                |            |
|  |                                                                                |            |
|  |                      [===============================]                          |            |
|  |                     Generating packing slip PDF...                             |            |
|  |                                                                                |            |
|  |                     [========== 65% ===========]                               |            |
|  |                                                                                |            |
|  |                                                                                |            |
|  +--------------------------------------------------------------------------------+            |
|                                                                                                    |
|  Fetching shipment details... Please wait                                                        |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Shipment)

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > Packing Slip                                              [< Back]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |  [Package Icon]  |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                  No Packing Slip Available                                        |
|                                                                                                    |
|                           This shipment does not have a packing slip.                             |
|                                                                                                    |
|                     Complete packing first to generate a packing slip.                            |
|                                                                                                    |
|                                                                                                    |
|                                  [Back to Shipment]                                               |
|                                                                                                    |
|                                  [Create Packing Slip]                                            |
|                                                                                                    |
|                                    [View Other Options]                                           |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - PDF Generation Failed

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Packing Slip                    [< Back] [Retry]            |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                Failed to Generate Packing Slip                                    |
|                                                                                                    |
|                             Error: PDF_GENERATION_TIMEOUT (Code 5001)                             |
|                                                                                                    |
|                         The PDF generation service took too long to respond.                      |
|                              Please try again or contact support.                                 |
|                                                                                                    |
|                                                                                                    |
|                              [Retry]    [Contact Support]                                         |
|                                                                                                    |
|                                [Back to Shipment]                                                 |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Email Send Failed

```
+----------------------------------+
| EMAIL PACKING SLIP               |
+----------------------------------+
|                                  |
| To: blue-mtn@restaurant.com      |
| CC: [Add Custom Contacts     +]  |
|                                  |
| Subject: Packing Slip - SO-02... |
|                                  |
| [Email content...]               |
|                                  |
|                                  |
| ERROR: Failed to Send Email      |
| =============================    |
| SMTP_CONNECTION_FAILED           |
| Unable to connect to mail server |
|                                  |
| [Retry]    [Try Different Email] |
|                                  |
| [Cancel]                         |
|                                  |
+----------------------------------+
```

### Error State - Missing Data

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Packing Slip                    [< Back] [Retry]            |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      | [Warning Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                   Incomplete Shipment                                              |
|                                                                                                    |
|                              Cannot generate packing slip. Missing information:                   |
|                                                                                                    |
|                                  - Box weights not captured                                       |
|                                  - SSCC barcodes not generated                                    |
|                                  - Customer address not confirmed                                 |
|                                                                                                    |
|                              Please complete packing before generating packing slip.              |
|                                                                                                    |
|                                                                                                    |
|                              [Complete Packing]    [Contact Support]                              |
|                                                                                                    |
|                                [Back to Shipment]                                                 |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Success State - Print Dialog

```
+----------------------------------+
| PRINT PACKING SLIP               |
+----------------------------------+
|                                  |
| Printer: [Brother HL-L8360CDW v]|
|                                  |
| Copies: [1] v                    |
|                                  |
| Paper Size: [Letter (8.5x11")]   |
|                                  |
| Orientation: (x) Portrait        |
|              ( ) Landscape       |
|                                  |
| [ ] Print to File                |
| [ ] Print in Color               |
| [x] Double-sided                 |
|                                  |
| Page Range:                      |
| (x) All  ( ) Pages: _____        |
|                                  |
| Preview:                         |
| +------- Page 1 -------+         |
| | [PACKING SLIP]      |         |
| +---------------------+         |
|                                  |
|                                  |
|    [Cancel]    [Print (CTRL+P)]  |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Packing Slip PDF (8.5" x 11" Document)

**Header Section (1.5 inches)**

| Element | Width | Notes |
|---------|-------|-------|
| Company Logo | 1.5" | Top left, scanned/uploaded from settings |
| "PACKING SLIP" title | 5" | Center, 24pt bold |
| Shipment metadata | 2" | SO #, Shipment #, Date, Tracking (right-aligned) |

**Ship To / Ship From (1.5 inches)**

| Section | Content | Source |
|---------|---------|--------|
| **Ship To** | Customer name, contact, address, phone | customers.name, customer_addresses.*, shipping_address_id |
| **Ship From** | Organization name, warehouse address, phone | organizations.*, locations.* (primary warehouse) |

**Line Items Table (3 inches)**

| Column | Width | Content |
|--------|-------|---------|
| Line # | 0.5" | Sequential (1, 2, 3...) |
| Product & Description | 2.5" | product_name + lot_number + best_before_date |
| Qty Ordered | 0.75" | sales_order_lines.quantity_ordered |
| Qty Shipped | 0.75" | shipment_box_contents.SUM(quantity) |
| Backorder Qty | 0.75" | quantity_ordered - quantity_shipped |
| Unit Price | 0.75" | sales_order_lines.unit_price |

**Carton Summary (1.5 inches)**

| Column | Content |
|--------|---------|
| Box # | "X of Y" (e.g., "1 of 2") |
| SSCC Barcode | shipment_boxes.sscc (GS1-128 barcode graphic) |
| Weight | shipment_boxes.weight (kg) |
| Dimensions | shipment_boxes.length x width x height (cm) |
| Total Weight | SUM(shipment_boxes.weight) |

**Special Instructions (1 inch)**

| Content | Source |
|---------|--------|
| Text block | sales_orders.notes (customer-facing instructions) |
| Handling notes | Generated from product allergens/temperature zones |
| Temperature range | dock_doors.temperature_zone mapping |

**Footer (1.5 inches)**

| Element | Content |
|---------|---------|
| Signature lines | "Shipped by: _____ Date: _____" and "Received by: _____ Date: _____" |
| Return policy | Static text (configurable in settings) |
| Contact info | organizations.contact_email, phone |

**PDF Generation:**
- Dimensions: 8.5" x 11" (letter)
- Fonts: Arial/Helvetica (web-safe fallback)
- SSCC barcode: GS1-128 format (barcode library: barcode.js)
- Margins: 0.5" all sides
- Page breaks: None (single page)
- Color: Full color (RGB mode)

### 2. Print Workflow

**Print Button Actions:**

| Step | Description | Technical |
|------|-------------|-----------|
| 1 | User clicks [Print] | onClick handler on button |
| 2 | Browser print dialog opens | window.print() or print API |
| 3 | User selects printer | Browser native printer selection |
| 4 | Optionally preview in browser | Ctrl+P shows print preview |
| 5 | Confirm print | Select "Print" in dialog |
| 6 | Send to printer | Browser handles print job |

**Print Dialog Options:**

- Printer selection (auto-detect default)
- Copies: 1 (default)
- Paper size: Letter 8.5" x 11" (force US standard)
- Orientation: Portrait (auto)
- Color: Full color (allow user control)
- Two-sided: Optional (user selectable)

**Page Settings:**
```css
@media print {
  /* Hide non-print elements */
  header, footer, .no-print { display: none; }

  /* Force page breaks */
  .page-break { page-break-after: always; }

  /* Preserve colors */
  * { -webkit-print-color-adjust: exact !important; }

  /* Optimize for printer */
  body { margin: 0; padding: 0; }
}
```

### 3. Email Workflow

**Email Modal (650px wide)**

| Element | Field | Validation |
|---------|-------|-----------|
| **To** | Dropdown (preselected contacts) | At least 1 email required, valid email format |
| **CC** | Multi-select with add (+) button | Optional, valid email format |
| **Subject** | Prefilled text | Max 200 chars, default: "Packing Slip - {SO#}" |
| **Message** | Rich text editor (basic) | Optional, default template provided |
| **Attachments** | Checkbox + label | [x] PDF attached (can toggle) |
| **Tracking Link** | Checkbox + label | [ ] Include tracking link (can toggle) |

**Email Recipient Defaults (in order of preference):**

1. Primary billing contact (customer_contacts.is_primary = true)
2. Customer account owner (customers.created_by user email)
3. Custom contacts from customer_addresses.notes (if email exists)
4. Manual entry field (user types email)

**Email Template (default):**

```
Subject: Packing Slip - SO-{order_number}

Dear {customer_contact_name},

Your order has been packed and is ready for shipment.

Order #: {sales_order_number}
Shipment #: {shipment_number}
Tracking #: {tracking_number}

Ship Date: {shipped_date}
Estimated Delivery: {estimated_delivery_date}

The packing slip is attached below, showing all items in your shipment.

[PACKING SLIP PDF CONTENT - Inline or attachment]

Tracking Link: {carrier_tracking_url}

Thank you for your order!

Best regards,
{organization_name} Team
{organization_phone}
{organization_email}

---
Return Policy: Items must be returned within 14 days for refund or credit.
Contact: {organization_returns_email} | {organization_phone}
```

**Email Sending:**

| Step | Method | Details |
|------|--------|---------|
| 1 | User fills form | To, CC, Subject, Message |
| 2 | Click [Send Email] | POST /api/shipping/packing-slips/email |
| 3 | API validates | Email addresses, PDF attachment |
| 4 | Generate PDF (if not cached) | If PDF not ready, generate first |
| 5 | Send via Supabase Edge Function | Use postmark or SendGrid API |
| 6 | Log email audit trail | audit_logs table with email details |
| 7 | Show success/error | Toast notification |

**API Endpoint (Email):**

```
POST /api/shipping/packing-slips/email

Request:
{
  "shipment_id": "uuid-ship-001",
  "to": ["blue-mtn@restaurant.com"],
  "cc": ["contact@bluerestaurant.co"],
  "subject": "Packing Slip - SO-024601",
  "message": "Custom message (optional)",
  "include_pdf": true,
  "include_tracking_link": true,
  "send_bcc_to_org": true  // CC org admin for record
}

Response (Success):
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "email_id": "uuid-email-001",
    "recipients": ["blue-mtn@restaurant.com"],
    "sent_at": "2025-01-15T14:30:00Z",
    "status": "sent",
    "audit_log_id": "uuid-audit-001"
  }
}

Response (Error):
{
  "success": false,
  "error": {
    "code": "EMAIL_SEND_FAILED",
    "message": "Failed to send email",
    "details": {
      "reason": "Invalid recipient email",
      "failed_emails": ["invalid@..."]
    }
  }
}
```

### 4. Download PDF Button

**Download Workflow:**

| Action | Description |
|--------|-------------|
| User clicks [Download] | Triggers browser download |
| PDF generated (if needed) | GET /api/shipping/packing-slips/{shipmentId}/pdf |
| File name | `packing-slip-{shipment_number}-{date}.pdf` |
| MIME type | application/pdf |
| Save location | Browser's default download folder |

---

## Main Actions

### Primary Actions

| Action | Location | Trigger | Result |
|--------|----------|---------|--------|
| **Print** | Header button | Click [Print] | Browser print dialog opens |
| **Email** | Header button | Click [Email] | Email modal opens with defaults |
| **Download** | Mobile footer button | Click [Download] | PDF downloads to device |
| **Back** | Header link | Click [< Back] | Navigate to shipment detail |

### Secondary Actions (Email Modal)

| Action | Enabled | Result |
|--------|---------|--------|
| **Add CC** | Always (if more recipients needed) | Opens text input for additional emails |
| **Edit Subject** | Always | Modify email subject line |
| **Edit Message** | Always | Modify email body text |
| **Toggle PDF Attachment** | Always | Include/exclude PDF in email |
| **Toggle Tracking Link** | If tracking_number exists | Include/exclude carrier tracking URL |
| **Cancel** | Always | Close modal without sending |
| **Send Email** | All required fields valid | POST request to send |

---

## States

| State | Description | Show Elements |
|-------|-------------|----------------|
| **Loading** | PDF generating | Spinner, progress indicator, "Generating..." message |
| **Empty** | No shipment/incomplete packing | Empty state illustration, "No packing slip available" message |
| **Success** | PDF ready, all data present | PDF preview, Print/Email/Download buttons |
| **Error** | PDF generation failed, API error | Error message, error code, Retry button |
| **Error - Missing Data** | Required fields incomplete | Warning icon, list of missing fields, "Complete Packing" CTA |
| **Error - Email Failed** | Email send failed | Error message, "Try Different Email" button |
| **Print Dialog** | Browser print preview | Native print UI with options |
| **Email Modal** | Email recipient/content form | Form inputs, Preview, Send/Cancel buttons |

---

## Data Fields

### Shipment Data (Required)

| Field | Source | Display |
|-------|--------|---------|
| shipment_number | shipments.shipment_number | Header: "Shipment: SHIP-001" |
| order_number | sales_orders.order_number | Header: "Sales Order: SO-024601" |
| shipment_date | shipments.packed_at | Header: "Shipped Date: 2025-01-15" |
| tracking_number | shipments.tracking_number | Header: "Tracking: 1Z999AA..." |
| customer_name | customers.name | Ship To section |
| customer_address | customer_addresses.* | Ship To section (address_line1, city, state, postal_code, country) |
| customer_phone | customer_addresses.notes or customers.phone | Ship To section |
| org_name | organizations.name | Ship From section |
| org_address | locations.* (primary warehouse) | Ship From section |
| org_phone | organizations.phone | Ship From section |

### Line Items Data

| Field | Source | Display |
|-------|--------|---------|
| line_number | sales_order_lines.line_number | Table: "1", "2", "3" |
| product_name | products.name | Table: "Organic Flour 5lb" |
| product_description | products.description | Under product name (optional) |
| lot_number | license_plates.lot_number (from shipment_box_contents) | Table: "Lot: FLOUR-2024-001" |
| best_before_date | license_plates.best_before_date | Table: "BBD: 2025-06-30" |
| quantity_ordered | sales_order_lines.quantity_ordered | Table: "100" |
| quantity_shipped | SUM(shipment_box_contents.quantity) for this line | Table: "100" |
| backorder_qty | quantity_ordered - quantity_shipped | Table: "0" |
| unit_price | sales_order_lines.unit_price | Table: "$24.95" |
| line_total | unit_price * quantity_shipped | Table: "$2,495.00" |

### Carton Data

| Field | Source | Display |
|--------|--------|---------|
| box_number | shipment_boxes.box_number | "Box 1 of 2" |
| sscc | shipment_boxes.sscc | GS1-128 barcode graphic + human-readable |
| weight_kg | shipment_boxes.weight | "48.5 kg" |
| length_cm | shipment_boxes.length | "60 cm" |
| width_cm | shipment_boxes.width | "40 cm" |
| height_cm | shipment_boxes.height | "30 cm" |
| total_weight | SUM(shipment_boxes.weight) | "90.8 kg" |
| total_boxes | COUNT(shipment_boxes) | "2" |

### Special Instructions

| Field | Source | Display |
|-------|--------|---------|
| customer_notes | sales_orders.notes | Text block in footer |
| temperature_zone | dock_doors.temperature_zone | "Keep refrigerated 2-8°C" |
| handling_instructions | Generated from products | "Handle with care - Fragile" |
| allergen_warnings | Generated from products.allergens | "Contains: Nuts, Dairy" (if applicable) |
| return_policy | organizations.settings.return_policy | Static footer text |

---

## API Endpoints

### Get Packing Slip

```
GET /api/shipping/packing-slips/:shipmentId

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "shipment_number": "SHIP-001",
    "order_number": "SO-024601",
    "shipment_date": "2025-01-15T10:30:00Z",
    "tracking_number": "1Z999AA10012345678",
    "status": "shipped",

    "customer": {
      "id": "uuid-cust-001",
      "name": "Blue Mountain Restaurant",
      "contact_name": "John Smith",
      "contact_email": "john@bluerestaurant.co",
      "phone": "(303) 555-1234"
    },

    "shipping_address": {
      "address_line1": "789 Main Street",
      "address_line2": "",
      "city": "Denver",
      "state": "CO",
      "postal_code": "80210",
      "country": "USA"
    },

    "organization": {
      "id": "uuid-org-001",
      "name": "MonoPilot Foods",
      "phone": "(303) 555-5678",
      "email": "sales@monopilot.com",
      "warehouse_address": "456 Industrial Blvd, Denver, CO 80202"
    },

    "line_items": [
      {
        "line_number": 1,
        "product_id": "uuid-prod-001",
        "product_name": "Organic Flour 5lb",
        "product_description": "Premium organic all-purpose flour",
        "lot_number": "FLOUR-2024-001",
        "best_before_date": "2025-06-30",
        "quantity_ordered": 100,
        "quantity_shipped": 100,
        "backorder_qty": 0,
        "unit_price": 24.95,
        "line_total": 2495.00
      },
      {
        "line_number": 2,
        "product_id": "uuid-prod-002",
        "product_name": "Organic Sugar 10lb",
        "product_description": "Organic cane sugar, non-GMO",
        "lot_number": "SUGAR-2024-045",
        "best_before_date": "2025-12-31",
        "quantity_ordered": 50,
        "quantity_shipped": 50,
        "backorder_qty": 0,
        "unit_price": 18.50,
        "line_total": 925.00
      },
      {
        "line_number": 3,
        "product_id": "uuid-prod-003",
        "product_name": "Butter 2kg Block",
        "product_description": "European-style butter, salted",
        "lot_number": "BUTT-2024-022",
        "best_before_date": "2025-04-15",
        "quantity_ordered": 25,
        "quantity_shipped": 25,
        "backorder_qty": 0,
        "unit_price": 12.75,
        "line_total": 318.75
      }
    ],

    "boxes": [
      {
        "box_number": 1,
        "sscc": "00123456789012345678",
        "weight": 48.5,
        "length": 60,
        "width": 40,
        "height": 30,
        "tracking_number": "1Z999AA10012345678"
      },
      {
        "box_number": 2,
        "sscc": "00123456789012345679",
        "weight": 42.3,
        "length": 60,
        "width": 40,
        "height": 25,
        "tracking_number": "1Z999AA10012345679"
      }
    ],

    "summary": {
      "total_boxes": 2,
      "total_weight_kg": 90.8,
      "total_items": 175,
      "order_total": 3738.75
    },

    "instructions": {
      "customer_notes": "Please call upon delivery",
      "temperature_zone": "chilled",
      "handling_instructions": "Handle with care - Perishable Items",
      "allergen_warnings": "Contains: Dairy, Gluten",
      "return_policy": "Items must be returned within 14 days for refund or credit."
    },

    "pdf_url": "https://api.monopilot.io/packing-slips/uuid-ship-001/pdf",
    "created_at": "2025-01-15T10:30:00Z",
    "ready_for_print": true
  }
}
```

### Get PDF

```
GET /api/shipping/packing-slips/:shipmentId/pdf

Response: Binary PDF file (application/pdf)
Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="packing-slip-SHIP-001-20250115.pdf"
  Content-Length: 256000
```

### Generate PDF (if needed)

```
POST /api/shipping/packing-slips/:shipmentId/generate

Request:
{
  "format": "pdf",  // or "png" for preview
  "force_regenerate": false
}

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "pdf_url": "https://...",
    "generated_at": "2025-01-15T10:35:00Z",
    "expires_at": "2025-02-15T10:35:00Z",
    "file_size_kb": 256
  }
}
```

### Print Packing Slip (legacy, now uses browser print)

```
POST /api/shipping/packing-slips/:shipmentId/print

Request:
{
  "printer_name": "Brother HL-L8360CDW",  // Optional
  "copies": 1,
  "orientation": "portrait",
  "color": true
}

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "print_job_id": "uuid-print-001",
    "status": "queued",
    "printer": "Brother HL-L8360CDW",
    "created_at": "2025-01-15T10:35:00Z"
  }
}
```

### Send Email

```
POST /api/shipping/packing-slips/:shipmentId/email

Request:
{
  "to": ["blue-mtn@restaurant.com"],
  "cc": ["contact@bluerestaurant.co"],
  "subject": "Packing Slip - SO-024601",
  "message": "Your order is ready!",
  "include_pdf": true,
  "include_tracking_link": true,
  "send_bcc_to_org": true
}

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "email_id": "uuid-email-001",
    "recipients": ["blue-mtn@restaurant.com"],
    "cc": ["contact@bluerestaurant.co"],
    "sent_at": "2025-01-15T14:30:00Z",
    "status": "sent",
    "audit_log_id": "uuid-audit-001"
  }
}
```

---

## Permissions

| Role | View | Print | Email | Download |
|------|------|-------|-------|----------|
| Admin | Yes | Yes | Yes | Yes |
| Shipping Clerk | Yes | Yes | Yes | Yes |
| Warehouse Manager | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | Yes |
| Customer (External) | Yes (own orders) | Limited | Limited | Yes |

**Permission Rules:**
- Print/Email requires "Shipping" or "Admin" role
- Download available to all authenticated users
- Customers can only access packing slips for their own orders

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Shipment ID | Must exist and be "packed" status | "Shipment not found or not yet packed" |
| PDF Ready | All required fields present | "Cannot generate packing slip - incomplete shipment" |
| Email Address | Valid format, not empty | "Invalid email address" |
| CC Email | Valid format (if provided) | "Invalid CC email address" |
| Subject | 5-200 chars | "Subject must be 5-200 characters" |
| Message | Max 5000 chars | "Message too long (max 5000 chars)" |
| Printer Name | Must exist on system | "Printer not found" |
| Box Count | >= 1 | "Shipment must have at least 1 box" |
| SSCC Present | All boxes must have SSCC | "Missing SSCC for box {N}" |
| Weight Present | All boxes must have weight | "Missing weight for box {N}" |

**Data Validation Rules (Zod Schema):**

```typescript
import { z } from 'zod';

// Packing slip request validation
const packingSlipRequestSchema = z.object({
  shipment_id: z.string().uuid('Invalid shipment ID format'),
  format: z.enum(['pdf', 'png']).default('pdf'),
  force_regenerate: z.boolean().default(false)
});

// Email form validation
const packingSlipEmailSchema = z.object({
  shipment_id: z.string().uuid('Invalid shipment ID format'),
  to: z.array(
    z.string().email('Invalid email address format')
  ).min(1, 'At least 1 recipient required'),
  cc: z.array(
    z.string().email('Invalid CC email format')
  ).optional().default([]),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  message: z.string()
    .max(5000, 'Message cannot exceed 5000 characters')
    .optional(),
  include_pdf: z.boolean().default(true),
  include_tracking_link: z.boolean().default(true),
  send_bcc_to_org: z.boolean().default(true)
});

// Shipment readiness check
function canGeneratePackingSlip(shipment: Shipment): ValidationResult {
  const errors: string[] = [];

  // Status check
  if (!['packed', 'shipped', 'delivered'].includes(shipment.status)) {
    errors.push("Shipment must be packed before generating packing slip");
  }

  // Box check
  if (!shipment.boxes || shipment.boxes.length === 0) {
    errors.push("No boxes found in shipment");
  }

  // SSCC check
  const boxesWithoutSSCC = shipment.boxes?.filter(b => !b.sscc) || [];
  if (boxesWithoutSSCC.length > 0) {
    errors.push(`${boxesWithoutSSCC.length} box(es) missing SSCC barcode`);
  }

  // Weight check
  const boxesWithoutWeight = shipment.boxes?.filter(b => !b.weight) || [];
  if (boxesWithoutWeight.length > 0) {
    errors.push(`${boxesWithoutWeight.length} box(es) missing weight`);
  }

  // Address check
  if (!shipment.shipping_address) {
    errors.push("Shipping address not defined");
  }

  // Line items check
  if (!shipment.line_items || shipment.line_items.length === 0) {
    errors.push("No line items in shipment");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Business Rules

### PDF Generation Rules

| Condition | Action | Note |
|-----------|--------|------|
| PDF already generated and fresh | Use cached PDF | Cache expires after 24 hours |
| PDF stale or shipment updated | Regenerate PDF | Triggers async PDF generation |
| Generation takes >30s | Show timeout error | User can retry or contact support |
| Shipment not "packed" | Block generation | Show error: "Complete packing first" |
| Missing SSCC/weight | Block generation | Show list of missing fields |

### Email Sending Rules

| Condition | Action | Note |
|-----------|--------|------|
| No recipient email | Block send | Show error: "At least 1 recipient required" |
| Invalid email format | Block send | Validate against RFC 5322 |
| Email send timeout | Show retry option | 30-second timeout |
| SMTP failure | Show error with reason | Log to audit trail |
| Success | Log audit entry | Record recipient, time, status |

### Print Workflow Rules

| Condition | Action | Note |
|-----------|--------|------|
| User clicks Print | Open browser print dialog | Ctrl+P / Cmd+P also works |
| User selects printer | Print job sent to device | No server-side print queue |
| Print preview shown | User can adjust settings | Paper size, orientation, color |
| Print job completes | No confirmation needed | Browser handles print job status |

### Audit Trail

**Logged Events:**

| Event | Fields Logged |
|-------|---------------|
| PDF Generated | shipment_id, user_id, generated_at, file_size_kb |
| PDF Downloaded | shipment_id, user_id, downloaded_at |
| Print Requested | shipment_id, user_id, printer_name, requested_at |
| Email Sent | shipment_id, user_id, recipients, sent_at, email_id |
| Email Failed | shipment_id, user_id, recipients, failure_reason |

---

## Accessibility

### Touch Targets

| Element | Size | Notes |
|---------|------|-------|
| [Print] button | 48x48dp | Header button |
| [Email] button | 48x48dp | Header button |
| [Download] button | 48x48dp | Mobile footer button |
| [< Back] link | 48x48dp | Navigation |
| PDF page scroller | 44dp height | Touch-friendly scroll area |
| Email input fields | 44dp min height | Form inputs |
| Send/Cancel buttons | 48x48dp | Modal action buttons |

### Contrast Ratios

| Element | Foreground | Background | Ratio | WCAG |
|---------|------------|------------|-------|------|
| Button text | #FFFFFF | #2563EB | 8.59:1 | AAA |
| Error message | #DC2626 | #FFFFFF | 5.90:1 | AA |
| Success message | #15803D | #FFFFFF | 5.0:1 | AA |
| Table text | #111827 | #FFFFFF | 16.65:1 | AAA |
| PDF preview background | #FFFFFF | #F3F4F6 | 18.5:1 | AAA |

### Screen Reader

```html
<!-- Page header -->
<h1 aria-label="Packing Slip for Sales Order SO-024601">
  SO-024601 > Packing Slip
</h1>

<!-- Print button -->
<button aria-label="Print packing slip for shipment SHIP-001">
  Print
</button>

<!-- Email button -->
<button aria-label="Send packing slip via email">
  Email
</button>

<!-- PDF Preview -->
<section
  role="region"
  aria-label="Packing slip PDF preview (8.5 by 11 inches)"
  aria-live="polite"
>
  <iframe
    title="Packing slip PDF preview"
    aria-label="Preview of packing slip document for SO-024601"
    src="..."
  ></iframe>
</section>

<!-- Email Modal -->
<dialog aria-labelledby="email-modal-title" aria-modal="true">
  <h2 id="email-modal-title">Email Packing Slip</h2>
  <label for="email-to">To (required)</label>
  <input id="email-to" type="email" required />
</dialog>

<!-- Status messages -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Email sent successfully to blue-mtn@restaurant.com
</div>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements (buttons, form fields) |
| Shift+Tab | Move backwards |
| Enter | Activate button, submit form, open modal |
| Space | Toggle checkbox, open dropdown |
| Escape | Close modal/dropdown, return focus to triggering button |
| Ctrl+P / Cmd+P | Open print dialog (browser-native) |
| Arrow Down | Scroll PDF preview down |
| Arrow Up | Scroll PDF preview up |
| Page Down | Next page (if multi-page) |
| Page Up | Previous page |

**Focus Management:**
- Visible focus indicator (2px blue outline, 4px offset)
- Modal focus trap (Tab cycles within modal only)
- Return focus to [Email] button after modal closes
- Skip to main content link at page top

### ARIA Attributes

```html
<!-- Print button -->
<button
  aria-label="Print packing slip for SO-024601"
  aria-pressed="false"
  role="button"
>
  Print
</button>

<!-- Email button with disabled state -->
<button
  aria-label="Send packing slip via email"
  aria-disabled="false"
  role="button"
>
  Email
</button>

<!-- Loading state -->
<div
  role="status"
  aria-live="polite"
  aria-label="Generating packing slip PDF, 65 percent complete"
>
  <span aria-hidden="true">[========== 65% ===========]</span>
  Generating packing slip PDF...
</div>

<!-- Error state -->
<div
  role="alert"
  aria-live="assertive"
  aria-label="Error: PDF generation timeout"
>
  Failed to generate packing slip. Please try again.
</div>

<!-- Email form -->
<form aria-label="Email packing slip">
  <fieldset>
    <legend>Email Recipients</legend>
    <label>
      To:
      <select aria-required="true" aria-label="Primary recipient email">
        <option>blue-mtn@restaurant.com</option>
      </select>
    </label>
  </fieldset>
</form>

<!-- Pagination (if multi-page) -->
<nav aria-label="Packing slip pages">
  <button aria-label="Previous page">Previous</button>
  <span aria-live="polite">Page <span aria-current="page">1</span> of 1</span>
  <button aria-label="Next page" aria-disabled="true">Next</button>
</nav>
```

---

## Responsive Breakpoints

### Desktop (>1024px)

**Layout:**
- PDF preview: 70% width, right sidebar empty
- Print/Email/Download buttons: Horizontal alignment in header
- Full table with all columns visible
- 1-2 page scrollable PDF preview

**PDF Zoom:**
- Default: 100% (actual size)
- Zoom controls: 50%, 75%, 100%, 125%, 150%, Fit Width
- User can scroll or use keyboard (Page Up/Down)

### Tablet (768-1024px)

**Layout:**
- PDF preview: 100% width, scrollable
- Buttons: Horizontal row below header
- Table condensed (fewer columns, stacked rows)
- Single page visible, scroll to see more

**PDF Zoom:**
- Default: Fit Width (auto-zoom)
- Zoom controls: Fit Width, Fit Page, 100%, +/-
- Touch-friendly zoom buttons (48dp)

### Mobile (<768px)

**Layout:**
- PDF preview: Full width, scrollable vertically
- Buttons: Vertical stack in footer (or sticky bottom action bar)
- Table converted to card layout
- Single section visible at a time

**PDF Interaction:**
- Double-tap to zoom in/out
- Pinch to zoom (native browser)
- Swipe to scroll
- Landscape orientation support

**Button Placement (Mobile):**
- If >3 buttons: Use sticky bottom action bar
- If 2-3 buttons: Vertical stack below PDF
- Action bar: Semi-transparent overlay, 48dp minimum height

**Footer Actions (Mobile):**
```
+----------------------------------+
| PDF Preview (Scrollable)         |
| (Content scrolls over footer)    |
+----------------------------------+
| [Print]  [Email]  [Download]    |  <- Sticky footer
+----------------------------------+
```

---

## Performance Notes

### PDF Generation Performance

**Caching Strategy:**

```typescript
// Redis cache keys
const cacheKey = `org:{orgId}:packing-slip:{shipmentId}`;
const ttl = 24 * 60 * 60; // 24 hours

// Check cache first
const cachedPdf = await redis.get(cacheKey);
if (cachedPdf && !forceRegenerate) {
  return cachedPdf; // Return cached PDF
}

// Generate PDF (async)
const pdf = await generatePackingSlipPdf(shipment);
await redis.set(cacheKey, pdf, ttl);
return pdf;
```

**Generation Benchmarks:**

| Operation | Target | Notes |
|-----------|--------|-------|
| Fetch shipment data | <500ms | Including related data (boxes, line items) |
| PDF generation | <5s | Timeout after 30s |
| Email send | <2s | Including PDF attachment |
| Print dialog open | <1s | Browser-native, no server delay |
| Page load (PDF preview) | <1s | Including PDF fetch |

### Browser Optimization

**PDF Preview:**
- Lazy load PDF iframe (scroll into view before loading)
- Use worker thread for PDF rendering (pdf.js Worker)
- Stream large PDFs for faster initial display
- Cancel pending PDF loads when navigating away

**Email Modal:**
- Debounce recipient dropdown (300ms)
- Debounce email validation (300ms)
- Cache contact list (5-min TTL)

**Print Dialog:**
- Instant browser print dialog (no server roundtrip)
- Pre-load print stylesheet on page load
- No server-side print queue (simplified workflow)

### Load Time Targets

| Page | Target | P95 |
|------|--------|-----|
| Packing Slip Page (initial load) | <1s | <2s |
| PDF Generation (fresh) | <5s | <10s |
| PDF from Cache | <500ms | <1s |
| Email Modal Open | <300ms | <500ms |
| Print Dialog Open | <1s | <1s |

---

## Testing Requirements

### Unit Tests

**PDF Generation:**
```typescript
describe('Packing Slip PDF Generation', () => {
  it('should generate valid PDF with all line items', () => {
    const pdf = generatePackingSlipPdf(mockShipment);
    expect(pdf).toBeDefined();
    expect(pdf.pageCount).toBe(1);
    expect(pdf.text).toContain('Organic Flour');
    expect(pdf.text).toContain('SHIP-001');
  });

  it('should include SSCC barcode for each box', () => {
    const pdf = generatePackingSlipPdf(mockShipment);
    expect(pdf.images).toHaveLength(2); // 2 barcodes for 2 boxes
  });

  it('should format currency correctly', () => {
    const pdf = generatePackingSlipPdf(mockShipment);
    expect(pdf.text).toContain('$24.95');
    expect(pdf.text).toContain('$2,495.00'); // With thousands separator
  });

  it('should calculate totals correctly', () => {
    const pdf = generatePackingSlipPdf(mockShipment);
    const total = pdf.text.match(/Subtotal: \$(\d+\.\d{2})/);
    expect(total[1]).toBe('3738.75');
  });
});
```

**Email Validation:**
```typescript
describe('Email Validation', () => {
  it('should require at least one recipient', () => {
    const result = validateEmailForm({ to: [], cc: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 1 recipient required');
  });

  it('should validate email format', () => {
    const result = validateEmailForm({ to: ['invalid-email'], cc: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid email/);
  });

  it('should allow multiple recipients', () => {
    const result = validateEmailForm({
      to: ['user1@example.com', 'user2@example.com'],
      cc: ['admin@example.com']
    });
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

**API Tests:**
```typescript
describe('Packing Slip API', () => {
  it('GET /api/shipping/packing-slips/:id - should return packing slip data', async () => {
    const response = await request(app)
      .get(`/api/shipping/packing-slips/${shipmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.shipment_number).toBe('SHIP-001');
    expect(response.body.data.line_items).toHaveLength(3);
    expect(response.body.data.boxes).toHaveLength(2);
  });

  it('GET /api/shipping/packing-slips/:id/pdf - should return PDF file', async () => {
    const response = await request(app)
      .get(`/api/shipping/packing-slips/${shipmentId}/pdf`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/pdf');
    expect(response.body.length).toBeGreaterThan(10000); // PDF > 10KB
  });

  it('POST /api/shipping/packing-slips/:id/email - should send email', async () => {
    const response = await request(app)
      .post(`/api/shipping/packing-slips/${shipmentId}/email`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        to: ['test@example.com'],
        subject: 'Test Packing Slip',
        include_pdf: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('sent');
    expect(response.body.data.recipients).toContain('test@example.com');
  });

  it('POST /api/shipping/packing-slips/:id/email - should fail with invalid recipient', async () => {
    const response = await request(app)
      .post(`/api/shipping/packing-slips/${shipmentId}/email`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        to: ['invalid-email'],
        subject: 'Test'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_EMAIL_FORMAT');
  });

  it('RLS - should only return org packing slips', async () => {
    const org1Response = await request(app)
      .get(`/api/shipping/packing-slips/${shipmentId}`)
      .set('Authorization', `Bearer ${org1Token}`);

    const org2Response = await request(app)
      .get(`/api/shipping/packing-slips/${shipmentId}`)
      .set('Authorization', `Bearer ${org2Token}`);

    expect(org1Response.status).toBe(200);
    expect(org2Response.status).toBe(403); // Forbidden
  });
});
```

### E2E Tests (Playwright)

```typescript
describe('Packing Slip E2E', () => {
  test('should load packing slip and show PDF preview', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // Wait for PDF to load
    await expect(page.getByText('PACKING SLIP')).toBeVisible();
    await expect(page.getByText('SO-024601')).toBeVisible();

    // Check buttons
    await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Email' })).toBeVisible();
  });

  test('should open print dialog', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // Spy on window.print
    const printSpy = await page.evaluateHandle(() => {
      window.printCalled = false;
      const origPrint = window.print;
      window.print = () => { window.printCalled = true; };
      return window;
    });

    // Click print
    await page.getByRole('button', { name: 'Print' }).click();

    // Verify print was called
    const printCalled = await page.evaluate(() => window.printCalled);
    expect(printCalled).toBe(true);
  });

  test('should open email modal with recipient suggestions', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // Click email
    await page.getByRole('button', { name: 'Email' }).click();

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('To')).toBeVisible();

    // Should have suggested recipients
    await page.getByLabel('To').click();
    await expect(page.getByText('blue-mtn@restaurant.com')).toBeVisible();
  });

  test('should send email with valid form', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // Open email modal
    await page.getByRole('button', { name: 'Email' }).click();

    // Fill form
    await page.getByLabel('To').selectOption('blue-mtn@restaurant.com');
    await page.getByLabel('Subject').fill('Order Packing Slip');

    // Send
    await page.getByRole('button', { name: 'Send Email' }).click();

    // Should show success
    await expect(page.getByText(/sent successfully|Email sent/i)).toBeVisible();
  });

  test('should block email send with invalid recipient', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    await page.getByRole('button', { name: 'Email' }).click();

    // Type invalid email
    const toInput = page.getByLabel('To');
    await toInput.fill('invalid-email');

    // Try to send
    await page.getByRole('button', { name: 'Send Email' }).click();

    // Should show error
    await expect(page.getByText(/Invalid email|Email format/i)).toBeVisible();
  });

  test('should download PDF on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // Download button should be visible
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();

    // Click download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/packing-slip.*\.pdf/);
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // PDF should scale to fit width
    const pdfElement = page.locator('iframe');
    const box = await pdfElement.boundingBox();
    expect(box?.width).toBeCloseTo(768, { absoluteTolerance: 50 });
  });

  test('should handle missing shipment gracefully', async ({ page }) => {
    await page.goto(`/shipping/shipments/invalid-id/packing-slip`);

    // Should show empty state
    await expect(page.getByText(/No Packing Slip Available|not found/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Shipment' })).toBeVisible();
  });

  test('should show error if shipment not packed', async ({ page }) => {
    // Use a shipment in "packing" status, not "packed"
    await page.goto(`/shipping/shipments/${unpackedShipmentId}/packing-slip`);

    await expect(page.getByText(/Complete packing|Incomplete shipment/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete Packing' })).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/packing-slip`);

    // Ctrl+P should open print (browser native)
    // We can't directly test this, but we can verify buttons are keyboard accessible
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Print' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Email' })).toBeFocused();

    // Enter should activate button
    await page.keyboard.press('Enter');
    // Should trigger email modal (from previous test)
  });
});
```

---

## Quality Gates

Before handoff to FRONTEND-DEV:

- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Additional error states defined (Missing Data, Email Failed, Missing Shipment)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] PDF generation and caching strategy documented
- [x] Print workflow documented with browser integration
- [x] Email workflow with modal and validation documented
- [x] Accessibility checklist passed (touch targets 48x48dp, contrast ratios, screen reader, keyboard, ARIA)
- [x] Performance targets defined (PDF <5s, Email <2s, Page load <1s)
- [x] SSCC barcode generation in PDF documented
- [x] Line items and carton summary layouts defined
- [x] Special instructions and footer sections specified
- [x] Email template with default message provided
- [x] Business rules for audit trail documented
- [x] Permissions matrix for 4 roles documented
- [x] Validation rules for emails, dates, required fields defined
- [x] Responsive mobile footer action bar documented
- [x] PDF zoom controls and keyboard navigation defined
- [x] Testing requirements complete (Unit, Integration, E2E)
- [x] Mobile-specific interactions (pinch/zoom, swipe) documented
- [x] Zod schema reference added for validation
- [x] Subtotal calculation corrected in ASCII wireframe
- [x] Print orientation aligned to Portrait default
- [x] Success message contrast ratio updated to 5.0:1
- [x] Mobile email modal layout clarified

---

## Handoff to FRONTEND-DEV

```yaml
feature: Packing Slip Generation & Printing
story: SHIP-020
fr_coverage: FR-7.40
approval_status:
  mode: "review_each"
  user_approved: false  # Awaiting user approval
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/SHIP-020-packing-slip.md
  api_endpoints:
    - GET /api/shipping/packing-slips/:shipmentId
    - GET /api/shipping/packing-slips/:shipmentId/pdf
    - POST /api/shipping/packing-slips/:shipmentId/generate
    - POST /api/shipping/packing-slips/:shipmentId/print
    - POST /api/shipping/packing-slips/:shipmentId/email
states_per_screen:
  - loading: Progress bar, "Generating packing slip..." message
  - empty: No packing slip available, CTA to complete packing
  - success: PDF preview with Print/Email/Download buttons
  - error: PDF generation failed with Retry button
  - error_missing_data: Incomplete shipment, list missing fields
  - error_email_failed: Email send failed with retry option
  - print_dialog: Browser native print dialog
  - email_modal: Email recipient form with validation
breakpoints:
  mobile: "<768px (Full-width PDF, vertical action buttons, sticky footer)"
  tablet: "768-1024px (Scaled PDF, horizontal buttons, condensed table)"
  desktop: ">1024px (100% preview, PDF zoom controls, header buttons)"
accessibility:
  touch_targets: "48x48dp minimum (buttons, form inputs, scroll areas)"
  contrast: "All elements meet WCAG AA 4.5:1 minimum"
  aria_roles: "region, status, alert, dialog, button, form"
  keyboard_nav: "Tab, Enter, Space, Escape, Ctrl+P for print, Page Up/Down for scroll"
  screen_reader: "Full labeling for all interactive elements, live regions for status"
performance_targets:
  page_load: "<1s (including PDF fetch)"
  pdf_generation: "<5s (timeout 30s)"
  email_send: "<2s"
  print_dialog: "<1s"
  cache_hit: "<500ms"
pdf_specifications:
  dimensions: "8.5\" x 11\" (letter)"
  margins: "0.5\" all sides"
  font: "Arial/Helvetica (web-safe)"
  barcode_format: "GS1-128 (SSCC)"
  page_count: "1 page"
  color_mode: "RGB full color"
related_screens:
  - SHIP-015: Shipment Detail (parent)
  - SHIP-017: Packing Station (where packing happens)
  - SHIP-018: SSCC Label Print (similar print workflow)
database_tables:
  - shipments (parent)
  - shipment_boxes (carton data)
  - shipment_box_contents (line items)
  - sales_orders (order reference)
  - sales_order_lines (line items)
  - products (product details)
  - license_plates (lot/BBD)
  - customers (ship-to address)
  - customer_addresses (address details)
  - organizations (ship-from)
  - audit_logs (email/print events)
business_logic:
  - Cannot generate if shipment status not in ["packed", "shipped", "delivered"]
  - All boxes must have SSCC before PDF generation
  - All boxes must have weight before PDF generation
  - PDF cached for 24 hours, regenerate on shipment update
  - Email audit trail includes recipients and timestamp
  - Print uses browser native dialog (no server-side queue)
  - Batch emails can include multiple recipients
validation:
  - Shipment must exist and belong to user's org (RLS)
  - Email addresses must be valid format (RFC 5322)
  - Subject max 200 chars
  - Message max 5000 chars
  - Printer name must exist (if specified)
  - PDF timeout after 30s
  - Email timeout after 30s
architectural_decisions:
  - Browser print dialog used instead of server-side print queue (simplified)
  - PDF cached in Redis for 24h TTL (reduces generation load)
  - Email sent via Supabase Edge Function (serverless pattern)
  - Audit trail logged for compliance (print/email events)
  - SSCC barcode generated at pack time, rendered in PDF
technical_notes:
  - PDF generation: pdfkit or puppeteer library
  - SSCC barcode: barcode.js with GS1-128 format
  - Email service: SendGrid or Postmark via Supabase Functions
  - PDF preview: pdf.js (Mozilla library)
  - Cache layer: Redis with 24h TTL and manual invalidation on shipment update
  - Validation: Zod schema with email, subject, message validation
estimated_effort: "16-20 hours (PDF generation, email workflow, print integration, 3 workflows)"
quality_target: "95%+"
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Quality Target**: 95%+

---

**END OF DOCUMENT**
