# PLAN-006: Purchase Order Detail Page

**Module**: Planning
**Feature**: PO Detail View with History & Receiving (FR-PLAN-005, FR-PLAN-007)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders > PO-2024-00156                           [Edit] [Actions v] [Print] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  PO-2024-00156                                                    Status: [Receiving]       |  |
|  |  Created by: John Smith on Dec 10, 2024                           60% Received              |  |
|  |                                                                                              |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |  | Supplier           |  | Warehouse          |  | Expected Delivery  |  | Currency       |  |  |
|  |  | Mill Co.           |  | Main Warehouse     |  | Dec 20, 2024       |  | PLN            |  |  |
|  |  | SUP-001            |  | WH-MAIN            |  | In 6 days          |  |                |  |  |
|  |  | [View Supplier]    |  |                    |  |                    |  |                |  |  |
|  |  +--------------------+  +--------------------+  +--------------------+  +----------------+  |  |
|  |                                                                                              |  |
|  |  Payment Terms: Net 30                        Tax Code: Standard 23%                        |  |
|  |                                                                                              |  |
|  |  Notes:                                                                                     |  |
|  |  Special handling required - deliver before 8am                                             |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- LINES TAB ---------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [History]  [Documents]  [Receiving]                                               |  |
|  |  -------                                                                                     |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | # | Product           | Ordered | Received | Remaining | Unit Price | Subtotal | Status| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1 | Flour Type A      | 500 kg  | 500 kg   | 0 kg      | $1.20      | $600.00  | [OK]  | |  |
|  |  |   | RM-FLOUR-001      |         |          |           |            |          |       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2 | Sugar White       | 200 kg  | 100 kg   | 100 kg    | $0.85      | $170.00  | [50%] | |  |
|  |  |   | RM-SUGAR-001      |         |          |           |            |          |       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3 | Salt Industrial   | 100 kg  | 0 kg     | 100 kg    | $0.30      | $30.00   | [0%]  | |  |
|  |  |   | RM-SALT-001       |         |          |           |            |          |       | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  3 Lines | Ordered: $800.00 | Received: $650.00                                             |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- TOTALS ------------------------------------------------------+  |
|  |                                                                                              |  |
|  |                                                        Subtotal:        $800.00   PLN       |  |
|  |                                                        Tax (23%):       $184.00   PLN       |  |
|  |                                                        Discount:        -$0.00    PLN       |  |
|  |                                                        ----------------------------         |  |
|  |                                                        Total:           $984.00   PLN       |  |
|  |                                                                                              |  |
|  |                                                        Received Value:  $799.50   PLN       |  |
|  |                                                        Outstanding:     $184.50   PLN       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Quick Actions:                                                                                   |
|  [Go to Receiving]  [Email Supplier]  [Create Follow-up PO]                                      |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

[Actions v] Menu:
  - Edit (if Draft status)
  - Submit for Approval (if Draft)
  - Approve (if Pending Approval + permission)
  - Reject (if Pending Approval + permission)
  - Confirm (if Approved)
  - Cancel PO
  - Duplicate PO
  - Export to PDF
```

### History Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HISTORY TAB -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [History]  [Documents]  [Receiving]                                               |  |
|  |           --------                                                                           |  |
|  |                                                                                              |  |
|  |  Timeline:                                                    Filter: [All Events v]        |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  |                                                                                        | |  |
|  |  |  Dec 14, 2024 - 09:30 AM                                                              | |  |
|  |  |  o  GRN Created - GRN-2024-00342                                     Jane Doe        | |  |
|  |  |     Received: Flour Type A (500 kg), Sugar White (100 kg)                             | |  |
|  |  |     [View GRN]                                                                        | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 12, 2024 - 02:15 PM                                                              | |  |
|  |  |  o  Status Changed: Confirmed -> Receiving                           System          | |  |
|  |  |     First receipt recorded                                                            | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 11, 2024 - 11:00 AM                                                              | |  |
|  |  |  o  Status Changed: Approved -> Confirmed                            John Smith      | |  |
|  |  |     PO sent to supplier                                                               | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 11, 2024 - 10:45 AM                                                              | |  |
|  |  |  o  Approved                                                         Mary Johnson    | |  |
|  |  |     Approval Notes: "Approved for Q4 stock replenishment"                            | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 10, 2024 - 04:30 PM                                                              | |  |
|  |  |  o  Status Changed: Submitted -> Pending Approval                    System          | |  |
|  |  |     Total $984.00 exceeds approval threshold ($1,000)                                 | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 10, 2024 - 04:25 PM                                                              | |  |
|  |  |  o  PO Submitted                                                     John Smith      | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 10, 2024 - 03:00 PM                                                              | |  |
|  |  |  o  Line Added: Salt Industrial (100 kg)                             John Smith      | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 10, 2024 - 02:45 PM                                                              | |  |
|  |  |  o  Line Added: Sugar White (200 kg)                                 John Smith      | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 10, 2024 - 02:30 PM                                                              | |  |
|  |  |  o  Line Added: Flour Type A (500 kg)                                John Smith      | |  |
|  |  |  |                                                                                    | |  |
|  |  |  Dec 10, 2024 - 02:00 PM                                                              | |  |
|  |  |  o  PO Created                                                       John Smith      | |  |
|  |  |     Supplier: Mill Co. | Expected: Dec 20, 2024                                       | |  |
|  |  |                                                                                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Documents Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- DOCUMENTS TAB -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [History]  [Documents]  [Receiving]                                               |  |
|  |                     ----------                                                               |  |
|  |                                                                                              |  |
|  |  Attached Documents:                                                   [+ Upload Document]  |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | [PDF] PO-2024-00156.pdf                                   2.4 MB    Dec 10, 2024       | |  |
|  |  |       Original purchase order document                                                 | |  |
|  |  |       Uploaded by: System (auto-generated)                                             | |  |
|  |  |       [Download] [Preview] [Delete]                                                    | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | [IMG] delivery_note_001.jpg                               1.8 MB    Dec 14, 2024       | |  |
|  |  |       Supplier delivery note photo                                                     | |  |
|  |  |       Uploaded by: Jane Doe                                                            | |  |
|  |  |       [Download] [Preview] [Delete]                                                    | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | [PDF] quality_cert_flour.pdf                              0.5 MB    Dec 14, 2024       | |  |
|  |  |       Quality certificate for Flour Type A                                             | |  |
|  |  |       Uploaded by: Quality Team                                                        | |  |
|  |  |       [Download] [Preview] [Delete]                                                    | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  3 Documents | Total Size: 4.7 MB                                                           |  |
|  |                                                                                              |  |
|  |  Supported Formats: PDF, JPG, PNG, XLSX (Max 10 MB per file)                                |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Receiving Tab View

```
+--------------------------------------------------------------------------------------------------+
|  (Header same as above)                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- RECEIVING TAB -----------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Lines]  [History]  [Documents]  [Receiving]                                               |  |
|  |                                   ----------                                                 |  |
|  |                                                                                              |  |
|  |  Receipts for this PO:                                         [+ Create New GRN]          |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | GRN #          | Date         | Received By  | Lines | Total Qty   | Status   | Action| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | GRN-2024-00342 | Dec 14, 2024 | Jane Doe     | 2     | 600 kg      | Complete | [View]| |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Summary:                                                                                   |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Product           | Ordered | Received | Pending  | Receipt History                    | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | Flour Type A      | 500 kg  | 500 kg   | 0 kg     | GRN-342: 500 kg (Dec 14)          | |  |
|  |  | Sugar White       | 200 kg  | 100 kg   | 100 kg   | GRN-342: 100 kg (Dec 14)          | |  |
|  |  | Salt Industrial   | 100 kg  | 0 kg     | 100 kg   | No receipts                        | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  Overall Progress: [========================--------] 75% (600 of 800 kg)                  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  < PO-2024-00156                 |
|  [Actions v]                     |
+----------------------------------+
|                                  |
|  Status: [Receiving] 60%         |
|                                  |
|  +----------------------------+  |
|  | Supplier                   |  |
|  | Mill Co.                   |  |
|  +----------------------------+  |
|  | Warehouse                  |  |
|  | Main Warehouse             |  |
|  +----------------------------+  |
|  | Expected Delivery          |  |
|  | Dec 20, 2024 (6 days)      |  |
|  +----------------------------+  |
|  | Total                      |  |
|  | $984.00 PLN                |  |
|  +----------------------------+  |
|                                  |
|  [Lines] [History] [Receiving]   |
|  ------                          |
|                                  |
|  +----------------------------+  |
|  | 1. Flour Type A            |  |
|  | 500 kg x $1.20             |  |
|  | Received: 500/500 kg [OK]  |  |
|  | Subtotal: $600.00          |  |
|  +----------------------------+  |
|  | 2. Sugar White             |  |
|  | 200 kg x $0.85             |  |
|  | Received: 100/200 kg [50%] |  |
|  | Subtotal: $170.00          |  |
|  +----------------------------+  |
|  | 3. Salt Industrial         |  |
|  | 100 kg x $0.30             |  |
|  | Received: 0/100 kg [0%]    |  |
|  | Subtotal: $30.00           |  |
|  +----------------------------+  |
|                                  |
|  Subtotal:   $800.00            |
|  Tax:        $184.00            |
|  Total:      $984.00 PLN        |
|                                  |
|  +----------------------------+  |
|  | [Go to Receiving]          |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders > ...                                                        [Print] |
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
|  +-------------------------------- LINES -------------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |  [==================================================================================]       |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  Loading purchase order details...                                                                |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - PO Not Found

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders > Error                                                              |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|                                                                                                    |
|                                      +------------------+                                          |
|                                      |   [Error Icon]   |                                          |
|                                      +------------------+                                          |
|                                                                                                    |
|                              Failed to Load Purchase Order                                        |
|                                                                                                    |
|                     The purchase order could not be found or you don't                            |
|                     have permission to view it.                                                   |
|                                                                                                    |
|                              Error: PO_NOT_FOUND                                                  |
|                                                                                                    |
|                                                                                                    |
|                       [Go Back to PO List]    [Contact Support]                                   |
|                                                                                                    |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Error State - Invalid Status Transition

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Purchase Orders > PO-2024-00156                                  [Edit] [Actions v]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |  [!] Action Cannot Be Performed                                                      [Close]|  |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                                                              |  |
|  |  [Warning Icon]                                                                              |  |
|  |                                                                                              |  |
|  |  Cannot submit this purchase order for approval.                                            |  |
|  |                                                                                              |  |
|  |  Reason: Purchase order is in "Receiving" status and cannot transition to "Submitted"       |  |
|  |                                                                                              |  |
|  |  Valid transitions from "Receiving":                                                         |  |
|  |  - Close PO (if all lines fully received)                                                   |  |
|  |  - Cancel PO (with manager approval)                                                        |  |
|  |                                                                                              |  |
|  |  Error Code: INVALID_STATUS_TRANSITION                                                      |  |
|  |  Current Status: Receiving                                                                  |  |
|  |  Attempted Status: Submitted                                                                |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+  |  |
|  |  |                                                                    [OK]                 |  |  |
|  |  +----------------------------------------------------------------------------------------+  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  (Rest of PO detail page below)                                                                   |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Header Info Section

| Field | Source | Display |
|-------|--------|---------|
| po_number | purchase_orders.po_number | "PO-2024-00156" |
| status | purchase_orders.status | Badge with color |
| receive_percent | Calculated | "60% Received" progress indicator |
| created_by | users.name via created_by | "John Smith" |
| created_at | purchase_orders.created_at | "Dec 10, 2024" |
| supplier_name | suppliers.name | "Mill Co." |
| supplier_code | suppliers.code | "SUP-001" |
| warehouse_name | warehouses.name | "Main Warehouse" |
| expected_delivery | purchase_orders.expected_delivery_date | "Dec 20, 2024" + relative time |
| currency | purchase_orders.currency | "PLN" |
| payment_terms | purchase_orders.payment_terms | "Net 30" |
| tax_code | tax_codes.name | "Standard 23%" |
| notes | purchase_orders.notes | User-entered notes |

### 2. Status Badge Color Mapping

| Status | Badge Color | Background | Text | Border | Icon |
|--------|-------------|------------|------|--------|------|
| draft | Gray | #F3F4F6 | #374151 | #D1D5DB | Edit icon |
| submitted | Blue | #DBEAFE | #1E40AF | #93C5FD | Send icon |
| pending_approval | Yellow | #FEF3C7 | #92400E | #FCD34D | Clock icon |
| approved | Green-Light | #D1FAE5 | #065F46 | #6EE7B7 | Checkmark icon |
| confirmed | Green | #D1FAE5 | #047857 | #34D399 | Double-check icon |
| receiving | Blue-Dark | #BFDBFE | #1E3A8A | #60A5FA | Package icon |
| closed | Gray-Dark | #E5E7EB | #1F2937 | #9CA3AF | Archive icon |
| cancelled | Red | #FEE2E2 | #991B1B | #FCA5A5 | X icon |

**Accessibility Notes**:
- All color combinations meet WCAG AA contrast ratio of 4.5:1
- Icons used as additional visual indicators beyond color
- Status text announced to screen readers

### 3. Tab Navigation

| Tab | Content | Visible When |
|-----|---------|--------------|
| **Lines** | Line items with ordered/received qty | Always (default) |
| **History** | Timeline of all status changes, edits, receipts | Always |
| **Documents** | Attached files (PDFs, images, certificates) | Always |
| **Receiving** | GRN list and receiving summary | Status in (Confirmed, Receiving, Closed) |

### 4. Documents Tab Structure

| Field | Type | Description |
|-------|------|-------------|
| File type icon | Icon | PDF, IMG, XLSX visual indicator |
| File name | String | Original filename |
| File size | String | Formatted size (KB, MB) |
| Upload date | Date | When document was attached |
| Description | String | Optional user-entered description |
| Uploaded by | User | User name who uploaded |
| Actions | Buttons | Download, Preview, Delete |

**Document Rules**:
- Supported formats: PDF, JPG, PNG, XLSX
- Max file size: 10 MB per file
- No limit on number of documents
- Auto-generated PDF always present (system-uploaded)
- Documents soft-deleted (audit trail)

### 5. Lines Table Columns

| Column | Width | Description |
|--------|-------|-------------|
| # | 40px | Line number |
| Product | 200px | Name + SKU |
| Ordered | 100px | Ordered quantity + UoM |
| Received | 100px | Received quantity + UoM |
| Remaining | 100px | Outstanding quantity |
| Unit Price | 100px | Price per unit |
| Subtotal | 100px | Line total (qty * price) |
| Status | 80px | [OK], [50%], [0%] indicator |

### 6. Line Status Indicators

| Indicator | Condition | Color |
|-----------|-----------|-------|
| [OK] | received_qty = ordered_qty | Green |
| [XX%] | received_qty > 0 AND received_qty < ordered_qty | Yellow |
| [0%] | received_qty = 0 | Gray |
| [OVER] | received_qty > ordered_qty | Red (rare, allowed by settings) |

### 7. Totals Section

| Field | Calculation | Display |
|-------|-------------|---------|
| Subtotal | SUM(line.quantity * line.unit_price) | "$800.00 PLN" |
| Tax | Subtotal * tax_rate | "$184.00 PLN" |
| Discount | SUM(line.discount_amount) | "-$0.00 PLN" |
| **Total** | Subtotal + Tax - Discount | "$984.00 PLN" |
| Received Value | SUM(line.received_qty * line.unit_price) * (1 + tax_rate) | "$799.50 PLN" |
| Outstanding | Total - Received Value | "$184.50 PLN" |

---

## Main Actions

### Header Actions (Status-Dependent)

| Action | Visible When | Result |
|--------|--------------|--------|
| **Edit** | status = Draft | Opens PLAN-005 Edit modal |
| **Submit for Approval** | status = Draft | Transitions to Submitted/Pending Approval |
| **Approve** | status = Pending Approval AND user has permission | Opens PLAN-008 Approval modal |
| **Reject** | status = Pending Approval AND user has permission | Opens PLAN-008 Rejection modal |
| **Confirm** | status = Approved | Transitions to Confirmed |
| **Cancel PO** | status NOT IN (Receiving, Closed) | Cancel with confirmation |
| **Duplicate PO** | Always | Creates copy as Draft |
| **Export to PDF** | Always | Downloads PDF |
| **Print** | Always | Opens print dialog |

### Quick Actions (Bottom of Page)

| Action | Visible When | Result |
|--------|--------------|--------|
| **Go to Receiving** | status IN (Confirmed, Receiving) | Navigate to Warehouse receiving page |
| **Email Supplier** | Always | Opens email compose with PO attachment |
| **Create Follow-up PO** | Always | Creates new PO with same supplier, remaining items |

### Documents Tab Actions

| Action | Description |
|--------|-------------|
| **Upload Document** | Opens file picker, uploads to storage |
| **Download** | Downloads document to user's device |
| **Preview** | Opens document in modal preview |
| **Delete** | Soft-deletes document (audit trail retained) |

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Initial page load | Skeleton for header, lines, totals |
| **Success** | PO loaded | Full detail view with all sections |
| **Error** | PO not found or no access | Error message, back button |
| **Invalid Transition** | User attempts invalid status change | Modal error with allowed transitions |

---

## API Endpoints

### Get PO Detail

```
GET /api/planning/purchase-orders/:id

Response:
{
  "success": true,
  "data": {
    "id": "uuid-po-156",
    "po_number": "PO-2024-00156",
    "status": "receiving",
    "approval_status": "approved",
    "supplier": {
      "id": "uuid-supplier-1",
      "code": "SUP-001",
      "name": "Mill Co."
    },
    "warehouse": {
      "id": "uuid-wh-main",
      "code": "WH-MAIN",
      "name": "Main Warehouse"
    },
    "expected_delivery_date": "2024-12-20",
    "currency": "PLN",
    "tax_code": {
      "id": "uuid-tax-23",
      "name": "Standard 23%",
      "rate": 23.0
    },
    "payment_terms": "Net 30",
    "notes": "Special handling required - deliver before 8am",
    "subtotal": 800.00,
    "tax_amount": 184.00,
    "discount_total": 0.00,
    "total": 984.00,
    "received_value": 799.50,
    "outstanding": 184.50,
    "receive_percent": 60,
    "lines": [
      {
        "id": "uuid-line-1",
        "line_number": 1,
        "product": {
          "id": "uuid-flour",
          "code": "RM-FLOUR-001",
          "name": "Flour Type A"
        },
        "quantity": 500,
        "uom": "kg",
        "unit_price": 1.20,
        "line_total": 600.00,
        "received_qty": 500,
        "remaining_qty": 0,
        "status": "complete"
      },
      {
        "id": "uuid-line-2",
        "line_number": 2,
        "product": {
          "id": "uuid-sugar",
          "code": "RM-SUGAR-001",
          "name": "Sugar White"
        },
        "quantity": 200,
        "uom": "kg",
        "unit_price": 0.85,
        "line_total": 170.00,
        "received_qty": 100,
        "remaining_qty": 100,
        "status": "partial"
      },
      {
        "id": "uuid-line-3",
        "line_number": 3,
        "product": {
          "id": "uuid-salt",
          "code": "RM-SALT-001",
          "name": "Salt Industrial"
        },
        "quantity": 100,
        "uom": "kg",
        "unit_price": 0.30,
        "line_total": 30.00,
        "received_qty": 0,
        "remaining_qty": 100,
        "status": "pending"
      }
    ],
    "created_by": {
      "id": "uuid-user-1",
      "name": "John Smith"
    },
    "created_at": "2024-12-10T14:00:00Z",
    "updated_at": "2024-12-14T09:30:00Z",
    "approved_by": {
      "id": "uuid-user-2",
      "name": "Mary Johnson"
    },
    "approved_at": "2024-12-11T10:45:00Z",
    "approval_notes": "Approved for Q4 stock replenishment"
  }
}
```

### Get PO History

```
GET /api/planning/purchase-orders/:id/history

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-hist-1",
      "event_type": "grn_created",
      "event_date": "2024-12-14T09:30:00Z",
      "user": { "id": "uuid-user-3", "name": "Jane Doe" },
      "details": {
        "grn_id": "uuid-grn-342",
        "grn_number": "GRN-2024-00342",
        "lines_received": [
          { "product": "Flour Type A", "quantity": 500 },
          { "product": "Sugar White", "quantity": 100 }
        ]
      }
    },
    {
      "id": "uuid-hist-2",
      "event_type": "status_change",
      "event_date": "2024-12-12T14:15:00Z",
      "user": { "id": "system", "name": "System" },
      "details": {
        "from_status": "confirmed",
        "to_status": "receiving",
        "reason": "First receipt recorded"
      }
    },
    // ... more history events
  ]
}
```

### Get PO Documents

```
GET /api/planning/purchase-orders/:id/documents

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-doc-1",
      "file_name": "PO-2024-00156.pdf",
      "file_type": "application/pdf",
      "file_size": 2457600,
      "file_url": "https://storage.example.com/docs/uuid-doc-1.pdf",
      "description": "Original purchase order document",
      "uploaded_by": {
        "id": "system",
        "name": "System"
      },
      "uploaded_at": "2024-12-10T14:00:00Z",
      "is_system_generated": true
    },
    {
      "id": "uuid-doc-2",
      "file_name": "delivery_note_001.jpg",
      "file_type": "image/jpeg",
      "file_size": 1887436,
      "file_url": "https://storage.example.com/docs/uuid-doc-2.jpg",
      "description": "Supplier delivery note photo",
      "uploaded_by": {
        "id": "uuid-user-3",
        "name": "Jane Doe"
      },
      "uploaded_at": "2024-12-14T09:35:00Z",
      "is_system_generated": false
    }
  ],
  "total_count": 3,
  "total_size": 4928000
}
```

### Upload Document

```
POST /api/planning/purchase-orders/:id/documents
Content-Type: multipart/form-data
Body: {
  file: <File>,
  description: "Quality certificate"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-doc-3",
    "file_name": "quality_cert_flour.pdf",
    "file_type": "application/pdf",
    "file_size": 524288,
    "file_url": "https://storage.example.com/docs/uuid-doc-3.pdf",
    "description": "Quality certificate",
    "uploaded_by": {
      "id": "uuid-user-4",
      "name": "Quality Team"
    },
    "uploaded_at": "2024-12-14T10:00:00Z"
  }
}
```

### Delete Document

```
DELETE /api/planning/purchase-orders/:id/documents/:documentId

Response:
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Get PO Receipts (Receiving Tab)

```
GET /api/planning/purchase-orders/:id/receipts

Response:
{
  "success": true,
  "data": {
    "receipts": [
      {
        "id": "uuid-grn-342",
        "grn_number": "GRN-2024-00342",
        "receipt_date": "2024-12-14",
        "received_by": { "id": "uuid-user-3", "name": "Jane Doe" },
        "lines_count": 2,
        "total_qty": 600,
        "status": "complete"
      }
    ],
    "summary": [
      {
        "product_id": "uuid-flour",
        "product_name": "Flour Type A",
        "ordered_qty": 500,
        "received_qty": 500,
        "pending_qty": 0,
        "receipt_history": [
          { "grn_number": "GRN-2024-00342", "qty": 500, "date": "2024-12-14" }
        ]
      },
      {
        "product_id": "uuid-sugar",
        "product_name": "Sugar White",
        "ordered_qty": 200,
        "received_qty": 100,
        "pending_qty": 100,
        "receipt_history": [
          { "grn_number": "GRN-2024-00342", "qty": 100, "date": "2024-12-14" }
        ]
      },
      {
        "product_id": "uuid-salt",
        "product_name": "Salt Industrial",
        "ordered_qty": 100,
        "received_qty": 0,
        "pending_qty": 100,
        "receipt_history": []
      }
    ],
    "overall_progress": {
      "percent": 75,
      "total_ordered": 800,
      "total_received": 600,
      "uom": "kg"
    }
  }
}
```

### Status Change Actions

```
POST /api/planning/purchase-orders/:id/submit
POST /api/planning/purchase-orders/:id/approve
POST /api/planning/purchase-orders/:id/reject
POST /api/planning/purchase-orders/:id/confirm
POST /api/planning/purchase-orders/:id/cancel

// All return:
{
  "success": true,
  "data": {
    "id": "uuid-po-156",
    "status": "new_status",
    "message": "Purchase order submitted successfully"
  }
}

// Invalid transition returns 400:
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'receiving' to 'submitted'",
    "current_status": "receiving",
    "attempted_status": "submitted",
    "valid_transitions": ["closed", "cancelled"]
  }
}
```

---

## Status Transition Rules

### Valid Status Transitions

| From Status | Valid Next Statuses | Action Required |
|-------------|---------------------|-----------------|
| draft | submitted, cancelled | Submit or Cancel |
| submitted | pending_approval, cancelled | Auto-transition or Cancel |
| pending_approval | approved, rejected, cancelled | Approval decision or Cancel |
| approved | confirmed, cancelled | Confirm or Cancel |
| confirmed | receiving, cancelled | First GRN or Cancel |
| receiving | closed, cancelled | Complete all receipts or Cancel |
| closed | - | Terminal state |
| cancelled | - | Terminal state |
| rejected | draft | Resubmit allowed |

### Invalid Transition Error Handling

When user attempts invalid status transition:

1. **Prevent action**: Action button disabled/hidden when invalid
2. **Show error modal**: If attempt made via API/direct action
3. **Display valid options**: List allowed transitions
4. **Error code**: `INVALID_STATUS_TRANSITION`
5. **HTTP 400**: Bad Request response

**Example Invalid Transitions**:
- Cannot submit PO in "Receiving" status
- Cannot approve PO already in "Closed" status
- Cannot confirm PO from "Draft" (must be Approved first)
- Cannot receive against "Draft" PO (must be Confirmed)

---

## Permissions

| Role | View Detail | Edit | Approve/Reject | Cancel | Print/Export | Upload Docs | Delete Docs |
|------|-------------|------|----------------|--------|--------------|-------------|-------------|
| Admin | Yes | Yes (Draft) | Yes | Yes | Yes | Yes | Yes |
| Purchaser | Yes | Yes (Draft) | No | Yes (own POs) | Yes | Yes | Yes (own) |
| Manager | Yes | Yes (Draft) | Yes | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | No | Yes | No | No |

---

## Business Rules

### Status-Based UI Rules

| Status | Edit Button | Action Menu Items |
|--------|-------------|-------------------|
| Draft | Visible | Submit, Duplicate, Cancel, Print |
| Submitted | Hidden | Duplicate, Cancel, Print |
| Pending Approval | Hidden | Approve, Reject, Duplicate, Cancel, Print |
| Approved | Hidden | Confirm, Duplicate, Cancel, Print |
| Confirmed | Hidden | Duplicate, Print |
| Receiving | Hidden | Duplicate, Print |
| Closed | Hidden | Duplicate, Print |
| Cancelled | Hidden | Duplicate, Print |

### Receiving Tab Visibility

- Only visible when status IN ('confirmed', 'receiving', 'closed')
- Shows link to create new GRN when status IN ('confirmed', 'receiving')
- "Create GRN" button disabled when all lines fully received

### History Events Logged

| Event | Trigger | Details Captured |
|-------|---------|------------------|
| po_created | POST /purchase-orders | supplier, expected_date, lines_count |
| line_added | POST /purchase-orders/:id/lines | product, quantity, price |
| line_updated | PUT /purchase-orders/:id/lines/:lineId | changed fields |
| line_deleted | DELETE /purchase-orders/:id/lines/:lineId | product that was removed |
| po_submitted | POST /purchase-orders/:id/submit | - |
| status_change | Any status transition | from_status, to_status, reason |
| po_approved | POST /purchase-orders/:id/approve | approval_notes |
| po_rejected | POST /purchase-orders/:id/reject | rejection_reason |
| grn_created | Warehouse module creates GRN | grn_number, lines_received |
| document_uploaded | POST /purchase-orders/:id/documents | file_name, uploaded_by |
| document_deleted | DELETE /purchase-orders/:id/documents/:docId | file_name, deleted_by |

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Tab navigation items: 48dp height
- History timeline events: 64dp minimum row height
- Document action buttons: 48x48dp

### Contrast
- Header info text: 4.5:1
- Status badges: WCAG AA compliant (see color mapping table)
- Table text: 4.5:1
- Document icons: 3:1 minimum

### Screen Reader
- Page title: "Purchase Order PO-2024-00156 Detail"
- Status: "Status: Receiving, 60 percent received"
- Lines table: Proper th/td structure with scope
- History timeline: "Timeline of purchase order events, 10 events"
- Documents: "3 documents attached, total size 4.7 megabytes"

### Keyboard Navigation
- Tab: Navigate between sections, tabs, action buttons
- Enter: Activate buttons, navigate links
- Arrow keys: Navigate within tabs
- Escape: Close error modals

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full layout with sidebar info cards |
| Tablet (768-1024px) | Stacked info cards, condensed table |
| Mobile (<768px) | Full stack, card-based lines, collapsible sections |

---

## Performance Notes

### Data Loading
- Header + Lines: Single query with JOINs
- History: Lazy load on tab click
- Documents: Lazy load on tab click
- Receipts: Lazy load on tab click

### Caching
```typescript
'org:{orgId}:po:{poId}:detail'      // 30 sec TTL (refresh on action)
'org:{orgId}:po:{poId}:history'     // 1 min TTL
'org:{orgId}:po:{poId}:documents'   // 30 sec TTL
'org:{orgId}:po:{poId}:receipts'    // 30 sec TTL
```

### Load Time Targets
- Initial page (header + lines): <500ms
- Tab switch (history): <300ms
- Tab switch (documents): <300ms
- Tab switch (receipts): <300ms
- Document upload: <2s for 5MB file

---

## Testing Requirements

### Unit Tests
- Receive percent calculation
- Line status determination (complete, partial, pending)
- Outstanding amount calculation
- Action button visibility by status
- Status transition validation logic
- Document file type validation
- Document size validation

### Integration Tests
- GET /api/planning/purchase-orders/:id
- GET /api/planning/purchase-orders/:id/history
- GET /api/planning/purchase-orders/:id/documents
- POST /api/planning/purchase-orders/:id/documents
- DELETE /api/planning/purchase-orders/:id/documents/:docId
- GET /api/planning/purchase-orders/:id/receipts
- All status change endpoints
- Invalid status transition error handling
- RLS enforcement

### E2E Tests
- View PO detail page loads all sections
- Tab navigation works (Lines, History, Documents, Receiving)
- Edit button opens modal (Draft PO)
- Submit action works
- Approve action works (manager role)
- Invalid status transition shows error modal
- Upload document to PO
- Download document from PO
- Delete document from PO
- Print action downloads PDF
- Mobile responsive layout
- Navigate to receiving from Quick Actions

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Success, Error, Invalid Transition)
- [x] All tabs specified (Lines, History, Documents, Receiving)
- [x] Documents tab structure defined
- [x] Status badge color mapping table complete
- [x] API endpoints documented
- [x] Status transition rules defined
- [x] Invalid transition error handling specified
- [x] Status-based action visibility defined
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] History events listed
- [x] Receiving integration specified

---

## Handoff to FRONTEND-DEV

```yaml
feature: PO Detail Page
story: PLAN-006
fr_coverage: FR-PLAN-005, FR-PLAN-007
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-006-po-detail.md
  api_endpoints:
    - GET /api/planning/purchase-orders/:id
    - GET /api/planning/purchase-orders/:id/history
    - GET /api/planning/purchase-orders/:id/documents
    - POST /api/planning/purchase-orders/:id/documents
    - DELETE /api/planning/purchase-orders/:id/documents/:docId
    - GET /api/planning/purchase-orders/:id/receipts
    - POST /api/planning/purchase-orders/:id/submit
    - POST /api/planning/purchase-orders/:id/approve
    - POST /api/planning/purchase-orders/:id/reject
    - POST /api/planning/purchase-orders/:id/confirm
    - POST /api/planning/purchase-orders/:id/cancel
states_per_screen: [loading, success, error, invalid_transition]
tabs: [lines, history, documents, receiving]
status_badges: 8  # draft, submitted, pending_approval, approved, confirmed, receiving, closed, cancelled
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  wcag_level: "AA"
related_screens:
  - PLAN-004: PO List Page
  - PLAN-005: PO Create/Edit Modal
  - PLAN-008: PO Approval Modal
  - Warehouse Receiving Page (cross-module)
```

---

**Status**: Ready for Implementation
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 12-14 hours
**Quality Target**: 97/100
