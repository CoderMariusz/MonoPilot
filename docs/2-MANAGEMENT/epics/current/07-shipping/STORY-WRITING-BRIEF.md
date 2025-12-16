# Epic 07 Shipping Module - Story Writing Brief

**Date:** 2025-12-16
**Author:** ARCHITECT-AGENT
**Status:** READY FOR STORY CREATION
**Target Audience:** Story-writing agents (DEV-AGENT, TECH-WRITER)

---

## Executive Summary

This brief provides comprehensive guidance for creating Epic 07 (Shipping Module) stories. The Shipping Module manages the complete order-to-delivery cycle for finished goods, including customer management, sales order processing, picking operations, packing, carrier integration, and returns processing.

**Key Statistics:**
- PRD Lines: ~1,345
- Functional Requirements: 72 total (FR-7.1 to FR-7.72)
- Database Tables: 15
- API Endpoints: ~70
- React Components: ~40
- Architecture: `/docs/1-BASELINE/architecture/modules/shipping.md`
- PRD: `/docs/1-BASELINE/product/modules/shipping.md`

**MVP CONSTRAINT:** Epic 07 depends on Epic 05 (Warehouse) for License Plate operations (allocation, picking). Shipping MVP requires LP infrastructure to be operational.

---

## 1. Epic Scope Analysis

### 1.1 PRD Functional Requirements Summary

| Category | FR Count | P0 (MVP) | P1 | P2 |
|----------|----------|----------|-----|-----|
| Customers | 8 (FR-7.1 to FR-7.8) | 4 | 2 | 2 |
| Sales Orders | 12 (FR-7.9 to FR-7.20) | 8 | 3 | 1 |
| Pick Lists | 13 (FR-7.21 to FR-7.33) | 9 | 3 | 1 |
| Packing & Shipping | 11 (FR-7.34 to FR-7.44) | 9 | 2 | 0 |
| Carrier Integration | 7 (FR-7.45 to FR-7.51) | 0 | 4 | 3 |
| Dock & Loading | 7 (FR-7.52 to FR-7.58) | 0 | 6 | 1 |
| Returns (RMA) | 7 (FR-7.59 to FR-7.65) | 0 | 7 | 0 |
| Dashboard & Reports | 7 (FR-7.66 to FR-7.72) | 2 | 3 | 2 |
| **TOTAL** | **72** | **32** | **30** | **10** |

### 1.2 Architecture Complexity

| Component | Count | Notes |
|-----------|-------|-------|
| Database Tables | 15 | customers, contacts, addresses, sales_orders, so_lines, allocations, pick_lists, pick_lines, shipments, shipment_boxes, box_contents, dock_doors, appointments, rma_requests, rma_lines, carrier_configs |
| API Endpoints | ~70 | Full CRUD + workflows |
| React Components | ~40 | Desktop + Scanner UIs |
| Services | 12 | customer, sales-order, allocation, pick-list, shipment, packing, dock, rma, carrier, scanner, dashboard, settings |

### 1.3 Upstream Dependencies

| Module | Dependency Type | What Shipping Needs |
|--------|-----------------|---------------------|
| **Settings (Epic 01)** | HARD | organizations, users, roles, warehouses, locations |
| **Technical (Epic 02)** | HARD | products, allergens |
| **Warehouse (Epic 05)** | HARD | license_plates, locations for allocation/picking |
| Planning (Epic 03) | SOFT | PO for backorder creation (nullable) |
| Production (Epic 04) | SOFT | Finished goods availability (nullable) |
| Quality (Epic 06) | SOFT | QA status for LP release (defaults to 'passed' if no QC) |

### 1.4 Downstream Impacts

| Module | What Shipping Provides |
|--------|------------------------|
| **Finance (Epic 09)** | Shipped SO for invoicing |
| **Integrations (Epic 11)** | EDI ASN (856), tracking webhooks |
| Planning (Epic 03) | Backorder signals for MRP |

---

## 2. MVP Boundary Definition

### 2.1 Phase 1A MVP (P0) - Enables Basic Shipping Operations

**What MUST be in MVP:**

| Story Group | FR Coverage | Rationale |
|-------------|-------------|-----------|
| Customer CRUD | FR-7.1, 7.2, 7.3, 7.7 | Cannot create orders without customers |
| Sales Order Core | FR-7.9, 7.10, 7.11, 7.12, 7.13, 7.15, 7.17, 7.18, 7.19 | Core order-to-ship workflow |
| Picking Core | FR-7.21, 7.22, 7.23, 7.24, 7.25, 7.26, 7.27, 7.28, 7.30, 7.31 | Cannot ship without picking |
| Packing Core | FR-7.34, 7.35, 7.36, 7.37, 7.38, 7.39, 7.40, 7.41, 7.42 | GS1 compliance, labels, BOL |
| Basic Dashboard | FR-7.66, 7.67 | Operational visibility |

**Total MVP Stories:** 14-16 stories (estimated 18-24 days)

### 2.2 Phase 1B (P1) - Enhanced Features

**What CAN be Phase 1B:**

| Story Group | FR Coverage | Rationale |
|-------------|-------------|-----------|
| Customer Enhancements | FR-7.4, 7.6 | Credit limits, payment terms |
| SO Enhancements | FR-7.14, 7.16, 7.19 | Clone, backorder mgmt |
| Pick Optimization | FR-7.29, 7.32 | Route optimization, batch |
| Packing QC | FR-7.43 | Quality checks |
| Carrier Integration | FR-7.45, 7.47, 7.48, 7.50 | DHL/UPS/DPD APIs |
| Dock Management | FR-7.52-7.56, 7.58 | Dock doors, appointments |
| Returns (RMA) | FR-7.59-7.65 | Full RMA workflow |
| Reports | FR-7.68, 7.69, 7.70 | Performance reports |

**Total Phase 1B Stories:** 10-12 stories (estimated 14-18 days)

### 2.3 Phase 2 (P2) - Advanced/Optimization

**What should be Phase 2:**

| Story Group | FR Coverage | Rationale |
|-------------|-------------|-----------|
| Customer Categories | FR-7.5 | Grouping, reporting |
| Pricing Agreements | FR-7.8 | Complex pricing |
| SO Import | FR-7.20 | CSV/API import |
| Pick Performance | FR-7.33 | Metrics, analytics |
| Hazmat | FR-7.44 | Regulatory compliance |
| Rate Shopping | FR-7.46 | Multi-carrier optimization |
| Tracking Webhooks | FR-7.49 | Real-time updates |
| POD Capture | FR-7.51 | Proof of delivery |
| Truck Capacity | FR-7.57 | Load optimization |
| Credit Memo | FR-7.64 | Finance integration |
| Analytics Reports | FR-7.71, 7.72 | Carrier/returns analysis |

**Total Phase 2 Stories:** 8-10 stories (deferred)

### 2.4 What to DEFER (Requires Future Modules/Integrations)

| Feature | Why Defer |
|---------|-----------|
| Drop-shipping | Requires supplier portal (out of scope) |
| Multi-warehouse shipping | Phase 3 (single warehouse MVP) |
| Customer self-service portal | Phase 3 or external integration |
| EDI 850/856/810 | Requires Epic 11 Integrations |
| Advanced forecasting | Requires Epic 10 OEE |

---

## 3. Dependency Matrix

### 3.1 Dependency Types

```
DEPENDENCY LEGEND:
- HARD = System breaks without it, blocker
- SOFT = Works but limited functionality, nullable FK
- OPTIONAL = Feature works if present, graceful degradation
- DEFERRED = Requires future epic complete
```

### 3.2 Full Dependency Matrix

```
+--------------------------------------------------------------------------------+
|                       SHIPPING MODULE REQUIRES FROM OTHER EPICS                 |
+----------------+----------+----------+----------+----------+----------+---------+
| Shipping       | Settings | Settings | Technical| Warehouse| Quality  | Notes   |
| Needs          | 01.1     | 01.8/9   | 02.1/3   | 05.1-5   | 06.x     |         |
|                | (Org+RLS)| (Wh/Loc) | (Prod)   | (LP)     | (QA)     |         |
+----------------+----------+----------+----------+----------+----------+---------+
| Org + RLS      | HARD     | -        | -        | -        | -        | Day 1   |
| Users + Roles  | HARD     | -        | -        | -        | -        | RBAC    |
| Warehouses     | -        | HARD     | -        | -        | -        | Staging |
| Locations      | -        | HARD     | -        | -        | -        | Pick loc|
| Products       | -        | -        | HARD     | -        | -        | SO lines|
| Allergens      | -        | -        | HARD     | -        | -        | Food    |
| License Plates | -        | -        | -        | HARD     | -        | Picking |
| LP Reservations| -        | -        | -        | HARD     | -        | Alloc   |
| FIFO/FEFO      | -        | -        | -        | HARD     | -        | Pick    |
| LP Genealogy   | -        | -        | -        | SOFT     | -        | Trace   |
| QA Status      | -        | -        | -        | -        | OPTIONAL | Default |
+----------------+----------+----------+----------+----------+----------+---------+

+--------------------------------------------------------------------------------+
|                       SHIPPING MODULE PROVIDES TO DOWNSTREAM                    |
+----------------+----------+----------+-----------------------------------------+
| Shipping       | Finance  | Integ    | Notes                                   |
| Provides       | Epic 09  | Epic 11  |                                         |
+----------------+----------+----------+-----------------------------------------+
| Shipped SO     | HARD     | -        | Invoice generation                      |
| Shipment Data  | -        | HARD     | EDI ASN (856)                           |
| Tracking #     | -        | HARD     | Webhook events                          |
| Customer Data  | SOFT     | HARD     | Customer master sync                    |
+----------------+----------+----------+-----------------------------------------+
```

### 3.3 Critical Dependencies for MVP

| Dependency | From Epic | Status | Impact on Shipping |
|------------|-----------|--------|-------------------|
| `organizations` | 01.1 | Must have | RLS, multi-tenancy |
| `users` + roles | 01.1 | Must have | Authorization |
| `warehouses` | 01.8 | Must have | Staging locations |
| `locations` | 01.9 | Must have | Pick locations |
| `products` | 02.1 | Must have | SO lines |
| `allergens` | 02.3 | Must have | Customer restrictions |
| `license_plates` | 05.1 | **CRITICAL** | Allocation, picking |
| `lp_reservations` | 05.3 | **CRITICAL** | Inventory allocation |
| FIFO/FEFO | 05.4 | **CRITICAL** | Pick suggestions |

**CONCLUSION:** Epic 07 MVP cannot start until Epic 05 Phase 0 (LP Foundation) is complete.

### 3.4 Graceful Degradation for Optional Dependencies

| Optional Feature | Degradation Strategy |
|------------------|---------------------|
| QA Status (Epic 06) | Default qa_status='passed' if no QC module |
| PO for backorder | Create backorder record, no PO link (nullable FK) |
| Production for inventory | Manual LP creation or import |
| Carrier API | Manual tracking number entry |

---

## 4. Story Grouping Strategy

### 4.1 Phase Structure

| Phase | Focus | Stories | Days | Priority | Dependency |
|-------|-------|---------|------|----------|------------|
| **Phase 1A** | Customers + SO Core | 6 | 8-10 | **P0 MVP** | Epic 01.1, 02.1 |
| **Phase 1B** | Allocation + Picking | 4 | 6-8 | **P0 MVP** | Epic 05.1-5.4 |
| **Phase 1C** | Packing + Shipment | 4 | 6-8 | **P0 MVP** | Phase 1B |
| **Phase 1D** | Dashboard + Basic Reports | 2 | 2-3 | **P0 MVP** | Phase 1A-C |
| Phase 2A | Dock Management | 3 | 4-5 | P1 | Phase 1D |
| Phase 2B | Returns (RMA) | 4 | 5-7 | P1 | Phase 1D |
| Phase 2C | Carrier Integration | 4 | 6-8 | P1 | Phase 1C |
| Phase 3 | Advanced + Analytics | 6 | 8-10 | P2 | All |

### 4.2 Phase 1A: Customers + SO Core

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.1 | Customers CRUD | FR-7.1, 7.7 | M | Backend + Frontend |
| 07.2 | Customer Contacts + Addresses | FR-7.2, 7.3 | M | Backend + Frontend |
| 07.3 | Sales Orders CRUD | FR-7.9, 7.10, 7.11 | L | Backend + Frontend |
| 07.4 | SO Lines Management | FR-7.10 | M | Backend + Frontend |
| 07.5 | SO Confirmation + Hold | FR-7.13 | M | Backend |
| 07.6 | SO Cancellation | FR-7.17 | S | Backend |

### 4.3 Phase 1B: Allocation + Picking (Requires Epic 05)

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.7 | Inventory Allocation | FR-7.12, 7.18 | L | Backend (Opus) |
| 07.8 | Pick List Generation | FR-7.21, 7.22, 7.23 | L | Backend + Frontend |
| 07.9 | Pick Confirmation Desktop | FR-7.24, 7.26, 7.27, 7.28, 7.30 | M | Frontend |
| 07.10 | Pick Confirmation Scanner | FR-7.25 | L | Scanner (Opus) |

### 4.4 Phase 1C: Packing + Shipment

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.11 | Packing Station Workflow | FR-7.34, 7.35, 7.37, 7.42 | L | Backend + Frontend |
| 07.12 | Pack Confirmation Scanner | FR-7.36 | M | Scanner |
| 07.13 | SSCC + Labels + BOL | FR-7.38, 7.39, 7.40, 7.41 | L | Backend (Opus) |
| 07.14 | Shipment + Ship Confirm | FR-7.15 | M | Backend + Frontend |

### 4.5 Phase 1D: Dashboard + Basic Reports

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.15 | Shipping Dashboard | FR-7.66 | M | Frontend |
| 07.16 | Orders by Status Report | FR-7.67 | S | Backend + Frontend |

### 4.6 Phase 2A: Dock Management

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.17 | Dock Doors CRUD | FR-7.52 | S | Backend + Frontend |
| 07.18 | Dock Appointments | FR-7.53 | M | Backend + Frontend |
| 07.19 | Load Confirmation | FR-7.54, 7.55, 7.56, 7.58 | M | Backend + Scanner |

### 4.7 Phase 2B: Returns (RMA)

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.20 | RMA Creation + Lines | FR-7.59, 7.65 | M | Backend + Frontend |
| 07.21 | RMA Approval Workflow | FR-7.59 | S | Backend |
| 07.22 | Return Receiving Desktop | FR-7.60, 7.62, 7.63 | M | Backend + Frontend |
| 07.23 | Return Receiving Scanner | FR-7.61 | M | Scanner |

### 4.8 Phase 2C: Carrier Integration

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.24 | Carrier Configuration | FR-7.45 | M | Backend + Frontend |
| 07.25 | Shipment Booking API | FR-7.47 | L | Backend (Opus) |
| 07.26 | Carrier Label Print | FR-7.50 | M | Backend |
| 07.27 | Tracking Number Import | FR-7.48 | S | Backend + Frontend |

### 4.9 Phase 3: Advanced + Analytics

| Story | Name | PRD FRs | Complexity | Type |
|-------|------|---------|------------|------|
| 07.28 | Customer Credit + Payment | FR-7.4, 7.6 | M | Backend + Frontend |
| 07.29 | SO Clone + Backorder | FR-7.14, 7.16 | M | Backend + Frontend |
| 07.30 | Pick Route Optimization | FR-7.29 | L | Backend (Opus) |
| 07.31 | Rate Shopping | FR-7.46 | L | Backend (Opus) |
| 07.32 | Advanced Reports | FR-7.68, 7.69, 7.70, 7.71, 7.72 | M | Backend + Frontend |
| 07.33 | Shipping Polish | NFRs | M | Full-stack |

---

## 5. Story Complexity Guidelines

### 5.1 Model Selection Criteria

| Criterion | Use Opus | Use Sonnet |
|-----------|----------|------------|
| Complexity | L/XL (5+ days) | S/M (1-4 days) |
| Allocation Logic | Yes (FIFO/FEFO, lot-specific) | No |
| Scanner UI | Yes (mobile-first, touch targets) | No |
| Wave Picking | Yes (consolidation, optimization) | No |
| Carrier Integration | Yes (external API) | No |
| SSCC/GS1 Generation | Yes (compliance) | No |
| Simple CRUD | No | Yes |
| Single service | No | Yes |

### 5.2 Opus-Required Stories

| Story | Rationale |
|-------|-----------|
| 07.7 Inventory Allocation | Complex FIFO/FEFO logic, lot-specific rules |
| 07.10 Pick Scanner | Mobile UX, audio feedback, scan validation |
| 07.13 SSCC + Labels + BOL | GS1 compliance, ZPL generation |
| 07.25 Shipment Booking API | External carrier API integration |
| 07.30 Pick Route Optimization | TSP/routing algorithm |
| 07.31 Rate Shopping | Multi-carrier comparison |

### 5.3 Sonnet-Suitable Stories

All stories not listed above (07.1-07.6, 07.8, 07.9, 07.11, 07.12, 07.14-07.24, 07.26-07.29, 07.32, 07.33)

### 5.4 Story Size Guidelines

| Size | Days | Lines of Code | When to Use |
|------|------|---------------|-------------|
| S (Small) | 1-2 | 200-500 | Single CRUD, simple form |
| M (Medium) | 3-4 | 500-1500 | CRUD + relationships, moderate UI |
| L (Large) | 5-7 | 1500-3000 | Complex logic, scanner, multiple entities |
| XL (Extra Large) | 8+ | 3000+ | **SPLIT INTO SMALLER STORIES** |

### 5.5 Story Splitting Rules

**If story > 5 days, split by:**
1. **Backend vs Frontend** - Separate API from UI
2. **Desktop vs Scanner** - Different UX paradigms
3. **CRUD vs Workflow** - Basic operations vs complex flows
4. **Core vs Advanced** - MVP vs enhanced features

**Minimum Story Size:** 0.5 day (avoid micro-stories)

---

## 6. Story Template for Epic 07

### 6.1 Standard Story Structure

```markdown
# 07.X - [Story Title]

**Priority**: P0 (MVP) | P1 (Phase 1B/2) | P2 (Phase 3)
**Complexity**: S (1-2 days) | M (3-4 days) | L (5-7 days)
**Type:** backend | frontend | backend + frontend | scanner

**State:** ready | in_progress | done
**Primary PRD:** `docs/1-BASELINE/product/modules/shipping.md` (FR-7.XX)
**Architecture:** `docs/1-BASELINE/architecture/modules/shipping.md`

---

## MVP Scope

[Describe what is in this story's MVP scope]

---

## Dependencies

### Epic Dependencies
- **Epic 01.1** - Org context, RLS, users, roles
- **Epic 01.8/9** - Warehouses, locations
- **Epic 02.1** - Products
- **Epic 02.3** - Allergens (for customer restrictions)
- **Epic 05.1-5.4** - License plates, reservations, FIFO/FEFO

### Story Dependencies (within Epic 07)
- **07.X** - [What this story requires]

### Provides To
- **07.Y** - [What stories depend on this]

---

## Goal

[1-2 sentences describing the objective]

## User Story

As a **[shipping clerk/warehouse operator/manager]**, I want **[action]** so that **[benefit]**.

## Scope

**In scope (this story)**
- [Specific features]

**Out of scope (this story)**
- [What's NOT included, reference other stories]

## Acceptance Criteria (Given/When/Then)

### AC-1: [Feature Name]

**Given** [precondition]
**When** [action]
**Then** [expected result]

[Repeat for all ACs - aim for 5-10 ACs per story]

## Scanner UI Requirements (if applicable)

### Touch Targets
- Minimum 48x48 pixels for all buttons
- Large barcode scan area (full width)
- Number pad for quantity input

### Audio/Visual Feedback
- Success tone + green indicator on valid scan
- Error beep + red indicator on invalid scan
- Vibration on mobile devices

## Implementation Notes

### API Endpoints

```typescript
GET    /api/shipping/[resource]
POST   /api/shipping/[resource]
PUT    /api/shipping/[resource]/:id
DELETE /api/shipping/[resource]/:id
POST   /api/shipping/[resource]/:id/[action]
```

### Database

```sql
-- Reference tables from architecture doc
-- Include RLS policy requirements
```

### Frontend Components

```
apps/frontend/app/(authenticated)/shipping/[route]/
  page.tsx
  components/
    [ComponentName].tsx
```

### Scanner Components (if applicable)

```
apps/frontend/app/(authenticated)/scanner/shipping/
  [workflow]/page.tsx
  components/
    [ScannerComponent].tsx
```

### Services

```typescript
// lib/services/[resource]-service.ts
export async function [operation](): Promise<[Type]>
```

### Validation (Zod)

```typescript
const [schema]Schema = z.object({
  // Fields
});
```

### Key Business Rules

1. [Rule 1]
2. [Rule 2]

## Food Safety Rules (if applicable)

### Allergen Validation
- Check customer.allergen_restrictions vs product.allergens
- Block SO confirmation if conflict (unless override)
- Display allergen alerts in pick/pack workflows

### FIFO/FEFO Enforcement
- FIFO: oldest manufactured first
- FEFO: soonest expiry first (overrides FIFO for perishables)
- Only allocate LP with qa_status = 'passed'

## GS1 Compliance (if applicable)

### SSCC Generation
- Format: (00) + 18-digit SSCC
- Structure: Extension(1) + GS1 Prefix(7-10) + Serial(6-8) + Check(1)
- Unique per shipment box

### Label Requirements
- GS1-128 barcode format
- Include: Ship From, Ship To, SSCC, Order #, Box X of Y

## Deliverables

- API routes: [list endpoints]
- Components: [list components]
- Services: [list services]
- Tests: [describe test coverage]

## Definition of Done

- [ ] API tests passing (>80% coverage)
- [ ] RLS policies verified
- [ ] Multi-tenant isolation tested
- [ ] E2E smoke test for critical path
- [ ] Scanner: Touch targets verified (48px+)
- [ ] Scanner: Audio feedback tested
- [ ] GS1: SSCC format validated
- [ ] Food safety: Allergen validation tested

---

## Future Phases (Not in This Story)

### Phase 2+
- [Feature] - Brief description

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | YYYY-MM-DD | Initial story | [Agent] |
```

### 6.2 Required Sections for Shipping Stories

Every story MUST have:
1. **MVP Scope** - Clear boundaries
2. **Dependencies** - Epic + Story dependencies
3. **User Story** - As a / I want / So that
4. **Acceptance Criteria** - Given/When/Then format (match PRD ACs)
5. **Key Business Rules** - From PRD/Architecture
6. **Food Safety Rules** - If story involves allergens or FIFO/FEFO
7. **GS1 Compliance** - If story involves SSCC, labels, or barcodes
8. **Scanner UI Requirements** - For scanner stories
9. **Definition of Done** - Checkboxes
10. **Future Phases** - Deferred features

---

## 7. Critical Business Rules

### 7.1 Allocation Rules

From Architecture:
- Auto-allocation on SO confirmation (configurable)
- FIFO: oldest manufactured first
- FEFO: soonest expiry first (overrides FIFO for perishables)
- Only allocate LP with qa_status = 'passed'
- Lot-specific: honor requested_lot if specified
- Partial allocation creates backorder record

### 7.2 Status Workflows

**Sales Order Status:**
```
draft -> confirmed -> allocated -> picking -> packing -> shipped -> delivered
           |
        cancelled
```

**Pick List Status:**
```
pending -> assigned -> in_progress -> completed
              |
           cancelled
```

**Shipment Status:**
```
pending -> packing -> packed -> manifested -> shipped -> delivered
                                                |
                                            exception
```

**RMA Status:**
```
pending -> approved -> receiving -> received -> processed -> closed
```

### 7.3 Allergen Validation Requirements

- Check `customer.allergen_restrictions` vs `products.allergens`
- If conflict detected:
  - Set `sales_orders.allergen_validated = false`
  - Create alert/task for manual review
  - Block shipment until override
- Display allergen alerts in pick/pack workflows
- Separate allergen products in different boxes (warning)

### 7.4 GS1 SSCC Generation Rules

**Format:** (00) SSCC (18 digits)

**Structure:**
- Extension Digit (1): Fixed '0'
- GS1 Company Prefix (7-10): From org configuration
- Serial Reference (8-6): Unique sequential number
- Check Digit (1): Calculated per GS1 standard

**Implementation:**
```sql
-- Next SSCC sequence per org
SELECT next_sscc_sequence FROM organizations WHERE id = :org_id FOR UPDATE;
UPDATE organizations SET next_sscc_sequence = next_sscc_sequence + 1;
```

### 7.5 BOL Requirements

**Header:**
- BOL Number (unique per shipment)
- Shipment Date
- Carrier Name, Pro Number (tracking)
- Ship From: Warehouse name, address
- Ship To: Customer name, address

**Line Items:**
- Box count, pallet count
- Total weight (gross)
- Freight class (LTL shipments)
- NMFC code (if applicable)

**Certifications:**
- Shipper signature, date
- Carrier signature, date
- Special instructions (temperature control, hazmat)

**Traceability:**
- List all SSCC numbers
- Optional: Product list with lot numbers

---

## 8. Quality Gates

### 8.1 RLS Policy Requirements Per Story

Every story that creates or modifies tables MUST:
1. Enable RLS on the table
2. Create org isolation policy
3. Test multi-tenant isolation
4. Document policy in story

**Standard RLS Pattern:**
```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table]_org_isolation" ON [table_name]
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### 8.2 API Endpoint Authorization Matrix

| Endpoint | Required Role |
|----------|---------------|
| GET /customers | Any authenticated |
| POST /customers | Sales, Manager, Admin |
| PUT /customers/:id | Sales, Manager, Admin |
| DELETE /customers/:id | Manager, Admin |
| GET /sales-orders | Any authenticated |
| POST /sales-orders | Sales, Manager, Admin |
| /sales-orders/:id/confirm | Sales, Manager, Admin |
| /sales-orders/:id/cancel | Manager, Admin |
| GET /pick-lists | Warehouse, Manager, Admin |
| /pick-lists/:id/assign | Warehouse Mgr, Admin |
| /pick-lists/:id/lines/:lineId/pick | Picker, Warehouse, Admin |
| GET /shipments | Any authenticated |
| /shipments/:id/ship | Warehouse Mgr, Admin |
| /rma/:id/approve | Manager, Admin |
| /carriers | Admin only |
| /settings | Admin only |

### 8.3 Scanner UI Requirements

**Touch Targets:**
- Minimum 48x48 pixels for all buttons
- Large barcode scan area (full width)
- Number pad for quantity input

**Audio/Visual Feedback:**
- Success tone + green indicator on valid scan
- Error beep + red indicator on invalid scan
- Vibration on mobile devices

**Label Printing:**
- ZPL format for Zebra printers
- SSCC label: barcode, Ship To, Order #, Box X of Y, Weight
- Shipping label: Carrier format (via API or ZPL)
- Packing slip: Product list, quantities, lot numbers

### 8.4 Test Coverage Expectations

| Test Type | Coverage Target | When Required |
|-----------|-----------------|---------------|
| Unit Tests | 80%+ for services | All stories |
| Integration Tests | API endpoints (80%+) | All backend stories |
| E2E Tests | Critical paths | MVP stories |
| RLS Tests | All tables | Stories with DB changes |
| Scanner Tests | Touch targets, audio | Scanner stories |

**E2E Critical Paths:**
1. Create customer -> Create SO -> Allocate -> Pick -> Pack -> Ship
2. Wave picking: 3 SOs -> wave pick list -> complete -> distribute
3. Short pick handling: partial pick -> backorder
4. RMA processing: create -> approve -> receive -> restock
5. Allergen validation: customer restriction -> SO alert -> override

---

## 9. Story Dependency Graph

```
+------------------------------------------------------------------+
|                     PHASE 1A: CUSTOMERS + SO CORE                 |
+------------------------------------------------------------------+

Epic 01.1 (Org + RLS)
Epic 02.1 (Products)
Epic 02.3 (Allergens)
    |
    v
07.1 (Customers CRUD) ───────> 07.2 (Contacts + Addresses)
    |                              |
    +─────────────┬────────────────+
                  v
07.3 (Sales Orders CRUD) ────> 07.4 (SO Lines)
                  |                |
                  v                v
07.5 (SO Confirm/Hold) ──────> 07.6 (SO Cancel)
    |
    v
+------------------------------------------------------------------+
|                     PHASE 1B: ALLOCATION + PICKING                |
+------------------------------------------------------------------+

Epic 05.1-5.4 (LP Foundation) ◄──── CRITICAL BLOCKER
    |
    v
07.7 (Inventory Allocation) ─────> 07.8 (Pick List Generation)
    |                                  |
    +──────────────┬───────────────────+
                   v
07.9 (Pick Desktop) ─────────────> 07.10 (Pick Scanner)
    |
    v
+------------------------------------------------------------------+
|                     PHASE 1C: PACKING + SHIPMENT                  |
+------------------------------------------------------------------+

07.11 (Packing Station) ─────────> 07.12 (Pack Scanner)
    |
    v
07.13 (SSCC + Labels + BOL) ─────> 07.14 (Shipment + Ship Confirm)
    |
    v
+------------------------------------------------------------------+
|                     PHASE 1D: DASHBOARD                           |
+------------------------------------------------------------------+

07.15 (Shipping Dashboard)
    |
    v
07.16 (Orders by Status Report)
    |
    v
=== MVP COMPLETE ===

+------------------------------------------------------------------+
|                     PHASE 2A-C: ENHANCED                          |
+------------------------------------------------------------------+

07.17-07.19 (Dock Management)
07.20-07.23 (Returns/RMA)
07.24-07.27 (Carrier Integration)
    |
    v
+------------------------------------------------------------------+
|                     PHASE 3: ADVANCED                             |
+------------------------------------------------------------------+

07.28-07.33 (Advanced + Analytics)
```

---

## 10. Effort Estimation

### 10.1 By Phase

| Phase | Stories | Story Points | Days (1 dev) | Cumulative |
|-------|---------|--------------|--------------|------------|
| Phase 1A (Customers + SO) | 6 | 22 | 8-10 | 8-10 |
| Phase 1B (Allocation + Picking) | 4 | 18 | 6-8 | 14-18 |
| Phase 1C (Packing + Shipment) | 4 | 16 | 6-8 | 20-26 |
| Phase 1D (Dashboard) | 2 | 5 | 2-3 | 22-29 |
| **MVP Total** | **16** | **61** | **22-29 days** | - |
| Phase 2A (Dock) | 3 | 10 | 4-5 | 26-34 |
| Phase 2B (RMA) | 4 | 13 | 5-7 | 31-41 |
| Phase 2C (Carrier) | 4 | 15 | 6-8 | 37-49 |
| Phase 3 (Advanced) | 6 | 20 | 8-10 | 45-59 |
| **TOTAL** | **33** | **119** | **45-59 days** | - |

### 10.2 Parallel Development Waves

**Wave 1 (Days 1-8) - Customers + SO Core:**
| Story | Agent | Model | Days |
|-------|-------|-------|------|
| 07.1 Customers CRUD | FULLSTACK-DEV | sonnet | 3 |
| 07.2 Contacts + Addresses | FULLSTACK-DEV | sonnet | 2 |
| 07.3 Sales Orders CRUD | FULLSTACK-DEV | opus | 4 |

**Wave 2 (Days 5-10) - SO Complete:**
| Story | Agent | Model | Days |
|-------|-------|-------|------|
| 07.4 SO Lines | FULLSTACK-DEV | sonnet | 2 |
| 07.5 SO Confirm/Hold | BACKEND-DEV | sonnet | 2 |
| 07.6 SO Cancel | BACKEND-DEV | sonnet | 1 |

**Wave 3 (Days 11-18) - Allocation + Picking:** (Requires Epic 05)
| Story | Agent | Model | Days |
|-------|-------|-------|------|
| 07.7 Allocation | BACKEND-DEV | opus | 4 |
| 07.8 Pick List Gen | FULLSTACK-DEV | opus | 4 |

**Wave 4 (Days 15-22) - Pick Complete:**
| Story | Agent | Model | Days |
|-------|-------|-------|------|
| 07.9 Pick Desktop | FRONTEND-DEV | sonnet | 2 |
| 07.10 Pick Scanner | FULLSTACK-DEV | opus | 4 |

**Wave 5 (Days 19-26) - Packing:**
| Story | Agent | Model | Days |
|-------|-------|-------|------|
| 07.11 Packing Station | FULLSTACK-DEV | opus | 4 |
| 07.12 Pack Scanner | FULLSTACK-DEV | sonnet | 2 |

**Wave 6 (Days 23-29) - Ship + Dashboard:**
| Story | Agent | Model | Days |
|-------|-------|-------|------|
| 07.13 SSCC + Labels + BOL | BACKEND-DEV | opus | 4 |
| 07.14 Shipment | FULLSTACK-DEV | sonnet | 2 |
| 07.15 Dashboard | FRONTEND-DEV | sonnet | 2 |
| 07.16 Reports | FULLSTACK-DEV | sonnet | 1 |

**=== MVP COMPLETE (Day ~29) ===**

---

## 11. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Epic 05 delayed** | CRITICAL | MEDIUM | MVP Phase 1A can start, Phase 1B blocked |
| Allocation logic bugs | HIGH | MEDIUM | Comprehensive unit tests for FIFO/FEFO |
| Scanner device issues | MEDIUM | MEDIUM | Test on multiple devices early |
| GS1 compliance errors | HIGH | LOW | Validate SSCC format with check digit |
| RLS policy gaps | HIGH | LOW | Multi-tenant integration tests |
| Allergen validation bypass | HIGH | LOW | Mandatory validation on confirm |
| Carrier API failures | MEDIUM | MEDIUM | Fallback to manual tracking entry |
| Label printing issues | MEDIUM | MEDIUM | PDF fallback from ZPL |
| Performance at scale | MEDIUM | LOW | Index strategy, pagination |

### 11.1 Dependency Risk Mitigation

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| Epic 05 LP Foundation | HIGH | Start Phase 1A immediately, Phase 1B waits |
| Epic 01 Settings | LOW | Should be complete before Epic 07 starts |
| Epic 02 Products/Allergens | LOW | Should be complete before Epic 07 starts |
| Carrier APIs (external) | MEDIUM | Mock for development, real API testing late |

---

## 12. Story Index (To Be Created)

### Phase 1A - Customers + SO Core (MVP)

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.1 | Customers CRUD | M | P0 | TO CREATE |
| 07.2 | Customer Contacts + Addresses | M | P0 | TO CREATE |
| 07.3 | Sales Orders CRUD | L | P0 | TO CREATE |
| 07.4 | SO Lines Management | M | P0 | TO CREATE |
| 07.5 | SO Confirmation + Hold | M | P0 | TO CREATE |
| 07.6 | SO Cancellation | S | P0 | TO CREATE |

### Phase 1B - Allocation + Picking (MVP)

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.7 | Inventory Allocation | L | P0 | TO CREATE |
| 07.8 | Pick List Generation | L | P0 | TO CREATE |
| 07.9 | Pick Confirmation Desktop | M | P0 | TO CREATE |
| 07.10 | Pick Confirmation Scanner | L | P0 | TO CREATE |

### Phase 1C - Packing + Shipment (MVP)

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.11 | Packing Station Workflow | L | P0 | TO CREATE |
| 07.12 | Pack Confirmation Scanner | M | P0 | TO CREATE |
| 07.13 | SSCC + Labels + BOL | L | P0 | TO CREATE |
| 07.14 | Shipment + Ship Confirm | M | P0 | TO CREATE |

### Phase 1D - Dashboard (MVP)

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.15 | Shipping Dashboard | M | P0 | TO CREATE |
| 07.16 | Orders by Status Report | S | P0 | TO CREATE |

**MVP Total: 16 stories, 22-29 days**

### Phase 2A - Dock Management

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.17 | Dock Doors CRUD | S | P1 | TO CREATE |
| 07.18 | Dock Appointments | M | P1 | TO CREATE |
| 07.19 | Load Confirmation | M | P1 | TO CREATE |

### Phase 2B - Returns (RMA)

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.20 | RMA Creation + Lines | M | P1 | TO CREATE |
| 07.21 | RMA Approval Workflow | S | P1 | TO CREATE |
| 07.22 | Return Receiving Desktop | M | P1 | TO CREATE |
| 07.23 | Return Receiving Scanner | M | P1 | TO CREATE |

### Phase 2C - Carrier Integration

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.24 | Carrier Configuration | M | P1 | TO CREATE |
| 07.25 | Shipment Booking API | L | P1 | TO CREATE |
| 07.26 | Carrier Label Print | M | P1 | TO CREATE |
| 07.27 | Tracking Number Import | S | P1 | TO CREATE |

### Phase 3 - Advanced + Analytics

| Story ID | Name | Complexity | Priority | Status |
|----------|------|------------|----------|--------|
| 07.28 | Customer Credit + Payment | M | P2 | TO CREATE |
| 07.29 | SO Clone + Backorder | M | P2 | TO CREATE |
| 07.30 | Pick Route Optimization | L | P2 | TO CREATE |
| 07.31 | Rate Shopping | L | P2 | TO CREATE |
| 07.32 | Advanced Reports | M | P2 | TO CREATE |
| 07.33 | Shipping Polish | M | P2 | TO CREATE |

**Grand Total: 33 stories, 45-59 days**

---

## 13. Handoff to Story Writers

### 13.1 Instructions for Story Creation

1. **Read PRD Section** - Each FR-7.XX has detailed ACs in PRD
2. **Use Template** - Follow template in Section 6
3. **Reference Architecture** - Use schema from shipping.md
4. **Map FRs to ACs** - PRD ACs are comprehensive, use as-is
5. **Document Dependencies** - Epic and story dependencies explicit
6. **Food Safety** - Include allergen validation rules
7. **GS1 Compliance** - Include SSCC/label specs where needed
8. **Scanner UI** - Include design specs for scanner stories

### 13.2 File Naming Convention

```
docs/2-MANAGEMENT/epics/current/07-shipping/
  07.0.epic-overview.md
  STORY-WRITING-BRIEF.md (this file)
  MVP-DEPENDENCY-ANALYSIS.md (to create)
  07.1.customers-crud.md
  07.2.customer-contacts-addresses.md
  07.3.sales-orders-crud.md
  07.4.so-lines-management.md
  07.5.so-confirmation-hold.md
  07.6.so-cancellation.md
  07.7.inventory-allocation.md
  07.8.pick-list-generation.md
  07.9.pick-confirmation-desktop.md
  07.10.pick-confirmation-scanner.md
  07.11.packing-station-workflow.md
  07.12.pack-confirmation-scanner.md
  07.13.sscc-labels-bol.md
  07.14.shipment-ship-confirm.md
  07.15.shipping-dashboard.md
  07.16.orders-status-report.md
  ... (07.17 through 07.33)
  context/
    07.1.context.yaml
    07.2.context.yaml
    ... (context files for each story)
```

### 13.3 Priority Order for Story Creation

**First Priority (Phase 1A - Can start immediately):**
1. 07.1 Customers CRUD
2. 07.2 Customer Contacts + Addresses
3. 07.3 Sales Orders CRUD
4. 07.4 SO Lines Management
5. 07.5 SO Confirmation + Hold
6. 07.6 SO Cancellation

**Second Priority (Phase 1B - After Epic 05 LP Foundation):**
7. 07.7 Inventory Allocation
8. 07.8 Pick List Generation
9. 07.9 Pick Confirmation Desktop
10. 07.10 Pick Confirmation Scanner

**Third Priority (Phase 1C - After Phase 1B):**
11. 07.11 Packing Station Workflow
12. 07.12 Pack Confirmation Scanner
13. 07.13 SSCC + Labels + BOL
14. 07.14 Shipment + Ship Confirm

**Fourth Priority (Phase 1D - After Phase 1C):**
15. 07.15 Shipping Dashboard
16. 07.16 Orders by Status Report

**Fifth Priority (Phases 2-3 - As needed):**
17. 07.17-07.33

---

## 14. Success Criteria

### 14.1 MVP Success Metrics

| Metric | Target |
|--------|--------|
| Order Fulfillment Time | < 24 hours (draft -> shipped) |
| Pick Accuracy | > 99% (correct product/lot/qty) |
| SSCC Label Print Success | > 99.5% (valid labels generated) |
| Scanner Uptime | > 99% (PWA availability) |
| API Response Time | < 500ms (p95) |

### 14.2 Story Writer Success Criteria

- [ ] All 16 MVP stories created
- [ ] All stories have complete AC mapping to PRD FRs
- [ ] All stories have context.yaml files
- [ ] Dependencies clearly documented
- [ ] Scanner stories have UI specs
- [ ] GS1 compliance documented
- [ ] Food safety rules included

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial story writing brief | ARCHITECT-AGENT |
