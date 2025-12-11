# Planning Module - PRD Specification

**Version:** 2.0
**Status:** Phase 1 Complete | Phase 2-3 Planned
**Priority:** P0 - Core Module
**Last Updated:** 2025-12-10
**Owner:** PM-AGENT

---

## Executive Summary

The Planning Module is the operational backbone of MonoPilot MES, responsible for procurement, production scheduling, inventory transfers, and demand planning. It bridges the gap between what needs to be produced (demand) and what resources are available (supply), ensuring small-to-medium food manufacturers can plan efficiently without enterprise-level complexity.

**Target Users:** Planners, Purchasers, Production Managers, Operations Staff
**Target Companies:** Food manufacturers with 5-100 employees

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dependencies](#2-dependencies)
3. [UI Structure](#3-ui-structure)
4. [Section 1: Suppliers](#4-section-1-suppliers)
5. [Section 2: Purchase Orders](#5-section-2-purchase-orders)
6. [Section 3: Transfer Orders](#6-section-3-transfer-orders)
7. [Section 4: Work Orders](#7-section-4-work-orders)
8. [Section 5: Planning Dashboard](#8-section-5-planning-dashboard)
9. [Section 6: Planning Settings](#9-section-6-planning-settings)
10. [Section 7: Demand Forecasting (Phase 2)](#10-section-7-demand-forecasting-phase-2)
11. [Section 8: MRP/MPS (Phase 2)](#11-section-8-mrpmps-phase-2)
12. [Section 9: Auto-Replenishment (Phase 2)](#12-section-9-auto-replenishment-phase-2)
13. [Section 10: Supplier Quality Management (Phase 3)](#13-section-10-supplier-quality-management-phase-3)
14. [Section 11: Capacity Planning (Phase 3)](#14-section-11-capacity-planning-phase-3)
15. [Section 12: EDI Integration (Phase 3)](#15-section-12-edi-integration-phase-3)
16. [Functional Requirements](#16-functional-requirements)
17. [Database Schema](#17-database-schema)
18. [API Endpoints](#18-api-endpoints)
19. [Integration Points](#19-integration-points)
20. [Phase Roadmap](#20-phase-roadmap)
21. [Non-Functional Requirements](#21-non-functional-requirements)
22. [Assumptions & Decisions](#22-assumptions--decisions)

---

## 1. Overview

### 1.1 Module Purpose

The Planning Module handles "how we order and schedule" - managing the complete lifecycle of:

- **Suppliers** - Vendor master data, supplier-product relationships, lead times
- **Purchase Orders (PO)** - Procurement from external suppliers
- **Transfer Orders (TO)** - Internal inventory movements between warehouses
- **Work Orders (WO)** - Production scheduling with BOM snapshots
- **Demand Planning** - Forecasting, MRP, auto-replenishment (Phase 2+)

### 1.2 Business Value

| Value Driver | Benefit | Metric |
|--------------|---------|--------|
| Reduced stockouts | Automated reorder points prevent production stops | Target: <2% stockout rate |
| Faster procurement | Bulk PO creation saves 70% of manual entry time | Target: <5 min for 20-line PO |
| Better visibility | Dashboard shows all orders in one place | Target: 100% real-time accuracy |
| Compliance | Full audit trail for supplier and order history | Target: Pass audits in <30 min |
| Material planning | BOM-driven material requirements | Target: 95% first-pass WO completion |

### 1.3 Scope

**In Scope (Phase 1):**
- Supplier master data management
- Purchase Order CRUD with approval workflow
- Transfer Order management with LP selection
- Work Order creation with BOM snapshot
- Basic planning dashboard
- Configurable status lifecycles

**In Scope (Phase 2):**
- Demand forecasting (historical-based)
- MRP/MPS basic implementation
- Auto-replenishment rules
- PO templates and blanket POs
- Safety stock management
- Reorder point calculations

**In Scope (Phase 3):**
- Finite capacity planning
- Supplier quality management (scorecards, audits)
- EDI integration (EDIFACT)
- Vendor Managed Inventory (VMI) portal
- Advanced scheduling optimization

**Out of Scope:**
- Full ERP finance integration (separate system)
- Customer order management (see Shipping Module)
- HR/workforce scheduling
- Transport management (3PL integration only)

---

## 2. Dependencies

### 2.1 Module Dependencies

```
                    +-----------------+
                    |    SETTINGS     |
                    |   (Epic 1)      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+         +---------v---------+
    |     TECHNICAL     |         |     PLANNING      |
    |     (Epic 2)      |         |     (Epic 3)      |
    +---------+---------+         +---------+---------+
              |                             |
              |   +-------------------------+
              |   |
    +---------v---v-----+
    |    PRODUCTION     |
    |     (Epic 4)      |
    +---------+---------+
              |
    +---------v---------+
    |    WAREHOUSE      |
    |     (Epic 5)      |
    +-------------------+
```

### 2.2 Required By Planning

| Module | Data Required |
|--------|---------------|
| **Settings** | Organizations, Users, Warehouses, Locations, Tax Codes |
| **Technical** | Products, BOMs, Routings, Allergens |

### 2.3 Planning Required By

| Module | Data Provided |
|--------|---------------|
| **Production** | Work Orders for execution |
| **Warehouse** | PO receiving, TO shipping/receiving |
| **Quality** | Supplier quality data |

### 2.4 Shared Services

- **RLS (Row Level Security)** - All tables filtered by `org_id`
- **Audit Trail** - `created_at`, `updated_at`, `created_by`, `updated_by`
- **Caching** - Upstash Redis for list queries
- **Notifications** - SendGrid for approval emails

---

## 3. UI Structure

### 3.1 Route Hierarchy

```
/planning                           -> Planning Dashboard
├── /purchase-orders                -> PO list, bulk create
│   └── /[id]                       -> PO detail with lines
├── /transfer-orders                -> TO list
│   └── /[id]                       -> TO detail with lines
├── /work-orders                    -> WO list, schedule view
│   └── /[id]                       -> WO detail with materials/operations
├── /suppliers                      -> Supplier list
│   └── /[id]                       -> Supplier detail with products
└── /mrp                            -> MRP dashboard (Phase 2)
    ├── /forecasting                -> Demand forecasting
    ├── /suggestions                -> Auto-generated PO/WO suggestions
    └── /capacity                   -> Capacity planning (Phase 3)

/settings/planning                  -> Planning module settings
```

### 3.2 Navigation Structure

| Tab | Route | Description | Phase |
|-----|-------|-------------|-------|
| Dashboard | `/planning` | KPIs, alerts, upcoming orders | 1 |
| Purchase Orders | `/planning/purchase-orders` | PO management | 1 |
| Transfer Orders | `/planning/transfer-orders` | TO management | 1 |
| Work Orders | `/planning/work-orders` | WO management | 1 |
| Suppliers | `/planning/suppliers` | Supplier master data | 1 |
| MRP | `/planning/mrp` | Demand planning | 2 |
| Settings | `/settings/planning` | Module configuration | 1 |

---

## 4. Section 1: Suppliers

### 4.1 Overview

Suppliers represent external vendors from whom the organization purchases raw materials, packaging, and other goods. Each supplier has default settings (currency, tax, lead time) that cascade to purchase orders.

### 4.2 Supplier Master Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `org_id` | UUID | Yes | Organization (RLS) |
| `code` | string | Yes | Unique supplier code (e.g., SUP-001) |
| `name` | string | Yes | Company name |
| `address` | text | No | Street address |
| `city` | string | No | City |
| `postal_code` | string | No | Postal/ZIP code |
| `country` | string | No | Country (ISO 3166-1 alpha-2) |
| `contact_name` | string | No | Primary contact person |
| `contact_email` | string | No | Email address |
| `contact_phone` | string | No | Phone number |
| `currency` | enum | Yes | Default currency (PLN, EUR, USD, GBP) |
| `tax_code_id` | UUID | Yes | Default tax code (FK to tax_codes) |
| `payment_terms` | string | No | Payment terms (e.g., "Net 30", "2/10 Net 30") |
| `lead_time_days` | integer | Yes | Default lead time in days |
| `moq` | decimal | No | Minimum Order Quantity (default) |
| `notes` | text | No | Internal notes |
| `is_active` | boolean | Yes | Active/inactive status |
| `approved_supplier` | boolean | No | Phase 3: Approved supplier list flag |
| `supplier_rating` | decimal | No | Phase 3: 1-5 quality score |
| `last_audit_date` | date | No | Phase 3: Last quality audit |
| `next_audit_due` | date | No | Phase 3: Next audit due date |
| `created_at` | timestamp | Auto | Record creation time |
| `updated_at` | timestamp | Auto | Last update time |
| `created_by` | UUID | Auto | Creator user ID |
| `updated_by` | UUID | Auto | Last updater user ID |

### 4.3 Supplier-Product Assignments

Links suppliers to products they can provide, with optional overrides for pricing, lead time, and MOQ.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `supplier_id` | UUID | Yes | FK to suppliers |
| `product_id` | UUID | Yes | FK to products |
| `is_default` | boolean | Yes | Default supplier for this product |
| `supplier_product_code` | string | No | Supplier's product code/SKU |
| `lead_time_days` | integer | No | Override supplier default |
| `unit_price` | decimal | No | Negotiated price |
| `currency` | enum | No | Price currency (default from supplier) |
| `moq` | decimal | No | Override supplier default |
| `order_multiple` | decimal | No | Must order in multiples (e.g., 100) |
| `last_purchase_date` | date | No | Auto-updated on PO |
| `last_purchase_price` | decimal | No | Auto-updated on PO |
| `notes` | text | No | Product-specific notes |
| `created_at` | timestamp | Auto | Record creation time |

**Business Rules:**
- Only ONE supplier-product assignment can have `is_default = true` per product
- When creating PO line, default supplier's price/lead time is pre-filled
- System warns if using non-default supplier

### 4.4 UI Components

| Component | Description |
|-----------|-------------|
| **Suppliers Table** | List view with search, filter by active status |
| **Supplier Form Modal** | Create/edit supplier master data |
| **Supplier Detail Page** | View supplier with assigned products |
| **Supplier Products Table** | Products this supplier provides |
| **Assign Product Modal** | Link product to supplier with overrides |

---

## 5. Section 2: Purchase Orders

### 5.1 Overview

Purchase Orders (PO) represent procurement requests to external suppliers. The PO lifecycle includes draft creation, optional approval, confirmation, receiving (in Warehouse module), and closure.

### 5.2 PO Header Fields

| Field | Type | Required | Inherited From | Description |
|-------|------|----------|----------------|-------------|
| `id` | UUID | Auto | - | Primary key |
| `org_id` | UUID | Yes | - | Organization (RLS) |
| `po_number` | string | Auto | - | Unique PO number (e.g., PO-2024-00001) |
| `supplier_id` | UUID | Yes | - | FK to suppliers |
| `currency` | enum | Yes | Supplier | Order currency |
| `tax_code_id` | UUID | Yes | Supplier | Tax code for calculations |
| `expected_delivery_date` | date | Yes | - | Requested delivery date |
| `warehouse_id` | UUID | Yes | - | Receiving warehouse |
| `status` | enum | Yes | Settings | Current status (configurable) |
| `payment_terms` | string | No | Supplier | Payment terms |
| `shipping_method` | string | No | - | Delivery method |
| `notes` | text | No | - | Order notes |
| `internal_notes` | text | No | - | Internal-only notes |
| `approval_status` | enum | No | - | Pending, Approved, Rejected |
| `approved_by` | UUID | No | - | FK to users |
| `approved_at` | timestamp | No | - | Approval timestamp |
| `approval_notes` | text | No | - | Approval/rejection reason |
| `subtotal` | decimal | Calc | - | Sum of line totals |
| `tax_amount` | decimal | Calc | - | subtotal * tax_rate |
| `total` | decimal | Calc | - | subtotal + tax_amount |
| `discount_total` | decimal | Calc | - | Sum of line discounts |
| `created_at` | timestamp | Auto | - | Creation time |
| `updated_at` | timestamp | Auto | - | Last update time |
| `created_by` | UUID | Auto | - | Creator |
| `updated_by` | UUID | Auto | - | Last updater |

**Configurable Fields (toggles in Settings):**
- `payment_terms` - Show/hide payment terms field
- `shipping_method` - Show/hide shipping method field
- `notes` - Show/hide notes field

### 5.3 PO Line Fields

| Field | Type | Required | Inherited From | Description |
|-------|------|----------|----------------|-------------|
| `id` | UUID | Auto | - | Primary key |
| `po_id` | UUID | Yes | - | FK to purchase_orders |
| `line_number` | integer | Auto | - | Line sequence (1, 2, 3...) |
| `product_id` | UUID | Yes | - | FK to products |
| `quantity` | decimal | Yes | - | Ordered quantity |
| `uom` | enum | Yes | Product | Unit of measure |
| `unit_price` | decimal | Yes | Product/Supplier | Unit price |
| `discount_percent` | decimal | No | - | Line discount % |
| `discount_amount` | decimal | Calc | - | Calculated discount |
| `line_total` | decimal | Calc | - | (qty * price) - discount |
| `expected_delivery_date` | date | No | Header | Line-level delivery date |
| `confirmed_delivery_date` | date | No | - | Supplier-confirmed date |
| `received_qty` | decimal | No | - | Quantity received so far |
| `notes` | text | No | - | Line notes |
| `created_at` | timestamp | Auto | - | Creation time |
| `updated_at` | timestamp | Auto | - | Last update time |

**Calculated Fields:**
```
discount_amount = quantity * unit_price * (discount_percent / 100)
line_total = (quantity * unit_price) - discount_amount
```

### 5.4 PO Status Lifecycle

**Default Statuses (configurable per organization):**

```
                    ┌─────────────────┐
                    │      DRAFT      │
                    └────────┬────────┘
                             │ Submit
                             v
                    ┌─────────────────┐
          ┌─────────│    SUBMITTED    │─────────┐
          │         └────────┬────────┘         │
          │ (if approval     │                  │ (if no approval
          │  required)       │ Auto-approve     │  required)
          v                  │                  │
┌─────────────────┐          │          ┌───────v───────┐
│ PENDING_APPROVAL│──────────┼──────────│   CONFIRMED   │
└────────┬────────┘          │          └───────┬───────┘
         │ Approve           │                  │ Partial receive
         v                   │                  v
┌─────────────────┐          │          ┌───────────────┐
│    APPROVED     │──────────┘          │   RECEIVING   │
└────────┬────────┘                     └───────┬───────┘
         │ Send to supplier                     │ Full receive
         v                                      v
┌─────────────────┐                     ┌───────────────┐
│   CONFIRMED     │─────────────────────│    CLOSED     │
└─────────────────┘                     └───────────────┘
```

**Status Transitions:**

| From | To | Trigger | Conditions |
|------|-----|---------|------------|
| Draft | Submitted | User submits | Lines > 0 |
| Submitted | Pending Approval | Auto | approval_required = true |
| Submitted | Confirmed | Auto | approval_required = false |
| Pending Approval | Approved | Manager approves | User has approve permission |
| Pending Approval | Rejected | Manager rejects | User has approve permission |
| Approved | Confirmed | User confirms | - |
| Confirmed | Receiving | First GRN created | received_qty > 0 |
| Receiving | Closed | Full receipt | All lines fully received |
| Any | Cancelled | User cancels | No receipts recorded |

### 5.5 Bulk PO Creation

**Feature:** Create multiple POs at once by importing products, auto-grouping by default supplier.

**Workflow:**
1. User opens Bulk PO modal
2. Enters products + quantities (form or Excel import)
3. System looks up default supplier for each product
4. System groups products by supplier
5. System creates one draft PO per supplier
6. User reviews and edits drafts
7. User submits all or selected POs

**Excel Import Format:**

| Column | Required | Description |
|--------|----------|-------------|
| Product Code | Yes | Product code or SKU |
| Quantity | Yes | Order quantity |
| Expected Delivery | No | Override default date |
| Notes | No | Line notes |

**Example:**
```
Input:
| Product Code | Qty  |
|--------------|------|
| RM-FLOUR-001 | 1000 | → Supplier: Mill Co.
| RM-SUGAR-001 | 500  | → Supplier: Sugar Inc.
| RM-SALT-001  | 200  | → Supplier: Mill Co.
| PKG-BOX-001  | 5000 | → Supplier: Pack Ltd.

Output:
- PO-001 (Mill Co.): RM-FLOUR-001 (1000), RM-SALT-001 (200)
- PO-002 (Sugar Inc.): RM-SUGAR-001 (500)
- PO-003 (Pack Ltd.): PKG-BOX-001 (5000)
```

### 5.6 PO Approval Workflow

**Configurable in Settings:**

| Setting | Type | Description |
|---------|------|-------------|
| `require_approval` | boolean | Enable/disable approval |
| `approval_threshold` | decimal | Require approval above this amount |
| `approval_roles` | array | Roles that can approve |

**Approval Process:**
1. PO submitted with `approval_required = true`
2. Status changes to `pending_approval`
3. Notification sent to approvers
4. Approver reviews PO details and lines
5. Approver approves (with optional notes) or rejects (with reason)
6. Status changes to `approved` or `rejected`
7. If approved, user can confirm and send to supplier

### 5.7 PO Templates (Phase 2)

**Feature:** Save PO configurations as reusable templates for recurring orders.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `org_id` | UUID | Organization |
| `name` | string | Template name |
| `description` | text | Template description |
| `supplier_id` | UUID | Default supplier |
| `warehouse_id` | UUID | Default warehouse |
| `frequency` | enum | weekly, biweekly, monthly, custom |
| `auto_generate` | boolean | Auto-create PO on schedule |
| `next_generate_date` | date | Next scheduled generation |
| `is_active` | boolean | Active/inactive |

**Template Lines:**

| Field | Type | Description |
|-------|------|-------------|
| `template_id` | UUID | FK to po_templates |
| `product_id` | UUID | Product |
| `quantity` | decimal | Default quantity |
| `notes` | text | Line notes |

### 5.8 Blanket POs (Phase 2)

**Feature:** Long-term purchase agreements with release scheduling.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `po_id` | UUID | Parent PO |
| `is_blanket` | boolean | Blanket PO flag |
| `total_commitment` | decimal | Total agreed quantity |
| `released_qty` | decimal | Quantity released so far |
| `agreement_start` | date | Agreement start date |
| `agreement_end` | date | Agreement end date |
| `price_locked` | boolean | Price locked for duration |

**Release Orders:**
- Created from blanket PO
- Reference parent PO
- Deduct from commitment quantity
- Inherit blanket pricing

### 5.9 UI Components

| Component | Description |
|-----------|-------------|
| **PO List Table** | Filterable list with status badges |
| **PO Fast Flow** | Quick bulk entry with product autocomplete |
| **PO Form Modal** | Create/edit PO with supplier selection |
| **PO Detail Page** | Full PO view with lines, history |
| **PO Lines Table** | Editable line items |
| **Add Line Modal** | Add product with pricing |
| **Approval Modal** | Approve/reject with notes |
| **Bulk Import Modal** | Excel upload interface |
| **PO Stats Cards** | Summary metrics |

---

## 6. Section 3: Transfer Orders

### 6.1 Overview

Transfer Orders (TO) manage inventory movements between warehouses within the same organization. Unlike external shipments, TOs move inventory without changing ownership.

### 6.2 TO Header Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `org_id` | UUID | Yes | Organization (RLS) |
| `to_number` | string | Auto | Unique TO number (e.g., TO-2024-00001) |
| `from_warehouse_id` | UUID | Yes | Source warehouse |
| `to_warehouse_id` | UUID | Yes | Destination warehouse |
| `planned_ship_date` | date | Yes | Planned shipping date |
| `planned_receive_date` | date | Yes | Planned arrival date |
| `actual_ship_date` | date | No | Actual ship date |
| `actual_receive_date` | date | No | Actual receive date |
| `status` | enum | Yes | Current status |
| `priority` | enum | No | Low, Normal, High, Urgent |
| `notes` | text | No | Order notes |
| `shipped_by` | UUID | No | User who shipped |
| `received_by` | UUID | No | User who received |
| `created_at` | timestamp | Auto | Creation time |
| `updated_at` | timestamp | Auto | Last update |
| `created_by` | UUID | Auto | Creator |

### 6.3 TO Line Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `to_id` | UUID | Yes | FK to transfer_orders |
| `line_number` | integer | Auto | Line sequence |
| `product_id` | UUID | Yes | FK to products |
| `quantity` | decimal | Yes | Requested quantity |
| `uom` | enum | Yes | Unit of measure (from Product) |
| `shipped_qty` | decimal | No | Quantity shipped |
| `received_qty` | decimal | No | Quantity received |
| `notes` | text | No | Line notes |
| `created_at` | timestamp | Auto | Creation time |

### 6.4 TO LP Selection

**Feature:** Optionally pre-select specific License Plates for transfer.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `to_line_id` | UUID | FK to to_lines |
| `lp_id` | UUID | FK to license_plates |
| `quantity` | decimal | Quantity from this LP |
| `created_at` | timestamp | Creation time |

**Workflow Options:**

1. **Without LP Pre-Selection:**
   - User creates TO with product + quantity
   - At shipping, warehouse staff selects LPs
   - FIFO/FEFO picking rules apply

2. **With LP Pre-Selection (toggle in Settings):**
   - User creates TO and assigns specific LPs
   - System validates LP availability
   - At shipping, selected LPs are picked

### 6.5 TO Status Lifecycle

```
┌─────────────────┐
│      DRAFT      │
└────────┬────────┘
         │ Release
         v
┌─────────────────┐
│     PLANNED     │
└────────┬────────┘
         │ Ship (partial or full)
         v
┌─────────────────┐     ┌───────────────────┐
│     SHIPPED     │────►│ PARTIALLY_SHIPPED │
└────────┬────────┘     └─────────┬─────────┘
         │ Receive                │ More shipments
         v                        v
┌─────────────────┐     ┌───────────────────┐
│    RECEIVED     │◄────│ PARTIALLY_RECEIVED│
└────────┬────────┘     └───────────────────┘
         │ Close
         v
┌─────────────────┐
│     CLOSED      │
└─────────────────┘
```

**Partial Shipments (configurable):**
- When `allow_partial_shipments = true` in settings
- TO can be shipped in multiple shipments
- Each shipment updates `shipped_qty` on lines
- Status shows `partially_shipped` until all lines shipped

### 6.6 UI Components

| Component | Description |
|-----------|-------------|
| **TO List Table** | Filterable list with status badges |
| **TO Form Modal** | Create TO with warehouse selection |
| **TO Detail Page** | Full TO view with lines |
| **TO Lines Table** | Line items with shipped/received qty |
| **LP Selection Modal** | Choose specific LPs for transfer |
| **Ship TO Modal** | Record shipment |
| **Receive TO Modal** | Record receipt |

---

## 7. Section 4: Work Orders

### 7.1 Overview

Work Orders (WO) represent production jobs. When created, the WO captures a snapshot of the BOM and optionally the Routing, which becomes immutable during production.

### 7.2 WO Header Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Primary key |
| `org_id` | UUID | Yes | Organization (RLS) |
| `wo_number` | string | Auto | Unique WO number (e.g., WO-2024-00001) |
| `product_id` | UUID | Yes | Product to produce |
| `bom_id` | UUID | Yes | BOM used (auto-selected or override) |
| `routing_id` | UUID | No | Routing used (optional) |
| `quantity` | decimal | Yes | Quantity to produce |
| `uom` | enum | Yes | Unit of measure (from Product) |
| `scheduled_date` | date | Yes | Planned production date |
| `scheduled_start_time` | time | No | Planned start time |
| `scheduled_end_time` | time | No | Planned end time |
| `line_id` | UUID | No | Production line assignment |
| `machine_id` | UUID | No | Machine assignment |
| `status` | enum | Yes | Current status |
| `priority` | enum | No | Low, Normal, High, Critical |
| `source_of_demand` | enum | No | Manual, PO, Customer Order, Forecast |
| `source_reference` | string | No | Reference number (PO-001, ORD-123) |
| `expiry_date` | date | No | WO expiry (auto-close after this date) |
| `notes` | text | No | Production notes |
| `started_at` | timestamp | No | Actual start time |
| `completed_at` | timestamp | No | Actual completion time |
| `paused_at` | timestamp | No | Last pause time |
| `pause_reason` | text | No | Reason for pause |
| `actual_qty` | decimal | No | Actually produced quantity |
| `yield_percent` | decimal | Calc | (actual_qty / quantity) * 100 |
| `created_at` | timestamp | Auto | Creation time |
| `updated_at` | timestamp | Auto | Last update |
| `created_by` | UUID | Auto | Creator |

### 7.3 BOM Auto-Selection

**Logic:**
1. User selects Product and Scheduled Date
2. System queries active BOMs for product:
   ```sql
   SELECT * FROM boms
   WHERE product_id = :product_id
     AND status = 'active'
     AND effective_from <= :scheduled_date
     AND (effective_to IS NULL OR effective_to >= :scheduled_date)
   ORDER BY effective_from DESC
   LIMIT 1
   ```
3. If multiple match, select most recent `effective_from`
4. User can override selection
5. If no active BOM found, show warning but allow manual selection

### 7.4 WO Materials (BOM Snapshot)

**At WO creation, BOM items are copied to `wo_materials`:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `wo_id` | UUID | FK to work_orders |
| `product_id` | UUID | Material product |
| `quantity` | decimal | Required qty (scaled from BOM) |
| `uom` | enum | Unit of measure |
| `scrap_percent` | decimal | Expected scrap % |
| `consume_whole_lp` | boolean | 1:1 LP consumption flag |
| `is_by_product` | boolean | By-product flag |
| `yield_percent` | decimal | By-product yield |
| `condition_flags` | jsonb | Conditional flags (organic, vegan, etc.) |
| `operation_id` | UUID | Assigned operation (Phase 2) |
| `consumed_qty` | decimal | Actually consumed (updated during production) |
| `reserved_qty` | decimal | Reserved from inventory |
| `created_at` | timestamp | Creation time |

**Quantity Scaling:**
```
wo_material.quantity = bom_item.quantity * (wo.quantity / bom.output_qty) * (1 + scrap_percent/100)
```

**Immutability:** Once WO status = `released`, `wo_materials` cannot be modified (even if source BOM changes).

### 7.5 WO Operations (Routing Copy)

**When `wo_copy_routing = true` in Settings:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `wo_id` | UUID | FK to work_orders |
| `sequence` | integer | Operation order |
| `operation_name` | string | Operation name |
| `description` | text | Operation description |
| `machine_id` | UUID | Assigned machine |
| `line_id` | UUID | Assigned line |
| `expected_duration_minutes` | integer | Planned duration |
| `expected_yield_percent` | decimal | Expected yield |
| `actual_duration_minutes` | integer | Actual duration (filled during production) |
| `actual_yield_percent` | decimal | Actual yield |
| `status` | enum | not_started, in_progress, completed |
| `started_at` | timestamp | Start time |
| `completed_at` | timestamp | Completion time |
| `started_by` | UUID | Operator who started |
| `completed_by` | UUID | Operator who completed |
| `notes` | text | Operation notes |

### 7.6 Material Availability Check

**At WO creation (if `wo_material_check = true` in Settings):**

1. Calculate required materials from BOM snapshot
2. Query available inventory:
   ```sql
   SELECT product_id, SUM(quantity) as available
   FROM license_plates
   WHERE product_id IN (:material_ids)
     AND warehouse_id = :warehouse_id
     AND status = 'available'
   GROUP BY product_id
   ```
3. Compare required vs available
4. Display warnings:
   - Green: available >= required * 1.2 (comfortable)
   - Yellow: required <= available < required * 1.2 (low)
   - Red: available < required (insufficient)
5. User can proceed despite warnings (materials may be incoming)

### 7.7 Material Reservation (Phase 1)

**Soft Reservation:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `wo_id` | UUID | FK to work_orders |
| `wo_material_id` | UUID | FK to wo_materials |
| `lp_id` | UUID | Reserved LP |
| `quantity` | decimal | Reserved quantity |
| `reserved_at` | timestamp | Reservation time |
| `reserved_by` | UUID | User who reserved |
| `released_at` | timestamp | Release time (if cancelled) |

**Rules:**
- Reservations are "soft" - don't block other WOs
- Reserved LPs shown with indicator in warehouse views
- On WO cancellation, reservations auto-release
- On WO completion, reservations converted to consumption

### 7.8 WO Status Lifecycle

```
┌─────────────────┐
│      DRAFT      │
└────────┬────────┘
         │ Plan
         v
┌─────────────────┐
│     PLANNED     │
└────────┬────────┘
         │ Release
         v
┌─────────────────┐
│    RELEASED     │
└────────┬────────┘
         │ Start
         v
┌─────────────────┐     ┌───────────────┐
│   IN_PROGRESS   │◄───►│    ON_HOLD    │
└────────┬────────┘     └───────────────┘
         │ Complete
         v
┌─────────────────┐
│    COMPLETED    │
└────────┬────────┘
         │ Close (auto or manual)
         v
┌─────────────────┐
│     CLOSED      │
└─────────────────┘
```

**Status Transitions:**

| From | To | Trigger | Validation |
|------|-----|---------|------------|
| Draft | Planned | User plans | Materials defined |
| Planned | Released | User releases | Material availability checked |
| Released | In Progress | Operator starts | WO scanned or manual start |
| In Progress | On Hold | Operator pauses | Reason required |
| On Hold | In Progress | Operator resumes | - |
| In Progress | Completed | Operator completes | Output qty > 0 |
| Completed | Closed | Auto or manual | All outputs recorded |

**Optional Statuses:**
- `quality_hold` - Awaiting QA release
- `cancelled` - WO cancelled before completion

### 7.9 Gantt Chart View

**Feature:** Visual schedule of WOs across production lines.

| Element | Description |
|---------|-------------|
| Y-axis | Production lines / machines |
| X-axis | Time (days/hours) |
| Bars | Work orders (color by status) |
| Interactions | Drag to reschedule, click for details |

### 7.10 UI Components

| Component | Description |
|-----------|-------------|
| **WO List Table** | Filterable list with status badges |
| **WO Spreadsheet View** | Quick inline editing |
| **WO Form Modal** | Create WO with BOM preview |
| **WO Detail Page** | Full WO view with materials, operations |
| **Material Availability Panel** | Stock check results |
| **WO Operations List** | Operation sequence with status |
| **Gantt Chart** | Visual schedule view |
| **WO Stats Cards** | Summary metrics |

---

## 8. Section 5: Planning Dashboard

### 8.1 Overview

Central dashboard providing real-time visibility into planning activities, KPIs, alerts, and upcoming orders.

### 8.2 KPI Cards

| KPI | Calculation | Target |
|-----|-------------|--------|
| **Open POs** | COUNT where status NOT IN (closed, cancelled) | Context-dependent |
| **POs Pending Approval** | COUNT where approval_status = 'pending' | < 5 |
| **Overdue POs** | COUNT where expected_delivery_date < today AND status != 'closed' | 0 |
| **Open TOs** | COUNT where status NOT IN (closed, received) | Context-dependent |
| **WOs Scheduled Today** | COUNT where scheduled_date = today | Context-dependent |
| **WOs In Progress** | COUNT where status = 'in_progress' | Capacity-dependent |
| **Material Shortages** | COUNT of products below reorder point | 0 |
| **Supplier Lead Time Avg** | AVG(lead_time_days) for active suppliers | < 7 days |

### 8.3 Alert Panels

**PO Alerts:**
- POs overdue for delivery (expected_date < today, not closed)
- POs pending approval > 2 days
- POs from inactive suppliers

**TO Alerts:**
- TOs overdue for shipment
- TOs with partial shipments > 3 days

**WO Alerts:**
- WOs with material shortages
- WOs on hold > 24 hours
- WOs past scheduled date

**Inventory Alerts (Phase 2):**
- Products below safety stock
- Products approaching reorder point
- Expiring inventory (FEFO)

### 8.4 Upcoming Orders Section

| View | Content |
|------|---------|
| **PO Calendar** | Expected deliveries by date |
| **WO Schedule** | Scheduled production by date/line |
| **TO Timeline** | Planned transfers |

### 8.5 Quick Actions

| Action | Description |
|--------|-------------|
| Create PO | Quick PO creation modal |
| Create TO | Quick TO creation modal |
| Create WO | Quick WO creation modal |
| Bulk PO Import | Excel import flow |
| View All POs | Navigate to PO list |
| View All WOs | Navigate to WO list |

### 8.6 UI Components

| Component | Description |
|-----------|-------------|
| **Planning Header** | Module title + quick actions |
| **Planning Stats Cards** | KPI tiles |
| **Top PO Cards** | Urgent/recent POs |
| **Top WO Cards** | Urgent/scheduled WOs |
| **Top TO Cards** | Open transfers |
| **Alert Panel** | Grouped alerts by type |
| **Calendar Widget** | Delivery/production calendar |

---

## 9. Section 6: Planning Settings

### 9.1 Overview

Configurable settings that control Planning module behavior, field visibility, and workflow rules.

### 9.2 PO Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `po_statuses` | array | See below | Available statuses |
| `po_default_status` | string | 'draft' | Initial status |
| `po_require_approval` | boolean | false | Enable approval workflow |
| `po_approval_threshold` | decimal | null | Require approval above amount |
| `po_approval_roles` | array | ['admin', 'manager'] | Who can approve |
| `po_auto_number_prefix` | string | 'PO-' | Number prefix |
| `po_auto_number_format` | string | 'YYYY-NNNNN' | Number format |
| `po_field_visibility` | jsonb | See below | Field toggles |

**Default PO Statuses:**
```json
["draft", "submitted", "pending_approval", "approved", "confirmed", "receiving", "closed", "cancelled"]
```

**PO Field Visibility:**
```json
{
  "payment_terms": { "visible": true, "mandatory": false },
  "shipping_method": { "visible": true, "mandatory": false },
  "notes": { "visible": true, "mandatory": false },
  "internal_notes": { "visible": true, "mandatory": false }
}
```

### 9.3 TO Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `to_statuses` | array | See below | Available statuses |
| `to_default_status` | string | 'draft' | Initial status |
| `to_allow_partial_shipments` | boolean | true | Allow partial ship |
| `to_require_lp_selection` | boolean | false | Must select LPs upfront |
| `to_auto_number_prefix` | string | 'TO-' | Number prefix |
| `to_auto_number_format` | string | 'YYYY-NNNNN' | Number format |

**Default TO Statuses:**
```json
["draft", "planned", "partially_shipped", "shipped", "partially_received", "received", "closed"]
```

### 9.4 WO Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `wo_statuses` | array | See below | Available statuses |
| `wo_default_status` | string | 'draft' | Initial status |
| `wo_status_expiry_days` | integer | null | Auto-close after X days |
| `wo_source_of_demand` | boolean | false | Show source field |
| `wo_material_check` | boolean | true | Check availability on create |
| `wo_copy_routing` | boolean | true | Copy routing operations |
| `wo_auto_select_bom` | boolean | true | Auto-select active BOM |
| `wo_require_bom` | boolean | true | BOM required to create WO |
| `wo_allow_overproduction` | boolean | false | Allow qty > planned |
| `wo_overproduction_limit` | decimal | 10 | Max overproduction % |
| `wo_auto_number_prefix` | string | 'WO-' | Number prefix |
| `wo_auto_number_format` | string | 'YYYY-NNNNN' | Number format |

**Default WO Statuses:**
```json
["draft", "planned", "released", "in_progress", "on_hold", "completed", "closed", "cancelled"]
```

### 9.5 MRP Settings (Phase 2)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `mrp_enabled` | boolean | false | Enable MRP features |
| `safety_stock_days` | integer | 7 | Default safety stock (days of demand) |
| `forecast_horizon_days` | integer | 30 | Forecast period |
| `forecast_method` | enum | 'moving_avg' | Forecasting algorithm |
| `auto_po_enabled` | boolean | false | Enable auto PO generation |
| `auto_po_lead_time_buffer` | integer | 2 | Days before lead time to order |
| `auto_wo_enabled` | boolean | false | Enable auto WO generation |

### 9.6 UI Components

| Component | Description |
|-----------|-------------|
| **Planning Settings Page** | `/settings/planning` |
| **PO Settings Section** | PO-specific config |
| **TO Settings Section** | TO-specific config |
| **WO Settings Section** | WO-specific config |
| **MRP Settings Section** | MRP config (Phase 2) |
| **Status Editor** | Drag-drop status management |

---

## 10. Section 7: Demand Forecasting (Phase 2)

### 10.1 Overview

Basic demand forecasting using historical consumption data to predict future material needs.

### 10.2 Forecasting Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Moving Average** | Average of last N periods | Stable demand patterns |
| **Weighted Moving Avg** | Recent periods weighted higher | Trending demand |
| **Seasonal Adjustment** | Adjusts for seasonal patterns | Food with seasonal demand |

### 10.3 Data Model

**Product Demand History:**

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | UUID | Product |
| `period_date` | date | Week/month start date |
| `period_type` | enum | weekly, monthly |
| `consumed_qty` | decimal | Actual consumption |
| `produced_qty` | decimal | Actual production |
| `sold_qty` | decimal | Actual sales (from Shipping) |

**Forecasts:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | Product |
| `forecast_date` | date | Forecast period start |
| `forecast_qty` | decimal | Predicted demand |
| `confidence` | decimal | Confidence % |
| `method_used` | enum | Algorithm used |
| `generated_at` | timestamp | When generated |

### 10.4 Safety Stock Calculation

```
Safety Stock = Average Daily Demand * Safety Stock Days * (1 + Demand Variability)

Where:
- Average Daily Demand = Total consumption / Days in period
- Safety Stock Days = Setting (default: 7)
- Demand Variability = StdDev(daily_demand) / Avg(daily_demand)
```

### 10.5 Reorder Point Calculation

```
Reorder Point = (Average Daily Demand * Lead Time Days) + Safety Stock

Where:
- Lead Time Days = Supplier lead time + buffer
```

### 10.6 Functional Requirements

**FR-PLAN-030: Historical Demand Tracking**
- **Priority:** Should Have (Phase 2)
- **Description:** Track historical consumption, production, and sales data by product
- **Acceptance Criteria:**
  - System records daily/weekly consumption from WO completions
  - System records daily/weekly production from WO outputs
  - System records sales from shipped SOs (integration with Shipping)
  - Data retained for minimum 2 years

**FR-PLAN-031: Basic Demand Forecasting**
- **Priority:** Should Have (Phase 2)
- **Description:** Generate demand forecasts using historical data
- **Acceptance Criteria:**
  - User can generate forecasts for product/product group
  - System uses moving average as default method
  - Forecasts show 7, 14, 30 day horizons
  - Forecasts display confidence level

**FR-PLAN-032: Safety Stock Management**
- **Priority:** Should Have (Phase 2)
- **Description:** Calculate and maintain safety stock levels
- **Acceptance Criteria:**
  - System calculates safety stock per product
  - User can override calculated values
  - Dashboard shows products below safety stock
  - Alerts generated when safety stock breached

**FR-PLAN-033: Reorder Point Alerts**
- **Priority:** Should Have (Phase 2)
- **Description:** Alert when inventory reaches reorder point
- **Acceptance Criteria:**
  - System calculates reorder points per product
  - Dashboard shows products at/below reorder point
  - Optional email notifications
  - Drill-down to suggested PO

---

## 11. Section 8: MRP/MPS (Phase 2)

### 11.1 Overview

Material Requirements Planning (MRP) and Master Production Schedule (MPS) for coordinating material procurement with production schedules.

### 11.2 MPS (Master Production Schedule)

**Purpose:** Define what to produce, when, and in what quantity.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | Finished goods product |
| `period_date` | date | Production period |
| `planned_qty` | decimal | Scheduled production |
| `confirmed_qty` | decimal | Firm planned qty |
| `actual_qty` | decimal | Actually produced |
| `source` | enum | manual, forecast, customer_order |

### 11.3 MRP Logic

**MRP Calculation Steps:**

1. **Gross Requirements**
   - From MPS (production schedule)
   - From Sales Orders (customer demand)
   - From Forecasts (predicted demand)

2. **Scheduled Receipts**
   - Open PO lines not yet received
   - Open TO lines incoming
   - Open WO outputs (for WIP/components)

3. **Projected Available**
   ```
   Projected Available = On Hand + Scheduled Receipts - Gross Requirements
   ```

4. **Net Requirements**
   ```
   If Projected Available < Safety Stock:
     Net Requirement = Gross Requirement - Projected Available + Safety Stock
   ```

5. **Planned Order Release**
   ```
   Order Date = Requirement Date - Lead Time - Buffer Days
   Order Qty = MAX(Net Requirement, MOQ, Economic Order Qty)
   ```

### 11.4 MRP Output

**Suggested Purchase Orders:**

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | UUID | Material to order |
| `supplier_id` | UUID | Suggested supplier |
| `quantity` | decimal | Suggested quantity |
| `required_date` | date | Date needed |
| `order_date` | date | Suggested order date |
| `status` | enum | suggested, accepted, rejected |

**Suggested Work Orders:**

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | UUID | Product to produce |
| `quantity` | decimal | Suggested quantity |
| `required_date` | date | Date needed |
| `start_date` | date | Suggested start date |
| `status` | enum | suggested, accepted, rejected |

### 11.5 Functional Requirements

**FR-PLAN-034: Master Production Schedule**
- **Priority:** Should Have (Phase 2)
- **Description:** Define and manage production schedule for finished goods
- **Acceptance Criteria:**
  - User can create MPS entries manually
  - System generates MPS from forecasts
  - MPS shows planned vs actual production
  - MPS drives MRP calculations

**FR-PLAN-035: MRP Calculation Engine**
- **Priority:** Should Have (Phase 2)
- **Description:** Calculate material requirements from production schedule
- **Acceptance Criteria:**
  - System explodes BOM to calculate material needs
  - System considers on-hand inventory
  - System considers open POs and WOs
  - System generates net requirements

**FR-PLAN-036: Suggested Order Generation**
- **Priority:** Should Have (Phase 2)
- **Description:** Generate suggested POs and WOs from MRP
- **Acceptance Criteria:**
  - System generates PO suggestions with quantities/dates
  - System generates WO suggestions with quantities/dates
  - User can accept, modify, or reject suggestions
  - Accepted suggestions create draft orders

**FR-PLAN-037: MRP Dashboard**
- **Priority:** Should Have (Phase 2)
- **Description:** Visual dashboard for MRP results
- **Acceptance Criteria:**
  - Timeline view of material requirements
  - Coverage analysis (days of stock)
  - Exception list (shortages, excesses)
  - Drill-down to affected WOs/POs

---

## 12. Section 9: Auto-Replenishment (Phase 2)

### 12.1 Overview

Automatic PO generation when inventory falls below minimum thresholds.

### 12.2 Replenishment Rules

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | Product |
| `warehouse_id` | UUID | Warehouse (null = all) |
| `supplier_id` | UUID | Preferred supplier |
| `reorder_point` | decimal | Trigger level |
| `reorder_qty` | decimal | Order quantity |
| `reorder_method` | enum | fixed_qty, economic_qty, days_supply |
| `days_supply` | integer | If method = days_supply |
| `max_stock` | decimal | Maximum stock level |
| `is_active` | boolean | Rule active |
| `last_triggered` | timestamp | Last auto-PO |

### 12.3 Replenishment Methods

| Method | Description | Formula |
|--------|-------------|---------|
| **Fixed Quantity** | Always order same qty | reorder_qty |
| **Economic Order Qty** | Balance holding/ordering costs | sqrt(2*D*S/H) |
| **Days Supply** | Order X days of demand | avg_daily_demand * days_supply |
| **Up to Max** | Order to reach max stock | max_stock - current_stock |

### 12.4 Auto-PO Generation

**Trigger Conditions:**
1. Inventory check runs (scheduled or on change)
2. Product available qty <= reorder_point
3. No open PO for product exists (avoid duplicates)
4. Auto-replenishment enabled for product

**Process:**
1. System detects low stock
2. Creates draft PO with calculated quantity
3. Assigns to default supplier
4. Sets expected date = today + lead_time + buffer
5. Optionally auto-submits if approval not required
6. Sends notification to purchaser

### 12.5 Functional Requirements

**FR-PLAN-038: Replenishment Rules**
- **Priority:** Should Have (Phase 2)
- **Description:** Define automatic reorder rules per product
- **Acceptance Criteria:**
  - User can create rules per product/warehouse
  - Rules include reorder point, quantity, method
  - Rules can be activated/deactivated
  - Rules show last trigger time

**FR-PLAN-039: Auto PO Generation**
- **Priority:** Should Have (Phase 2)
- **Description:** Automatically create POs when stock low
- **Acceptance Criteria:**
  - System monitors inventory levels
  - System creates draft POs when conditions met
  - System avoids duplicate POs
  - Notifications sent to purchasers

**FR-PLAN-040: Replenishment Dashboard**
- **Priority:** Could Have (Phase 2)
- **Description:** Monitor auto-replenishment activity
- **Acceptance Criteria:**
  - View products with active rules
  - View auto-generated POs
  - View products approaching reorder point
  - Rule performance metrics

---

## 13. Section 10: Supplier Quality Management (Phase 3)

### 13.1 Overview

Manage supplier quality through audits, scorecards, and approved supplier lists.

### 13.2 Approved Supplier List (ASL)

**Concept:** Products can only be purchased from approved suppliers.

| Field | Type | Description |
|-------|------|-------------|
| `supplier_id` | UUID | Supplier |
| `product_category` | string | Category approved for |
| `approval_status` | enum | pending, approved, suspended, revoked |
| `approved_date` | date | Approval date |
| `approved_by` | UUID | Approver |
| `expiry_date` | date | Re-approval due |
| `notes` | text | Approval notes |

**Business Rules:**
- When ASL enabled, POs blocked for non-approved suppliers
- Warning when creating PO for supplier with expiring approval
- Suspension removes from PO suggestions

### 13.3 Supplier Scorecards

| Metric | Description | Weight |
|--------|-------------|--------|
| **Quality Score** | % of receipts passing QA | 30% |
| **Delivery Score** | % on-time deliveries | 30% |
| **Quantity Score** | % correct quantities | 20% |
| **Documentation Score** | CoA completeness | 10% |
| **Price Score** | Price competitiveness | 10% |

**Overall Score:**
```
Supplier Rating = SUM(Metric * Weight) / 100
Scale: 1-5 stars (5 = excellent)
```

### 13.4 Supplier Audits

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `supplier_id` | UUID | Supplier |
| `audit_type` | enum | initial, periodic, unannounced, incident |
| `audit_date` | date | Audit date |
| `auditor` | string | Auditor name |
| `score` | decimal | Audit score (0-100) |
| `result` | enum | pass, conditional_pass, fail |
| `findings` | jsonb | Audit findings |
| `corrective_actions` | jsonb | Required actions |
| `next_audit_date` | date | Next audit due |

### 13.5 Functional Requirements

**FR-PLAN-050: Approved Supplier List**
- **Priority:** Could Have (Phase 3)
- **Description:** Manage list of approved suppliers per category
- **Acceptance Criteria:**
  - User can approve/suspend/revoke suppliers
  - System enforces ASL on PO creation (if enabled)
  - Expiring approvals flagged
  - Audit trail of approval changes

**FR-PLAN-051: Supplier Scorecards**
- **Priority:** Could Have (Phase 3)
- **Description:** Automatic calculation of supplier performance scores
- **Acceptance Criteria:**
  - System calculates scores from receipt data
  - Scores updated on each delivery
  - Dashboard shows supplier rankings
  - Trend analysis over time

**FR-PLAN-052: Supplier Audits**
- **Priority:** Could Have (Phase 3)
- **Description:** Record and track supplier quality audits
- **Acceptance Criteria:**
  - User can record audit results
  - Findings linked to corrective actions
  - Due date tracking for next audit
  - Audit history per supplier

---

## 14. Section 11: Capacity Planning (Phase 3)

### 14.1 Overview

Finite capacity scheduling that considers production line and machine availability.

### 14.2 Capacity Model

**Resource Capacity:**

| Field | Type | Description |
|-------|------|-------------|
| `resource_id` | UUID | Line or machine |
| `resource_type` | enum | line, machine |
| `date` | date | Capacity date |
| `shift` | enum | shift1, shift2, shift3 |
| `available_minutes` | integer | Available capacity |
| `planned_minutes` | integer | Already scheduled |
| `efficiency_factor` | decimal | Utilization adjustment |

**Capacity Calculation:**
```
Available Capacity = (Shift Hours * 60) * Efficiency Factor
Used Capacity = SUM(WO Operation Duration)
Remaining Capacity = Available - Used
```

### 14.3 Finite Scheduling

**Scheduling Rules:**

| Rule | Description |
|------|-------------|
| **Forward Scheduling** | Start from today, schedule forward |
| **Backward Scheduling** | Start from due date, schedule backward |
| **Priority-Based** | Schedule by WO priority (critical first) |
| **Changeover Minimization** | Group similar products |

### 14.4 Functional Requirements

**FR-PLAN-060: Resource Capacity Definition**
- **Priority:** Could Have (Phase 3)
- **Description:** Define available capacity per resource
- **Acceptance Criteria:**
  - User can define shifts per line/machine
  - User can set efficiency factors
  - System calculates available capacity
  - Calendar view of capacity

**FR-PLAN-061: Finite Capacity Scheduling**
- **Priority:** Could Have (Phase 3)
- **Description:** Schedule WOs considering capacity constraints
- **Acceptance Criteria:**
  - System prevents over-scheduling
  - System suggests alternative dates/resources
  - Drag-drop rescheduling in Gantt view
  - Conflict detection and resolution

**FR-PLAN-062: Capacity Analytics**
- **Priority:** Could Have (Phase 3)
- **Description:** Analyze capacity utilization
- **Acceptance Criteria:**
  - Utilization charts by resource/period
  - Bottleneck identification
  - What-if scenario modeling
  - Capacity vs demand comparison

---

## 15. Section 12: EDI Integration (Phase 3)

### 15.1 Overview

Electronic Data Interchange for automated order exchange with retail chains and large customers.

### 15.2 Supported Standards

| Standard | Use Case | Priority |
|----------|----------|----------|
| **EDIFACT** | EU retail chains (Tesco, Carrefour) | P1 |
| **ANSI X12** | US customers | P3 |
| **GS1 XML** | Modern implementations | P2 |

### 15.3 Message Types

| Message | Direction | Description |
|---------|-----------|-------------|
| **ORDERS** | Inbound | Customer purchase order |
| **ORDRSP** | Outbound | Order response/acknowledgment |
| **DESADV** | Outbound | Dispatch advice (ASN) |
| **INVOIC** | Outbound | Invoice |
| **RECADV** | Inbound | Receiving advice |

### 15.4 Integration Architecture

```
External System (Retailer)
         │
         │ EDI Messages
         v
┌─────────────────────┐
│   EDI Gateway       │ (Third-party service or self-hosted)
│   - Message parsing │
│   - Validation      │
│   - Translation     │
└──────────┬──────────┘
           │ REST API / Webhook
           v
┌─────────────────────┐
│   MonoPilot API     │
│   - Order import    │
│   - ASN export      │
│   - Invoice export  │
└─────────────────────┘
```

### 15.5 Vendor Managed Inventory (VMI)

**Supplier Portal Features:**
- View customer inventory levels
- See demand forecasts
- Create replenishment orders
- Track shipment status
- Access scorecards

### 15.6 Functional Requirements

**FR-PLAN-070: EDI Order Import**
- **Priority:** Could Have (Phase 3)
- **Description:** Import customer orders via EDI
- **Acceptance Criteria:**
  - Support EDIFACT ORDERS message
  - Auto-create Sales Orders
  - Validation and error handling
  - Acknowledgment generation

**FR-PLAN-071: EDI Dispatch Advice**
- **Priority:** Could Have (Phase 3)
- **Description:** Export ASN to customers via EDI
- **Acceptance Criteria:**
  - Generate DESADV from shipments
  - Include SSCC, lot, expiry data
  - Send via configured gateway
  - Track message status

**FR-PLAN-072: VMI Supplier Portal**
- **Priority:** Won't Have (Phase 4+)
- **Description:** Self-service portal for supplier inventory management
- **Acceptance Criteria:**
  - Supplier login/authentication
  - View inventory levels at customer
  - Create replenishment suggestions
  - Track order status

---

## 16. Functional Requirements

### 16.1 Phase 1 Requirements (Core)

#### Suppliers

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-PLAN-001 | Supplier CRUD | Must Have | Goal: Vendor management |
| FR-PLAN-002 | Supplier-Product Assignment | Must Have | Goal: Product sourcing |
| FR-PLAN-003 | Default Supplier per Product | Must Have | Goal: Auto-fill PO data |
| FR-PLAN-004 | Supplier Lead Time Management | Must Have | Goal: Delivery planning |

**FR-PLAN-001: Supplier CRUD**
- **Priority:** Must Have
- **Description:** Create, read, update, delete supplier master data
- **Acceptance Criteria:**
  - User can create supplier with required fields (code, name, currency, tax code, lead time)
  - User can edit all supplier fields
  - User can deactivate supplier (soft delete)
  - Supplier code unique within organization
  - Validation: email format, phone format
  - Audit trail captured

**FR-PLAN-002: Supplier-Product Assignment**
- **Priority:** Must Have
- **Description:** Link products to suppliers with optional overrides
- **Acceptance Criteria:**
  - User can assign multiple suppliers to one product
  - User can set supplier-specific price, lead time, MOQ
  - User can mark one supplier as default per product
  - System prevents duplicate supplier-product pairs
  - Unassign removes relationship (no cascade delete)

**FR-PLAN-003: Default Supplier per Product**
- **Priority:** Must Have
- **Description:** Automatically select supplier when adding product to PO
- **Acceptance Criteria:**
  - When adding PO line, default supplier's data pre-filled
  - If product has no default supplier, show warning
  - User can override supplier selection
  - Only one default per product enforced

**FR-PLAN-004: Supplier Lead Time Management**
- **Priority:** Must Have
- **Description:** Track lead times at supplier and product level
- **Acceptance Criteria:**
  - Supplier has default lead time
  - Supplier-product can override lead time
  - Lead time used in expected delivery calculation
  - Lead time displayed in supplier/product views

#### Purchase Orders

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-PLAN-005 | PO CRUD | Must Have | Goal: Procurement |
| FR-PLAN-006 | PO Line Management | Must Have | Goal: Order details |
| FR-PLAN-007 | PO Status Lifecycle | Must Have | Goal: Process tracking |
| FR-PLAN-008 | Bulk PO Creation | Must Have | Goal: Efficiency |
| FR-PLAN-009 | PO Approval Workflow | Should Have | Goal: Control |
| FR-PLAN-010 | PO Totals Calculation | Must Have | Goal: Cost visibility |
| FR-PLAN-011 | Configurable PO Statuses | Should Have | Goal: Flexibility |

**FR-PLAN-005: PO CRUD**
- **Priority:** Must Have
- **Description:** Create, read, update, delete purchase orders
- **Acceptance Criteria:**
  - User can create PO with supplier, warehouse, expected date
  - Currency/tax auto-inherited from supplier
  - PO number auto-generated
  - User can edit PO in draft status
  - User cannot delete PO with receipts
  - Status changes audited

**FR-PLAN-006: PO Line Management**
- **Priority:** Must Have
- **Description:** Add, edit, remove line items on PO
- **Acceptance Criteria:**
  - User can add products with quantity and price
  - UoM inherited from product
  - Price defaults from supplier-product or product std_price
  - Line total calculated automatically
  - User can edit lines in draft/submitted status
  - Cannot edit lines after receipt started

**FR-PLAN-007: PO Status Lifecycle**
- **Priority:** Must Have
- **Description:** Enforce PO status transitions
- **Acceptance Criteria:**
  - Status transitions follow defined rules
  - Invalid transitions blocked with error message
  - Status history tracked with timestamps
  - Automatic status changes (e.g., receiving on first receipt)

**FR-PLAN-008: Bulk PO Creation**
- **Priority:** Must Have
- **Description:** Create multiple POs from product list
- **Acceptance Criteria:**
  - User can enter products via form or Excel import
  - System groups by default supplier
  - Creates one draft PO per supplier
  - User can review before submit
  - Products without supplier flagged as warning

**FR-PLAN-009: PO Approval Workflow**
- **Priority:** Should Have
- **Description:** Require approval before PO confirmation
- **Acceptance Criteria:**
  - Toggle in settings to enable/disable
  - Optional threshold amount
  - Only designated roles can approve
  - Approval/rejection captured with notes
  - Notifications sent to approvers

**FR-PLAN-010: PO Totals Calculation**
- **Priority:** Must Have
- **Description:** Calculate PO subtotal, tax, total
- **Acceptance Criteria:**
  - Subtotal = sum of line totals
  - Tax = subtotal * tax_rate
  - Total = subtotal + tax
  - Recalculated on line changes
  - Currency displayed consistently

**FR-PLAN-011: Configurable PO Statuses**
- **Priority:** Should Have
- **Description:** Organization can customize PO status list
- **Acceptance Criteria:**
  - Admin can add/remove/rename statuses
  - Default statuses provided on setup
  - Cannot remove statuses in use
  - Status colors/icons configurable

#### Transfer Orders

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-PLAN-012 | TO CRUD | Must Have | Goal: Internal transfers |
| FR-PLAN-013 | TO Line Management | Must Have | Goal: Transfer details |
| FR-PLAN-014 | TO Status Lifecycle | Must Have | Goal: Process tracking |
| FR-PLAN-015 | Partial Shipments | Should Have | Goal: Flexibility |
| FR-PLAN-016 | LP Selection for TO | Should Have | Goal: Specific inventory |

**FR-PLAN-012: TO CRUD**
- **Priority:** Must Have
- **Description:** Create, read, update, delete transfer orders
- **Acceptance Criteria:**
  - User can create TO with source/dest warehouse
  - TO number auto-generated
  - Planned ship/receive dates required
  - Cannot transfer to same warehouse
  - Cannot delete TO with shipments

**FR-PLAN-013: TO Line Management**
- **Priority:** Must Have
- **Description:** Add, edit, remove line items on TO
- **Acceptance Criteria:**
  - User can add products with quantity
  - UoM inherited from product
  - Shipped/received qty tracked per line
  - Cannot add duplicate products

**FR-PLAN-014: TO Status Lifecycle**
- **Priority:** Must Have
- **Description:** Enforce TO status transitions
- **Acceptance Criteria:**
  - Status transitions follow defined rules
  - Shipped date set when shipped
  - Received date set when received
  - Status history tracked

**FR-PLAN-015: Partial Shipments**
- **Priority:** Should Have
- **Description:** Ship TO in multiple shipments
- **Acceptance Criteria:**
  - Toggle in settings
  - Track shipped_qty vs quantity per line
  - Status shows partially_shipped
  - Each shipment recorded separately

**FR-PLAN-016: LP Selection for TO**
- **Priority:** Should Have
- **Description:** Pre-select specific LPs for transfer
- **Acceptance Criteria:**
  - Toggle in settings to require
  - User can assign LPs to TO lines
  - System validates LP availability
  - Not mandatory unless setting enabled

#### Work Orders

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-PLAN-017 | WO CRUD | Must Have | Goal: Production planning |
| FR-PLAN-018 | BOM Auto-Selection | Must Have | Goal: Accuracy |
| FR-PLAN-019 | BOM Snapshot (wo_materials) | Must Have | Goal: Immutability |
| FR-PLAN-020 | Routing Copy (wo_operations) | Should Have | Goal: Process tracking |
| FR-PLAN-021 | Material Availability Check | Should Have | Goal: Feasibility |
| FR-PLAN-022 | WO Status Lifecycle | Must Have | Goal: Process tracking |
| FR-PLAN-023 | Configurable WO Statuses | Should Have | Goal: Flexibility |
| FR-PLAN-024 | WO Gantt Chart View | Could Have | Goal: Visualization |
| FR-PLAN-025 | Material Reservation | Should Have | Goal: Allocation |

**FR-PLAN-017: WO CRUD**
- **Priority:** Must Have
- **Description:** Create, read, update, delete work orders
- **Acceptance Criteria:**
  - User can create WO with product, quantity, scheduled date
  - WO number auto-generated
  - Line/machine assignment optional
  - Priority and notes optional
  - Cannot delete WO with production activity

**FR-PLAN-018: BOM Auto-Selection**
- **Priority:** Must Have
- **Description:** Automatically select active BOM based on date
- **Acceptance Criteria:**
  - System finds BOM matching scheduled_date
  - If multiple, select most recent
  - User can override selection
  - Warning if no active BOM found
  - BOM preview shown before creation

**FR-PLAN-019: BOM Snapshot (wo_materials)**
- **Priority:** Must Have
- **Description:** Copy BOM items to WO at creation
- **Acceptance Criteria:**
  - All BOM items copied to wo_materials
  - Quantities scaled based on WO qty
  - Scrap % applied
  - By-products included
  - Snapshot immutable after release

**FR-PLAN-020: Routing Copy (wo_operations)**
- **Priority:** Should Have
- **Description:** Copy routing operations to WO
- **Acceptance Criteria:**
  - Toggle in settings
  - Operations copied from routing
  - Expected times included
  - Actual times populated during production
  - Operation status tracking

**FR-PLAN-021: Material Availability Check**
- **Priority:** Should Have
- **Description:** Check material stock when creating WO
- **Acceptance Criteria:**
  - Toggle in settings
  - System queries available inventory
  - Visual indicators (green/yellow/red)
  - Detailed breakdown by material
  - User can proceed with warnings

**FR-PLAN-022: WO Status Lifecycle**
- **Priority:** Must Have
- **Description:** Enforce WO status transitions
- **Acceptance Criteria:**
  - Status transitions follow defined rules
  - Invalid transitions blocked
  - Timestamps captured (started_at, completed_at)
  - Status history tracked

**FR-PLAN-023: Configurable WO Statuses**
- **Priority:** Should Have
- **Description:** Organization can customize WO status list
- **Acceptance Criteria:**
  - Admin can add/remove/rename statuses
  - Default statuses provided
  - Status expiry configurable
  - Cannot remove statuses in use

**FR-PLAN-024: WO Gantt Chart View**
- **Priority:** Could Have
- **Description:** Visual schedule view of work orders
- **Acceptance Criteria:**
  - Timeline view by day/week
  - Group by line/machine
  - Color-coded by status
  - Click for WO details
  - Optional drag-drop rescheduling

**FR-PLAN-025: Material Reservation**
- **Priority:** Should Have
- **Description:** Reserve inventory for WO materials
- **Acceptance Criteria:**
  - User can reserve specific LPs
  - Reserved LPs marked in inventory views
  - Reservations released on WO cancel
  - Reservations converted to consumption on use

### 16.2 Phase 2 Requirements (MRP/Forecasting)

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-PLAN-030 | Historical Demand Tracking | Should Have | Goal: Data foundation |
| FR-PLAN-031 | Basic Demand Forecasting | Should Have | Goal: Prediction |
| FR-PLAN-032 | Safety Stock Management | Should Have | Goal: Buffer stock |
| FR-PLAN-033 | Reorder Point Alerts | Should Have | Goal: Proactive ordering |
| FR-PLAN-034 | Master Production Schedule | Should Have | Goal: Production planning |
| FR-PLAN-035 | MRP Calculation Engine | Should Have | Goal: Material planning |
| FR-PLAN-036 | Suggested Order Generation | Should Have | Goal: Automation |
| FR-PLAN-037 | MRP Dashboard | Should Have | Goal: Visibility |
| FR-PLAN-038 | Replenishment Rules | Should Have | Goal: Auto-ordering |
| FR-PLAN-039 | Auto PO Generation | Should Have | Goal: Automation |
| FR-PLAN-040 | Replenishment Dashboard | Could Have | Goal: Monitoring |
| FR-PLAN-041 | PO Templates | Should Have | Goal: Efficiency |
| FR-PLAN-042 | Blanket POs | Could Have | Goal: Long-term contracts |

### 16.3 Phase 3 Requirements (Enterprise)

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-PLAN-050 | Approved Supplier List | Could Have | Goal: Quality control |
| FR-PLAN-051 | Supplier Scorecards | Could Have | Goal: Performance tracking |
| FR-PLAN-052 | Supplier Audits | Could Have | Goal: Compliance |
| FR-PLAN-060 | Resource Capacity Definition | Could Have | Goal: Capacity mgmt |
| FR-PLAN-061 | Finite Capacity Scheduling | Could Have | Goal: Realistic planning |
| FR-PLAN-062 | Capacity Analytics | Could Have | Goal: Optimization |
| FR-PLAN-070 | EDI Order Import | Could Have | Goal: Automation |
| FR-PLAN-071 | EDI Dispatch Advice | Could Have | Goal: Customer integration |
| FR-PLAN-072 | VMI Supplier Portal | Won't Have | Goal: Supplier collaboration |

---

## 17. Database Schema

### 17.1 Core Tables (Phase 1)

```sql
-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  currency TEXT NOT NULL DEFAULT 'PLN',
  tax_code_id UUID NOT NULL REFERENCES tax_codes(id),
  payment_terms TEXT,
  lead_time_days INTEGER NOT NULL DEFAULT 7,
  moq NUMERIC(15,4),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Phase 3 fields
  approved_supplier BOOLEAN DEFAULT false,
  supplier_rating NUMERIC(3,2),
  last_audit_date DATE,
  next_audit_due DATE,
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  -- Constraints
  UNIQUE(org_id, code)
);

-- Supplier-Product Assignments
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  supplier_product_code TEXT,
  lead_time_days INTEGER,
  unit_price NUMERIC(15,4),
  currency TEXT,
  moq NUMERIC(15,4),
  order_multiple NUMERIC(15,4),
  last_purchase_date DATE,
  last_purchase_price NUMERIC(15,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  currency TEXT NOT NULL,
  tax_code_id UUID NOT NULL REFERENCES tax_codes(id),
  expected_delivery_date DATE NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft',
  payment_terms TEXT,
  shipping_method TEXT,
  notes TEXT,
  internal_notes TEXT,
  approval_status TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  discount_total NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(org_id, po_number)
);

-- PO Lines
CREATE TABLE po_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(15,4) NOT NULL,
  uom TEXT NOT NULL,
  unit_price NUMERIC(15,4) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  expected_delivery_date DATE,
  confirmed_delivery_date DATE,
  received_qty NUMERIC(15,4) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer Orders
CREATE TABLE transfer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  to_number TEXT NOT NULL,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  planned_ship_date DATE NOT NULL,
  planned_receive_date DATE NOT NULL,
  actual_ship_date DATE,
  actual_receive_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  shipped_by UUID REFERENCES users(id),
  received_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(org_id, to_number)
);

-- TO Lines
CREATE TABLE to_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL DEFAULT 1,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(15,4) NOT NULL,
  uom TEXT NOT NULL,
  shipped_qty NUMERIC(15,4) DEFAULT 0,
  received_qty NUMERIC(15,4) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TO Line LP Assignments
CREATE TABLE to_line_lps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_line_id UUID NOT NULL REFERENCES to_lines(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  quantity NUMERIC(15,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_number TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  bom_id UUID NOT NULL REFERENCES boms(id),
  routing_id UUID REFERENCES routings(id),
  quantity NUMERIC(15,4) NOT NULL,
  uom TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  line_id UUID REFERENCES production_lines(id),
  machine_id UUID REFERENCES machines(id),
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT DEFAULT 'normal',
  source_of_demand TEXT,
  source_reference TEXT,
  expiry_date DATE,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  actual_qty NUMERIC(15,4) DEFAULT 0,
  yield_percent NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(org_id, wo_number)
);

-- WO Materials (BOM Snapshot)
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(15,4) NOT NULL,
  uom TEXT NOT NULL,
  scrap_percent NUMERIC(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  is_by_product BOOLEAN DEFAULT false,
  yield_percent NUMERIC(5,2),
  condition_flags JSONB,
  operation_id UUID,
  consumed_qty NUMERIC(15,4) DEFAULT 0,
  reserved_qty NUMERIC(15,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WO Operations (Routing Copy)
CREATE TABLE wo_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  operation_name TEXT NOT NULL,
  description TEXT,
  machine_id UUID REFERENCES machines(id),
  line_id UUID REFERENCES production_lines(id),
  expected_duration_minutes INTEGER,
  expected_yield_percent NUMERIC(5,2),
  actual_duration_minutes INTEGER,
  actual_yield_percent NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_by UUID REFERENCES users(id),
  completed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Reservations
CREATE TABLE wo_material_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  wo_material_id UUID NOT NULL REFERENCES wo_materials(id) ON DELETE CASCADE,
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  quantity NUMERIC(15,4) NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ
);

-- Planning Settings
CREATE TABLE planning_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  -- PO Settings
  po_statuses JSONB NOT NULL DEFAULT '["draft","submitted","pending_approval","approved","confirmed","receiving","closed","cancelled"]',
  po_default_status TEXT NOT NULL DEFAULT 'draft',
  po_require_approval BOOLEAN DEFAULT false,
  po_approval_threshold NUMERIC(15,2),
  po_approval_roles JSONB DEFAULT '["admin","manager"]',
  po_auto_number_prefix TEXT DEFAULT 'PO-',
  po_auto_number_format TEXT DEFAULT 'YYYY-NNNNN',
  po_field_visibility JSONB,
  -- TO Settings
  to_statuses JSONB NOT NULL DEFAULT '["draft","planned","partially_shipped","shipped","partially_received","received","closed"]',
  to_default_status TEXT NOT NULL DEFAULT 'draft',
  to_allow_partial_shipments BOOLEAN DEFAULT true,
  to_require_lp_selection BOOLEAN DEFAULT false,
  to_auto_number_prefix TEXT DEFAULT 'TO-',
  to_auto_number_format TEXT DEFAULT 'YYYY-NNNNN',
  -- WO Settings
  wo_statuses JSONB NOT NULL DEFAULT '["draft","planned","released","in_progress","on_hold","completed","closed","cancelled"]',
  wo_default_status TEXT NOT NULL DEFAULT 'draft',
  wo_status_expiry_days INTEGER,
  wo_source_of_demand BOOLEAN DEFAULT false,
  wo_material_check BOOLEAN DEFAULT true,
  wo_copy_routing BOOLEAN DEFAULT true,
  wo_auto_select_bom BOOLEAN DEFAULT true,
  wo_require_bom BOOLEAN DEFAULT true,
  wo_allow_overproduction BOOLEAN DEFAULT false,
  wo_overproduction_limit NUMERIC(5,2) DEFAULT 10,
  wo_auto_number_prefix TEXT DEFAULT 'WO-',
  wo_auto_number_format TEXT DEFAULT 'YYYY-NNNNN',
  -- MRP Settings (Phase 2)
  mrp_enabled BOOLEAN DEFAULT false,
  safety_stock_days INTEGER DEFAULT 7,
  forecast_horizon_days INTEGER DEFAULT 30,
  forecast_method TEXT DEFAULT 'moving_avg',
  auto_po_enabled BOOLEAN DEFAULT false,
  auto_po_lead_time_buffer INTEGER DEFAULT 2,
  auto_wo_enabled BOOLEAN DEFAULT false,
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 17.2 Phase 2 Tables (MRP/Forecasting)

```sql
-- PO Templates
CREATE TABLE po_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  frequency TEXT, -- weekly, biweekly, monthly, custom
  auto_generate BOOLEAN DEFAULT false,
  next_generate_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PO Template Lines
CREATE TABLE po_template_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES po_templates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(15,4) NOT NULL,
  notes TEXT
);

-- Demand History
CREATE TABLE demand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'weekly',
  consumed_qty NUMERIC(15,4) DEFAULT 0,
  produced_qty NUMERIC(15,4) DEFAULT 0,
  sold_qty NUMERIC(15,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, product_id, period_date, period_type)
);

-- Forecasts
CREATE TABLE demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  forecast_date DATE NOT NULL,
  forecast_qty NUMERIC(15,4) NOT NULL,
  confidence NUMERIC(5,2),
  method_used TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replenishment Rules
CREATE TABLE replenishment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  supplier_id UUID REFERENCES suppliers(id),
  reorder_point NUMERIC(15,4) NOT NULL,
  reorder_qty NUMERIC(15,4),
  reorder_method TEXT DEFAULT 'fixed_qty',
  days_supply INTEGER,
  max_stock NUMERIC(15,4),
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MRP Suggestions
CREATE TABLE mrp_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  suggestion_type TEXT NOT NULL, -- 'po', 'wo'
  product_id UUID NOT NULL REFERENCES products(id),
  supplier_id UUID REFERENCES suppliers(id),
  quantity NUMERIC(15,4) NOT NULL,
  required_date DATE NOT NULL,
  order_date DATE,
  status TEXT DEFAULT 'suggested', -- suggested, accepted, rejected
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_order_id UUID, -- FK to PO or WO
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Production Schedule
CREATE TABLE master_production_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  period_date DATE NOT NULL,
  planned_qty NUMERIC(15,4) NOT NULL DEFAULT 0,
  confirmed_qty NUMERIC(15,4) DEFAULT 0,
  actual_qty NUMERIC(15,4) DEFAULT 0,
  source TEXT, -- manual, forecast, customer_order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, product_id, period_date)
);
```

### 17.3 Phase 3 Tables (Enterprise)

```sql
-- Supplier Approval Status
CREATE TABLE supplier_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  product_category TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_date DATE,
  approved_by UUID REFERENCES users(id),
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Audits
CREATE TABLE supplier_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  audit_type TEXT NOT NULL,
  audit_date DATE NOT NULL,
  auditor TEXT,
  score NUMERIC(5,2),
  result TEXT,
  findings JSONB,
  corrective_actions JSONB,
  next_audit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Capacity
CREATE TABLE resource_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'line', 'machine'
  date DATE NOT NULL,
  shift TEXT,
  available_minutes INTEGER NOT NULL,
  planned_minutes INTEGER DEFAULT 0,
  efficiency_factor NUMERIC(5,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, resource_id, date, shift)
);
```

### 17.4 RLS Policies

```sql
-- All planning tables use standard org_id RLS pattern
CREATE POLICY "tenant_isolation" ON suppliers
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR org_id = (auth.jwt() ->> 'org_id')::uuid
  );

-- Repeat for all planning tables:
-- purchase_orders, po_lines, transfer_orders, to_lines, to_line_lps,
-- work_orders, wo_materials, wo_operations, wo_material_reservations,
-- planning_settings, po_templates, demand_history, demand_forecasts,
-- replenishment_rules, mrp_suggestions, master_production_schedule,
-- supplier_approvals, supplier_audits, resource_capacity
```

### 17.5 Indexes

```sql
-- Suppliers
CREATE INDEX idx_suppliers_org_active ON suppliers(org_id, is_active);
CREATE INDEX idx_supplier_products_product ON supplier_products(product_id);
CREATE INDEX idx_supplier_products_default ON supplier_products(product_id, is_default) WHERE is_default = true;

-- Purchase Orders
CREATE INDEX idx_po_org_status ON purchase_orders(org_id, status);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX idx_po_lines_product ON po_lines(product_id);

-- Transfer Orders
CREATE INDEX idx_to_org_status ON transfer_orders(org_id, status);
CREATE INDEX idx_to_warehouses ON transfer_orders(from_warehouse_id, to_warehouse_id);

-- Work Orders
CREATE INDEX idx_wo_org_status ON work_orders(org_id, status);
CREATE INDEX idx_wo_product ON work_orders(product_id);
CREATE INDEX idx_wo_scheduled ON work_orders(scheduled_date);
CREATE INDEX idx_wo_line ON work_orders(line_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);
```

---

## 18. API Endpoints

### 18.1 Suppliers API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/suppliers` | List suppliers with filters |
| GET | `/api/planning/suppliers/:id` | Get supplier with products |
| POST | `/api/planning/suppliers` | Create supplier |
| PUT | `/api/planning/suppliers/:id` | Update supplier |
| DELETE | `/api/planning/suppliers/:id` | Deactivate supplier |
| GET | `/api/planning/suppliers/:id/products` | Get supplier's products |
| POST | `/api/planning/suppliers/:id/products` | Assign product |
| DELETE | `/api/planning/suppliers/:id/products/:productId` | Remove assignment |

### 18.2 Purchase Orders API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/purchase-orders` | List POs with filters |
| GET | `/api/planning/purchase-orders/:id` | Get PO with lines |
| POST | `/api/planning/purchase-orders` | Create PO |
| PUT | `/api/planning/purchase-orders/:id` | Update PO |
| DELETE | `/api/planning/purchase-orders/:id` | Delete draft PO |
| POST | `/api/planning/purchase-orders/bulk` | Bulk create POs |
| PUT | `/api/planning/purchase-orders/:id/status` | Change status |
| POST | `/api/planning/purchase-orders/:id/submit` | Submit PO |
| POST | `/api/planning/purchase-orders/:id/approve` | Approve PO |
| POST | `/api/planning/purchase-orders/:id/reject` | Reject PO |
| POST | `/api/planning/purchase-orders/:id/lines` | Add line |
| PUT | `/api/planning/purchase-orders/:id/lines/:lineId` | Update line |
| DELETE | `/api/planning/purchase-orders/:id/lines/:lineId` | Remove line |

### 18.3 Transfer Orders API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/transfer-orders` | List TOs with filters |
| GET | `/api/planning/transfer-orders/:id` | Get TO with lines |
| POST | `/api/planning/transfer-orders` | Create TO |
| PUT | `/api/planning/transfer-orders/:id` | Update TO |
| DELETE | `/api/planning/transfer-orders/:id` | Delete draft TO |
| PUT | `/api/planning/transfer-orders/:id/status` | Change status |
| POST | `/api/planning/transfer-orders/:id/lines` | Add line |
| PUT | `/api/planning/transfer-orders/:id/lines/:lineId` | Update line |
| DELETE | `/api/planning/transfer-orders/:id/lines/:lineId` | Remove line |
| PUT | `/api/planning/transfer-orders/:id/lines/:lineId/lps` | Assign LPs |

### 18.4 Work Orders API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/work-orders` | List WOs with filters |
| GET | `/api/planning/work-orders/:id` | Get WO with materials/ops |
| POST | `/api/planning/work-orders` | Create WO (with BOM snapshot) |
| PUT | `/api/planning/work-orders/:id` | Update WO |
| DELETE | `/api/planning/work-orders/:id` | Delete draft WO |
| PUT | `/api/planning/work-orders/:id/status` | Change status |
| GET | `/api/planning/work-orders/:id/availability` | Check material availability |
| POST | `/api/planning/work-orders/:id/reserve` | Reserve materials |
| DELETE | `/api/planning/work-orders/:id/reserve` | Release reservations |
| GET | `/api/planning/work-orders/schedule` | Get schedule (Gantt data) |
| GET | `/api/planning/work-orders/bom-preview` | Preview BOM selection |

### 18.5 MRP API (Phase 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/mrp/forecast` | Get demand forecasts |
| POST | `/api/planning/mrp/forecast/generate` | Generate forecasts |
| GET | `/api/planning/mrp/suggestions` | Get PO/WO suggestions |
| POST | `/api/planning/mrp/suggestions/:id/accept` | Accept suggestion |
| POST | `/api/planning/mrp/suggestions/:id/reject` | Reject suggestion |
| POST | `/api/planning/mrp/generate` | Run MRP calculation |
| GET | `/api/planning/mrp/coverage` | Get coverage analysis |
| GET | `/api/planning/replenishment/rules` | List replenishment rules |
| POST | `/api/planning/replenishment/rules` | Create rule |
| PUT | `/api/planning/replenishment/rules/:id` | Update rule |
| DELETE | `/api/planning/replenishment/rules/:id` | Delete rule |

### 18.6 Planning Settings API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/settings` | Get planning settings |
| PUT | `/api/planning/settings` | Update settings |
| GET | `/api/planning/settings/statuses/po` | Get PO statuses |
| GET | `/api/planning/settings/statuses/to` | Get TO statuses |
| GET | `/api/planning/settings/statuses/wo` | Get WO statuses |

### 18.7 API Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

// Example: List POs
GET /api/planning/purchase-orders?status=draft&page=1&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "po_number": "PO-2024-00001",
      "supplier": { "id": "uuid", "name": "Mill Co." },
      "status": "draft",
      "total": 5000.00,
      "expected_delivery_date": "2024-01-15",
      "lines_count": 3
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

---

## 19. Integration Points

### 19.1 Internal Module Integration

| From Planning | To Module | Integration |
|---------------|-----------|-------------|
| PO Created | Warehouse | Available for receiving (GRN) |
| TO Released | Warehouse | Available for shipping |
| WO Released | Production | Available for execution |
| WO Materials | Production | Consumption tracking |
| Supplier Data | Warehouse | Receiving supplier info |
| PO Lines | Quality | QA spec reference (Phase 2) |

### 19.2 External Integration (Phase 2+)

| System | Direction | Data | Priority |
|--------|-----------|------|----------|
| **Accounting (Comarch/Sage)** | Outbound | PO costs for invoicing | P2 |
| **Email (SendGrid)** | Outbound | Approval notifications | P1 |
| **Calendar** | Outbound | Delivery dates | P3 |
| **EDI Gateway** | Bidirectional | Orders, ASN | P3 |
| **Scales/PLC** | Inbound | Weight data (Phase 3) | P3 |

### 19.3 Webhook Events (Phase 2)

| Event | Payload | Use Case |
|-------|---------|----------|
| `po.created` | PO header | External notification |
| `po.approved` | PO with lines | Trigger EDI send |
| `po.received` | GRN data | Accounting sync |
| `wo.released` | WO with materials | Floor display |
| `wo.completed` | WO with actuals | Costing sync |

---

## 20. Phase Roadmap

### 20.1 Phase 1 (Core - COMPLETE)

**Duration:** 4 weeks
**Stories:** 30
**Status:** DONE

| Feature | Status |
|---------|--------|
| Supplier CRUD | DONE |
| Supplier-Product Assignments | DONE |
| PO CRUD with Lines | DONE |
| PO Approval Workflow | DONE |
| Bulk PO Creation | DONE |
| Configurable PO Statuses | DONE |
| TO CRUD with Lines | DONE |
| Partial Shipments | DONE |
| LP Selection for TO | DONE |
| WO CRUD with BOM Snapshot | DONE |
| Material Availability Check | DONE |
| Routing Copy to WO | DONE |
| Configurable WO Statuses | DONE |
| Planning Dashboard | DONE |
| Planning Settings | DONE |

### 20.2 Phase 2 (MRP/Forecasting)

**Duration:** 8-10 weeks
**Stories:** ~25
**Status:** PLANNED

| Feature | Priority | Effort |
|---------|----------|--------|
| Historical Demand Tracking | P1 | 2 weeks |
| Basic Demand Forecasting | P1 | 3 weeks |
| Safety Stock Management | P1 | 1 week |
| Reorder Point Alerts | P1 | 1 week |
| Replenishment Rules | P1 | 2 weeks |
| Auto PO Generation | P1 | 2 weeks |
| MRP Calculation Engine | P2 | 3 weeks |
| Suggested Order Generation | P2 | 2 weeks |
| MRP Dashboard | P2 | 2 weeks |
| PO Templates | P2 | 2 weeks |
| Blanket POs | P3 | 2 weeks |

**Dependencies:**
- Warehouse Module completion (inventory data)
- Quality Module (QA status for inventory)

### 20.3 Phase 3 (Enterprise)

**Duration:** 12-16 weeks
**Stories:** ~30
**Status:** PLANNED

| Feature | Priority | Effort |
|---------|----------|--------|
| Approved Supplier List | P2 | 2 weeks |
| Supplier Scorecards | P2 | 3 weeks |
| Supplier Audits | P3 | 2 weeks |
| Resource Capacity Definition | P2 | 2 weeks |
| Finite Capacity Scheduling | P2 | 4 weeks |
| Capacity Analytics | P3 | 2 weeks |
| EDI Order Import | P2 | 4 weeks |
| EDI Dispatch Advice | P2 | 3 weeks |
| VMI Supplier Portal | P4 | 8 weeks |

**Dependencies:**
- Shipping Module (EDI dispatch)
- Quality Module (supplier quality data)

### 20.4 Competitive Gap Closure

| Gap | Phase | Feature | Target |
|-----|-------|---------|--------|
| Demand Forecasting | 2 | Basic forecasting | 80% competitor parity |
| MRP/MPS | 2 | MRP calculation | 70% competitor parity |
| Auto-replenishment | 2 | Auto PO generation | 90% competitor parity |
| Supplier Quality | 3 | Scorecards, audits | 80% competitor parity |
| Capacity Planning | 3 | Finite scheduling | 60% competitor parity |
| EDI | 3 | EDIFACT support | 70% competitor parity |

---

## 21. Non-Functional Requirements

### 21.1 Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| PO List Load Time | < 500ms | P95 response time |
| WO Creation Time | < 1s | Including BOM snapshot |
| MRP Calculation | < 30s | For 1000 products |
| Dashboard Load | < 1s | All KPIs |
| Bulk PO (100 lines) | < 5s | Creation time |

### 21.2 Scalability

| Dimension | Current | Target (Phase 3) |
|-----------|---------|------------------|
| POs per org | 10,000 | 100,000 |
| WOs per org | 10,000 | 100,000 |
| Suppliers per org | 500 | 5,000 |
| Concurrent users | 50 | 500 |

### 21.3 Availability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| MTTR | < 30 minutes |
| Backup Frequency | Daily (PITR enabled) |
| Recovery Point | < 1 hour |

### 21.4 Security

| Requirement | Implementation |
|-------------|----------------|
| Multi-tenancy | RLS on all tables |
| Authentication | Supabase Auth (JWT) |
| Authorization | Role-based access |
| Audit Trail | All changes logged |
| Data Encryption | At rest (AES-256), in transit (TLS 1.3) |

---

## 22. Assumptions & Decisions

### 22.1 Validated Assumptions

| ID | Assumption | Validated By | Date |
|----|------------|--------------|------|
| A-01 | Organizations use single currency per supplier | Discovery interviews | 2025-11-15 |
| A-02 | PO approval workflow is optional feature | User feedback | 2025-11-20 |
| A-03 | BOM immutability after WO release is required | Production team | 2025-11-22 |
| A-04 | Lead time in days is sufficient granularity | Pilot users | 2025-11-25 |
| A-05 | Safety stock calculated in days of demand | Industry standard | 2025-11-28 |

### 22.2 Open Assumptions

| ID | Assumption | Impact if Wrong | Status |
|----|------------|-----------------|--------|
| A-06 | Moving average is sufficient for initial forecasting | Inaccurate forecasts - need more methods | Needs validation |
| A-07 | EDI integration via third-party gateway | More integration work if direct | Needs decision |
| A-08 | Capacity planning by line/machine sufficient | May need operator scheduling | Phase 3 scope |

### 22.3 Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| No full ERP finance module | Focus on MES core, integrate with external | 2025-10-01 |
| LP-based inventory only | Ensures traceability, industry best practice | 2025-10-01 |
| Soft reservation (not hard) | Flexibility over rigid allocation | 2025-11-15 |
| Phase MRP features (not MVP) | Complexity vs time-to-market | 2025-11-20 |
| Phase 3 for capacity planning | Enterprise feature, SMB can use basic | 2025-11-28 |

### 22.4 Traceability Matrix

| Goal | Requirements |
|------|--------------|
| Procurement efficiency | FR-PLAN-005, FR-PLAN-006, FR-PLAN-008 |
| Production planning | FR-PLAN-017, FR-PLAN-018, FR-PLAN-019 |
| Material visibility | FR-PLAN-021, FR-PLAN-025, FR-PLAN-035 |
| Supplier management | FR-PLAN-001, FR-PLAN-002, FR-PLAN-050, FR-PLAN-051 |
| Demand planning | FR-PLAN-030, FR-PLAN-031, FR-PLAN-034 |
| Process flexibility | FR-PLAN-011, FR-PLAN-023 |
| Automation | FR-PLAN-038, FR-PLAN-039, FR-PLAN-070 |

---

## Appendix A: Status Codes

### PO Statuses (Default)

| Status | Description | Editable | Deletable |
|--------|-------------|----------|-----------|
| draft | Initial creation | Yes | Yes |
| submitted | Sent for approval | Limited | No |
| pending_approval | Awaiting approval | No | No |
| approved | Approved by manager | No | No |
| confirmed | Sent to supplier | No | No |
| receiving | Partial receipts exist | No | No |
| closed | Fully received | No | No |
| cancelled | Cancelled | No | No |

### TO Statuses (Default)

| Status | Description |
|--------|-------------|
| draft | Initial creation |
| planned | Ready for shipping |
| partially_shipped | Some items shipped |
| shipped | All items shipped |
| partially_received | Some items received |
| received | All items received |
| closed | Complete |

### WO Statuses (Default)

| Status | Description |
|--------|-------------|
| draft | Initial creation |
| planned | Scheduled |
| released | Ready for production |
| in_progress | Currently producing |
| on_hold | Paused |
| completed | Production finished |
| closed | Closed/archived |
| cancelled | Cancelled |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **ASL** | Approved Supplier List - suppliers qualified to provide specific products |
| **BOM** | Bill of Materials - list of components for a product |
| **EDI** | Electronic Data Interchange - automated data exchange |
| **FEFO** | First Expired, First Out - picking strategy |
| **FIFO** | First In, First Out - picking strategy |
| **GRN** | Goods Receipt Note - record of received goods |
| **LP** | License Plate - inventory tracking unit |
| **MOQ** | Minimum Order Quantity |
| **MPS** | Master Production Schedule |
| **MRP** | Material Requirements Planning |
| **PO** | Purchase Order |
| **TO** | Transfer Order |
| **VMI** | Vendor Managed Inventory |
| **WO** | Work Order |

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-23 | PM-AGENT | Initial PRD |
| 2.0 | 2025-12-10 | PM-AGENT | Complete rewrite with Phase 2/3 features |

---

**Handoff to ARCHITECT-AGENT:**

```yaml
prd_ref: docs/1-BASELINE/product/modules/planning.md
requirements:
  functional:
    phase_1: [FR-PLAN-001 to FR-PLAN-025]
    phase_2: [FR-PLAN-030 to FR-PLAN-042]
    phase_3: [FR-PLAN-050 to FR-PLAN-072]
  non_functional: [Performance, Scalability, Availability, Security]
priority_order: [Must Have, Should Have, Could Have, Won't Have]
integrations:
  internal: [Settings, Technical, Production, Warehouse, Quality]
  external: [Accounting, Email, EDI, Scales]
open_assumptions:
  - A-06: Forecasting algorithm selection
  - A-07: EDI integration approach
  - A-08: Capacity planning scope
```
