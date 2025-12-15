# SHIP-021: Bill of Lading (BOL) Generation & Printing

**Module**: Shipping
**Feature**: Bill of Lading Generation (FR-7.41)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State (Desktop) - BOL Preview (8.5x11")

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Bill of Lading               [< Back] [Print] [Email] [Download] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +------------------------------ PDF PREVIEW (8.5x11") ------------------------------------+  |
|  |                                                                                            |  |
|  |  BILL OF LADING                                       BOL #: BOL-2025-001234                 |  |
|  |  Shipper: MonoPilot Foods                             Date: 2025-01-15                       |  |
|  |  456 Industrial Blvd                                  Carrier: DHL Freight                    |  |
|  |  Denver, CO 80202, USA                                Pro #: 1Z999AA10012345678              |  |
|  |  Phone: (303) 555-5678                                                                       |  |
|  |  Contact: shipping@monopilot.com                                                             |  |
|  |                                                                                            |  |
|  |  +--------- CONSIGNEE (SHIP TO) --------+   +--------- SPECIAL INSTRUCTIONS --------+     |  |
|  |  | Blue Mountain Restaurant             |   | Handle with care - Perishable          |     |  |
|  |  | Attn: John Smith                     |   | Keep refrigerated at 2-8°C (35-46°F)   |     |  |
|  |  | 789 Main Street                      |   | Do not stack - Fragile items            |     |  |
|  |  | Denver, CO 80210, USA                |   | Temperature-controlled transport req'd  |     |  |
|  |  | Phone: (303) 555-1234                |   | Hazmat: None                            |     |  |
|  |  +------------------------------------+   +----------------------------------------+     |  |
|  |                                                                                            |  |
|  |  FREIGHT TERMS: Prepaid          PAYMENT TERMS: Due upon receipt                           |  |
|  |                                                                                            |  |
|  |  +----------- SHIPMENT DETAILS -------------------------------------------------------+  |  |
|  |  | Item # | SSCC Barcode        | Weight   | Dimensions (LxWxH) | Freight | NMFC  |  |  |
|  |  |        |                     | (kg)     | (cm)               | Class   | Code  |  |  |
|  |  +--------+---------------------+----------+--------------------+---------+-------+  |  |
|  |  | 1      | 00123456789012345678| 48.5     | 60 x 40 x 30      | 65      | 1234  |  |  |
|  |  | 2      | 00123456789012345679| 42.3     | 60 x 40 x 25      | 65      | 1234  |  |  |
|  |  +--------+---------------------+----------+--------------------+---------+-------+  |  |
|  |                                                                                            |  |
|  |  TOTALS: 2 cartons / 0 pallets | Total Weight: 90.8 kg | Declared Value: $3,738.75      |  |
|  |                                                                                            |  |
|  |  +----------- PRODUCT SUMMARY -------------------------------------------------------+  |  |
|  |  | Carton 1 (SSCC: 00123456789012345678)                                               |  |  |
|  |  |   - Organic Flour 5lb (Lot: FLOUR-2024-001, BBD: 2025-06-30) x 100 units            |  |  |
|  |  |   - Butter 2kg Block (Lot: BUTT-2024-022, BBD: 2025-04-15) x 12 units               |  |  |
|  |  |                                                                                       |  |  |
|  |  | Carton 2 (SSCC: 00123456789012345679)                                               |  |  |
|  |  |   - Organic Sugar 10lb (Lot: SUGAR-2024-045, BBD: 2025-12-31) x 50 units            |  |  |
|  |  |   - Butter 2kg Block (Lot: BUTT-2024-022, BBD: 2025-04-15) x 13 units               |  |  |
|  |  +-----------------------------------------------------------------------+               |  |  |
|  |                                                                                            |  |
|  |  +----- SHIPPER SIGNATURE -----+      +----- CARRIER SIGNATURE -----+                   |  |
|  |  | Signature:  _______________  |      | Signature: _______________  |                   |  |
|  |  | Name:       _______________  |      | Name:      _______________  |                   |  |
|  |  | Title:      _______________  |      | Title:     _______________  |                   |  |
|  |  | Date:       _______________  |      | Date:      _______________  |                   |  |
|  |  +----------------------------+      +----------------------------+                   |  |
|  |                                                                                            |  |
|  |  RETURN BOL TO: shipping@monopilot.com | DocID: BOL-2025-001234 | Page 1 of 1            |  |
|  |                                                                                            |  |
|  +-----------+------------------+------------------+-----------------------------------------+  |
|  [Page 1]   [Zoom: 100%] [<] [>]                     [Print View]                             |
|  +----------------------------------+------------------+------------------+----------+-------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Print] - Sends to system printer or print dialog
[Email] - Opens email modal with recipient suggestions
[Download] - Downloads PDF to device
```

### Success State (Desktop) - Email Modal

```
+----------------------------------+
| EMAIL BILL OF LADING             |
+----------------------------------+
|                                  |
| To: [Carrier Contact Email   v]  |
|     > dhl@dhlogistics.com     |
|     > john.smith@dhl.com      |
|                                  |
| CC: [Add Custom Contacts     +]  |
|                                  |
| Subject: [BOL-2025-001234        |
|           Shipment Manifest  ]   |
|                                  |
| Message:                         |
| +-----------------------------+  |
| | Dear DHL Freight,          |  |
| |                             |  |
| | Please find attached the   |  |
| | Bill of Lading for our      |  |
| | shipment.                  |  |
| |                             |  |
| | BOL #: BOL-2025-001234     |  |
| | Pro #: 1Z999AA100123       |  |
| | Date: 2025-01-15            |  |
| | Total Weight: 90.8 kg       |  |
| |                             |  |
| | Thank you!                 |  |
| |                             |  |
| | MonoPilot Foods            |  |
| +-----------------------------+  |
|                                  |
| [ ] Include PDF attachment       |
| [x] Include carrier instructions |
|                                  |
|      [Cancel]    [Send Email]    |
|                                  |
+----------------------------------+
```

### Success State (Tablet: 768-1024px)

```
+--------------------------------------------------------------------+
|  Shipping > SO-024601 > BOL               [< Back] [Print] [Email]  |
+--------------------------------------------------------------------+
|                                                                      |
|  +----- PDF PREVIEW (Scaled) -----+                                |
|  |                                |                                |
|  | BILL OF LADING                 |                                |
|  | BOL #: BOL-2025-001234         |                                |
|  | Date: 2025-01-15               |                                |
|  | Carrier: DHL Freight           |                                |
|  | Pro #: 1Z999AA100123           |                                |
|  |                                |                                |
|  | SHIPPER:                       |                                |
|  | MonoPilot Foods                |                                |
|  | 456 Industrial Blvd            |                                |
|  | Denver, CO 80202               |                                |
|  |                                |                                |
|  | CONSIGNEE:                     |                                |
|  | Blue Mountain Restaurant       |                                |
|  | 789 Main Street                |                                |
|  | Denver, CO 80210               |                                |
|  |                                |                                |
|  | FREIGHT TERMS: Prepaid         |                                |
|  | PAYMENT TERMS: Due on receipt  |                                |
|  |                                |                                |
|  | CARTONS: 2 boxes               |                                |
|  | TOTAL WEIGHT: 90.8 kg          |                                |
|  | VALUE: $3,738.75               |                                |
|  |                                |                                |
|  | Carton 1 (SSCC: 001234...)     |                                |
|  | Weight: 48.5 kg                |                                |
|  |                                |                                |
|  | Carton 2 (SSCC: 001234...)     |                                |
|  | Weight: 42.3 kg                |                                |
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
|  < SO-024601 Bill of Lading      |
|  [Print] [Email] [Download]      |
+----------------------------------+
|                                  |
| BILL OF LADING                   |
|                                  |
| BOL #: BOL-2025-001234           |
| Date: 2025-01-15                 |
| Pro #: 1Z999AA100123             |
|                                  |
| SHIPPER:                         |
| MonoPilot Foods                  |
| 456 Industrial Blvd              |
| Denver, CO 80202                 |
|                                  |
| CONSIGNEE:                       |
| Blue Mountain Restaurant         |
| 789 Main Street                  |
| Denver, CO 80210                 |
|                                  |
| FREIGHT TERMS: Prepaid           |
| PAYMENT: Due upon receipt        |
|                                  |
| CARTONS: 2 boxes                 |
| WEIGHT: 90.8 kg                  |
| VALUE: $3,738.75                 |
|                                  |
| Carton 1/2:                      |
| SSCC: 00123456789012345678       |
| Weight: 48.5 kg                  |
| 60x40x30 cm                      |
| Freight Class: 65                |
| NMFC: 1234                       |
|                                  |
| Carton 2/2:                      |
| SSCC: 00123456789012345679       |
| Weight: 42.3 kg                  |
| 60x40x25 cm                      |
| Freight Class: 65                |
| NMFC: 1234                       |
|                                  |
| SPECIAL INSTRUCTIONS:            |
| Handle with care                 |
| Keep refrigerated 2-8°C          |
| Temperature-controlled req'd     |
|                                  |
| [Print]  [Email]  [Download]     |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Bill of Lading               [< Back] [Print] [Email]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +------------------------------ LOADING PDF ------------------------------------+            |
|  |                                                                                |            |
|  |                                                                                |            |
|  |                      [===============================]                          |            |
|  |                     Generating Bill of Lading PDF...                           |            |
|  |                                                                                |            |
|  |                     [========== 45% ===========]                               |            |
|  |                                                                                |            |
|  |                                                                                |            |
|  +--------------------------------------------------------------------------------+            |
|                                                                                                    |
|  Fetching shipment and carrier details... Please wait                                            |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Empty State (No Shipment)

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > Bill of Lading                                            [< Back]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      | [Document Icon]  |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    No Bill of Lading Available                                    |
|                                                                                                    |
|                                 This shipment does not have a BOL.                               |
|                                                                                                    |
|                         BOL is generated after packing is complete                               |
|                         and carrier is assigned to the shipment.                                  |
|                                                                                                    |
|                                                                                                    |
|                                  [Back to Shipment]                                               |
|                                                                                                    |
|                                  [Generate BOL]                                                   |
|                                                                                                    |
|                                    [View Packing Slip]                                            |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - PDF Generation Failed

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Bill of Lading               [< Back] [Retry]                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                    Failed to Generate BOL                                         |
|                                                                                                    |
|                              Error: PDF_GENERATION_TIMEOUT (Code 5002)                            |
|                                                                                                    |
|                          The BOL generation service took too long to respond.                     |
|                          Please try again or contact support.                                    |
|                                                                                                    |
|                                                                                                    |
|                              [Retry]    [Contact Support]                                         |
|                                                                                                    |
|                                [Back to Shipment]                                                 |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Missing Data

```
+--------------------------------------------------------------------------------------------------+
|  Shipping > Shipments > SO-024601 > Bill of Lading               [< Back] [Retry]                |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      | [Warning Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                                   Incomplete Shipment                                              |
|                                                                                                    |
|                              Cannot generate BOL. Missing information:                            |
|                                                                                                    |
|                                  - No carrier assigned (required for Pro #)                       |
|                                  - Box weights not captured                                       |
|                                  - SSCC barcodes not generated                                    |
|                                  - Freight class and NMFC codes not set                           |
|                                                                                                    |
|                              Please complete packing before generating BOL.                       |
|                                                                                                    |
|                                                                                                    |
|                              [Complete Packing]    [Assign Carrier]                               |
|                                                                                                    |
|                                [Back to Shipment]                                                 |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Email Send Failed

```
+----------------------------------+
| EMAIL BILL OF LADING             |
+----------------------------------+
|                                  |
| To: dhl@dhlogistics.com          |
| CC: [Add Custom Contacts     +]  |
|                                  |
| Subject: BOL-2025-001234 ...     |
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

### Success State - Print Dialog

```
+----------------------------------+
| PRINT BOL                        |
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
| [x] Print in Color               |
| [x] Double-sided                 |
|                                  |
| Page Range:                      |
| (x) All  ( ) Pages: _____        |
|                                  |
| Preview:                         |
| +------- Page 1 -------+         |
| | [BILL OF LADING]    |         |
| | BOL-2025-001234     |         |
| +---------------------+         |
|                                  |
|                                  |
|    [Cancel]    [Print (CTRL+P)]  |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. BOL PDF (8.5" x 11" Document)

**Header Section (1.75 inches)**

| Element | Width | Notes |
|---------|-------|-------|
| Document Title | 3" | "BILL OF LADING" (18pt bold) |
| BOL # | 2" | Right-aligned, e.g., "BOL-2025-001234" |
| Shipper Name & Address | 2.5" | Left section: warehouse location |
| Date, Carrier, Pro # | 2" | Right section: shipment metadata |

**Shipper/Consignee Section (1.5 inches)**

| Section | Content | Source |
|---------|---------|--------|
| **Shipper** | Organization name, address, phone, contact email | organizations.*, locations.* (primary warehouse) |
| **Consignee** | Customer name, address, phone, contact name | customers.name, customer_addresses.*, contacts.* |
| **Carrier** | Carrier name, Pro/Tracking number | shipments.carrier_name, carrier_configs.name |

**Special Instructions (1 inch)**

| Content | Source |
|---------|--------|
| Temperature control requirements | dock_doors.temperature_zone mapping |
| Hazmat declarations (if applicable) | shipment_items.hazmat_class (future) |
| Handling instructions | Generated from product attributes |
| Customer delivery notes | sales_orders.special_instructions |

**Freight Details Table (2 inches)**

| Column | Width | Content |
|--------|-------|---------|
| Item # | 0.5" | Sequential (1, 2, 3...) |
| SSCC Barcode | 2" | shipment_boxes.sscc (human-readable) |
| Weight | 0.75" | shipment_boxes.weight (kg) |
| Dimensions | 1.5" | L x W x H (cm) |
| Freight Class | 0.75" | LTL shipping classification (e.g., 65) |
| NMFC Code | 0.75" | Commodity code (e.g., 1234) |

**Totals Section (0.75 inches)**

| Metric | Calculation |
|--------|-------------|
| Total Cartons | COUNT(shipment_boxes) |
| Total Pallets | COUNT(shipment_boxes) WHERE box_type = 'pallet' |
| Total Weight | SUM(shipment_boxes.weight) (kg) |
| Declared Value | SUM(sales_order_lines.unit_price * quantity) |

**Product Summary (1.5 inches)**

| Content | Notes |
|---------|-------|
| By carton (SSCC) | Group line items by shipment_box |
| Product name + lot number | With BBD for traceability |
| Quantity per carton | From shipment_box_contents |
| Leave blank lines for manual adds | Allows carrier to update during transport |

**Signature Section (1.25 inches)**

| Field | Placeholder |
|-------|-------------|
| Shipper Signature | ______________ |
| Shipper Name | ______________ |
| Shipper Title | ______________ |
| Shipper Date | ______________ |
| Carrier Signature | ______________ |
| Carrier Name | ______________ |
| Carrier Title | ______________ |
| Carrier Date | ______________ |

**Footer (0.5 inches)**

| Element | Content |
|---------|---------|
| Return instruction | "RETURN BOL TO: {org_email}" |
| Document ID | BOL #, Doc ID |
| Page indicator | "Page 1 of 1" |

**PDF Specifications:**

- Dimensions: 8.5" x 11" (letter)
- Fonts: Arial/Helvetica (web-safe fallback)
- Margins: 0.5" all sides
- Page breaks: None (single page standard, can extend to 2 pages with long product lists)
- Color: Full color (RGB mode) or B&W for printing
- SSCC barcode: Human-readable text (barcode graphics optional but recommended)
- **Multi-page threshold**: Page break after 10 cartons OR 25 product lines (whichever comes first)

### 2. BOL Data Fields

**Shipment Metadata (Required)**

| Field | Source | Display |
|-------|--------|---------|
| bol_number | generated auto-increment | Header: "BOL #: BOL-2025-001234" |
| bol_date | shipments.created_at or NOW() | Header: "Date: 2025-01-15" |
| carrier_name | carrier_configs.name | Header: "Carrier: DHL Freight" |
| pro_number | shipments.tracking_number (carrier's Pro #) | Header: "Pro #: 1Z999AA..." |
| shipment_id | shipments.id | Hidden, for audit trail |
| sales_order_number | sales_orders.order_number | For traceability |

**Shipper Data**

| Field | Source | Display |
|-------|--------|---------|
| org_name | organizations.name | "MonoPilot Foods" |
| org_address | locations.* (primary warehouse) | Address block |
| org_phone | organizations.phone | Contact line |
| org_email | organizations.contact_email | "Return BOL to:" |
| warehouse_location | locations.name | Shipper section |

**Consignee Data**

| Field | Source | Display |
|-------|--------|---------|
| customer_name | customers.name | "Blue Mountain Restaurant" |
| consignee_address | customer_addresses.* (from shipment) | Full address block |
| consignee_phone | customer_addresses.phone or customers.phone | Contact line |
| contact_name | customer_contacts.name (primary) | "Attn: John Smith" |

**Freight Terms**

| Field | Options | Display |
|-------|---------|---------|
| freight_terms | "Prepaid" / "Collect" / "Third Party" | Freight Terms line |
| payment_terms | "Due upon receipt" / "Net 30" / "Custom" | Payment Terms line |
| special_instructions | sales_orders.special_instructions + generated | Instructions box |

**Carton & Freight Details**

| Field | Source | Display |
|-------|--------|---------|
| carton_count | COUNT(shipment_boxes) | "2 cartons" |
| pallet_count | COUNT(shipment_boxes WHERE type='pallet') | "0 pallets" |
| total_weight_kg | SUM(shipment_boxes.weight) | "Total Weight: 90.8 kg" |
| total_weight_lbs | total_weight_kg * 2.20462 | Alternative unit |
| declared_value | SUM(line_item_totals) | "Declared Value: $3,738.75" |
| declared_value_currency | organizations.default_currency (from settings) | USD, EUR, GBP, etc. |
| freight_class | shipment_boxes.freight_class (LTL) | Per carton, table |
| nmfc_code | shipment_boxes.nmfc_code | Per carton, table |

### 3. Freight Class & NMFC Reference

**Freight Classes (LTL Shipping):**

| Class | Description | Examples |
|-------|-------------|----------|
| 50 | Very dense, low volume | Metal ingots, dense machinery |
| 55 | Dense items | Most food products (flour, sugar) |
| 60 | Medium density | Small machinery, electronics |
| 65 | Food products, standard | Packaged food items |
| 70 | Lower density | Beverages, light packaged goods |
| 85 | Light, high volume | Loose packaging, blankets |
| 100 | Very light, very bulky | Foam, cushioning |

**NMFC Codes (Sample for Food):**

| Code | Description |
|------|-------------|
| 1234 | Flour, cornmeal, grain products |
| 1235 | Sugar, sweeteners |
| 1240 | Butter, margarine, oils |
| 1250 | Food additives, baking supplies |
| 1260 | Dried fruits, nuts |

**Freight Class Configuration:**

Organizations should configure their standard freight class/NMFC mappings in **Settings > Shipping Configuration** (to be created as dedicated Shipping settings screen). Freight class defaults can be overridden per shipment if needed.

### 4. Print Workflow

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
- Copies: 1-10 (default 1)
- Paper size: Letter 8.5" x 11" (force US standard)
- Orientation: Portrait (auto)
- Color: Full color or B&W (user selectable)
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

  /* BOL-specific */
  .bol-document { page-break-inside: avoid; }
  .signature-section { page-break-inside: avoid; }
}
```

### 5. Email Workflow

**Email Modal (650px wide)**

| Element | Field | Validation |
|---------|-------|-----------|
| **To** | Dropdown (preselected carrier contacts) | At least 1 email required, valid email format |
| **CC** | Multi-select with add (+) button | Optional, valid email format |
| **Subject** | Prefilled text | Max 200 chars, default: "BOL-{BOL#} {Customer Name}" |
| **Message** | Rich text editor (basic) | Optional, default template provided |
| **Attachments** | Checkbox + label | [x] PDF attached (can toggle) |
| **Carrier Instructions** | Checkbox + label | [x] Include carrier-specific instructions |

**Email Recipient Defaults (in order of preference):**

1. Assigned carrier contact (carrier_contacts.is_primary = true, FK: carrier_configs.id)
2. Carrier company email (carrier_configs.contact_email)
3. Custom email from shipment notes (shipments.carrier_contact_email)
4. Manual entry field (user types email)

**Fallback Behavior (No Carrier Contacts):**

If carrier has no configured primary contact (carrier_contacts table empty or no is_primary=true):
1. Show carrier_configs.contact_email in dropdown
2. Display note: "No primary contact found for this carrier. Using company email."
3. Allow user to manually add email addresses via [+ Add Custom Email] button
4. Require manual validation: email must be entered before Send is enabled
5. Log to audit trail: "Fallback email method used (no primary contact configured)"

**Email Template (default):**

```
Subject: BOL-{bol_number} Shipment Manifest - {customer_name}

Dear {carrier_contact_name},

Please find attached the Bill of Lading for the following shipment:

BOL #: {bol_number}
Pro #: {pro_number}
Shipment Date: {shipment_date}
Carrier: {carrier_name}

Shipper: {org_name}
Consignee: {customer_name}

Total Weight: {total_weight_kg} kg ({total_weight_lbs} lbs)
Total Cartons: {carton_count}
Total Declared Value: {declared_value} {currency}

Special Instructions:
{special_instructions}

Temperature Control: {temperature_zone}
Hazmat: {hazmat_declaration}

The Bill of Lading is attached. Please sign and return a copy.

Best regards,
{org_name}
Shipping Department
{org_phone}
{org_email}

---
Questions about this shipment? Contact: {contact_name} - {contact_phone}
```

**Email Sending:**

| Step | Method | Details |
|------|--------|---------|
| 1 | User fills form | To, CC, Subject, Message |
| 2 | Click [Send Email] | POST /api/shipping/bol/email |
| 3 | API validates | Email addresses, PDF attachment |
| 4 | Generate PDF (if not cached) | If PDF not ready, generate first |
| 5 | Send via Supabase Edge Function | Use SendGrid or Postmark API |
| 6 | Log email audit trail | audit_logs table with email details |
| 7 | Show success/error | Toast notification |

**API Endpoint (Email):**

```
POST /api/shipping/bol/email

Request:
{
  "shipment_id": "uuid-ship-001",
  "to": ["dhl@dhlogistics.com"],
  "cc": ["carrier-ops@dhlogistics.com"],
  "subject": "BOL-2025-001234 Shipment Manifest",
  "message": "Custom message (optional)",
  "include_pdf": true,
  "include_carrier_instructions": true,
  "send_bcc_to_org": true  // CC org admin for record
}

Response (Success):
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "email_id": "uuid-email-001",
    "recipients": ["dhl@dhlogistics.com"],
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

### 6. Download PDF Button

**Download Workflow:**

| Action | Description |
|--------|-------------|
| User clicks [Download] | Triggers browser download |
| PDF generated (if needed) | GET /api/shipping/bol/{shipmentId}/pdf |
| File name | `bol-{bol_number}-{date}.pdf` |
| MIME type | application/pdf |
| Save location | Browser's default download folder |

---

## Main Actions

### Primary Actions

| Action | Location | Trigger | Result |
|--------|----------|---------|--------|
| **Print** | Header button | Click [Print] | Browser print dialog opens |
| **Email** | Header button | Click [Email] | Email modal opens with carrier suggestions |
| **Download** | Mobile footer button | Click [Download] | PDF downloads to device |
| **Back** | Header link | Click [< Back] | Navigate to shipment detail |

### Secondary Actions (Email Modal)

| Action | Enabled | Result |
|--------|---------|--------|
| **Add CC** | Always (if more recipients needed) | Opens text input for additional emails |
| **Edit Subject** | Always | Modify email subject line |
| **Edit Message** | Always | Modify email body text |
| **Toggle PDF Attachment** | Always | Include/exclude PDF in email |
| **Toggle Carrier Instructions** | Always | Include/exclude special handling notes |
| **Cancel** | Always | Close modal without sending |
| **Send Email** | All required fields valid | POST request to send |

---

## States

| State | Description | Show Elements |
|-------|-------------|----------------|
| **Loading** | PDF generating | Spinner, progress indicator, "Generating..." message |
| **Empty** | No shipment/incomplete packing/no carrier | Empty state illustration, "No BOL available" message |
| **Success** | PDF ready, all data present | PDF preview, Print/Email/Download buttons |
| **Error** | PDF generation failed, API error | Error message, error code, Retry button |
| **Error - Missing Data** | Required fields incomplete (no carrier, no weights, etc.) | Warning icon, list of missing fields, "Complete Packing" CTA |
| **Error - Email Failed** | Email send failed | Error message, "Try Different Email" button |
| **Print Dialog** | Browser print preview | Native print UI with options |
| **Email Modal** | Email recipient/content form | Form inputs, Preview, Send/Cancel buttons |

---

## Data Fields

### Shipment Data (Required)

| Field | Source | Display |
|-------|--------|---------|
| shipment_number | shipments.shipment_number | Reference: "SHIP-001" |
| order_number | sales_orders.order_number | Reference: "SO-024601" |
| bol_number | auto-generated sequence | Header: "BOL #: BOL-2025-001234" |
| bol_date | shipments.packed_at | Header: "Date: 2025-01-15" |
| carrier_name | carrier_configs.name | Header: "Carrier: DHL Freight" |
| pro_number | shipments.tracking_number | Header: "Pro #: 1Z999AA..." |

### Shipper & Consignee Data

| Field | Source | Display |
|-------|--------|---------|
| org_name | organizations.name | Shipper section |
| org_address | locations.* (primary warehouse) | Shipper address block |
| org_phone | organizations.phone | Shipper contact |
| org_email | organizations.contact_email | Return email |
| customer_name | customers.name | Consignee section |
| customer_address | customer_addresses.* | Consignee address block |
| customer_phone | customer_addresses.phone | Consignee contact |
| contact_name | customer_contacts.name (primary) | "Attn:" line |

### Freight Terms

| Field | Source | Display |
|-------|--------|---------|
| freight_terms | shipments.freight_terms or "Prepaid" default | "Prepaid" / "Collect" |
| payment_terms | shipments.payment_terms or "Due upon receipt" default | Payment terms line |
| special_instructions | sales_orders.special_instructions | Instructions section |
| temperature_zone | dock_doors.temperature_zone mapping | "Keep refrigerated 2-8°C" |
| hazmat_declaration | shipment_items.hazmat_class (future) | "Hazmat: None" or class |

### Carton & Weight Data

| Field | Source | Display |
|-------|--------|---------|
| carton_number | shipment_boxes.box_number | "1", "2", etc. |
| sscc | shipment_boxes.sscc | Full 18-digit barcode |
| weight_kg | shipment_boxes.weight | "48.5 kg" |
| dimensions_cm | L/W/H from shipment_boxes | "60 x 40 x 30 cm" |
| freight_class | shipment_boxes.freight_class (LTL) | "65" for food items |
| nmfc_code | shipment_boxes.nmfc_code | "1234" commodity code |
| total_cartons | COUNT(shipment_boxes) | "2" |
| total_pallets | COUNT WHERE type='pallet' | "0" |
| total_weight_kg | SUM(shipment_boxes.weight) | "90.8 kg" |
| total_weight_lbs | total_weight_kg * 2.20462 | "200.0 lbs" |

### Product Details (by carton)

| Field | Source | Display |
|-------|--------|---------|
| product_name | products.name | "Organic Flour 5lb" |
| lot_number | license_plates.lot_number | "FLOUR-2024-001" |
| best_before_date | license_plates.best_before_date | "2025-06-30" |
| quantity | shipment_box_contents.quantity | "100" units |
| unit_price | sales_order_lines.unit_price | For total value |

---

## API Endpoints

### Get BOL Metadata

```
GET /api/shipping/bol/:shipmentId

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "bol_number": "BOL-2025-001234",
    "bol_date": "2025-01-15T10:30:00Z",
    "shipment_number": "SHIP-001",
    "order_number": "SO-024601",
    "carrier_name": "DHL Freight",
    "pro_number": "1Z999AA10012345678",
    "status": "packed",

    "shipper": {
      "org_name": "MonoPilot Foods",
      "address": "456 Industrial Blvd, Denver, CO 80202, USA",
      "phone": "(303) 555-5678",
      "email": "shipping@monopilot.com",
      "contact": "Shipping Department"
    },

    "consignee": {
      "customer_name": "Blue Mountain Restaurant",
      "contact_name": "John Smith",
      "address": "789 Main Street, Denver, CO 80210, USA",
      "phone": "(303) 555-1234",
      "email": "john@bluerestaurant.co"
    },

    "freight": {
      "freight_terms": "Prepaid",
      "payment_terms": "Due upon receipt",
      "temperature_zone": "chilled",
      "special_instructions": "Handle with care - Perishable",
      "hazmat_declaration": "None"
    },

    "cartons": [
      {
        "carton_number": 1,
        "sscc": "00123456789012345678",
        "weight_kg": 48.5,
        "weight_lbs": 106.9,
        "length_cm": 60,
        "width_cm": 40,
        "height_cm": 30,
        "freight_class": 65,
        "nmfc_code": "1234",
        "products": [
          {
            "product_name": "Organic Flour 5lb",
            "lot_number": "FLOUR-2024-001",
            "best_before_date": "2025-06-30",
            "quantity": 100
          },
          {
            "product_name": "Butter 2kg Block",
            "lot_number": "BUTT-2024-022",
            "best_before_date": "2025-04-15",
            "quantity": 12
          }
        ]
      },
      {
        "carton_number": 2,
        "sscc": "00123456789012345679",
        "weight_kg": 42.3,
        "weight_lbs": 93.2,
        "length_cm": 60,
        "width_cm": 40,
        "height_cm": 25,
        "freight_class": 65,
        "nmfc_code": "1234",
        "products": [
          {
            "product_name": "Organic Sugar 10lb",
            "lot_number": "SUGAR-2024-045",
            "best_before_date": "2025-12-31",
            "quantity": 50
          },
          {
            "product_name": "Butter 2kg Block",
            "lot_number": "BUTT-2024-022",
            "best_before_date": "2025-04-15",
            "quantity": 13
          }
        ]
      }
    ],

    "summary": {
      "total_cartons": 2,
      "total_pallets": 0,
      "total_weight_kg": 90.8,
      "total_weight_lbs": 200.1,
      "total_items": 175,
      "declared_value": 3738.75,
      "currency": "USD"
    },

    "pdf_url": "https://api.monopilot.io/shipping/bol/uuid-ship-001/pdf",
    "created_at": "2025-01-15T10:30:00Z",
    "ready_for_print": true
  }
}
```

### Get BOL PDF

```
GET /api/shipping/bol/:shipmentId/pdf

Response: Binary PDF file (application/pdf)
Headers:
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="bol-BOL-2025-001234-20250115.pdf"
  Content-Length: 256000
```

### Generate BOL PDF (if needed)

```
POST /api/shipping/bol/:shipmentId/generate

Request:
{
  "format": "pdf",
  "force_regenerate": false,
  "include_product_list": true  // Include detailed product summary
}

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "bol_number": "BOL-2025-001234",
    "pdf_url": "https://...",
    "generated_at": "2025-01-15T10:35:00Z",
    "expires_at": "2025-02-15T10:35:00Z",
    "file_size_kb": 245
  }
}
```

### Print BOL (optional server-side)

```
POST /api/shipping/bol/:shipmentId/print

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
    "bol_number": "BOL-2025-001234",
    "print_job_id": "uuid-print-001",
    "status": "queued",
    "printer": "Brother HL-L8360CDW",
    "created_at": "2025-01-15T10:35:00Z"
  }
}
```

### Send BOL via Email

```
POST /api/shipping/bol/:shipmentId/email

Request:
{
  "to": ["dhl@dhlogistics.com"],
  "cc": ["carrier-ops@dhlogistics.com"],
  "subject": "BOL-2025-001234 Shipment Manifest",
  "message": "Custom message (optional)",
  "include_pdf": true,
  "include_carrier_instructions": true,
  "send_bcc_to_org": true
}

Response:
{
  "success": true,
  "data": {
    "shipment_id": "uuid-ship-001",
    "bol_number": "BOL-2025-001234",
    "email_id": "uuid-email-001",
    "recipients": ["dhl@dhlogistics.com"],
    "cc": ["carrier-ops@dhlogistics.com"],
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
| Carrier (External) | Yes (own shipments) | No | Limited | Yes |

**Permission Rules:**
- Print/Email requires "Shipping" or "Admin" role
- Download available to all authenticated users
- Carriers can only access BOLs for their assigned shipments

---

## Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Shipment ID | Must exist and be "packed" status | "Shipment not found or not yet packed" |
| Carrier Assigned | Must have carrier_configs linked (FK: shipments.carrier_id -> carrier_configs.id) | "Carrier not assigned - cannot generate BOL" |
| Box Weights | All boxes must have weight | "Missing weight for box {N}" |
| Box Dimensions | All boxes must have dimensions | "Missing dimensions for box {N}" |
| SSCC Present | All boxes must have SSCC | "Missing SSCC for box {N}" |
| Freight Class | Should be set for LTL (optional) | "Recommend setting freight class for {box}" |
| NMFC Code | Should be set for commodities (optional) | "Recommend setting NMFC code" |
| Email Address | Valid format, not empty | "Invalid email address" |
| CC Email | Valid format (if provided) | "Invalid CC email address" |
| Subject | 5-200 chars | "Subject must be 5-200 characters" |
| Message | Max 5000 chars | "Message too long (max 5000 chars)" |
| Total Weight | > 0 kg | "Shipment must have measurable weight" |

**Data Validation Rules:**

```typescript
// BOL readiness check
function canGenerateBol(shipment: Shipment): ValidationResult {
  const errors: string[] = [];

  // Status check
  if (!['packed', 'shipped', 'delivered'].includes(shipment.status)) {
    errors.push("Shipment must be packed before generating BOL");
  }

  // Carrier check (FK validation: shipments.carrier_id -> carrier_configs.id)
  if (!shipment.carrier_id || !shipment.tracking_number) {
    errors.push("Carrier must be assigned before generating BOL");
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

  // Dimensions check
  const boxesWithoutDimensions = shipment.boxes?.filter(b => !b.length || !b.width || !b.height) || [];
  if (boxesWithoutDimensions.length > 0) {
    errors.push(`${boxesWithoutDimensions.length} box(es) missing dimensions`);
  }

  // Address check
  if (!shipment.shipping_address) {
    errors.push("Shipping address not defined");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Business Rules

### BOL Generation Rules

| Condition | Action | Note |
|-----------|--------|------|
| BOL already generated and fresh | Use cached BOL | Cache expires after 24 hours |
| BOL stale or shipment updated | Regenerate BOL | Triggers async PDF generation |
| Generation takes >30s | Show timeout error | User can retry or contact support |
| Shipment not "packed" | Block generation | Show error: "Complete packing first" |
| No carrier assigned | Block generation | Show error: "Assign carrier first" |
| Missing weights/dimensions | Block generation | Show list of missing fields |
| Missing SSCC | Block generation | Show list of boxes without SSCC |

### Email Sending Rules

| Condition | Action | Note |
|-----------|--------|------|
| No recipient email | Block send | Show error: "At least 1 recipient required" |
| Invalid email format | Block send | Validate against RFC 5322 |
| Email send timeout | Show retry option | 30-second timeout |
| SMTP failure | Show error with reason | Log to audit trail |
| Success | Log audit entry | Record recipient, time, status |

### BOL Numbering

| Aspect | Specification | Notes |
|--------|---------------|-------|
| Format | BOL-YYYY-XXXXXX | Year + 6-digit sequence |
| Sequence | Per organization | Resets annually or per carrier |
| Generation | On first print/email | Not on packing completion |
| Uniqueness | Global (across all shipments) | Prevents duplicates |
| Immutability | Cannot be changed | Once assigned, locked |

### Audit Trail

**Logged Events:**

| Event | Fields Logged |
|-------|---------------|
| BOL Generated | shipment_id, user_id, bol_number, generated_at, file_size_kb |
| BOL Downloaded | shipment_id, user_id, bol_number, downloaded_at |
| BOL Printed | shipment_id, user_id, bol_number, printer_name, printed_at |
| BOL Emailed | shipment_id, user_id, bol_number, recipients, sent_at, email_id |
| BOL Email Failed | shipment_id, user_id, bol_number, recipients, failure_reason |

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
| BOL title | #111827 | #FFFFFF | 16.65:1 | AAA |
| Table text | #111827 | #FFFFFF | 16.65:1 | AAA |
| BOL data fields | #374151 | #FFFFFF | 9.25:1 | AAA |

### Screen Reader

```html
<!-- Page header -->
<h1 aria-label="Bill of Lading BOL-2025-001234 for Sales Order SO-024601">
  SO-024601 > Bill of Lading
</h1>

<!-- Print button -->
<button aria-label="Print Bill of Lading BOL-2025-001234">
  Print
</button>

<!-- Email button -->
<button aria-label="Send Bill of Lading via email to carrier">
  Email
</button>

<!-- PDF Preview -->
<section
  role="region"
  aria-label="Bill of Lading PDF preview (8.5 by 11 inches)"
  aria-live="polite"
>
  <iframe
    title="Bill of Lading PDF preview"
    aria-label="Preview of BOL document BOL-2025-001234"
    src="..."
  ></iframe>
</section>

<!-- Email Modal -->
<dialog aria-labelledby="email-modal-title" aria-modal="true">
  <h2 id="email-modal-title">Email Bill of Lading</h2>
  <label for="email-to">To Carrier (required)</label>
  <input id="email-to" type="email" required />
</dialog>

<!-- Status messages -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Bill of Lading sent successfully to dhl@dhlogistics.com
</div>

<!-- Carton summary table (accessible) -->
<table aria-label="Carton and freight details for BOL-2025-001234">
  <caption>Shipment cartons with weight, dimensions, and freight classification</caption>
  <thead>
    <tr>
      <th scope="col">Carton Number</th>
      <th scope="col">SSCC Barcode</th>
      <th scope="col">Weight (kg)</th>
      <th scope="col">Dimensions</th>
      <th scope="col">Freight Class</th>
      <th scope="col">NMFC Code</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>00123456789012345678</td>
      <td>48.5</td>
      <td>60 x 40 x 30 cm</td>
      <td>65</td>
      <td>1234</td>
    </tr>
  </tbody>
</table>
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
  aria-label="Print Bill of Lading BOL-2025-001234"
  aria-pressed="false"
  role="button"
>
  Print
</button>

<!-- Email button -->
<button
  aria-label="Send Bill of Lading via email to carrier"
  aria-disabled="false"
  role="button"
>
  Email
</button>

<!-- Loading state -->
<div
  role="status"
  aria-live="polite"
  aria-label="Generating BOL PDF, 45 percent complete"
>
  <span aria-hidden="true">[=========== 45% ===========]</span>
  Generating Bill of Lading PDF...
</div>

<!-- Error state -->
<div
  role="alert"
  aria-live="assertive"
  aria-label="Error: No carrier assigned for BOL generation"
>
  Cannot generate BOL - carrier not assigned to shipment.
</div>

<!-- Email form -->
<form aria-label="Email Bill of Lading">
  <fieldset>
    <legend>Email Recipients (Carrier)</legend>
    <label>
      To Carrier:
      <select aria-required="true" aria-label="Carrier contact email">
        <option>dhl@dhlogistics.com</option>
      </select>
    </label>
  </fieldset>
</form>

<!-- Carton summary with headings -->
<h2>Shipment Cartons</h2>
<ul aria-label="List of cartons in shipment BOL-2025-001234">
  <li>Carton 1: SSCC 00123456789012345678, Weight 48.5 kg, Dimensions 60 x 40 x 30 cm</li>
  <li>Carton 2: SSCC 00123456789012345679, Weight 42.3 kg, Dimensions 60 x 40 x 25 cm</li>
</ul>
```

---

## Responsive Breakpoints

### Desktop (>1024px)

**Layout:**
- PDF preview: 70% width, right sidebar empty
- Print/Email/Download buttons: Horizontal alignment in header
- Full freight details table with all columns visible
- 1 page scrollable PDF preview (extends if product list long)

**PDF Zoom:**
- Default: 100% (actual size)
- Zoom controls: 50%, 75%, 100%, 125%, 150%, Fit Width
- User can scroll or use keyboard (Page Up/Down)

### Tablet (768-1024px)

**Layout:**
- PDF preview: 100% width, scrollable
- Buttons: Horizontal row below header
- Freight table: Condensed (fewer columns, stacked rows)
- Single page visible, scroll to see more

**PDF Zoom:**
- Default: Fit Width (auto-zoom)
- Zoom controls: Fit Width, Fit Page, 100%, +/-
- Touch-friendly zoom buttons (48dp)

### Mobile (<768px)

**Layout:**
- PDF preview: Full width, scrollable vertically
- Buttons: Vertical stack in footer (or sticky bottom action bar)
- Freight table: Converted to card layout
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
const cacheKey = `org:{orgId}:bol:{shipmentId}`;
const ttl = 24 * 60 * 60; // 24 hours

// Check cache first
const cachedPdf = await redis.get(cacheKey);
if (cachedPdf && !forceRegenerate) {
  return cachedPdf; // Return cached PDF
}

// Generate PDF (async)
const pdf = await generateBolPdf(shipment);
await redis.set(cacheKey, pdf, ttl);
return pdf;
```

**Generation Benchmarks:**

| Operation | Target | Notes |
|-----------|--------|-------|
| Fetch shipment data | <500ms | Including carrier, boxes, line items |
| PDF generation | <3s | Timeout after 30s |
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
| BOL Page (initial load) | <1s | <2s |
| PDF Generation (fresh) | <3s | <8s |
| PDF from Cache | <500ms | <1s |
| Email Modal Open | <300ms | <500ms |
| Print Dialog Open | <1s | <1s |

---

## Testing Requirements

### Unit Tests

**BOL Generation:**
```typescript
describe('BOL PDF Generation', () => {
  it('should generate valid PDF with all carton details', () => {
    const pdf = generateBolPdf(mockShipment);
    expect(pdf).toBeDefined();
    expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
    expect(pdf.text).toContain('BILL OF LADING');
    expect(pdf.text).toContain('BOL-2025-001234');
  });

  it('should include correct carton information', () => {
    const pdf = generateBolPdf(mockShipment);
    expect(pdf.text).toContain('00123456789012345678'); // SSCC
    expect(pdf.text).toContain('48.5 kg'); // Weight
    expect(pdf.text).toContain('60 x 40 x 30'); // Dimensions
  });

  it('should include freight class and NMFC codes', () => {
    const pdf = generateBolPdf(mockShipment);
    expect(pdf.text).toContain('65'); // Freight class
    expect(pdf.text).toContain('1234'); // NMFC code
  });

  it('should calculate totals correctly', () => {
    const pdf = generateBolPdf(mockShipment);
    expect(pdf.text).toContain('Total Weight: 90.8 kg');
    expect(pdf.text).toContain('Declared Value: $3,738.75');
  });

  it('should format shipper and consignee addresses', () => {
    const pdf = generateBolPdf(mockShipment);
    expect(pdf.text).toContain('MonoPilot Foods');
    expect(pdf.text).toContain('456 Industrial Blvd');
    expect(pdf.text).toContain('Blue Mountain Restaurant');
    expect(pdf.text).toContain('789 Main Street');
  });

  it('should include carrier and Pro number', () => {
    const pdf = generateBolPdf(mockShipment);
    expect(pdf.text).toContain('DHL Freight');
    expect(pdf.text).toContain('1Z999AA10012345678');
  });

  it('should handle multi-page BOLs with product lists', () => {
    const largeShipment = {
      ...mockShipment,
      boxes: Array(5).fill(mockBox), // 5 cartons
    };
    const pdf = generateBolPdf(largeShipment);
    expect(pdf.pageCount).toBeGreaterThanOrEqual(1);
  });
});
```

**Email Validation:**
```typescript
describe('BOL Email Validation', () => {
  it('should require at least one carrier recipient', () => {
    const result = validateEmailForm({ to: [], cc: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 1 recipient required');
  });

  it('should validate email format', () => {
    const result = validateEmailForm({ to: ['invalid-email'], cc: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid email/);
  });

  it('should allow multiple carrier contacts', () => {
    const result = validateEmailForm({
      to: ['dhl@dhlogistics.com', 'carrier2@example.com'],
      cc: ['ops@dhlogistics.com']
    });
    expect(result.valid).toBe(true);
  });

  it('should validate subject length', () => {
    const result = validateEmailForm(
      { to: ['dhl@dhlogistics.com'], cc: [] },
      { subject: 'x'.repeat(201) }
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/200 characters/);
  });
});
```

### Integration Tests

**API Tests:**
```typescript
describe('BOL API', () => {
  it('GET /api/shipping/bol/:id - should return BOL data', async () => {
    const response = await request(app)
      .get(`/api/shipping/bol/${shipmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.bol_number).toMatch(/^BOL-\d{4}-\d{6}$/);
    expect(response.body.data.cartons).toHaveLength(2);
    expect(response.body.data.summary.total_weight_kg).toBe(90.8);
  });

  it('GET /api/shipping/bol/:id/pdf - should return PDF file', async () => {
    const response = await request(app)
      .get(`/api/shipping/bol/${shipmentId}/pdf`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.type).toBe('application/pdf');
    expect(response.body.length).toBeGreaterThan(10000); // PDF > 10KB
  });

  it('POST /api/shipping/bol/:id/email - should send BOL email', async () => {
    const response = await request(app)
      .post(`/api/shipping/bol/${shipmentId}/email`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        to: ['dhl@dhlogistics.com'],
        subject: 'BOL Shipment Manifest',
        include_pdf: true
      });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('sent');
    expect(response.body.data.recipients).toContain('dhl@dhlogistics.com');
  });

  it('POST /api/shipping/bol/:id/email - should fail with no carrier', async () => {
    const response = await request(app)
      .post(`/api/shipping/bol/${shipmentId}/email`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        to: [],
        subject: 'Test'
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_RECIPIENT');
  });

  it('RLS - should only return org BOLs', async () => {
    const org1Response = await request(app)
      .get(`/api/shipping/bol/${shipmentId}`)
      .set('Authorization', `Bearer ${org1Token}`);

    const org2Response = await request(app)
      .get(`/api/shipping/bol/${shipmentId}`)
      .set('Authorization', `Bearer ${org2Token}`);

    expect(org1Response.status).toBe(200);
    expect(org2Response.status).toBe(403); // Forbidden
  });
});
```

### E2E Tests (Playwright)

```typescript
describe('BOL E2E', () => {
  test('should load BOL and show PDF preview', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Wait for PDF to load
    await expect(page.getByText('BILL OF LADING')).toBeVisible();
    await expect(page.getByText(/BOL-\d{4}-\d{6}/)).toBeVisible();

    // Check buttons
    await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Email' })).toBeVisible();
  });

  test('should display carton details with SSCC', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Check SSCC numbers visible
    await expect(page.getByText('00123456789012345678')).toBeVisible();
    await expect(page.getByText('48.5 kg')).toBeVisible();
    await expect(page.getByText('60 x 40 x 30')).toBeVisible();
  });

  test('should open print dialog', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

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

  test('should open email modal with carrier suggestions', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Click email
    await page.getByRole('button', { name: 'Email' }).click();

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/To|Carrier/i)).toBeVisible();

    // Should have suggested carrier contacts
    await page.getByLabel(/To|Carrier/i).click();
    await expect(page.getByText('dhl@dhlogistics.com')).toBeVisible();
  });

  test('should send email with valid form', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Open email modal
    await page.getByRole('button', { name: 'Email' }).click();

    // Fill form
    await page.getByLabel(/To|Carrier/i).selectOption('dhl@dhlogistics.com');
    await page.getByLabel('Subject').fill('BOL Shipment Manifest');

    // Send
    await page.getByRole('button', { name: /Send|Submit/i }).click();

    // Should show success
    await expect(page.getByText(/sent successfully|Email sent/i)).toBeVisible();
  });

  test('should download PDF on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Download button should be visible
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();

    // Click download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/bol-BOL-.*\.pdf/);
  });

  test('should show error if no carrier assigned', async ({ page }) => {
    // Use shipment with no carrier
    await page.goto(`/shipping/shipments/${unassignedCarrierShipmentId}/bol`);

    await expect(page.getByText(/Carrier not assigned|Cannot generate/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Assign Carrier/i })).toBeVisible();
  });

  test('should show missing data error', async ({ page }) => {
    // Use shipment with incomplete packing
    await page.goto(`/shipping/shipments/${incompletePacking}/bol`);

    await expect(page.getByText(/Incomplete Shipment|Missing weight/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Complete Packing/i })).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // PDF should scale to fit width
    const pdfElement = page.locator('iframe');
    const box = await pdfElement.boundingBox();
    expect(box?.width).toBeCloseTo(768, { absoluteTolerance: 50 });
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Tab to Print button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Print' })).toBeFocused();

    // Tab to Email button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Email' })).toBeFocused();

    // Enter should open email modal
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should escape modal with keyboard', async ({ page }) => {
    await page.goto(`/shipping/shipments/${shipmentId}/bol`);

    // Open email modal
    await page.getByRole('button', { name: 'Email' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Focus should return to Email button
    await expect(page.getByRole('button', { name: 'Email' })).toBeFocused();
  });
});
```

---

## Quality Gates

Before handoff to FRONTEND-DEV:

- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] Additional error states defined (Missing Data, Email Failed, No Carrier)
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] All API endpoints specified with request/response schemas
- [x] PDF generation and caching strategy documented
- [x] Print workflow documented with browser integration
- [x] Email workflow with modal and validation documented
- [x] Accessibility checklist passed (touch targets 48x48dp, contrast ratios 5.0:1+, screen reader, keyboard, ARIA)
- [x] Performance targets defined (PDF <3s, Email <2s, Page load <1s)
- [x] BOL layout with shipper/consignee/carrier documented
- [x] Freight class and NMFC code fields specified
- [x] Signature section for shipper and carrier documented
- [x] Carton summary with SSCC and dimensions documented
- [x] Product list by carton with lot/BBD documented
- [x] Email template with carrier contact suggestions provided
- [x] Business rules for BOL numbering documented
- [x] Permissions matrix for 4 roles documented
- [x] Validation rules for emails, required fields, carrier assignment defined (FK: shipments.carrier_id -> carrier_configs.id)
- [x] Responsive mobile footer action bar documented
- [x] PDF zoom controls and keyboard navigation defined
- [x] Testing requirements complete (Unit, Integration, E2E)
- [x] Mobile-specific interactions (pinch/zoom, swipe) documented
- [x] Freight terms and payment terms fields documented
- [x] Special instructions and temperature control documented
- [x] Multi-page BOL support for large shipments documented (Page break after 10 cartons or 25 product lines)
- [x] Carrier contact fallback behavior documented (manual entry with validation)
- [x] Declared value currency handling documented (use org default from settings)

---

## Handoff to FRONTEND-DEV

```yaml
feature: Bill of Lading Generation & Printing
story: SHIP-021
fr_coverage: FR-7.41
approval_status:
  mode: "review_each"
  user_approved: false  # Awaiting user approval
  screens_approved: []
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/SHIP-021-bill-of-lading.md
  api_endpoints:
    - GET /api/shipping/bol/:shipmentId
    - GET /api/shipping/bol/:shipmentId/pdf
    - POST /api/shipping/bol/:shipmentId/generate
    - POST /api/shipping/bol/:shipmentId/print
    - POST /api/shipping/bol/:shipmentId/email
states_per_screen:
  - loading: Progress bar, "Generating BOL..." message
  - empty: No BOL available, CTA to complete packing or assign carrier
  - success: PDF preview with Print/Email/Download buttons
  - error: PDF generation failed with Retry button
  - error_missing_data: Incomplete shipment, list missing fields (weights, dimensions, SSCC, carrier)
  - error_email_failed: Email send failed with retry option
  - print_dialog: Browser native print dialog
  - email_modal: Email recipient form with carrier contact validation
breakpoints:
  mobile: "<768px (Full-width PDF, vertical action buttons, sticky footer)"
  tablet: "768-1024px (Scaled PDF, horizontal buttons, condensed table)"
  desktop: ">1024px (70% preview, PDF zoom controls, header buttons)"
accessibility:
  touch_targets: "48x48dp minimum (buttons, form inputs, scroll areas)"
  contrast: "All elements meet WCAG AA 5.0:1 minimum (updated success message)"
  aria_roles: "region, status, alert, dialog, button, form, table"
  keyboard_nav: "Tab, Enter, Space, Escape, Ctrl+P for print, Page Up/Down for scroll"
  screen_reader: "Full labeling for all interactive elements, table headers, live regions"
performance_targets:
  page_load: "<1s (including PDF fetch)"
  pdf_generation: "<3s (timeout 30s)"
  email_send: "<2s"
  print_dialog: "<1s"
  cache_hit: "<500ms"
bol_specifications:
  dimensions: "8.5\" x 11\" (letter)"
  margins: "0.5\" all sides"
  font: "Arial/Helvetica (web-safe)"
  page_count: "1 page standard (extends for large product lists)"
  page_break_threshold: "After 10 cartons OR 25 product lines (whichever comes first)"
  color_mode: "RGB full color or B&W"
  sscc_format: "18-digit barcode (human-readable text)"
  numbering: "BOL-YYYY-XXXXXX (per organization)"
  declared_value_currency: "From organizations.default_currency (settings)"
bol_sections:
  header: "BOL #, Date, Carrier, Pro #, Shipper, Consignee"
  freight_details: "Carton #, SSCC, Weight, Dimensions, Freight Class, NMFC Code"
  totals: "Total Cartons, Pallets, Weight, Declared Value (with currency)"
  products: "By carton: Product name, Lot number, BBD, Quantity"
  signatures: "Shipper signature/date, Carrier signature/date"
  footer: "Return email, Doc ID, Page indicator"
related_screens:
  - SHIP-017: Packing Station (where packing happens)
  - SHIP-020: Packing Slip (similar document)
  - SHIP-019: SSCC Label Print (carton labeling)
  - SHIP-015: Shipment Detail (parent)
database_tables:
  - shipments (parent, FK: carrier_id -> carrier_configs.id)
  - shipment_boxes (carton data: SSCC, weight, dimensions)
  - shipment_box_contents (line items per carton)
  - sales_orders (order reference)
  - sales_order_lines (line items with pricing)
  - products (product details)
  - license_plates (lot/BBD)
  - customers (consignee)
  - customer_addresses (ship-to address)
  - carrier_configs (carrier info, contact) [FK target]
  - carrier_contacts (primary contact lookup with fallback)
  - organizations (shipper, currency settings)
  - locations (warehouse address)
  - audit_logs (BOL generation/email/print events)
business_logic:
  - Cannot generate if shipment status not in ["packed", "shipped", "delivered"]
  - Cannot generate if no carrier assigned (FK: shipments.carrier_id required)
  - All boxes must have SSCC before BOL generation
  - All boxes must have weight and dimensions before BOL
  - Freight class/NMFC codes optional but recommended (from settings)
  - BOL numbered once (immutable after generation)
  - BOL cached for 24 hours, regenerate on shipment update
  - Email audit trail includes recipients and timestamp
  - Print uses browser native dialog (no server-side queue)
  - Carrier contact fallback: use company email if no primary contact configured
  - Declared value uses org default currency (settable in Settings)
validation:
  - Shipment must exist and belong to user's org (RLS)
  - Carrier must be assigned to shipment (FK validation required)
  - All boxes must have SSCC, weight, dimensions (blocking)
  - Email addresses must be valid format (RFC 5322)
  - Subject max 200 chars
  - Message max 5000 chars
  - PDF timeout after 30s
  - Email timeout after 30s
architectural_decisions:
  - Browser print dialog used instead of server-side print queue (simplified)
  - BOL cached in Redis for 24h TTL (reduces generation load)
  - Email sent via Supabase Edge Function (serverless pattern)
  - Audit trail logged for compliance (print/email events)
  - SSCC barcode text-based (optional: render with barcode library)
  - BOL numbering per organization (not per carrier)
  - Freight class defaults from Settings (configurable per org)
  - Multi-page BOL: page break after 10 cartons or 25 product lines
technical_notes:
  - PDF generation: pdfkit or puppeteer library
  - SSCC display: Human-readable 18-digit text (barcode graphics optional)
  - Email service: SendGrid or Postmark via Supabase Functions
  - PDF preview: pdf.js (Mozilla library)
  - Cache layer: Redis with 24h TTL and manual invalidation on shipment update
  - Freight class/NMFC: Configurable defaults in org settings
  - Currency: Fetch from organizations.default_currency
  - Carrier contacts: Query carrier_contacts with fallback to carrier_configs.contact_email
estimated_effort: "20-24 hours (BOL layout, freight details, signature section, email, 3 workflows)"
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
