# Epic 3 Batch 3B Technical Specification: Transfer Orders

Date: 2025-01-23
Author: Claude Code
Epic ID: 3
Batch: 3B
Status: Draft

---

## Overview

Epic 3 Batch 3B (Transfer Orders) implementuje kompletny system zarządzania przenosem towarów pomiędzy magazynami w MonoPilot MES. Batch ten składa się z 4 stories (3.6-3.9) realizujących pełną funkcjonalność TO: CRUD operations, linie transferowe z produktami, partial shipments tracking, oraz opcjonalną pre-selekcję License Plates dla transferu.

Batch 3B zależy wyłącznie od Epic 2 Batch 2A (Products + Settings) jako foundation - wymaga działających tabel products, warehouses, i locations. System TO wspiera transfery między magazynami z tracking shipped_qty i received_qty per line, partial shipments (można wysłać w kilku częściach), oraz optional LP selection (rezerwacja konkretnych palet przed wysyłką).

Transfer Orders stanowią kluczowy element Warehouse Management, umożliwiając śledzenie przepływu towarów między lokalizacjami i synchronizację stanów magazynowych.

## Objectives and Scope

### In Scope
- ✅ **TO CRUD**: Create, read, update Transfer Orders z from_warehouse_id, to_warehouse_id, planned ship/receive dates, status
- ✅ **TO Line Management**: Add/edit/delete TO lines z product_id, quantity, UoM, shipped_qty, received_qty tracking
- ✅ **Partial Shipments**: Możliwość wysyłki TO w kilku częściach, tracking shipped_qty per line, status transitions (Draft → Partially Shipped → Shipped)
- ✅ **LP Selection**: Optional pre-selection konkretnych License Plates dla transferu (to_line_lps table), UI pokazuje selected LPs per line
- ✅ **Status Lifecycle**: Configurable TO statuses z default workflow (Draft → Planned → Shipped → Received)
- ✅ **Warehouse Integration**: TO wykorzystuje Epic 1 warehouses i locations (from/to warehouse selection)

### Out of Scope (Phase 2+)
- ❌ TO Cost Calculation (transfer cost per unit) - Epic 8 Finance
- ❌ TO Templates (reusable TO patterns) - Phase 2 enhancement
- ❌ Bulk TO Creation (create multiple TOs at once) - Phase 2
- ❌ TO Approval Workflow (manager approval) - Phase 2
- ❌ Transit Tracking (real-time location during transfer) - Phase 3
- ❌ Cross-docking (receive + ship without storage) - Phase 3
- ❌ TO Scheduling (optimal timing based on demand) - Phase 4

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (table, modal, drawer)
- **Database**: PostgreSQL 15 via Supabase (RLS enabled dla org_id isolation)
- **Validation**: React Hook Form + Zod (client + server)
- **State Management**: SWR dla data fetching/caching
- **Caching**: Upstash Redis (TO list cache 3 min TTL, invalidate on status change)

### Architecture Constraints
1. **Multi-tenancy**: Wszystkie tabele z `org_id UUID FK` + RLS policies
2. **Audit Trail**: `created_by`, `updated_by`, `created_at`, `updated_at` na transfer_orders i to_lines
3. **Soft Delete**: Brak soft delete dla TOs (hard delete dozwolony dla Draft status, block delete dla Shipped/Received)
4. **Unique Constraints**:
   - `(org_id, to_number)` na transfer_orders (auto-generated unique number)
   - `(to_id, product_id)` OPTIONAL (może być duplicate products if needed)
5. **Foreign Keys**:
   - transfer_orders.from_warehouse_id → warehouses.id (ON DELETE RESTRICT)
   - transfer_orders.to_warehouse_id → warehouses.id (ON DELETE RESTRICT)
   - to_lines.transfer_order_id → transfer_orders.id (ON DELETE CASCADE)
   - to_lines.product_id → products.id (ON DELETE RESTRICT)
   - to_line_lps.lp_id → license_plates.id (ON DELETE RESTRICT) - Epic 5 dependency

### Referenced Components
- **Warehouses Module** (Epic 1): transfer_orders.from_warehouse_id, to_warehouse_id FK
- **Products Module** (Epic 2 Batch 2A): to_lines.product_id FK
- **License Plates** (Epic 5): to_line_lps.lp_id FK (optional, enabled by planning_settings.to_require_lp_selection)

### Cache Dependencies & Events
```typescript
const CACHE_KEYS = {
  transferOrders: 'transfer-orders:{org_id}',          // TTL 3 min, consumed by Epic 5,7
  toLines: 'to-lines:{transfer_order_id}',             // TTL 3 min, consumed by Epic 5
  toLpSelections: 'to-lp-selections:{to_line_id}',     // TTL 3 min, consumed by Epic 5
}

// Cache invalidation events (Batch 3B emits → Others listen)
'to.created' → Epic 5,7 invalidate TO list cache
'to.status_changed' → Epic 5,7 refetch specific TO (status → Shipped triggers LP reservation)
'to_line.created' → Epic 5 refetch TO lines list
'to_lp_selected' → Epic 5 refetch LP availability (LP now reserved for TO)
```

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **TransferOrderService** | CRUD operations dla TOs i TO lines | TO form data, lines list | TO objects, lines arrays | API |
| **TOValidationService** | Validate warehouse selection, quantity checks | TO data, warehouse IDs | Validation result, error messages | API |
| **TONumberGenerator** | Auto-generate unique TO number | org_id, prefix format | Unique TO number (e.g., TO-2025-001) | API |
| **TOStatusService** | Manage status lifecycle, transitions | TO object, new status | Updated TO, status history record | API |
| **TOLpSelectionService** | Pre-select LPs for transfer, check availability | TO line, LP IDs | LP selection records, availability check | API |
| **PartialShipmentService** | Track shipped_qty per line, update status | TO, line items, shipped quantities | Updated TO lines, new status | API |

### Data Models and Contracts

#### Transfer Orders Table
```typescript
interface TransferOrder {
  id: string                      // UUID PK
  org_id: string                  // FK → organizations, RLS key
  to_number: string               // Auto-generated unique (e.g., TO-2025-001)
  from_warehouse_id: string       // FK → warehouses (source)
  to_warehouse_id: string         // FK → warehouses (destination)
  status: TransferOrderStatus     // Enum: Draft, Planned, Partially Shipped, Shipped, Partially Received, Received, Cancelled
  planned_ship_date: Date         // Required
  planned_receive_date: Date      // Required
  actual_ship_date?: Date         // Set when shipped
  actual_receive_date?: Date      // Set when received
  notes?: string                  // Optional
  created_by: string              // FK → users
  updated_by: string              // FK → users
  created_at: Date
  updated_at: Date
}

enum TransferOrderStatus {
  Draft = 'draft',                      // Initial state, can edit
  Planned = 'planned',                  // Confirmed, ready to ship
  PartiallyShipped = 'partially_shipped', // Some lines shipped, some pending
  Shipped = 'shipped',                  // All lines shipped
  PartiallyReceived = 'partially_received', // Some lines received
  Received = 'received',                // All lines received, TO complete
  Cancelled = 'cancelled'               // Cancelled before shipping
}

// Unique constraint: (org_id, to_number)
// Indexes: org_id, from_warehouse_id, to_warehouse_id, status, planned_ship_date
// RLS: org_id = auth.jwt()->>'org_id'
```

#### TO Lines Table
```typescript
interface TransferOrderLine {
  id: string                      // UUID PK
  transfer_order_id: string       // FK → transfer_orders
  product_id: string              // FK → products
  quantity: number                // Planned quantity to transfer
  uom: string                     // From product (kg, pcs, L, etc.)
  shipped_qty: number             // Qty actually shipped (can be partial)
  received_qty: number            // Qty actually received (can differ from shipped)
  notes?: string                  // Optional line-level notes
  created_at: Date
  updated_at: Date
}

// Unique constraint: NONE (can have duplicate products on different lines if needed)
// Indexes: transfer_order_id, product_id
// RLS: org_id via transfer_orders.org_id
// Validation: shipped_qty <= quantity, received_qty <= shipped_qty
```

#### TO Line License Plates (Optional)
```typescript
interface TransferOrderLineLp {
  id: string                      // UUID PK
  to_line_id: string              // FK → to_lines
  lp_id: string                   // FK → license_plates (Epic 5)
  reserved_qty: number            // Qty reserved from this LP
  created_at: Date
}

// Unique constraint: (to_line_id, lp_id)
// Indexes: to_line_id, lp_id
// RLS: org_id via to_lines → transfer_orders
// Validation: SUM(reserved_qty) per to_line_id <= to_line.quantity
// Note: Optional feature, enabled by planning_settings.to_require_lp_selection
```

### APIs and Interfaces

#### REST Endpoints

**Transfer Order CRUD**
```typescript
GET    /api/planning/transfer-orders
  Query: { status?, from_warehouse_id?, to_warehouse_id?, search?, date_from?, date_to? }
  Response: TransferOrder[]
  Auth: Warehouse role or higher
  Cache: 3 min TTL

POST   /api/planning/transfer-orders
  Body: CreateTransferOrderInput {
    from_warehouse_id: string,
    to_warehouse_id: string,
    planned_ship_date: string,
    planned_receive_date: string,
    notes?: string
  }
  Response: TransferOrder
  Auth: Warehouse role or higher
  Side effects: Auto-generate to_number, set status = 'draft'

PUT    /api/planning/transfer-orders/:id
  Body: UpdateTransferOrderInput
  Response: TransferOrder
  Auth: Warehouse role or higher
  Validation: Cannot edit if status = 'shipped' or 'received'

DELETE /api/planning/transfer-orders/:id
  Response: { success: boolean }
  Auth: Warehouse role or higher
  Validation: Can only delete if status = 'draft'
```

**TO Line Management**
```typescript
GET    /api/planning/transfer-orders/:id/lines
  Response: TransferOrderLine[]
  Auth: Warehouse role or higher
  Cache: 3 min TTL

POST   /api/planning/transfer-orders/:id/lines
  Body: CreateToLineInput {
    product_id: string,
    quantity: number,
    notes?: string
  }
  Response: TransferOrderLine
  Auth: Warehouse role or higher
  Side effects: UoM inherited from product

PUT    /api/planning/transfer-orders/:id/lines/:lineId
  Body: UpdateToLineInput
  Response: TransferOrderLine
  Auth: Warehouse role or higher
  Validation: Cannot edit if TO status >= 'shipped'

DELETE /api/planning/transfer-orders/:id/lines/:lineId
  Response: { success: boolean }
  Auth: Warehouse role or higher
  Validation: Can only delete if TO status = 'draft'
```

**Partial Shipment Operations**
```typescript
POST   /api/planning/transfer-orders/:id/ship
  Body: ShipToInput {
    lines: [
      { line_id: string, shipped_qty: number }
    ],
    actual_ship_date: string
  }
  Response: TransferOrder
  Auth: Warehouse role or higher
  Side effects:
    - Update to_lines.shipped_qty
    - Set transfer_orders.actual_ship_date
    - Update status: all shipped → 'shipped', partial → 'partially_shipped'
    - Emit 'to.status_changed' event

POST   /api/planning/transfer-orders/:id/receive
  Body: ReceiveToInput {
    lines: [
      { line_id: string, received_qty: number }
    ],
    actual_receive_date: string
  }
  Response: TransferOrder
  Auth: Warehouse role or higher
  Side effects:
    - Update to_lines.received_qty
    - Set transfer_orders.actual_receive_date
    - Update status: all received → 'received', partial → 'partially_received'
    - Create License Plates at destination warehouse (Epic 5 integration)
```

**LP Selection (Optional)**
```typescript
GET    /api/planning/transfer-orders/:id/lines/:lineId/lps
  Response: TransferOrderLineLp[]
  Auth: Warehouse role or higher

PUT    /api/planning/transfer-orders/:id/lines/:lineId/lps
  Body: SelectLpsInput {
    lps: [
      { lp_id: string, reserved_qty: number }
    ]
  }
  Response: TransferOrderLineLp[]
  Auth: Warehouse role or higher
  Validation:
    - LP must be in from_warehouse
    - LP.product_id must match to_line.product_id
    - SUM(reserved_qty) <= to_line.quantity
    - LP status must be 'available'
  Side effects:
    - Create to_line_lps records
    - Update LP status to 'reserved' (Epic 5)
    - Emit 'to_lp_selected' event
```

#### Zod Validation Schemas

```typescript
// Transfer Order
const CreateTransferOrderSchema = z.object({
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  planned_ship_date: z.string().datetime(),
  planned_receive_date: z.string().datetime(),
  notes: z.string().max(500).optional()
}).refine(data => data.from_warehouse_id !== data.to_warehouse_id, {
  message: "Source and destination warehouse must be different"
}).refine(data => new Date(data.planned_receive_date) >= new Date(data.planned_ship_date), {
  message: "Planned receive date must be after ship date"
})

// TO Line
const CreateToLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  notes: z.string().max(200).optional()
})

// Partial Shipment
const ShipToSchema = z.object({
  lines: z.array(z.object({
    line_id: z.string().uuid(),
    shipped_qty: z.number().min(0)
  })),
  actual_ship_date: z.string().datetime()
})

// LP Selection
const SelectLpsSchema = z.object({
  lps: z.array(z.object({
    lp_id: z.string().uuid(),
    reserved_qty: z.number().positive()
  }))
})
```

### Workflows and Sequencing

#### Workflow 1: Create Transfer Order
```
User: Navigate to /planning/transfer-orders
  ↓
User: Click "Add Transfer Order"
  ↓
Modal Opens:
  - Select From Warehouse (dropdown)
  - Select To Warehouse (dropdown, filtered to exclude from_warehouse)
  - Planned Ship Date (date picker)
  - Planned Receive Date (date picker, must be >= ship date)
  - Notes (optional textarea)
  ↓
User: Click Save
  ↓
API: POST /api/planning/transfer-orders
  - Validate: from_warehouse ≠ to_warehouse
  - Validate: receive_date >= ship_date
  - Auto-generate to_number (TO-2025-001)
  - Set status = 'draft'
  - Create audit trail entry
  ↓
UI: Close modal, refresh TO list
  - Show success toast: "Transfer Order TO-2025-001 created"
  - Navigate to TO detail page
```

#### Workflow 2: Add Lines to TO
```
User: Open TO detail page
  ↓
User: Click "Add Line"
  ↓
Modal Opens:
  - Select Product (dropdown with search)
  - Quantity (number input)
  - UoM (auto-filled from product, read-only)
  - Notes (optional)
  ↓
User: Click Save
  ↓
API: POST /api/planning/transfer-orders/:id/lines
  - Validate: TO status = 'draft' (cannot add lines after planning)
  - Inherit UoM from product
  - Initialize shipped_qty = 0, received_qty = 0
  ↓
UI: Close modal, refresh lines table
  - Show line in table: Product, Quantity, UoM, Shipped (0/10), Received (0/10)
```

#### Workflow 3: Partial Shipment
```
User: Open TO detail page (status = 'planned')
  ↓
User: Click "Ship Transfer Order"
  ↓
Modal Opens:
  - Shows all lines with checkboxes
  - For each line: Planned Qty, Shipped input (0 to planned_qty)
  - Actual Ship Date (date picker, default today)
  ↓
User: Enter shipped quantities:
  - Line 1 (Product A, 10 kg): shipped_qty = 10 (full)
  - Line 2 (Product B, 5 pcs): shipped_qty = 3 (partial)
  - Line 3 (Product C, 20 L): shipped_qty = 0 (not shipped yet)
  ↓
User: Click "Confirm Shipment"
  ↓
API: POST /api/planning/transfer-orders/:id/ship
  - Update to_lines.shipped_qty
  - Set actual_ship_date
  - Calculate status:
    - All lines fully shipped (10/10, 3/5 = partial, 0/20) → 'partially_shipped'
    - (If all were 10/10, 5/5, 20/20 → 'shipped')
  - Emit 'to.status_changed' event
  - Invalidate TO cache
  ↓
UI: Close modal, refresh TO
  - Status badge changes: 'Planned' → 'Partially Shipped' (yellow)
  - Lines table shows: Product A (10/10 ✅), Product B (3/5 ⏳), Product C (0/20 ⏳)
  - "Ship Transfer Order" button still available (for remaining qty)
```

#### Workflow 4: LP Selection (Optional)
```
User: Open TO detail page (status = 'planned')
  ↓
User: Click "Select LPs" on Line 1 (Product A, 10 kg)
  ↓
Modal Opens:
  - Shows available LPs for Product A in From Warehouse
  - LP list: LP-001 (8 kg, available), LP-002 (5 kg, available), LP-003 (3 kg, reserved)
  - Checkboxes to select LPs
  - Reserved Qty input per LP
  ↓
User: Select LPs:
  - LP-001: reserved_qty = 8 kg
  - LP-002: reserved_qty = 2 kg
  - Total: 10 kg (matches TO line quantity ✅)
  ↓
User: Click "Confirm Selection"
  ↓
API: PUT /api/planning/transfer-orders/:id/lines/:lineId/lps
  - Validate: SUM(reserved_qty) = 10 kg (matches to_line.quantity)
  - Validate: LP-001, LP-002 status = 'available'
  - Create to_line_lps records
  - Update LP status to 'reserved' (Epic 5)
  - Emit 'to_lp_selected' event
  ↓
UI: Close modal, refresh line detail
  - Show selected LPs: LP-001 (8 kg), LP-002 (2 kg)
  - Badge: "LPs Selected ✅"
```

#### Workflow 5: Receive Transfer Order
```
User: Open TO detail page (status = 'shipped')
  ↓
User: Click "Receive Transfer Order"
  ↓
Modal Opens:
  - Shows all shipped lines
  - For each line: Shipped Qty, Received input (0 to shipped_qty)
  - Actual Receive Date (date picker, default today)
  ↓
User: Enter received quantities:
  - Line 1 (Product A, 10 kg): received_qty = 10 (full)
  - Line 2 (Product B, 5 pcs): received_qty = 4 (partial, 1 pcs damaged)
  ↓
User: Click "Confirm Receipt"
  ↓
API: POST /api/planning/transfer-orders/:id/receive
  - Update to_lines.received_qty
  - Set actual_receive_date
  - Calculate status:
    - All lines fully received → 'received'
    - Partial → 'partially_received'
  - Create License Plates at To Warehouse (Epic 5 integration):
    - LP-101 (Product A, 10 kg, To Warehouse, default receiving location)
    - LP-102 (Product B, 4 pcs, To Warehouse, default receiving location)
  - Emit 'to.status_changed' event, 'lp.created' event
  ↓
UI: Close modal, refresh TO
  - Status badge: 'Shipped' → 'Received' (green)
  - Lines table: Product A (10/10/10 ✅), Product B (4/5/4 ⚠️)
  - Show variance warning: "Product B: 1 pcs not received (damaged/lost)"
```

## Non-Functional Requirements

### Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| TO list load (100 TOs) | <300ms p95 | GET /api/planning/transfer-orders |
| TO detail page load | <200ms p95 | GET /api/planning/transfer-orders/:id + lines |
| Create TO | <200ms p95 | POST /api/planning/transfer-orders |
| Add TO line | <150ms p95 | POST /api/planning/transfer-orders/:id/lines |
| Ship TO (10 lines) | <500ms p95 | POST /api/planning/transfer-orders/:id/ship (update 10 lines + status) |
| Receive TO (10 lines) | <800ms p95 | POST /api/planning/transfer-orders/:id/receive (update lines + create LPs) |
| LP selection query (500 LPs) | <300ms p95 | GET available LPs for product in warehouse |
| TO status filter | <250ms p95 | GET /api/planning/transfer-orders?status=shipped |
| Cache hit rate | >75% | TO list, lines, LP selections |

**Performance Optimizations:**
- **Index**: `idx_transfer_orders_status_date` ON (org_id, status, planned_ship_date) - optimizes dashboard queries
- **Index**: `idx_to_lines_to_id` ON (transfer_order_id) - fast line lookups
- **Caching**: TO list cached 3 min, invalidate on status change
- **Pagination**: TO list paginated (50 per page) if >100 TOs
- **Optimistic Updates**: UI immediately reflects status changes, background sync

### Security

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Multi-Tenancy Isolation** | RLS policy `org_id = auth.jwt()->>'org_id'` | Automated RLS test suite |
| **Role-Based Access** | Warehouse role or higher for TO operations | Middleware checks role per endpoint |
| **Status-Based Edit Lock** | Cannot edit TO if status >= 'shipped' | API validation, UI disables edit buttons |
| **Warehouse Validation** | from_warehouse ≠ to_warehouse | Zod schema client + server |
| **Quantity Validation** | shipped_qty <= quantity, received_qty <= shipped_qty | API validation before update |
| **LP Selection Security** | Only select LPs from from_warehouse, status = 'available' | API checks LP ownership + status |
| **Audit Trail** | created_by, updated_by, status_changed_by logged | All TO updates tracked |

**Security Tests Required:**
- ✅ RLS: User A cannot view User B's TOs (different org)
- ✅ Role enforcement: Non-warehouse user cannot create TO (403 Forbidden)
- ✅ Status lock: Cannot edit shipped TO (422 Unprocessable Entity)
- ✅ Warehouse validation: Cannot create TO with same from/to warehouse (400 Bad Request)
- ✅ LP validation: Cannot select LP from wrong warehouse (400 Bad Request)

### Reliability/Availability

| Requirement | Implementation | SLA |
|-------------|----------------|-----|
| **Uptime** | 99.9% availability (Vercel + Supabase) | 43.2 min downtime/month max |
| **Graceful Degradation** | Cache serves stale TO data if DB slow | Max 5 min stale acceptable |
| **Transaction Atomicity** | Ship TO: update all lines + status atomically | All or nothing |
| **Idempotent Ship/Receive** | Duplicate ship request with same data → no-op | Safe to retry |
| **Cascade Delete Protection** | FK `ON DELETE RESTRICT` dla warehouses | Cannot delete warehouse with active TOs |
| **Status Consistency** | Status calculated from line quantities (not manual) | Always accurate |

**Failure Scenarios Covered:**
- Ship TO fails mid-transaction → Rollback all line updates
- Receive TO fails → No LPs created, status unchanged
- LP selection fails (LP unavailable) → Error, suggest alternatives
- Warehouse deletion with active TOs → Block delete, show TO count
- Network failure during ship → Retry with same payload (idempotent)

### Observability

| Signal | Implementation | Retention |
|--------|----------------|-----------|
| **Application Logs** | Vercel logs (JSON structured) | 7 days free tier |
| **Error Tracking** | Console errors logged, API errors RFC 7807 | Real-time monitoring |
| **Performance Metrics** | Vercel Analytics (response times) | 30 days |
| **API Metrics** | Status codes, response times per endpoint | 7 days |
| **TO Metrics** | Avg ship time (planned → actual), receive accuracy | 90 days |
| **Audit Trail** | Status changes, shipped/received timestamps | Indefinite |

**Key Metrics to Monitor:**
- TO creation rate (per day)
- Avg time: Planned → Shipped (target <2 days)
- Avg time: Shipped → Received (target <1 day)
- Partial shipment rate (% TOs with partial shipments)
- Receive variance rate (% lines with received_qty < shipped_qty)
- LP selection usage (% TOs using LP pre-selection)

**Alerting Thresholds:**
- 🔴 Critical: TO ship API 5xx error rate >1% (immediate)
- 🔴 Critical: Receive TO fails (creates no LPs) - immediate alert
- 🟡 Warning: TO ship time >5 days (daily digest)
- 🟡 Warning: Receive variance >10% (weekly report)

## Dependencies and Integrations

### Epic 3 Batch 3B Requires (Foundation Data)

Batch 3B zależy od następujących modułów:

```
Epic 1: Foundation & Settings
│
├── Warehouses (Stories 1.5)
│   └→ transfer_orders.from_warehouse_id, to_warehouse_id FK
│
├── Locations (Story 1.6)
│   └→ Used for LP creation at destination (default receiving location)
│
└── Users
    └→ created_by, updated_by audit trail

Epic 2: Technical - Batch 2A
│
└── Products (Stories 2.1-2.5)
    └→ to_lines.product_id FK, UoM inheritance
```

### Epic 3 Batch 3B Provides (APIs for Other Modules)

| API Endpoint | Consumer Modules | Purpose | Cache TTL |
|--------------|------------------|---------|-----------|
| `GET /api/planning/transfer-orders` | Epic 5 Warehouse | TO list for shipping/receiving operations | 3 min |
| `GET /api/planning/transfer-orders/:id` | Epic 5, 7 | TO detail for execution | 3 min |
| `PUT /api/planning/transfer-orders/:id/ship` | Epic 5 | Ship TO, update shipped_qty | N/A (invalidate cache) |
| `PUT /api/planning/transfer-orders/:id/receive` | Epic 5 | Receive TO, create LPs | N/A (invalidate cache) |
| `GET /api/planning/transfer-orders/:id/lines/:lineId/lps` | Epic 5 | LP selections for picking | 3 min |

### Epic 3 Batch 3B Consumes APIs

| API Endpoint | Provider Module | Purpose |
|--------------|-----------------|---------|
| `GET /api/settings/warehouses` | Epic 1 | Warehouse dropdown options |
| `GET /api/settings/locations` | Epic 1 | Location selection for LP creation |
| `GET /api/technical/products` | Epic 2 | Product selection, UoM inheritance |
| `GET /api/warehouse/license-plates` | Epic 5 | LP selection for transfer (optional) |
| `POST /api/warehouse/license-plates` | Epic 5 | Create LPs at destination on receive |

### Shared Tables (Epic 3B owns, others read)

| Table | Owner | Readers | Write Access | Cache Strategy |
|-------|-------|---------|--------------|----------------|
| `transfer_orders` | Epic 3B | Epic 5, 7 | Epic 3B only | 3 min TTL, invalidate on status change |
| `to_lines` | Epic 3B | Epic 5 | Epic 3B only | 3 min TTL, invalidate on line create/update |
| `to_line_lps` | Epic 3B | Epic 5 | Epic 3B only | 3 min TTL, invalidate on LP selection |

### Cache Invalidation Events

```typescript
// Epic 3B emits events → Other modules listen and invalidate their caches

interface CacheEvent {
  event: string
  org_id: string
  entity_id: string
  timestamp: Date
}

// Events emitted by Epic 3B:
'to.created' → Epic 5,7 refetch TO list
'to.status_changed' → Epic 5,7 refetch specific TO, update dashboard
'to.shipped' → Epic 5 trigger picking workflow (if LPs selected)
'to.received' → Epic 5 create LPs at destination warehouse
'to_line.created' → Epic 5 refetch TO lines
'to_lp_selected' → Epic 5 update LP status to 'reserved'
```

### Integration Testing Requirements

| Integration Point | Test Scenario | Expected Result |
|-------------------|---------------|-----------------|
| TO → Warehouses | Create TO with from/to warehouses | Both warehouses exist, from ≠ to |
| TO → Products | Add TO line with product | Product exists, UoM inherited |
| TO → LP Selection | Select LPs for TO line | LPs exist in from_warehouse, status = 'available' |
| Ship TO → LP Status | Ship TO with selected LPs | LP status changes to 'in_transit' (Epic 5) |
| Receive TO → LP Creation | Receive TO | New LPs created at to_warehouse (Epic 5) |
| Delete Warehouse → TO Check | Delete warehouse with active TOs | 403 error: "Cannot delete - X active TOs" |
| Partial Shipment → Status | Ship 50% of TO lines | Status changes to 'partially_shipped' |

## Acceptance Criteria (Authoritative)

Epic 3 Batch 3B realizuje 4 Functional Requirements (FR-PLAN-005 to FR-PLAN-007) poprzez 4 stories. Poniżej znajdują się atomiczne, testable acceptance criteria zgrupowane per story:

### Story 3.6: Transfer Order CRUD (FR-PLAN-005)

**AC-3.6.1**: User może wypełnić i zapisać TO form z wymaganymi polami: from_warehouse_id, to_warehouse_id, planned_ship_date, planned_receive_date

**AC-3.6.2**: Validation: from_warehouse_id ≠ to_warehouse_id (error: "Source and destination must be different")

**AC-3.6.3**: Validation: planned_receive_date >= planned_ship_date (error: "Receive date must be after ship date")

**AC-3.6.4**: TO number auto-generated (format: TO-YYYY-NNN, e.g., TO-2025-001), unique per org

**AC-3.6.5**: Default status set to 'draft', can be edited before planning

**AC-3.6.6**: TO list table sortowalna, filtrowalna (status, from_warehouse, to_warehouse, date range), searchable (to_number)

**AC-3.6.7**: Cannot delete TO if status >= 'shipped' (only draft TOs deletable)

**AC-3.6.8**: Audit trail logged: created_by, updated_by, created_at, updated_at

### Story 3.7: TO Line Management (FR-PLAN-005)

**AC-3.7.1**: User może dodać line z product_id, quantity (required), notes (optional)

**AC-3.7.2**: UoM inherited from product (read-only field, auto-filled)

**AC-3.7.3**: Initially shipped_qty = 0, received_qty = 0

**AC-3.7.4**: TO lines displayed in table: Product, Quantity, UoM, Shipped (0/10), Received (0/10)

**AC-3.7.5**: Cannot add/edit/delete lines if TO status >= 'planned' (only draft allows line changes)

**AC-3.7.6**: Validation: quantity > 0 (error: "Quantity must be positive")

**AC-3.7.7**: Can add multiple lines with same product (no unique constraint on product_id)

### Story 3.8: Partial Shipments (FR-PLAN-006)

**AC-3.8.1**: User może kliknąć "Ship Transfer Order", modal shows all lines with shipped_qty inputs

**AC-3.8.2**: Validation: 0 <= shipped_qty <= quantity per line (error: "Cannot ship more than planned")

**AC-3.8.3**: User enters partial quantities (e.g., Line 1: 10/10, Line 2: 3/5, Line 3: 0/20)

**AC-3.8.4**: On submit: to_lines.shipped_qty updated, actual_ship_date set

**AC-3.8.5**: Status calculation:
- All lines fully shipped (shipped_qty = quantity for all) → status = 'shipped'
- Some lines partially shipped (0 < shipped_qty < quantity for any) → status = 'partially_shipped'

**AC-3.8.6**: User can ship remaining quantities in subsequent shipments (modal shows remaining qty: 5-3=2 for Line 2)

**AC-3.8.7**: Validation: Cannot ship more than remaining qty (error: "Already shipped 3 pcs, max 2 pcs remaining")

**AC-3.8.8**: Status badge updated in UI: 'Planned' → 'Partially Shipped' (yellow) → 'Shipped' (green)

### Story 3.9: LP Selection for TO (FR-PLAN-007)

**AC-3.9.1**: Feature toggle: planning_settings.to_require_lp_selection (default: false, optional feature)

**AC-3.9.2**: User kliknie "Select LPs" on TO line, modal shows available LPs for product in from_warehouse

**AC-3.9.3**: LP list filtered: product_id matches, warehouse_id = from_warehouse_id, status = 'available'

**AC-3.9.4**: User selects LPs with reserved_qty per LP (e.g., LP-001: 8 kg, LP-002: 2 kg)

**AC-3.9.5**: Validation: SUM(reserved_qty) <= to_line.quantity (error: "Total reserved (12 kg) exceeds line qty (10 kg)")

**AC-3.9.6**: Validation: LP status must be 'available' (error: "LP-003 is already reserved")

**AC-3.9.7**: On submit: to_line_lps records created, LP status updated to 'reserved' (Epic 5 integration)

**AC-3.9.8**: TO line detail shows selected LPs: LP-001 (8 kg), LP-002 (2 kg), badge "LPs Selected ✅"

**AC-3.9.9**: User can edit LP selection before shipment (remove/add LPs, change reserved_qty)

**AC-3.9.10**: Optional: If to_require_lp_selection = true, cannot ship TO without LP selection (validation error)

## Traceability Mapping

Pełna mapa FR → Stories → Components → Tests:

| FR ID | FR Title | Story IDs | Status | Notes |
|-------|----------|-----------|--------|-------|
| FR-PLAN-005 | TO CRUD | 3.6, 3.7 | ✅ Covered | Transfer Order header + line items |
| FR-PLAN-006 | Partial Shipments | 3.8 | ✅ Covered | Track shipped_qty per line, status transitions |
| FR-PLAN-007 | LP Selection for TO | 3.9 | ✅ Covered | Pre-select LPs, reserve inventory |

**Coverage Summary:**
- **Total FRs:** 3 (all P0)
- **P0 FRs Covered:** 3/3 (100%)
- **Total Stories:** 4

**Validation:**
- ✅ All P0 functional requirements have at least one implementing story
- ✅ No orphaned stories (all stories trace back to FRs)
- ✅ FR-PLAN-005 split into 2 stories (TO header vs line items)

**Reverse Traceability (Story → FR):**
- Story 3.6 → FR-PLAN-005 (TO CRUD)
- Story 3.7 → FR-PLAN-005 (TO Lines)
- Story 3.8 → FR-PLAN-006 (Partial Shipments)
- Story 3.9 → FR-PLAN-007 (LP Selection)

**Components Implemented:**
- TransferOrderService (CRUD operations)
- TOValidationService (date/warehouse validation)
- TONumberGenerator (auto-generate unique numbers)
- TOStatusService (status lifecycle, transitions)
- TOLpSelectionService (LP pre-selection, availability check)
- PartialShipmentService (shipped_qty tracking, status calculation)

**Test Files:**
- `__tests__/api/planning/transfer-orders.test.ts` (CRUD operations)
- `__tests__/api/planning/to-lines.test.ts` (Line management)
- `__tests__/api/planning/to-partial-shipment.test.ts` (Partial shipment logic)
- `__tests__/api/planning/to-lp-selection.test.ts` (LP selection, validation)
- `e2e/planning/transfer-orders.spec.ts` (Full TO workflow)

## Risks, Assumptions, Open Questions

### 🔴 Critical Risks

#### Risk 1: LP Reservation Race Condition
- **Likelihood**: Medium (concurrent TO creation)
- **Impact**: 🔴 HIGH - Same LP reserved for multiple TOs, stock mismatch
- **Root Cause**: Two TOs select same LP simultaneously, no lock
- **Mitigation**:
  - ✅ Database transaction with SELECT FOR UPDATE on LP
  - ✅ Optimistic locking: check LP status before commit
  - ✅ Error handling: suggest alternative LPs if selected LP unavailable
- **Detection**: Integration test with concurrent LP selections
- **Response**: Rollback transaction, show error, auto-suggest next available LP

#### Risk 2: Partial Shipment Quantity Mismatch
- **Likelihood**: Low (user error)
- **Impact**: 🟡 MEDIUM - Shipped more than planned, inventory inaccuracy
- **Root Cause**: User enters shipped_qty > quantity, validation fails
- **Mitigation**:
  - ✅ Client-side validation: shipped_qty input disabled if > remaining
  - ✅ Server-side validation: shipped_qty <= (quantity - already_shipped)
  - ✅ Error message: "Already shipped 5 pcs, max 5 pcs remaining"
- **Detection**: Integration test with boundary values
- **Response**: Reject request, show error message

#### Risk 3: Receive TO Without Creating LPs
- **Likelihood**: Low (Epic 5 integration failure)
- **Impact**: 🔴 HIGH - TO marked as received, but no LPs created → lost inventory
- **Root Cause**: Epic 5 LP creation API fails, TO status still updated
- **Mitigation**:
  - ✅ Transaction: update TO status + create LPs atomically
  - ✅ Rollback if LP creation fails
  - ✅ Error handling: show "Receive failed, please retry"
- **Detection**: Integration test with Epic 5 LP API mock
- **Response**: Rollback transaction, log error, alert admin

### 🟡 Medium Risks

#### Risk 4: Warehouse Deletion with Active TOs
- **Likelihood**: Low (admin action)
- **Impact**: 🟡 MEDIUM - FK constraint error, UI crash
- **Root Cause**: Admin deletes warehouse with active TOs
- **Mitigation**:
  - ✅ FK `ON DELETE RESTRICT` prevents deletion
  - ✅ UI validation: "Cannot delete - 12 active TOs"
  - ✅ Suggest: "Complete or cancel TOs first"
- **Detection**: Integration test with FK constraint
- **Response**: Show error message, list affected TOs

#### Risk 5: LP Selection Performance (1000+ LPs)
- **Likelihood**: Medium (large warehouses)
- **Impact**: 🟡 MEDIUM - Slow modal load, poor UX
- **Root Cause**: Query all LPs for product without pagination
- **Mitigation**:
  - ✅ Pagination: load 50 LPs per page
  - ✅ Search filter: search by LP ID, batch number
  - ✅ Index: idx_lps_product_warehouse ON (product_id, warehouse_id, status)
- **Detection**: Performance test with 1000 LPs
- **Response**: Add pagination, optimize query

### 🟢 Low Risks

#### Risk 6: TO Number Collision
- **Likelihood**: Very Low (UUID fallback)
- **Impact**: 🟢 LOW - Duplicate TO number
- **Mitigation**: Unique constraint (org_id, to_number), retry on conflict

#### Risk 7: Date Validation Edge Case
- **Likelihood**: Low (timezone mismatch)
- **Impact**: 🟢 LOW - Ship date after receive date
- **Mitigation**: Use UTC dates, validate on server

### Assumptions

| ID | Assumption | Impact if False | Validation |
|----|------------|-----------------|------------|
| A-001 | LP Selection optional (not mandatory for MVP) | Additional story if mandatory | User feedback |
| A-002 | Partial shipments common (>30% TOs) | Optimize for full shipments if rare | Analytics |
| A-003 | TOs have avg 5 lines | Performance issues if avg >20 | Performance testing |
| A-004 | Epic 5 LP API ready before Batch 3B implementation | Cannot implement Story 3.9 | Check Epic 5 timeline |
| A-005 | Same product can appear multiple times on TO | Constraint needed if duplicate not allowed | User research |
| A-006 | Receive variance (received_qty < shipped_qty) <10% | Need variance reporting if >10% | Analytics |

### Open Questions

| ID | Question | Decision Needed By | Owner | Impact |
|----|----------|-------------------|-------|--------|
| Q-001 | Should TO support multi-warehouse routing (A → B → C)? | Sprint 0 | PM | Out of scope (Phase 2) |
| Q-002 | Do we need TO approval workflow (like PO)? | Sprint 0 | PM | Out of scope (Phase 2) |
| Q-003 | Should LP selection be mandatory or optional? | Sprint 0 | PM | Default: optional (toggle in settings) |
| Q-004 | Do we track transit location during shipment? | Sprint 0 | PM | Out of scope (Phase 3) |
| Q-005 | Should TO have cost calculation (transfer cost)? | Sprint 0 | PM | Out of scope (Epic 8 Finance) |
| Q-006 | Do we need TO templates (reusable patterns)? | Sprint 0 | PM | Out of scope (Phase 2) |
| Q-007 | Should TO support cross-docking (no storage)? | Sprint 0 | PM | Out of scope (Phase 3) |

## Test Strategy Summary

### Test Pyramid

```
           /\
          /E2E\ (20% - 8 tests)
         /------\
        /Integration\ (30% - 20 tests)
       /--------------\
      /    Unit Tests    \ (50% - 60 tests)
     /--------------------\
```

**Coverage Targets:**
- Unit Tests: 95% coverage (services, utilities, hooks)
- Integration Tests: 70% coverage (API endpoints, DB operations)
- E2E Tests: 100% user flows (TO creation, shipping, receiving)

### Unit Tests (60 tests, Vitest)

**Testing:**
- Zod validation schemas (CreateTransferOrderSchema, ShipToSchema, etc.)
- Business logic (TO number generation, status calculation, quantity validation)
- React hooks (useTransferOrders, useToLines)
- Utility functions (status badge color, date formatters)

**Files:**
```
lib/api/__tests__/TransferOrderService.spec.ts (15 tests)
lib/validation/__tests__/to-schemas.spec.ts (10 tests)
lib/utils/__tests__/to-number-generator.spec.ts (5 tests)
lib/hooks/__tests__/useTransferOrders.spec.ts (10 tests)
components/planning/__tests__/TransferOrderForm.spec.tsx (10 tests)
components/planning/__tests__/ToLineTable.spec.tsx (10 tests)
```

### Integration Tests (20 tests, Vitest + Supabase Test Client)

**Testing:**
- API endpoints (GET/POST/PUT/DELETE dla TOs i TO lines)
- Database constraints (unique to_number, FK restrictions, RLS policies)
- Partial shipment logic (shipped_qty updates, status calculation)
- LP selection integration (reserve LPs, check availability)

**Files:**
```
app/api/planning/transfer-orders/__tests__/crud.test.ts (5 tests)
app/api/planning/transfer-orders/__tests__/lines.test.ts (4 tests)
app/api/planning/transfer-orders/__tests__/ship.test.ts (4 tests)
app/api/planning/transfer-orders/__tests__/receive.test.ts (4 tests)
app/api/planning/transfer-orders/__tests__/lp-selection.test.ts (3 tests)
```

**Key Integration Test Scenarios:**
- Create TO → Validate from ≠ to warehouse
- Add TO line → Inherit UoM from product
- Ship TO partial → Status changes to 'partially_shipped'
- Ship TO full → Status changes to 'shipped'
- Receive TO → Creates LPs at destination (Epic 5 mock)
- Select LPs → LP status changes to 'reserved' (Epic 5 mock)
- Delete warehouse → FK constraint blocks if active TOs

### E2E Tests (8 tests, Playwright)

**User Flows Tested:**

1. **Create Transfer Order** (to-crud.e2e.ts)
   - Create TO with from/to warehouses
   - Add 3 lines with different products
   - Validate to_number auto-generated
   - Change status to 'planned'

2. **Partial Shipment** (to-partial-shipment.e2e.ts)
   - Create TO with 3 lines
   - Ship 2 lines full, 1 line partial
   - Verify status = 'partially_shipped'
   - Ship remaining qty
   - Verify status = 'shipped'

3. **Receive Transfer Order** (to-receive.e2e.ts)
   - Create and ship TO
   - Receive all lines
   - Verify LPs created at destination
   - Verify status = 'received'

4. **LP Selection** (to-lp-selection.e2e.ts)
   - Create TO
   - Select LPs for lines
   - Verify LPs reserved
   - Ship TO
   - Verify LPs marked as 'in_transit'

5. **Validation Errors** (to-validation.e2e.ts)
   - Try create TO with from = to warehouse (error)
   - Try ship qty > planned (error)
   - Try select unavailable LP (error)

6. **TO Status Lifecycle** (to-status-lifecycle.e2e.ts)
   - Draft → Planned → Shipped → Received
   - Verify cannot edit after shipped

### Performance Tests

**Load Testing (k6):**
- 50 concurrent users creating TOs
- 100 TOs query (<300ms target)
- 500 TO lines query per TO (<300ms target)
- LP selection query with 1000 LPs (<500ms target)

**Stress Testing:**
- 1000 TOs in single org
- 50 lines per TO (quantity validation)
- 100 concurrent ship operations (race condition test)

### Security Tests

**Automated (CI/CD):**
- RLS policy test suite (transfer_orders, to_lines, to_line_lps)
- SQL injection attempts (Supabase client prevents)
- XSS attempts (React auto-escapes)
- Role-based access (non-warehouse user → 403)

**Manual (Pre-release):**
- LP selection race condition (2 users select same LP simultaneously)
- Status lock (edit shipped TO → 422 error)
- Warehouse validation (from = to → 400 error)

### Regression Tests

**Critical Paths (Run on every deploy):**
- Create TO → Add lines → Ship → Receive flow
- Partial shipment → Complete shipment flow
- LP selection → Ship → Receive → LP creation
- Validation errors (date, warehouse, quantity)

**Smoke Tests (Post-deploy):**
- TO list loads <300ms
- TO detail loads <200ms
- Ship TO (10 lines) <500ms
- Receive TO (10 lines) <800ms

---

**Last Updated:** 2025-01-23
**Dependencies:** Epic 2 Batch 2A (Products) ✅
**Optional Dependency:** Epic 5 (License Plates) for Story 3.9
