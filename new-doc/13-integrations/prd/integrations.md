# Integrations Module - PRD

**Version:** 1.0
**Status:** Planned
**Priority:** P1 - Strategic Module
**Last Updated:** 2025-12-10
**Owner:** PM-AGENT

---

## Executive Summary

The Integrations Module serves as MonoPilot's connectivity layer, enabling seamless data exchange with external systems, third-party platforms, and partner portals. It provides standardized APIs, EDI capabilities, ERP synchronization (Comarch Optima), supplier/customer portals, and robust error handling with audit trails.

**Target Users:** System Administrators, Integration Specialists, IT Managers, External Partners
**Target Companies:** Food manufacturers requiring multi-system connectivity (ERP, accounting, EDI, portals)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [UI Structure](#3-ui-structure)
4. [Functional Requirements](#4-functional-requirements)
5. [Database Schema](#5-database-schema)
6. [API Endpoints](#6-api-endpoints)
7. [Integration Patterns](#7-integration-patterns)
8. [Phase Roadmap](#8-phase-roadmap)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Assumptions & Decisions](#10-assumptions--decisions)

---

## 1. Overview

### 1.1 Module Purpose

The Integrations Module handles "how we connect to external systems" - managing:

- **Comarch Optima Integration** - Polish accounting system (invoices, chart of accounts, VAT reports)
- **EDI (Electronic Data Interchange)** - EDIFACT/XML for orders, invoices, ASN (Advanced Shipping Notice)
- **Supplier Portal** - Read-only PO view with delivery confirmation
- **Customer Portal** - Order status tracking, shipment visibility
- **Webhook Events** - Outbound real-time notifications
- **API Keys Management** - Secure authentication for external systems
- **Data Export/Import** - Bulk CSV/JSON/XML operations
- **Integration Logs** - Full audit trail with error tracking and retry logic

### 1.2 Business Value

| Value Driver | Benefit | Metric |
|--------------|---------|--------|
| Reduced manual entry | Auto-sync eliminates 80% of duplicate data entry | Target: <5 manual invoice entries/month |
| Faster onboarding | Partner portals reduce email/phone communication | Target: 50% reduction in supplier queries |
| Compliance | EDI meets retail/distributor requirements | Target: 100% EDI compliance for major retailers |
| Real-time sync | Webhook events enable instant notifications | Target: <1 second notification delay |
| Error reduction | Validation + retry logic prevents data loss | Target: 99.9% successful sync rate |
| Audit trail | Complete integration logs for troubleshooting | Target: <5 min to identify integration errors |

### 1.3 Scope

**In Scope (Phase 1 - MVP):**
- API Keys Management (CRUD, scopes, rate limiting)
- Integration Logs (audit trail, error tracking)
- Webhook Events (outbound notifications)
- Data Export (CSV, JSON, XML for products, orders, inventory)
- Supplier Portal (read-only PO view, delivery confirmation)
- Basic Comarch Optima Integration (invoice push)

**In Scope (Phase 2):**
- Customer Portal (order tracking, shipment status)
- EDI Basic (EDIFACT ORDERS, INVOIC, DESADV)
- Import Templates (bulk product/BOM import)
- Comarch Optima Advanced (chart of accounts sync, VAT reports)
- Retry Logic UI (manual retry, dead letter queue)

**In Scope (Phase 3):**
- EDI Advanced (ORDRSP, RECADV, additional message types)
- Comarch Optima Full (payment reconciliation, cost center mapping)
- Partner API Marketplace (public API directory)
- Real-time Webhooks (bi-directional)
- Custom Integration Builder (low-code connectors)

**Out of Scope:**
- Direct ERP replacement (MonoPilot focuses on MES)
- Payment processing (use accounting system)
- CRM functionality (use dedicated CRM)
- Email marketing (use dedicated platform)

---

## 2. Dependencies

### 2.1 Upstream Dependencies

| Module | Required Data | Usage |
|--------|---------------|-------|
| Settings | Organization, users, permissions | Portal access control |
| Technical | Products, BOMs | Export/import operations |
| Planning | Purchase orders, work orders | Supplier portal, EDI ORDERS |
| Warehouse | Inventory levels, shipments | EDI DESADV, customer portal |
| Shipping | Delivery notes, tracking numbers | Customer portal tracking |
| Finance | Invoices (future) | Comarch Optima sync, EDI INVOIC |

### 2.2 Downstream Dependencies

**External Systems:**
- Comarch Optima (Polish accounting software)
- EDI VAN providers (e.g., Seeburger, TrueCommerce)
- Customer/Supplier portals (external users)
- Webhook consumers (external services)

---

## 3. UI Structure

### 3.1 Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/integrations/dashboard` | Overview, health status, recent logs | Admin |
| `/integrations/api-keys` | API key management | Admin |
| `/integrations/webhooks` | Webhook configuration | Admin |
| `/integrations/logs` | Integration audit trail | Admin |
| `/integrations/comarch` | Comarch Optima settings | Admin |
| `/integrations/edi` | EDI configuration | Admin |
| `/integrations/export` | Data export UI | Admin, User |
| `/integrations/import` | Data import templates | Admin |
| `/portal/supplier` | Supplier portal (external) | Supplier |
| `/portal/customer` | Customer portal (external) | Customer |

### 3.2 Navigation

```
Integrations
├── Dashboard
├── Connections
│   ├── Comarch Optima
│   ├── EDI Setup
│   ├── API Keys
│   └── Webhooks
├── Portals
│   ├── Supplier Portal
│   └── Customer Portal
├── Data Operations
│   ├── Export
│   └── Import
└── Logs & Monitoring
    ├── Integration Logs
    └── Error Queue
```

---

## 4. Functional Requirements

### 4.1 FR Summary Table

| ID | Feature | Priority | Phase |
|----|---------|----------|-------|
| FR-INT-001 | Integrations Dashboard | P0 | MVP |
| FR-INT-002 | API Keys CRUD | P0 | MVP |
| FR-INT-003 | API Key Scopes | P0 | MVP |
| FR-INT-004 | Rate Limiting | P0 | MVP |
| FR-INT-005 | Integration Logs | P0 | MVP |
| FR-INT-006 | Webhook Configuration | P0 | MVP |
| FR-INT-007 | Webhook Events (Outbound) | P0 | MVP |
| FR-INT-008 | Data Export (CSV/JSON) | P0 | MVP |
| FR-INT-009 | Supplier Portal - PO View | P0 | MVP |
| FR-INT-010 | Supplier Portal - Delivery Confirm | P0 | MVP |
| FR-INT-011 | Comarch Optima - Invoice Push | P0 | MVP |
| FR-INT-012 | Comarch Optima Auth Setup | P0 | MVP |
| FR-INT-013 | Customer Portal - Order Tracking | P1 | Phase 2 |
| FR-INT-014 | Customer Portal - Shipment Status | P1 | Phase 2 |
| FR-INT-015 | EDI ORDERS (Inbound) | P1 | Phase 2 |
| FR-INT-016 | EDI INVOIC (Outbound) | P1 | Phase 2 |
| FR-INT-017 | EDI DESADV (Outbound ASN) | P1 | Phase 2 |
| FR-INT-018 | Import Templates - Products | P1 | Phase 2 |
| FR-INT-019 | Import Templates - BOMs | P1 | Phase 2 |
| FR-INT-020 | Retry Logic UI | P1 | Phase 2 |
| FR-INT-021 | Dead Letter Queue | P1 | Phase 2 |
| FR-INT-022 | Comarch Optima - Chart of Accounts Sync | P1 | Phase 2 |
| FR-INT-023 | Comarch Optima - VAT Reports | P1 | Phase 2 |
| FR-INT-024 | Data Export - XML | P1 | Phase 2 |
| FR-INT-025 | EDI ORDRSP (Order Response) | P2 | Phase 3 |
| FR-INT-026 | EDI RECADV (Receiving Advice) | P2 | Phase 3 |
| FR-INT-027 | Comarch Optima - Payment Reconciliation | P2 | Phase 3 |
| FR-INT-028 | Custom Integration Builder | P2 | Phase 3 |
| FR-INT-029 | Partner API Marketplace | P2 | Phase 3 |
| FR-INT-030 | Bi-directional Webhooks | P2 | Phase 3 |

### 4.2 FR Details

#### FR-INT-001: Integrations Dashboard

**Description:** Central overview of integration health, activity, and errors

**Components:**
- **Health Status Cards:**
  - Comarch Optima (Connected/Disconnected/Error)
  - EDI (Active/Inactive)
  - Active API Keys (count)
  - Active Webhooks (count)
  - Last 24h Sync Status (success rate %)

- **Recent Activity Feed:**
  - Last 20 integration events
  - Timestamp, type (API call, webhook, EDI, sync), status, message

- **Error Summary:**
  - Failed syncs (last 24h)
  - Pending retries
  - Dead letter queue count

**UI:** Dashboard layout with status cards, activity timeline, error alerts

---

#### FR-INT-002: API Keys CRUD

**Description:** Manage API keys for external system authentication

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Key name (e.g., "Mobile App Production") |
| key_value | string | Auto | Auto-generated secure token |
| scopes | array | Yes | Permissions (read:products, write:orders, etc.) |
| status | enum | Yes | active / suspended / revoked |
| expires_at | timestamp | No | Optional expiration date |
| created_by | uuid | Auto | User who created key |
| last_used_at | timestamp | Auto | Track usage |

**Actions:**
- Create new key (show once, then hash)
- View list (masked keys)
- Edit (name, scopes, expiration only)
- Suspend/Reactivate
- Revoke (permanent, cannot reactivate)
- Regenerate (creates new key, revokes old)

**UI:** API Keys table with create modal, scope selector (checkboxes)

---

#### FR-INT-003: API Key Scopes

**Description:** Granular permission control for API keys

**Scope Categories:**
| Scope | Actions | Description |
|-------|---------|-------------|
| `read:products` | GET /api/technical/products | View products, BOMs |
| `write:products` | POST/PUT/DELETE /api/technical/products | Modify products |
| `read:orders` | GET /api/planning/purchase-orders, work-orders | View orders |
| `write:orders` | POST/PUT /api/planning/orders | Create/update orders |
| `read:inventory` | GET /api/warehouse/inventory | View stock levels |
| `write:inventory` | POST /api/warehouse/moves | Adjust inventory |
| `read:production` | GET /api/production/work-orders | View production data |
| `write:production` | POST /api/production/consumption | Record production |
| `read:shipping` | GET /api/shipping/shipments | View shipments |
| `webhook:manage` | POST/DELETE /api/integrations/webhooks | Manage webhooks |

**Validation:**
- At least one scope required
- Write scopes automatically include read
- Admin-only scopes (e.g., `user:manage`) restricted

**UI:** Scope selector with grouped checkboxes

---

#### FR-INT-004: Rate Limiting

**Description:** Prevent API abuse with configurable rate limits

**Limits:**
| Tier | Requests/Minute | Requests/Hour | Burst |
|------|-----------------|---------------|-------|
| Basic | 60 | 1000 | 10 |
| Standard | 300 | 10000 | 50 |
| Premium | 1000 | 50000 | 200 |

**Response Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

**Exceeded Response:**
- HTTP 429 Too Many Requests
- `Retry-After` header in seconds
- Log event to integration_logs

**Settings:**
- Default tier per organization
- Override tier per API key
- Whitelist IPs (bypass rate limit)

**UI:** Rate limit settings in API key edit modal

---

#### FR-INT-005: Integration Logs

**Description:** Comprehensive audit trail of all integration events

**Log Entry Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Log entry ID |
| org_id | uuid | Organization |
| timestamp | timestamp | Event time (with timezone) |
| integration_type | enum | api / webhook / edi / comarch / import / export |
| event_type | string | Specific action (e.g., "invoice.created") |
| direction | enum | inbound / outbound |
| status | enum | success / warning / error |
| http_status | integer | HTTP status code (if applicable) |
| request_body | jsonb | Request payload (masked sensitive data) |
| response_body | jsonb | Response payload |
| error_message | text | Error details |
| api_key_id | uuid | Which API key used (if applicable) |
| external_system | string | System name (e.g., "Comarch Optima") |
| retry_count | integer | Number of retry attempts |
| duration_ms | integer | Processing time |

**Filters:**
- Date range (default: last 7 days)
- Status (success/warning/error)
- Integration type
- External system
- Event type

**Search:**
- Full-text search in request/response bodies
- Search by external ID (e.g., PO number)

**Retention:**
- Keep logs for 90 days (configurable)
- Archive to cold storage after 30 days

**UI:** Logs table with expandable rows (show request/response JSON), filters sidebar

---

#### FR-INT-006: Webhook Configuration

**Description:** Manage outbound webhook endpoints

**Webhook Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Webhook name |
| url | string | Yes | Target endpoint (must be HTTPS) |
| events | array | Yes | Subscribed events (e.g., ["order.created"]) |
| status | enum | Yes | active / paused |
| secret | string | Auto | HMAC signature secret |
| retry_policy | enum | Yes | immediate / exponential / manual |
| max_retries | integer | Yes | Default: 3 |
| headers | jsonb | No | Custom headers |
| created_at | timestamp | Auto | |
| last_triggered_at | timestamp | Auto | |

**Available Events:**
| Event | Trigger | Payload |
|-------|---------|---------|
| `order.created` | New purchase order created | PO details |
| `order.updated` | PO status changed | PO details + changes |
| `workorder.started` | Work order started | WO details |
| `workorder.completed` | Work order completed | WO details + output |
| `shipment.dispatched` | Shipment sent | Shipment details + tracking |
| `inventory.low` | Stock below reorder point | Product + qty |
| `product.created` | New product added | Product details |

**Actions:**
- Create webhook
- Test webhook (send sample payload)
- Pause/Resume
- Delete
- View delivery logs (last 100 events)

**UI:** Webhooks table, create/edit modal with event selector

---

#### FR-INT-007: Webhook Events (Outbound)

**Description:** Send real-time HTTP POST notifications to external systems

**Delivery Flow:**
```
1. Event triggered (e.g., WO completed)
2. Find all active webhooks subscribed to event
3. Build payload (JSON)
4. Sign with HMAC-SHA256 (using webhook secret)
5. POST to webhook URL
6. Log response
7. If failed: retry based on policy
```

**Request Format:**
```json
{
  "event": "workorder.completed",
  "timestamp": "2025-12-10T14:30:00Z",
  "org_id": "uuid",
  "data": {
    "wo_number": "WO-2025-001",
    "product_name": "Bread Loaf White 500g",
    "qty_completed": 1000,
    "completed_at": "2025-12-10T14:30:00Z"
  }
}
```

**Request Headers:**
```
Content-Type: application/json
X-MonoPilot-Signature: sha256=<hmac>
X-MonoPilot-Event: workorder.completed
X-MonoPilot-Delivery-ID: uuid
```

**Retry Policy:**
- **Immediate:** Retry 3 times with 5s delay
- **Exponential:** Retry 5 times (5s, 30s, 5m, 30m, 2h)
- **Manual:** No auto-retry, admin must manually retry

**Success Criteria:**
- HTTP 2xx response
- Response within 30s timeout

**Error Handling:**
- Log failed delivery
- Increment retry count
- Move to dead letter queue after max retries

---

#### FR-INT-008: Data Export (CSV/JSON)

**Description:** Bulk export of MonoPilot data to files

**Exportable Entities:**
| Entity | Scope | Format |
|--------|-------|--------|
| Products | All products + BOMs | CSV, JSON |
| Purchase Orders | Filtered by date range | CSV, JSON |
| Work Orders | Filtered by date range | CSV, JSON |
| Inventory | Current stock levels | CSV, JSON |
| Shipments | Filtered by date range | CSV, JSON |
| Suppliers | All suppliers | CSV, JSON |

**Export Options:**
- **Format:** CSV or JSON
- **Date Range:** Last 30/90/365 days or custom
- **Filters:** Status, product, location, etc.
- **Include Archives:** Yes/No (default: No)

**CSV Format:**
- UTF-8 encoding with BOM (Excel compatibility)
- Headers in first row
- Date format: YYYY-MM-DD
- Decimal separator: . (period)
- Nested data flattened (e.g., product.name)

**JSON Format:**
- Pretty-printed
- ISO 8601 timestamps
- Nested objects preserved

**Download:**
- Generate file asynchronously for large exports (>10k rows)
- Show progress indicator
- Email download link when ready
- Files expire after 24h

**UI:** Export modal with entity selector, format, filters

---

#### FR-INT-009: Supplier Portal - PO View

**Description:** External supplier portal to view assigned purchase orders

**Access:**
- Public route: `/portal/supplier`
- Login: Email + password (separate from MonoPilot users)
- Each supplier has unique credentials

**Supplier User Fields:**
| Field | Type | Description |
|-------|------|-------------|
| email | string | Login email |
| supplier_id | uuid | Linked supplier |
| name | string | Contact name |
| status | enum | active / suspended |
| last_login_at | timestamp | Track activity |

**PO List View:**
- Show only POs assigned to logged-in supplier
- Columns: PO Number, Date, Due Date, Total Lines, Status
- Filters: Status, Due Date
- Sort: Due Date ASC (default)

**PO Detail View:**
- PO header (number, date, delivery address, due date)
- Line items table: Product, Description, Qty Ordered, Unit, Unit Price, Total
- Total amount
- Delivery instructions (notes)
- Attached files (if any)
- Delivery confirmation button (if status = 'Sent')

**Restrictions:**
- Read-only (no editing)
- No access to MonoPilot internal data
- Can only see own POs

**UI:** Simple, clean portal with logo, supplier name in header

---

#### FR-INT-010: Supplier Portal - Delivery Confirmation

**Description:** Suppliers confirm delivery with actual quantities

**Workflow:**
1. Supplier opens PO in portal
2. Click "Confirm Delivery"
3. Enter actual delivered quantities per line
4. Add delivery note number (optional)
5. Upload delivery note PDF (optional)
6. Submit confirmation

**Confirmation Creates:**
- Warehouse receipt (pending approval)
- Email notification to purchaser
- PO status updated to 'Partially Received' or 'Received'

**Validation:**
- Delivered qty cannot exceed ordered qty (warning if > 110%)
- At least one line must have qty > 0

**UI:** Confirmation modal with editable qty fields, file upload

---

#### FR-INT-011: Comarch Optima - Invoice Push

**Description:** Sync invoices from MonoPilot to Comarch Optima

**Scope:**
- Outbound sales invoices (when shipping module implemented)
- Initially: manual push button per invoice
- Phase 2: automatic push on invoice creation

**Mapping:**
| MonoPilot Field | Comarch Optima Field |
|-----------------|----------------------|
| invoice_number | NumerDokumentu |
| issue_date | DataWystawienia |
| customer.name | Kontrahent.Nazwa |
| customer.tax_id | Kontrahent.NIP |
| line_items[].product_code | Pozycja.KodTowaru |
| line_items[].qty | Pozycja.Ilosc |
| line_items[].unit_price | Pozycja.CenaJedn |
| line_items[].vat_rate | Pozycja.StawkaVAT |
| total_net | WartoscNetto |
| total_gross | WartoscBrutto |

**API Integration:**
- Use Comarch Optima API v2
- Authentication: API Key + Secret
- Endpoint: `POST /api/faktury`
- Format: JSON

**Error Handling:**
- If push fails: log error, show alert
- Allow manual retry
- Mark invoice as "sync_pending"

**UI:** "Push to Optima" button on invoice detail page, sync status indicator

---

#### FR-INT-012: Comarch Optima Auth Setup

**Description:** Configure Comarch Optima API connection

**Settings:**
| Field | Type | Description |
|-------|------|-------------|
| enabled | boolean | Enable/disable integration |
| api_url | string | Base URL (e.g., https://api.comarch.pl) |
| api_key | string | API key from Comarch |
| api_secret | string | API secret (encrypted) |
| company_code | string | Company identifier in Optima |
| test_mode | boolean | Use sandbox environment |
| auto_sync | boolean | Auto-push invoices (Phase 2) |

**Test Connection:**
- Button: "Test Connection"
- Makes test API call (GET /api/ping)
- Shows success/error message
- Validates credentials

**UI:** Settings form at `/integrations/comarch`

---

#### FR-INT-013: Customer Portal - Order Tracking

**Description:** External customer portal to track order status

**Access:**
- Public route: `/portal/customer`
- Login: Email + password OR magic link
- Each customer has unique credentials

**Order List:**
- Show orders for logged-in customer
- Columns: Order Number, Date, Products, Qty, Status, Est. Delivery
- Filters: Status, Date Range
- Sort: Date DESC

**Order Detail:**
- Order header (number, date, customer PO reference)
- Line items: Product, Description, Qty Ordered, Qty Shipped, Status
- Production status (if work orders linked)
- Shipment tracking (if dispatched)

**Restrictions:**
- Read-only
- Can only see own orders

**UI:** Customer-branded portal (configurable logo/colors)

---

#### FR-INT-014: Customer Portal - Shipment Status

**Description:** Real-time shipment tracking in customer portal

**Data Shown:**
| Field | Description |
|-------|-------------|
| Shipment Number | MonoPilot shipment ID |
| Carrier | DHL, UPS, etc. |
| Tracking Number | Carrier tracking number (clickable link) |
| Dispatch Date | When shipped |
| Est. Delivery Date | Expected delivery |
| Current Status | In Transit / Out for Delivery / Delivered |
| Delivery Address | Where shipped to |

**Status Updates:**
- Auto-refresh every 5 minutes (if in transit)
- Show delivery proof (signature, photo) if available

**UI:** Shipment timeline with status milestones

---

#### FR-INT-015: EDI ORDERS (Inbound)

**Description:** Receive customer orders via EDI (EDIFACT ORDERS message)

**Flow:**
```
1. Customer sends ORDERS message to MonoPilot EDI mailbox
2. MonoPilot processes message (parse, validate)
3. Create sales order (or work order) in MonoPilot
4. Send acknowledgment (ORDRSP if Phase 3)
```

**Mapping:**
| EDIFACT Field | MonoPilot Field |
|---------------|-----------------|
| BGM.C002.1001 | order_number |
| DTM.2005 | order_date |
| NAD+BY | customer_id |
| LIN.1082 | line_item.sequence |
| IMD.C273.7008 | product_code |
| QTY.6060 | qty_ordered |
| DTM.2005 (delivery) | requested_delivery_date |

**Validation:**
- Customer exists in MonoPilot
- Product exists (by code)
- Qty > 0
- Valid delivery date

**Error Handling:**
- If validation fails: send error notification to customer
- Log to integration_logs
- Create "pending review" order (manual fix required)

**UI:** EDI inbox at `/integrations/edi/inbox`, shows pending messages

---

#### FR-INT-016: EDI INVOIC (Outbound)

**Description:** Send invoices to customers via EDI (EDIFACT INVOIC message)

**Flow:**
```
1. Invoice created/finalized in MonoPilot
2. Generate EDIFACT INVOIC message
3. Send to customer's EDI mailbox
4. Log transmission
```

**Mapping:**
| MonoPilot Field | EDIFACT Field |
|-----------------|---------------|
| invoice_number | BGM.C002.1004 |
| issue_date | DTM.2005 |
| customer.edi_id | NAD+BY.C082.3039 |
| line_items[].product_code | LIN.C212.7140 |
| line_items[].qty | QTY.6060 |
| line_items[].unit_price | PRI.C509.5118 |
| line_items[].vat_rate | TAX.C243.5278 |
| total_net | MOA.5004 |
| total_gross | MOA.5004 |

**Validation:**
- Customer has EDI enabled
- All required fields present
- VAT rates valid

**UI:** "Send via EDI" button on invoice page

---

#### FR-INT-017: EDI DESADV (Outbound ASN)

**Description:** Send Advanced Shipping Notice via EDI (EDIFACT DESADV message)

**Flow:**
```
1. Shipment dispatched in MonoPilot
2. Generate DESADV message
3. Send to customer's EDI mailbox
4. Log transmission
```

**Mapping:**
| MonoPilot Field | EDIFACT Field |
|-----------------|---------------|
| shipment_number | BGM.C002.1004 |
| dispatch_date | DTM.2005 |
| carrier | TDT.C220.8067 |
| tracking_number | RFF.C506.1154 |
| delivery_address | NAD+DP |
| line_items[].product_code | LIN.C212.7140 |
| line_items[].qty_shipped | QTY.6060 |
| line_items[].batch_number | RFF.C506.1154 |
| line_items[].expiry_date | DTM.2005 |

**Use Case:**
- Required by large retailers (e.g., Carrefour, Tesco)
- Enables automated receiving at customer warehouse

**UI:** "Send ASN" button on shipment detail page

---

#### FR-INT-018: Import Templates - Products

**Description:** Bulk import products via CSV/Excel template

**Template Columns:**
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| product_code | string | Yes | Unique product code |
| name | string | Yes | Product name |
| type | enum | Yes | raw_material / semi_finished / finished_good |
| unit | string | Yes | pcs / kg / L / m |
| description | text | No | Description |
| allergens | string | No | Comma-separated allergen codes |
| shelf_life_days | integer | No | Shelf life |
| storage_temp | string | No | e.g., "2-8°C" |
| tax_code | string | No | Tax/VAT code |

**Import Process:**
1. Download template (pre-filled headers)
2. Fill in product data
3. Upload file
4. System validates (show errors if any)
5. Preview import (show first 10 rows)
6. Confirm import
7. System creates products (with conflict handling)

**Validation:**
- Product code unique
- Type is valid enum
- Unit exists in system
- Allergens valid (if provided)

**Conflict Handling:**
- If product_code exists: Skip / Update / Ask per row

**UI:** Import wizard at `/integrations/import/products`

---

#### FR-INT-019: Import Templates - BOMs

**Description:** Bulk import BOMs via CSV/Excel template

**Template Columns:**
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| product_code | string | Yes | Final product code |
| version | integer | Yes | BOM version |
| item_product_code | string | Yes | Component product code |
| item_qty | decimal | Yes | Component quantity |
| item_unit | string | Yes | Component unit |
| operation_sequence | integer | No | Operation number |
| is_byproduct | boolean | No | true/false |

**Import Process:**
1. Download template
2. Fill BOM data (multiple rows per BOM)
3. Upload file
4. Validate (products exist, qty > 0)
5. Preview
6. Confirm import
7. System creates BOMs (with versioning)

**Validation:**
- Product and component exist
- Qty > 0
- Unit matches product unit
- Version number valid

**UI:** Import wizard at `/integrations/import/boms`

---

#### FR-INT-020: Retry Logic UI

**Description:** Manual retry interface for failed integration events

**Retry Queue:**
- Shows all failed events with retry_count < max_retries
- Columns: Timestamp, Type, External System, Error, Retry Count, Next Retry At
- Actions: Retry Now, Skip, View Logs

**Manual Retry:**
- Click "Retry Now" on failed event
- System re-attempts integration
- If succeeds: remove from queue
- If fails again: increment retry_count

**Bulk Actions:**
- Select multiple events
- "Retry All Selected"
- "Skip All Selected" (move to dead letter queue)

**UI:** Retry queue table at `/integrations/logs/retry-queue`

---

#### FR-INT-021: Dead Letter Queue

**Description:** Final destination for permanently failed integration events

**DLQ Criteria:**
- Retry count >= max_retries
- Manual skip from retry queue
- Unrecoverable errors (e.g., invalid credentials)

**DLQ Table:**
- Columns: Timestamp, Type, External System, Error, Retry Count, Actions
- Actions: View Logs, Delete, Manual Fix & Retry

**Manual Fix & Retry:**
- Admin reviews error
- Corrects underlying issue (e.g., fix API credentials)
- Clicks "Retry" to re-attempt
- If succeeds: remove from DLQ
- If fails: add note and leave in DLQ

**Retention:**
- Keep DLQ entries for 30 days
- Auto-delete after retention period

**UI:** DLQ table at `/integrations/logs/dead-letter-queue`

---

#### FR-INT-022: Comarch Optima - Chart of Accounts Sync

**Description:** Sync chart of accounts from Comarch Optima to MonoPilot

**Scope:**
- Pull GL accounts from Optima
- Map to MonoPilot cost centers / expense categories
- Bi-directional sync (changes in either system)

**Mapping:**
| Optima Field | MonoPilot Field |
|--------------|-----------------|
| KontoPlan.Numer | gl_account_code |
| KontoPlan.Nazwa | gl_account_name |
| KontoPlan.Typ | account_type (asset/liability/expense/revenue) |

**Sync Frequency:**
- Manual sync button
- Scheduled sync (daily at 2 AM)

**UI:** Sync button at `/integrations/comarch`, shows last sync time

---

#### FR-INT-023: Comarch Optima - VAT Reports

**Description:** Generate VAT reports compatible with Comarch Optima format

**Report Types:**
- JPK_VAT (Polish VAT standard file)
- VAT-7 (monthly VAT return)
- VAT-UE (EU VAT summary)

**Export Format:**
- XML (JPK schema v7)
- Include all transactions from MonoPilot
- Sign with company certificate (if required)

**Workflow:**
1. Select report type + date range
2. Generate report
3. Validate XML schema
4. Download file
5. Upload to Comarch Optima or tax office portal

**UI:** VAT reports page at `/integrations/comarch/vat-reports`

---

#### FR-INT-024: Data Export - XML

**Description:** Export data in XML format (in addition to CSV/JSON)

**XML Schema:**
- Custom MonoPilot schema (documented)
- Include XSD for validation
- Nested structures preserved

**Use Cases:**
- Custom ERP integrations
- Data migration
- Compliance reporting

**UI:** XML option in export format dropdown

---

## 5. Database Schema

### 5.1 Core Tables

#### integration_api_keys
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
name              varchar(255) NOT NULL
key_value_hash    varchar(255) NOT NULL -- bcrypt hash
scopes            jsonb NOT NULL -- ["read:products", "write:orders"]
status            varchar(20) NOT NULL -- active, suspended, revoked
rate_limit_tier   varchar(20) DEFAULT 'basic'
expires_at        timestamp
last_used_at      timestamp
created_by        uuid REFERENCES users(id)
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### integration_webhooks
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
name              varchar(255) NOT NULL
url               varchar(500) NOT NULL
events            jsonb NOT NULL -- ["order.created", "shipment.dispatched"]
status            varchar(20) NOT NULL -- active, paused
secret            varchar(255) NOT NULL
retry_policy      varchar(20) DEFAULT 'exponential'
max_retries       integer DEFAULT 3
custom_headers    jsonb
last_triggered_at timestamp
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### integration_logs
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
timestamp         timestamp DEFAULT now()
integration_type  varchar(50) NOT NULL -- api, webhook, edi, comarch
event_type        varchar(100) NOT NULL
direction         varchar(10) NOT NULL -- inbound, outbound
status            varchar(20) NOT NULL -- success, warning, error
http_status       integer
request_body      jsonb
response_body     jsonb
error_message     text
api_key_id        uuid REFERENCES integration_api_keys(id)
webhook_id        uuid REFERENCES integration_webhooks(id)
external_system   varchar(100)
retry_count       integer DEFAULT 0
duration_ms       integer
```

#### integration_retry_queue
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
log_id            uuid REFERENCES integration_logs(id)
retry_count       integer DEFAULT 0
max_retries       integer DEFAULT 3
next_retry_at     timestamp
status            varchar(20) DEFAULT 'pending' -- pending, in_progress, succeeded, failed
error_message     text
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### supplier_portal_users
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
supplier_id       uuid NOT NULL REFERENCES suppliers(id)
email             varchar(255) NOT NULL UNIQUE
password_hash     varchar(255) NOT NULL
name              varchar(255) NOT NULL
status            varchar(20) DEFAULT 'active'
last_login_at     timestamp
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### customer_portal_users
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
customer_id       uuid NOT NULL REFERENCES customers(id)
email             varchar(255) NOT NULL UNIQUE
password_hash     varchar(255) NOT NULL
name              varchar(255) NOT NULL
status            varchar(20) DEFAULT 'active'
last_login_at     timestamp
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### comarch_optima_config
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
enabled           boolean DEFAULT false
api_url           varchar(500) NOT NULL
api_key           varchar(255) NOT NULL
api_secret_encrypted varchar(500) NOT NULL
company_code      varchar(50)
test_mode         boolean DEFAULT true
auto_sync         boolean DEFAULT false
last_sync_at      timestamp
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### edi_config
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
enabled           boolean DEFAULT false
edi_mailbox       varchar(255) -- EDI address (e.g., "MONOPILOT@EANCOM")
van_provider      varchar(100) -- e.g., "Seeburger", "TrueCommerce"
message_types     jsonb -- ["ORDERS", "INVOIC", "DESADV"]
test_mode         boolean DEFAULT true
created_at        timestamp DEFAULT now()
updated_at        timestamp DEFAULT now()
```

#### edi_messages
```sql
id                uuid PRIMARY KEY
org_id            uuid NOT NULL REFERENCES organizations(id)
direction         varchar(10) NOT NULL -- inbound, outbound
message_type      varchar(20) NOT NULL -- ORDERS, INVOIC, DESADV
message_content   text NOT NULL -- Raw EDI message
status            varchar(20) NOT NULL -- pending, processed, error
partner_id        varchar(100) -- Trading partner ID
reference_id      varchar(100) -- PO/Invoice number
error_message     text
processed_at      timestamp
created_at        timestamp DEFAULT now()
```

---

## 6. API Endpoints

### 6.1 API Keys
```
GET    /api/integrations/api-keys              List all API keys
POST   /api/integrations/api-keys              Create new API key
GET    /api/integrations/api-keys/:id          Get API key details
PUT    /api/integrations/api-keys/:id          Update API key
DELETE /api/integrations/api-keys/:id          Revoke API key
POST   /api/integrations/api-keys/:id/regenerate  Regenerate key
POST   /api/integrations/api-keys/:id/suspend  Suspend key
POST   /api/integrations/api-keys/:id/activate Reactivate key
```

### 6.2 Webhooks
```
GET    /api/integrations/webhooks              List webhooks
POST   /api/integrations/webhooks              Create webhook
GET    /api/integrations/webhooks/:id          Get webhook details
PUT    /api/integrations/webhooks/:id          Update webhook
DELETE /api/integrations/webhooks/:id          Delete webhook
POST   /api/integrations/webhooks/:id/test     Test webhook (send sample)
POST   /api/integrations/webhooks/:id/pause    Pause webhook
POST   /api/integrations/webhooks/:id/resume   Resume webhook
GET    /api/integrations/webhooks/:id/logs     Get delivery logs
```

### 6.3 Integration Logs
```
GET    /api/integrations/logs                  List integration logs (paginated, filtered)
GET    /api/integrations/logs/:id              Get log details
GET    /api/integrations/logs/stats            Get log statistics (success rate, etc.)
```

### 6.4 Retry Queue
```
GET    /api/integrations/retry-queue           List retry queue
POST   /api/integrations/retry-queue/:id/retry Retry failed event
POST   /api/integrations/retry-queue/:id/skip  Skip event (move to DLQ)
POST   /api/integrations/retry-queue/bulk-retry Retry multiple events
```

### 6.5 Data Export
```
POST   /api/integrations/export/products       Export products (CSV/JSON/XML)
POST   /api/integrations/export/orders         Export orders
POST   /api/integrations/export/inventory      Export inventory
POST   /api/integrations/export/shipments      Export shipments
GET    /api/integrations/export/:id/status     Check export job status
GET    /api/integrations/export/:id/download   Download export file
```

### 6.6 Data Import
```
GET    /api/integrations/import/products/template  Download product import template
POST   /api/integrations/import/products/validate  Validate import file
POST   /api/integrations/import/products/execute   Execute import
GET    /api/integrations/import/boms/template      Download BOM import template
POST   /api/integrations/import/boms/validate      Validate BOM import
POST   /api/integrations/import/boms/execute       Execute BOM import
```

### 6.7 Comarch Optima
```
GET    /api/integrations/comarch/config        Get Comarch config
PUT    /api/integrations/comarch/config        Update Comarch config
POST   /api/integrations/comarch/test          Test Comarch connection
POST   /api/integrations/comarch/sync-accounts Sync chart of accounts
POST   /api/integrations/comarch/push-invoice  Push invoice to Optima
GET    /api/integrations/comarch/vat-report    Generate VAT report
```

### 6.8 EDI
```
GET    /api/integrations/edi/config            Get EDI config
PUT    /api/integrations/edi/config            Update EDI config
GET    /api/integrations/edi/inbox             List inbound EDI messages
GET    /api/integrations/edi/outbox            List outbound EDI messages
POST   /api/integrations/edi/send              Send EDI message
POST   /api/integrations/edi/process/:id       Process inbound message
```

### 6.9 Supplier Portal (Public)
```
POST   /api/portal/supplier/login              Supplier login
GET    /api/portal/supplier/orders             List POs for supplier
GET    /api/portal/supplier/orders/:id         Get PO details
POST   /api/portal/supplier/orders/:id/confirm Confirm delivery
```

### 6.10 Customer Portal (Public)
```
POST   /api/portal/customer/login              Customer login
GET    /api/portal/customer/orders             List orders for customer
GET    /api/portal/customer/orders/:id         Get order details
GET    /api/portal/customer/shipments/:id      Get shipment tracking
```

---

## 7. Integration Patterns

### 7.1 Webhook Delivery Flow

```
┌─────────────┐
│ Event       │
│ Triggered   │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ Find Active         │
│ Webhooks for Event  │
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ Build Payload       │
│ + HMAC Signature    │
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ HTTP POST to URL    │
│ (30s timeout)       │
└──────┬──────────────┘
       │
       ├─Success (2xx)─────> Log Success ──> Done
       │
       └─Failure (4xx/5xx)──> Log Error ──> Add to Retry Queue
                                                    │
                                                    v
                                              ┌──────────────┐
                                              │ Retry Logic  │
                                              │ (exponential)│
                                              └──────┬───────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                │                │
                                    v                v                v
                               Retry 1          Retry 2          Retry 3
                                (5s)             (30s)            (5m)
                                    │                │                │
                                    └────────────────┴────────────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    │                                 │
                                Success                          Max Retries
                                    │                                 │
                                    v                                 v
                               Remove from Queue            Move to Dead Letter Queue
```

### 7.2 API Authentication Flow

```
┌──────────────┐
│ External     │
│ System       │
└──────┬───────┘
       │
       │ HTTP Request with Header:
       │ Authorization: Bearer <api_key>
       │
       v
┌─────────────────────┐
│ MonoPilot API       │
│ Gateway             │
└──────┬──────────────┘
       │
       │ 1. Validate API Key
       │    (check key exists, status=active, not expired)
       v
┌─────────────────────┐
│ Check Rate Limit    │
│ (Redis counter)     │
└──────┬──────────────┘
       │
       ├─Rate Limit OK───> 2. Check Scopes
       │                       │
       │                       v
       │                  ┌─────────────────────┐
       │                  │ Validate Scope      │
       │                  │ (e.g., read:orders) │
       │                  └──────┬──────────────┘
       │                         │
       │                         ├─Scope OK──> 3. Process Request
       │                         │                      │
       │                         │                      v
       │                         │              ┌──────────────┐
       │                         │              │ Log Request  │
       │                         │              └──────┬───────┘
       │                         │                     │
       │                         │                     v
       │                         │              ┌──────────────┐
       │                         │              │ Return 200   │
       │                         │              └──────────────┘
       │                         │
       │                         └─Scope Missing──> Return 403 Forbidden
       │
       └─Rate Limit Exceeded──> Return 429 Too Many Requests
```

### 7.3 Comarch Optima Sync Flow

```
┌──────────────────┐
│ MonoPilot        │
│ Invoice Created  │
└────────┬─────────┘
         │
         v
┌─────────────────────────┐
│ Check Comarch Config    │
│ (enabled? credentials?) │
└────────┬────────────────┘
         │
         ├─Enabled──> Map Fields
         │                 │
         │                 v
         │          ┌────────────────┐
         │          │ Build JSON     │
         │          │ Payload        │
         │          └────────┬───────┘
         │                   │
         │                   v
         │          ┌────────────────────┐
         │          │ POST /api/faktury  │
         │          │ to Comarch Optima  │
         │          └────────┬───────────┘
         │                   │
         │     ┌─────────────┼─────────────┐
         │     │                            │
         │     v                            v
         │  Success (200)              Error (4xx/5xx)
         │     │                            │
         │     v                            v
         │  ┌─────────────┐       ┌─────────────────┐
         │  │ Update      │       │ Log Error       │
         │  │ Invoice:    │       │ Add to Retry    │
         │  │ sync_status │       │ Queue           │
         │  │ = synced    │       └─────────────────┘
         │  └─────────────┘
         │
         └─Disabled──> Skip Sync
```

### 7.4 EDI ORDERS Processing Flow

```
┌──────────────────┐
│ Customer EDI     │
│ VAN sends ORDERS │
└────────┬─────────┘
         │
         v
┌────────────────────────┐
│ MonoPilot EDI Mailbox  │
│ (Polling every 5 min)  │
└────────┬───────────────┘
         │
         v
┌────────────────────────┐
│ Parse EDIFACT Message  │
│ (validate syntax)      │
└────────┬───────────────┘
         │
         ├─Valid──> Extract Fields
         │              │
         │              v
         │          ┌───────────────────────┐
         │          │ Validate Data         │
         │          │ - Customer exists?    │
         │          │ - Products exist?     │
         │          │ - Valid dates?        │
         │          └───────┬───────────────┘
         │                  │
         │      ┌───────────┼───────────┐
         │      │                       │
         │      v                       v
         │   All Valid              Validation Errors
         │      │                       │
         │      v                       v
         │   ┌─────────────────┐   ┌──────────────────┐
         │   │ Create Sales    │   │ Create "Pending  │
         │   │ Order/Work      │   │ Review" Order    │
         │   │ Order           │   │ Log Errors       │
         │   └────────┬────────┘   │ Notify Admin     │
         │            │            └──────────────────┘
         │            v
         │   ┌──────────────────┐
         │   │ Send ORDRSP      │
         │   │ (if Phase 3)     │
         │   └──────────────────┘
         │
         └─Invalid Syntax──> Log Error, Notify Admin
```

### 7.5 Supplier Portal Access Flow

```
┌──────────────┐
│ Supplier     │
│ User         │
└──────┬───────┘
       │
       │ 1. Navigate to /portal/supplier
       │
       v
┌─────────────────────┐
│ Login Page          │
│ (email + password)  │
└──────┬──────────────┘
       │
       │ 2. Submit credentials
       │
       v
┌─────────────────────┐
│ Authenticate        │
│ (separate from      │
│  MonoPilot users)   │
└──────┬──────────────┘
       │
       ├─Valid──> 3. Create Session
       │              │
       │              v
       │          ┌──────────────────────┐
       │          │ Load POs for         │
       │          │ supplier_id          │
       │          │ (filtered by org_id) │
       │          └──────┬───────────────┘
       │                 │
       │                 v
       │          ┌──────────────────────┐
       │          │ Display PO List      │
       │          └──────────────────────┘
       │
       └─Invalid──> Show Error, Log Failed Attempt
```

---

## 8. Phase Roadmap

### Phase 1 (MVP) - Q2 2026

**Focus:** Core integration infrastructure + Comarch Optima basic + Supplier Portal

**Deliverables:**
- API Keys Management (FR-INT-002 to FR-INT-004)
- Integration Logs (FR-INT-005)
- Webhook Events (FR-INT-006 to FR-INT-007)
- Data Export CSV/JSON (FR-INT-008)
- Supplier Portal (FR-INT-009 to FR-INT-010)
- Comarch Optima Basic (FR-INT-011 to FR-INT-012)
- Integrations Dashboard (FR-INT-001)

**Success Criteria:**
- API keys working with rate limiting
- Webhooks delivering 99% of events
- Supplier portal used by 5+ suppliers
- Comarch Optima invoices syncing successfully

**Estimated Effort:** 8-10 weeks

---

### Phase 2 - Q3 2026

**Focus:** EDI + Customer Portal + Import Templates + Advanced Comarch

**Deliverables:**
- Customer Portal (FR-INT-013 to FR-INT-014)
- EDI ORDERS/INVOIC/DESADV (FR-INT-015 to FR-INT-017)
- Import Templates (FR-INT-018 to FR-INT-019)
- Retry Logic UI (FR-INT-020 to FR-INT-021)
- Comarch Optima Advanced (FR-INT-022 to FR-INT-023)
- Data Export XML (FR-INT-024)

**Success Criteria:**
- EDI messages processed with 99% success rate
- Customer portal used by 10+ customers
- Import templates used for bulk product updates
- Chart of accounts synced with Comarch Optima

**Estimated Effort:** 10-12 weeks

---

### Phase 3 - Q4 2026

**Focus:** Advanced EDI + Custom Integrations + Partner Marketplace

**Deliverables:**
- EDI ORDRSP/RECADV (FR-INT-025 to FR-INT-026)
- Comarch Optima Full (FR-INT-027)
- Custom Integration Builder (FR-INT-028)
- Partner API Marketplace (FR-INT-029)
- Bi-directional Webhooks (FR-INT-030)

**Success Criteria:**
- Full EDI compliance for major Polish retailers
- Custom integration builder used by 3+ customers
- API marketplace with 5+ published integrations

**Estimated Effort:** 8-10 weeks

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | <500ms (p95) | API Gateway logs |
| Webhook Delivery | <2s end-to-end | Webhook logs |
| Export Generation | <30s for 10k rows | Export job metrics |
| EDI Processing | <10s per message | EDI logs |
| Comarch Sync | <5s per invoice | Integration logs |
| Dashboard Load | <2s | Frontend metrics |

### 9.2 Scalability

- Support 100 concurrent API requests per org
- Handle 1000 webhook deliveries per minute
- Process 500 EDI messages per day
- Support 50 API keys per org
- Handle 100 webhooks per org

### 9.3 Security

- All API keys hashed with bcrypt (cost factor: 12)
- HTTPS required for all webhook URLs
- HMAC-SHA256 signatures for webhook payloads
- Comarch API secrets encrypted at rest (AES-256)
- Rate limiting per API key (prevent abuse)
- Audit logs retained for 90 days
- Supplier/customer portal users isolated by org_id
- Two-factor authentication for portal access (Phase 2)

### 9.4 Reliability

- Webhook retry policy: exponential backoff (5s, 30s, 5m, 30m, 2h)
- Dead letter queue for permanently failed events
- Idempotent API endpoints (use idempotency keys)
- Transaction rollback on integration failure
- Health checks for external systems (Comarch, EDI)
- Graceful degradation if external system down

### 9.5 Monitoring

- Integration success rate dashboard
- Alert if success rate < 95% (1 hour window)
- Alert if dead letter queue > 50 items
- Alert if Comarch Optima connection fails
- Alert if EDI mailbox not polled in 10 minutes
- Alert if webhook delivery < 90% success rate

---

## 10. Assumptions & Decisions

### 10.1 Assumptions

1. **Comarch Optima API Access:**
   - Customers have Comarch Optima licenses with API access enabled
   - Comarch Optima API v2 is stable and documented
   - Customers can provide API credentials

2. **EDI VAN Provider:**
   - Customers use standard EDI VAN providers (Seeburger, TrueCommerce, etc.)
   - EDIFACT standard is sufficient (no proprietary formats)
   - Customers handle EDI VAN costs and setup

3. **Supplier/Customer Portal:**
   - External users have email addresses
   - Portal users do NOT need full MonoPilot access
   - Single contact per supplier/customer sufficient for MVP

4. **Webhook Consumers:**
   - External systems can receive HTTPS POST requests
   - External systems validate HMAC signatures
   - External systems respond within 30s timeout

5. **Import Templates:**
   - Excel/CSV format is acceptable (no proprietary formats)
   - Users can correct import errors manually
   - Import volumes < 10k rows per file

### 10.2 Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| **API Key Authentication (not OAuth)** | Simpler for small manufacturers, OAuth overkill for MES | 2025-12-10 |
| **EDIFACT over X12** | EDIFACT standard in Europe/Poland, X12 is US-centric | 2025-12-10 |
| **Comarch Optima Priority** | Most popular accounting system in Poland (target market) | 2025-12-10 |
| **Webhook-only (no polling)** | Real-time notifications more valuable than polling APIs | 2025-12-10 |
| **Separate Portal Users** | External users should NOT access full MonoPilot (security) | 2025-12-10 |
| **Retry with Dead Letter Queue** | Prevents infinite retries while preserving failed events | 2025-12-10 |
| **CSV/JSON/XML Export** | Covers 95% of integration needs, proprietary formats out of scope | 2025-12-10 |
| **Manual Retry UI** | Admins need visibility and control over failed integrations | 2025-12-10 |
| **Rate Limiting per API Key** | Prevents abuse while allowing legitimate high-volume use cases | 2025-12-10 |
| **Async Export for Large Files** | Better UX than blocking browser for large exports | 2025-12-10 |

### 10.3 Open Questions

1. **Comarch Optima Licensing:**
   - Q: Does MonoPilot need Comarch Optima partner certification?
   - Action: Contact Comarch Optima partner program
   - Owner: PM-AGENT

2. **EDI VAN Costs:**
   - Q: Should MonoPilot bundle EDI VAN services or require customer to provide?
   - Action: Research VAN provider partnerships
   - Owner: PM-AGENT

3. **Portal Branding:**
   - Q: Should customer portal be white-labeled per customer?
   - Action: User research with potential customers
   - Owner: UX-DESIGNER

4. **API Versioning:**
   - Q: How to handle breaking API changes for external integrations?
   - Action: Define API versioning strategy (e.g., /api/v1/, /api/v2/)
   - Owner: ARCHITECT

5. **Webhook Signature Algorithm:**
   - Q: HMAC-SHA256 sufficient or need RSA signatures?
   - Action: Security review
   - Owner: ARCHITECT

---

**End of PRD**

**Document Status:** Ready for Review
**Next Steps:** Technical spec for Phase 1 (Epic 11A)
**Owner:** PM-AGENT
**Reviewers:** ARCHITECT, TECH-WRITER, DEV
