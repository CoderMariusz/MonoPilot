# SSCC & BOL Labels - User Guide

> Story: 07.13 - SSCC Generation + BOL + Shipping Labels
> Module: Shipping
> Audience: Warehouse Packers, Shipping Coordinators

## Overview

This guide covers generating GS1-compliant SSCC barcodes for shipment boxes, printing shipping labels on Zebra printers, creating Bill of Lading (BOL) documents, and generating packing slips. These are essential for food manufacturing traceability and carrier handoff.

---

## Prerequisites

Before you begin:

1. Shipment must be in **Packed** status (all boxes created)
2. Your organization must have **GS1 Company Prefix** configured in Settings
3. Navigate to **Shipping > Shipments** and open the shipment

---

## Workflow

### Step 1: Generate SSCC Codes

SSCC (Serial Shipping Container Code) is an 18-digit barcode that uniquely identifies each box worldwide.

1. Open the shipment detail page
2. Locate the **Labels & Documents** section
3. Click **Generate SSCC**

The system generates unique SSCC codes for all boxes:

```
Box 1: 00 6141 4100 0012 3452
Box 2: 00 6141 4100 0012 3469
Box 3: 00 6141 4100 0012 3476
```

**Understanding the SSCC Structure**

| Part | Digits | Description |
|------|--------|-------------|
| Extension | 0 | 0 = carton, 9 = pallet |
| GS1 Prefix | 7-10 | Your company's unique identifier |
| Serial | 6-9 | Sequential number |
| Check | 1 | Validation digit |

SSCC generation is **idempotent** - boxes with existing SSCC codes are skipped.

---

### Step 2: Preview SSCC Labels

Before printing, preview labels to verify accuracy:

1. Click the **Preview** icon next to any box
2. The label preview shows:
   - GS1-128 barcode (scannable)
   - Human-readable SSCC with spaces
   - Ship To address
   - Order number
   - Box X of Y
   - Weight
   - Handling instructions

3. Toggle between label sizes:
   - **4x6"** - Standard carton label
   - **4x8"** - Pallet label

---

### Step 3: Print Shipping Labels

Print labels directly to your Zebra printer:

1. Click **Print Labels**
2. Select options:
   - **Format**: 4x6" (carton) or 4x8" (pallet)
   - **Printer**: Select your Zebra printer
   - **Copies**: Number of labels per box
3. Click **Print**

**Printer Support**

| Printer Type | Output Format |
|--------------|---------------|
| Zebra (ZPL) | Native ZPL commands |
| Other printers | PDF fallback |

The label includes:

```
+----------------------------------+
| [GS1-128 BARCODE]                |
| 00 6141 4100 0012 3452           |
|----------------------------------|
| SHIP TO:                         |
| Blue Mountain Restaurant         |
| 789 Main Street                  |
| Denver, CO 80210                 |
|----------------------------------|
| ORDER: SO-2026-00123             |
| BOX: 1 of 3                      |
| WEIGHT: 48.5 kg                  |
|----------------------------------|
| Keep Refrigerated (2-8C)         |
+----------------------------------+
```

---

### Step 4: Generate Bill of Lading (BOL)

Create the official shipping document for carrier handoff:

1. Ensure all boxes have SSCC codes
2. Ensure carrier is assigned to shipment
3. Click **Generate BOL**
4. Wait for PDF generation (typically 2-5 seconds)

**BOL Preview Modal**

The BOL preview shows:
- Zoom controls (50%, 75%, 100%, 125%, 150%)
- Print button
- Download button (PDF)
- Email button

**BOL Contents**

- BOL number (e.g., BOL-2026-000123)
- Shipper information (your warehouse)
- Consignee information (customer)
- Freight details table with SSCC, weight, dimensions
- Product summary per carton with lot numbers
- Signature sections for shipper and carrier

---

### Step 5: Email BOL to Carrier

Send the BOL directly to the carrier:

1. Click **Email** in the BOL preview
2. The system suggests carrier contact email
3. Add CC recipients if needed
4. Customize subject and message
5. Click **Send**

Email includes the BOL PDF attachment.

---

### Step 6: Generate Packing Slip

Create a packing slip for the customer:

1. Click **Print Packing Slip**
2. Wait for PDF generation
3. Print or download the packing slip

**Packing Slip Contents**

- "PACKING SLIP" header
- Sales order number and shipment number
- Ship To and Ship From addresses
- Line items with quantities ordered, shipped, backorder
- Lot numbers and best-before dates
- Carton summary with SSCC codes
- Allergen warnings (if applicable)
- Temperature handling instructions
- Signature section

Include one packing slip inside or attached to each shipment.

---

## GS1 Company Prefix Setup

If you see "GS1 Company Prefix not configured":

1. Go to **Settings > Organization**
2. Locate the **GS1 Configuration** section
3. Enter your 7-10 digit GS1 Company Prefix
4. Click **Save**

Your GS1 Company Prefix is assigned by GS1 organization. Contact GS1 if you don't have one.

---

## Label Format Comparison

| Format | Size | Use Case |
|--------|------|----------|
| 4x6" | 4" x 6" | Standard carton/case labels |
| 4x8" | 4" x 8" | Pallet labels (more room for info) |

---

## Handling Instructions

Common handling instructions displayed on labels:

| Instruction | Meaning |
|-------------|---------|
| Keep Refrigerated (2-8C) | Cold chain product |
| Keep Frozen (-18C) | Frozen product |
| Fragile - Handle with Care | Delicate items |
| Do Not Stack | Heavy or fragile |
| This Side Up | Orientation matters |

Handling instructions are pulled from product settings and customer requirements.

---

## Troubleshooting

### SSCC generation fails

**Error**: "GS1 Company Prefix not configured"

**Solution**: Contact your administrator to configure the GS1 prefix in Settings > Organization.

---

### BOL generation fails

**Error**: "All boxes must have SSCC before generating BOL"

**Solution**: Click "Generate SSCC" first to assign SSCC codes to all boxes.

---

**Error**: "Carrier not assigned to shipment"

**Solution**: Assign a carrier to the shipment in the shipment details before generating BOL.

---

### Labels not printing

**Cause**: Printer not connected or wrong format selected

**Solution**:
1. Check printer connection
2. Verify correct printer selected
3. Try PDF output for non-Zebra printers
4. Check printer has labels loaded

---

### Barcode won't scan

**Cause**: Print quality issue or incorrect barcode type

**Solution**:
1. Ensure scanner is set for GS1-128 / Code 128
2. Adjust printer darkness setting
3. Check label media alignment
4. Clean printer head

---

## Glossary

| Term | Definition |
|------|------------|
| SSCC | Serial Shipping Container Code - 18-digit unique identifier |
| GS1-128 | Barcode standard using AI (Application Identifiers) |
| BOL | Bill of Lading - legal shipping document |
| ZPL | Zebra Programming Language - printer commands |
| AI (00) | Application Identifier for SSCC data |
| MOD 10 | Check digit calculation algorithm |

---

## Quick Reference

### Generate All Documents

1. **Generate SSCC** - Create barcode numbers
2. **Print Labels** - Print for each box
3. **Generate BOL** - Create shipping document
4. **Print Packing Slip** - Create customer document

### Checklist Before Ship

- [ ] All boxes have SSCC labels attached
- [ ] BOL generated and printed (2 copies)
- [ ] Carrier has signed BOL
- [ ] Packing slip included in shipment
- [ ] Shipment marked as "Shipped"

---

## Related Topics

- [Pick Confirmation](./pick-confirmation.md)
- [Packing Station](./packing-station.md)
- [Shipment Manifest](./shipment-manifest.md)
