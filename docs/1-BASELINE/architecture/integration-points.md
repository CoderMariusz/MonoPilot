# Integration Points - MonoPilot

**Version:** 1.0
**Date:** 2025-12-09
**Status:** BASELINE

---

## 1. Overview

Dokument opisuje punkty integracji w systemie MonoPilot:
- **Wewnetrzne:** Integracje miedzy modulami systemu
- **Zewnetrzne:** Integracje z systemami trzecimi

### 1.1 Integration Architecture

```
+==============================================================================+
|                            MONOPILOT SYSTEM                                   |
+==============================================================================+
|                                                                               |
|  +----------+     +----------+     +----------+     +----------+             |
|  | Settings |---->| Technical|---->| Planning |---->| Warehouse|             |
|  +----------+     +----------+     +----------+     +----------+             |
|       |               |                 |                |                    |
|       v               v                 v                v                    |
|  +----------+     +----------+     +----------+     +----------+             |
|  | Production|<---|  Quality |<----|  Shipping|<----|   ...    |             |
|  +----------+     +----------+     +----------+     +----------+             |
|                                                                               |
+==============================================================================+
                                       |
                      +----------------+----------------+
                      |                |                |
               +------v------+  +------v------+  +------v------+
               | Zebra Print |  | GS1 Barcode |  | Email/SMTP  |
               +-------------+  +-------------+  +-------------+
               +------v------+  +------v------+  +------v------+
               |  Accounting |  |     EDI     |  |   Carrier   |
               | (Phase 3)   |  |  (Phase 3)  |  |  (Phase 3)  |
               +-------------+  +-------------+  +-------------+
```

---

## 2. Internal Module Integrations

### 2.1 Integration Matrix

```
              Settings  Technical  Planning  Warehouse  Production  Quality  Shipping
Settings        -         R           R          R           R          R         R
Technical       -         -           R          R           R          R         R
Planning        -         -           -        R/W           R          R         R
Warehouse       -         -           -          -         R/W        R/W       R/W
Production      -         -           -          -           -        R/W         R
Quality         -         -           -          -           -          -         R
Shipping        -         -           -          -           -          -         -

R = Read dependency
W = Write dependency
R/W = Read and Write dependency
```

### 2.2 Settings -> All Modules

**Entities Shared:**
- `organizations` - Multi-tenancy root
- `users` - Authentication, authorization
- `warehouses` - Physical locations
- `locations` - Storage areas
- `machines` - Production equipment
- `production_lines` - Manufacturing lines
- `allergens` - EU14 + custom allergens
- `tax_codes` - VAT rates

**Integration Pattern:**
```typescript
// All modules read settings data
const warehouses = await warehouseService.list()
const locations = await locationService.listByWarehouse(warehouseId)
```

### 2.3 Technical -> Planning, Warehouse, Production

**Entities Shared:**
- `products` - Product master data
- `boms` - Bill of Materials
- `routings` - Production routes

**Integration Points:**

| Source | Target | Trigger | Action |
|--------|--------|---------|--------|
| Product | PO Line | PO Creation | Validate product exists |
| Product | LP | GRN Receipt | Create LP with product |
| BOM | WO | WO Creation | Calculate materials |
| Routing | WO | WO Creation | Generate operations |
| Product Allergens | BOM | BOM View | Aggregate allergens |

**Code Example:**
```typescript
// Planning creates PO with product reference
const poLine = await poLineService.create({
  po_id: poId,
  product_id: productId,  // Technical module entity
  quantity: 100,
  uom: product.uom
})

// Production uses BOM for WO
const bom = await bomService.getActiveForProduct(productId, date)
const materials = await bomService.calculateMaterials(bom.id, plannedQty)
```

### 2.4 Planning -> Warehouse

**Integration Flow: PO Receipt**

```
+-------------+         +-------------+         +-------------+
|  Planning   |         |  Warehouse  |         |   LP/GRN    |
|     PO      |-------->|   Receipt   |-------->|   Created   |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 PO Status:             GRN Created              LP Created
 submitted ->           with po_id               with grn_id
 partial/received       reference                reference
```

**API Integration:**
```typescript
// Warehouse creates GRN from PO
POST /api/warehouse/grns
{
  "source_type": "po",
  "po_id": "uuid",
  "warehouse_id": "uuid",
  "location_id": "uuid",
  "items": [
    {
      "po_line_id": "uuid",
      "product_id": "uuid",
      "received_qty": 100,
      "batch_number": "BATCH-001",
      "expiry_date": "2025-12-31"
    }
  ]
}

// System automatically:
// 1. Creates GRN record
// 2. Creates LP for each item
// 3. Updates po_line.received_qty
// 4. Updates PO status if fully received
```

**Integration Flow: TO Transfer**

```
+-------------+         +-------------+         +-------------+
|  Planning   |         |  Warehouse  |         |  Warehouse  |
|     TO      |-------->|   Ship      |-------->|   Receive   |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 TO Status:             LP Status:              LP Location:
 draft ->               available ->            from_warehouse ->
 in_transit             in_transit              to_warehouse
```

### 2.5 Warehouse -> Production

**Integration Flow: Material Consumption**

```
+-------------+         +-------------+         +-------------+
|    WO       |         | Reservation |         | Consumption |
|  Materials  |-------->|    LP       |-------->|    LP       |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 wo_materials            LP Status:              LP Status:
 planned_qty             available ->            reserved ->
                         reserved                consumed
                                                 (qty = 0 or partial)
```

**API Integration:**
```typescript
// Production reserves materials
POST /api/production/work-orders/:id/reserve
{
  "materials": [
    {
      "wo_material_id": "uuid",
      "lp_id": "uuid",
      "quantity": 50
    }
  ]
}

// Production consumes materials
POST /api/production/work-orders/:id/consume
{
  "reservations": [
    {
      "reservation_id": "uuid",
      "consumed_qty": 50
    }
  ]
}

// System automatically:
// 1. Updates LP.quantity (decreases)
// 2. Updates LP.status if fully consumed
// 3. Creates lp_genealogy record
// 4. Updates wo_material.consumed_qty
```

**Integration Flow: Output Registration**

```
+-------------+         +-------------+         +-------------+
|    WO       |         |   Output    |         | New LP with |
|  Complete   |-------->| Registration|-------->|  Genealogy  |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 WO Status:              LP Created              lp_genealogy:
 in_progress ->          with wo_id              consumed LPs ->
 completed               reference               output LP
```

### 2.6 Warehouse -> Quality

**Integration Flow: QA Status**

```
+-------------+         +-------------+         +-------------+
|     LP      |         |   Quality   |         | LP Updated  |
|   Receipt   |-------->|  Inspection |-------->| qa_status   |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 LP Created:             QA Decision:            LP Status:
 qa_status =             passed/failed/          qa_status =
 pending                 quarantine              passed/failed
```

**Business Rules:**
- LP with `qa_status = failed` cannot be consumed
- LP with `qa_status = quarantine` cannot be moved
- Settings toggle: `allow_pending_consumption`

### 2.7 Warehouse/Production -> Quality (Holds)

**Integration Flow: Quality Hold**

```
+-------------+         +-------------+         +-------------+
| Issue       |         | Quality     |         | LPs         |
| Detected    |-------->|   Hold      |-------->| Quarantine  |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 Source:                 Hold Created:           LP Status:
 NCR/Complaint/          hold_lps[]              qa_status =
 Recall                  linked                  quarantine
```

### 2.8 Warehouse -> Shipping

**Integration Flow: Picking**

```
+-------------+         +-------------+         +-------------+
|     SO      |         | Pick List   |         | LP Reserved |
|  Confirmed  |-------->| Generated   |-------->| for Ship    |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 SO Status:              Pick Items:             LP Status:
 confirmed ->            FIFO/FEFO              available ->
 picking                 suggested LP            reserved

+-------------+         +-------------+         +-------------+
| Pick        |         |   Pack      |         |    Ship     |
| Completed   |-------->|  Process    |-------->|   Process   |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 so_line:                Packages                LP Status:
 picked_qty              created with            reserved ->
 updated                 LP links                shipped
```

### 2.9 Traceability Integration

**Forward Trace Flow:**
```
LP Input ----consume----> WO ----produce----> LP Output
    |                      |                      |
    v                      v                      v
lp_genealogy          lp_genealogy          lp_genealogy
parent_lp_id          wo_id                 child_lp_id
```

**Backward Trace Flow:**
```
LP Finished Good <----produced---- WO <----consumed---- LP Raw Material
                                    |
                                    v
                              All ancestor LPs
                              via lp_genealogy
```

**API:**
```typescript
// Forward trace
POST /api/technical/tracing/forward
{ "lp_number": "LP-001" }
// Returns: all downstream LPs created from this LP

// Backward trace
POST /api/technical/tracing/backward
{ "lp_number": "LP-100" }
// Returns: all upstream LPs used to create this LP

// Recall simulation
POST /api/technical/tracing/recall
{ "lp_number": "LP-001", "reason": "Contamination" }
// Returns: all affected LPs in both directions
```

---

## 3. External Integrations

### 3.1 Zebra ZPL Print (Phase 1 - Partial)

**Status:** Stub implemented, full integration pending

**Architecture:**
```
+-------------+         +-------------+         +-------------+
| MonoPilot   |         | Print Queue |         | Zebra       |
| (Label Gen) |-------->| (Redis)     |-------->| Printer     |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 ZPL Template            queue:print:*           IPP/RAW
 Rendered                job metadata            Socket
```

**Label Types:**
| Label | Use Case | Template |
|-------|----------|----------|
| LP Label | License Plate | 4x6" ZPL |
| Product Label | Item identification | 2x4" ZPL |
| Shipping Label | Package | 4x6" ZPL |
| Location Label | Bin identification | 2x2" ZPL |

**Integration API:**
```typescript
// Print LP label
POST /api/warehouse/license-plates/:id/print
{
  "printer_id": "ZEBRA-WH01",
  "copies": 2
}

// Response
{
  "job_id": "uuid",
  "status": "queued",
  "zpl_preview": "^XA^FO50,50..."
}
```

**ZPL Template Example:**
```zpl
^XA
^FO50,50^A0N,30,30^FD{lp_number}^FS
^FO50,100^BY2^BCN,100,Y,N,N^FD{lp_barcode}^FS
^FO50,220^A0N,25,25^FDProduct: {product_name}^FS
^FO50,260^A0N,25,25^FDQty: {quantity} {uom}^FS
^FO50,300^A0N,25,25^FDBatch: {batch_number}^FS
^FO50,340^A0N,25,25^FDExpiry: {expiry_date}^FS
^XZ
```

**Printer Configuration:**
```typescript
// Settings: Printer registry
{
  "printers": [
    {
      "id": "ZEBRA-WH01",
      "name": "Warehouse 1 Label Printer",
      "type": "zebra",
      "model": "ZD420",
      "connection": "network",
      "ip_address": "192.168.1.100",
      "port": 9100,
      "dpi": 203,
      "label_width": 4,
      "label_height": 6
    }
  ]
}
```

### 3.2 GS1 Barcodes (Phase 2)

**Status:** Planned

**Supported Formats:**
| Format | Use Case | Example |
|--------|----------|---------|
| GS1-128 | Shipping labels | (00)123456789012345678 |
| EAN-13 | Product identification | 5901234123457 |
| SSCC | Pallet tracking | (00)106141411234567897 |
| GTIN | Global trade item | (01)09521234543213 |

**Integration Points:**
```typescript
// Generate SSCC for pallet
const sscc = gs1Service.generateSSCC({
  company_prefix: "0614141",
  serial_reference: "1234567"
})
// Returns: "006141411234567897" (with check digit)

// Generate GS1-128 barcode
const barcode = gs1Service.generateGS1128({
  gtin: "09521234543213",
  batch: "BATCH001",
  expiry: "251231",
  serial: "SN12345"
})
// Returns: "(01)09521234543213(10)BATCH001(17)251231(21)SN12345"
```

### 3.3 Email Integration (Active)

**Provider:** SendGrid

**Current Usage:**
- User invitations
- Password reset
- (Future) Notifications

**Configuration:**
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@monopilot.app
```

**Integration Pattern:**
```typescript
// lib/services/email-service.ts
import sgMail from '@sendgrid/mail'

export async function sendInvitationEmail(
  email: string,
  invitationToken: string,
  orgName: string
) {
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    templateId: 'd-invitation-template',
    dynamicTemplateData: {
      invitation_url: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`,
      org_name: orgName
    }
  })
}
```

### 3.4 Accounting Systems (Phase 3)

**Planned Integrations:**

| System | Market | Protocol | Use Cases |
|--------|--------|----------|-----------|
| Comarch ERP XL | Poland | REST API | Invoice sync, PO sync |
| Sage 50 | UK/EU | SOAP/REST | Invoice export |
| SAP Business One | Enterprise | OData | Full ERP integration |

**Integration Architecture:**
```
+-------------+         +-------------+         +-------------+
| MonoPilot   |         | Integration |         | Accounting  |
|   Events    |-------->|   Queue     |-------->|   System    |
+-------------+         +-------------+         +-------------+
      |                       |                       |
      v                       v                       v
 PO Approved            Transform &              Create PO
 Invoice Due            Map Fields               in ERP
```

**Planned Sync Types:**
- **Outbound:** PO -> ERP, SO -> Invoice
- **Inbound:** Product master, Customer master, Price lists

### 3.5 EDI Integration (Phase 3)

**Status:** Planned for enterprise customers

**Supported Standards:**
- EDIFACT (EU)
- X12 (US)
- GS1 EANCOM

**Document Types:**
| EDI Type | Purpose |
|----------|---------|
| ORDERS (850/D96A) | Purchase Order |
| ORDRSP (855) | Order Response |
| DESADV (856) | Dispatch Advice (ASN) |
| INVOIC (810) | Invoice |
| RECADV | Receiving Advice |

**Integration Flow:**
```
Partner ----EDI----> EDI Gateway ----Transform----> MonoPilot API
                                                         |
                                                         v
                                                    Create PO/SO
                                                    automatically
```

### 3.6 Carrier Integration (Phase 3)

**Planned Carriers:**

| Carrier | Region | Features |
|---------|--------|----------|
| DHL | Global | Labels, Tracking, Rates |
| FedEx | Global | Labels, Tracking, Rates |
| UPS | Global | Labels, Tracking, Rates |
| DPD | EU | Labels, Tracking |
| InPost | Poland | Parcel lockers |

**Integration Features:**
- Rate shopping (compare prices)
- Label generation (native format)
- Tracking webhooks
- Pickup scheduling

**Planned API:**
```typescript
// Get shipping rates
POST /api/shipping/carriers/rates
{
  "from_address": {...},
  "to_address": {...},
  "packages": [
    { "weight_kg": 5, "dimensions": "30x20x15" }
  ]
}

// Generate label
POST /api/shipping/carriers/labels
{
  "carrier": "dhl",
  "service": "express",
  "shipment_id": "uuid"
}

// Response includes:
// - label_url (PDF)
// - tracking_number
// - carrier_reference
```

---

## 4. Webhook Architecture (Phase 2)

### 4.1 Outgoing Webhooks

**Planned Events:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `lp.created` | New LP created | LP data |
| `lp.status_changed` | LP status update | Old/new status |
| `wo.completed` | WO finished | WO summary |
| `so.shipped` | Shipment dispatched | Tracking info |
| `qa.hold_created` | Quality hold | Hold details |

**Webhook Configuration:**
```typescript
// Settings: Webhook endpoints
{
  "webhooks": [
    {
      "id": "uuid",
      "url": "https://erp.customer.com/webhook",
      "events": ["lp.created", "wo.completed"],
      "secret": "webhook-secret-key",
      "active": true
    }
  ]
}
```

**Webhook Payload:**
```json
{
  "event": "lp.created",
  "timestamp": "2025-12-09T10:00:00Z",
  "data": {
    "lp_number": "LP-2025-0001",
    "product_code": "FG-001",
    "quantity": 100,
    "warehouse_code": "WH01"
  },
  "signature": "sha256=xxx"
}
```

### 4.2 Incoming Webhooks

**Planned Sources:**

| Source | Events | Action |
|--------|--------|--------|
| Supabase Auth | User events | Sync public.users |
| Carrier APIs | Tracking updates | Update shipment status |
| Payment gateways | Payment status | Update invoice |

---

## 5. Integration Security

### 5.1 Authentication Methods

| Integration | Auth Method | Storage |
|-------------|-------------|---------|
| Supabase | Service Role Key | Env var |
| SendGrid | API Key | Env var |
| Upstash | REST Token | Env var |
| Zebra | Network (no auth) | N/A |
| EDI (future) | Certificates | Vault |
| Carriers (future) | OAuth 2.0 | Database |

### 5.2 Secret Management

```env
# Current secrets (env vars)
SUPABASE_SERVICE_ROLE_KEY=xxx
SENDGRID_API_KEY=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# Future: Use secret manager for rotating keys
# - Vercel secrets for static keys
# - Database for OAuth tokens (encrypted)
```

### 5.3 Webhook Verification

```typescript
// Verify incoming webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  )
}
```

---

## 6. Integration Roadmap

### Phase 1 (MVP) - Current
- [x] Supabase Auth integration
- [x] Supabase Database integration
- [x] Upstash Redis integration
- [x] SendGrid email integration
- [~] Zebra ZPL print (stub only)

### Phase 2 (Q1 2025)
- [ ] Full Zebra print integration
- [ ] GS1 barcode generation
- [ ] Outgoing webhooks
- [ ] Quality module integrations

### Phase 3 (Q2-Q3 2025)
- [ ] Accounting system integrations (Comarch)
- [ ] EDI support (EDIFACT)
- [ ] Carrier API integrations
- [ ] Advanced traceability (blockchain optional)

---

## 7. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | Architect | Initial integration documentation |
