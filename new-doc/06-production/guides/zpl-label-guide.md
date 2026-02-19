# ZPL Label Generation Guide

**Story:** 04.7b - Output Registration Scanner
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

This guide explains the ZPL (Zebra Programming Language) label generation system used for production output LP labels. Labels are designed for 4x6 inch format at 203 DPI, compatible with Zebra ZT410, ZT230, and ZD620 printers.

---

## Label Format

### Standard LP Label (4x6 inch)

```
+--------------------------------+
|  Chocolate Cookies             |
|  Qty: 250 kg                   |
|  Batch: WO-2026-0156           |
|  Expiry: 2026-02-20            |
|  QA: APPROVED                  |
|                                |
|  ||||||||||||||||||||||||||||  |
|  LP-20260121-0001              |
+--------------------------------+
```

### Label Fields

| Field | Position | Font | Size |
|-------|----------|------|------|
| Product Name | Top | A0N | 30x30 |
| Quantity + UoM | Row 2 | A0N | 24x24 |
| Batch Number | Row 3 | A0N | 24x24 |
| Expiry Date | Row 4 | A0N | 24x24 |
| QA Status | Row 5 | A0N | 24x24 |
| Barcode | Center | Code128 | 100 dots height |
| LP Number (text) | Below barcode | A0N | 20x20 |

---

## ZPL Template

### Standard LP Label Template

```zpl
^XA
^FO50,30^A0N,30,30^FD{product_name}^FS
^FO50,70^A0N,24,24^FDQty: {qty_with_uom}^FS
^FO50,100^A0N,24,24^FDBatch: {batch_number}^FS
^FO50,130^A0N,24,24^FDExpiry: {expiry_date}^FS
^FO50,160^A0N,24,24^FDQA: {qa_status}^FS
^FO50,200^BY3^BCN,100,Y,N,N^FD{lp_number}^FS
^FO50,320^A0N,20,20^FD{lp_number}^FS
^XZ
```

### ZPL Commands Reference

| Command | Description |
|---------|-------------|
| `^XA` | Start label format |
| `^XZ` | End label format |
| `^FO{x},{y}` | Field origin (position in dots) |
| `^A0N,{h},{w}` | Scalable font, normal orientation, height, width |
| `^FD{data}^FS` | Field data and separator |
| `^BY{w}` | Bar code default settings (module width) |
| `^BCN,{h},Y,N,N` | Code 128 barcode, height, print text, UCC check, mode |

---

## Label Service Implementation

### Generate ZPL Content

```typescript
// lib/services/label-service.ts

export async function generateZPL(lpId: string, templateId?: string): Promise<ZPLResult> {
  const supabase = getAdminClient()

  // Get LP with product info
  const { data: lp, error: lpError } = await supabase
    .from('license_plates')
    .select(`
      id,
      lp_number,
      quantity,
      current_qty,
      uom,
      batch_number,
      expiry_date,
      qa_status,
      products!license_plates_product_id_fkey(id, name, code)
    `)
    .eq('id', lpId)
    .single()

  if (lpError || !lp) {
    return {
      success: false,
      error: 'LP not found',
    }
  }

  const product = lp.products as { id: string; name: string; code: string }
  const qtyValue = lp.current_qty || lp.quantity
  const qtyWithUom = `${qtyValue} ${lp.uom}`
  const expiryDate = lp.expiry_date
    ? new Date(lp.expiry_date).toISOString().slice(0, 10)
    : ''

  // Generate ZPL content
  const zplContent = generateZPLContent({
    lpNumber: lp.lp_number,
    productName: product.name,
    qtyWithUom,
    batchNumber: lp.batch_number || '',
    expiryDate,
    qaStatus: lp.qa_status || 'pending',
  })

  return {
    success: true,
    zpl_content: zplContent,
    label_fields: {
      lp_number: lp.lp_number,
      barcode_type: 'Code128',
      product_name: product.name,
      qty_with_uom: qtyWithUom,
      batch_number: lp.batch_number || '',
      expiry_date: expiryDate,
      qa_status: lp.qa_status || 'pending',
    },
  }
}

function generateZPLContent(fields: {
  lpNumber: string
  productName: string
  qtyWithUom: string
  batchNumber: string
  expiryDate: string
  qaStatus: string
}): string {
  // Standard ZPL for 4x6 label (203 DPI)
  return `^XA
^FO50,30^A0N,30,30^FD${fields.productName}^FS
^FO50,70^A0N,24,24^FDQty: ${fields.qtyWithUom}^FS
^FO50,100^A0N,24,24^FDBatch: ${fields.batchNumber}^FS
^FO50,130^A0N,24,24^FDExpiry: ${fields.expiryDate}^FS
^FO50,160^A0N,24,24^FDQA: ${fields.qaStatus.toUpperCase()}^FS
^FO50,200^BY3^BCN,100,Y,N,N^FD${fields.lpNumber}^FS
^FO50,320^A0N,20,20^FD${fields.lpNumber}^FS
^XZ`
}
```

---

## Printer Configuration

### Database Table

```sql
CREATE TABLE printer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  printer_name TEXT NOT NULL,
  printer_ip TEXT NOT NULL,
  printer_port INTEGER NOT NULL DEFAULT 9100,
  printer_type TEXT NOT NULL DEFAULT 'zebra',
  is_default BOOLEAN NOT NULL DEFAULT false,
  location_id UUID REFERENCES locations(id),
  label_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_printer_configs_org_default
  ON printer_configs(org_id, is_default);
CREATE INDEX idx_printer_configs_org_location
  ON printer_configs(org_id, location_id);
```

### Configuring a Printer

```typescript
// Example: Add a printer for a location
const { data, error } = await supabase
  .from('printer_configs')
  .insert({
    org_id: orgId,
    printer_name: 'Production Line 1 Printer',
    printer_ip: '192.168.1.100',
    printer_port: 9100,
    printer_type: 'zebra',
    is_default: false,
    location_id: locationId,
  })
```

---

## Sending to Printer

### TCP Socket Method

```typescript
// lib/services/label-service.ts

export async function sendToPrinter(
  zpl: string,
  printerId?: string
): Promise<PrintResult> {
  const supabase = getAdminClient()

  // Get printer config
  let printerQuery = supabase
    .from('printer_configs')
    .select('id, printer_name, printer_ip, printer_port')

  if (printerId) {
    printerQuery = printerQuery.eq('id', printerId)
  } else {
    printerQuery = printerQuery.eq('is_default', true)
  }

  const { data: printer, error: printerError } = await printerQuery.maybeSingle()

  if (printerError || !printer) {
    return {
      success: false,
      error: 'No printer configured',
    }
  }

  // In production: Send via TCP socket
  // const net = require('net')
  // const socket = new net.Socket()
  // socket.connect(printer.printer_port, printer.printer_ip)
  // socket.write(zpl)
  // socket.end()

  console.log(`Sending ZPL to ${printer.printer_name} at ${printer.printer_ip}:${printer.printer_port}`)

  return {
    success: true,
    printer_name: printer.printer_name,
    sent_at: new Date().toISOString(),
  }
}
```

### Edge Function Method (Alternative)

For environments where TCP sockets aren't available:

```typescript
// supabase/functions/print-label/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  const { zpl, printer_ip, printer_port } = await req.json()

  const conn = await Deno.connect({
    hostname: printer_ip,
    port: printer_port || 9100,
  })

  await conn.write(new TextEncoder().encode(zpl))
  conn.close()

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## Error Handling

### Printer Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `No printer configured` | No default printer, printer ID not found | Configure a printer in Settings |
| `Printer not responding` | Printer offline or network issue | Check printer power and network |
| `Print timeout` | Print took > 2 seconds | Retry or check printer queue |

### ZPL Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `LP not found` | Invalid LP ID | Verify LP exists |
| Garbled print | Special characters | Escape special chars in ZPL |
| Blank label | Invalid coordinates | Check ^FO positions |

---

## Barcode Types

### Code 128 (Default)

Used for LP numbers. Supports full ASCII.

```zpl
^BY3^BCN,100,Y,N,N^FD{lp_number}^FS
```

### QR Code (Alternative)

For high-density data:

```zpl
^BY2,2,0^BQN,2,6^FDQA,{data}^FS
```

### GS1-128

For GS1 compliance (GTIN-14, lot, expiry):

```zpl
^BY2^BCN,100,Y,N,N^FD>;>801{GTIN}>8{BATCH}>817{EXPIRY}^FS
```

---

## Label Customization

### Custom Templates

Templates can be stored in `label_template` column:

```json
{
  "format": "4x6",
  "dpi": 203,
  "fields": [
    {"type": "text", "x": 50, "y": 30, "font": "A0N,30,30", "field": "product_name"},
    {"type": "barcode", "x": 50, "y": 200, "format": "Code128", "height": 100, "field": "lp_number"}
  ]
}
```

### Dynamic Template Rendering

```typescript
function renderTemplate(template: LabelTemplate, data: LabelData): string {
  let zpl = '^XA'

  for (const field of template.fields) {
    const value = data[field.field] || ''

    if (field.type === 'text') {
      zpl += `^FO${field.x},${field.y}^A${field.font}^FD${value}^FS`
    } else if (field.type === 'barcode') {
      zpl += `^FO${field.x},${field.y}^BY3^BCN,${field.height},Y,N,N^FD${value}^FS`
    }
  }

  zpl += '^XZ'
  return zpl
}
```

---

## Testing Labels

### ZPL Viewer Online

Use Labelary Viewer to preview labels:
- URL: http://labelary.com/viewer.html
- Paste ZPL content
- Select 4x6 / 203 DPI

### Test Print Function

```typescript
async function testPrint(printerId: string) {
  const testZpl = `^XA
^FO50,50^A0N,50,50^FDTEST LABEL^FS
^FO50,120^A0N,30,30^FD${new Date().toISOString()}^FS
^XZ`

  return sendToPrinter(testZpl, printerId)
}
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| ZPL Generation | < 100ms |
| Print Execution | < 2000ms |
| Total Label Time | < 2500ms |

---

## Supported Printers

| Model | Protocol | Port | Notes |
|-------|----------|------|-------|
| Zebra ZT410 | RAW | 9100 | Industrial |
| Zebra ZT230 | RAW | 9100 | Mid-range |
| Zebra ZD620 | RAW | 9100 | Desktop |
| Zebra GX420 | RAW | 9100 | Compact |

---

## Related Documentation

- [Scanner Output Components Guide](./scanner-output-components.md)
- [Scanner Output API Reference](./scanner-output-api.md)
- [Zebra ZPL Documentation](https://www.zebra.com/us/en/support-downloads/knowledge-articles/zpl-command-information-and-details.html)

---

## Support

**Story:** 04.7b
**Last Updated:** 2026-01-21
