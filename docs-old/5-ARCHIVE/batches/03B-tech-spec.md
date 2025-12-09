# Epic Technical Specification: Purchase Orders & Suppliers

Date: 2025-01-23
Author: MonoPilot Team
Epic ID: 3 - Batch 3A
Status: Draft

---

## Overview

Epic 3 Batch 3A (Purchase Orders & Suppliers) implementuje fundamentalny moduł zakupowy MonoPilot MES, który umożliwia zarządzanie dostawcami i zamówieniami zakupowymi. Moduł zapewnia kompletną obsługę dostawców z domyślnymi ustawieniami, CRUD operacje dla zamówień zakupowych (PO), bulk creation z automatycznym grupowaniem po dostawcach, konfigurowalny workflow zatwierdzania, oraz elastyczny system statusów.

Batch składa się z 6 stories obejmujących: zarządzanie dostawcami z przypisaniami produktów (3.17), tworzenie i edycję PO z dziedziczeniem danych z dostawcy (3.1), zarządzanie liniami PO z kalkulacją podatków (3.2), bulk creation PO z Excel/CSV (3.3), workflow zatwierdzania z poziomami uprawnień (3.4), oraz konfigurowalne statusy PO (3.5).

## Objectives and Scope

### In Scope
- ✅ **Supplier Management**: CRUD dla dostawców z code, name, contact info, currency, tax_code_id, payment_terms, lead_time_days, MOQ, is_active status
- ✅ **Supplier-Product Assignments**: Many-to-many relationship, is_default flag, supplier_product_code, unit_price, lead_time override, MOQ per product
- ✅ **Purchase Order CRUD**: Header z supplier_id, warehouse_id, expected_delivery_date, status, payment_terms, shipping_method, notes
- ✅ **PO Line Management**: Lines z product_id, quantity, unit_price (editable), discount_percent, tax calculation, line totals
- ✅ **Bulk PO Creation**: Excel/CSV import lub bulk form, auto-grouping po dostawcach, draft PO generation, review przed submitem
- ✅ **PO Approval Workflow**: Configurable approval requirement, pending/approved/rejected statuses, approval_by/approval_at tracking, rejection reason
- ✅ **Configurable PO Statuses**: Admin może dodawać/usuwać/rename statusy, set default status, typical flow: Draft → Submitted → Confirmed → Receiving → Closed
- ✅ **Currency Inheritance**: PO dziedziczy currency z supplier, all prices w supplier currency
- ✅ **Tax Calculation**: PO lines calculate tax based on supplier.tax_code_id, totals: subtotal, tax, grand total
- ✅ **Auto-numbering**: PO numbers auto-generated format: PO-YYYY-NNNN (e.g., PO-2025-0001)

### Out of Scope (Later Batches/Phases)
- ❌ PO Receiving (Epic 5 - Warehouse Module)
- ❌ PO-SO linking (demand traceability) - Phase 2
- ❌ Supplier lead time tracking/alerts - Phase 3
- ❌ PO cost vs actual cost analysis - Phase 4
- ❌ Supplier performance metrics - Phase 4
- ❌ Multi-currency conversion (all POs in supplier currency for MVP)
- ❌ Supplier portal (external access) - Phase 3

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Modal, Drawer, Form)
- **Database**: PostgreSQL 15 via Supabase (RLS enabled dla org_id isolation)
- **Auth**: Supabase Auth z JWT sessions
- **Forms**: React Hook Form + Zod validation (client + server)
- **State Management**: SWR dla data fetching/caching
- **File Upload**: React Dropzone dla bulk CSV/Excel import
- **Excel Parsing**: xlsx library dla Excel file parsing

### Architecture Constraints
1. **Multi-tenancy**: Wszystkie tabele z `org_id UUID FK` + RLS policies dla tenant isolation
2. **Audit Trail**: `created_by`, `updated_by`, `created_at`, `updated_at` na wszystkich business tables
3. **Soft Delete**: Brak soft delete dla PO tables (PO status lifecycle zamiast delete)
4. **Unique Constraints**: Composite unique indexes `(org_id, code)` dla suppliers, unique PO numbers per org
5. **Currency Handling**: All PO amounts w supplier currency (no conversion in MVP)
6. **Tax Calculation**: Line-level tax calculation based on supplier.tax_code_id

### Referenced Components (Dependencies)
- **Epic 1 - Settings**:
  - `warehouses` table (PO.warehouse_id FK dla receiving location)
  - `tax_codes` table (supplier.tax_code_id FK)
  - `users` table (created_by, updated_by, approved_by FK)
  - `organizations` table (org_id FK, RLS isolation)
- **Epic 2 - Technical**:
  - `products` table (PO lines, supplier-product assignments)
  - Product UoM, unit_price defaults

### Cache Dependencies & Events
```typescript
// Epic 3 Batch 3A owns cache, other epics may consume
const CACHE_KEYS = {
  suppliers: 'suppliers:{org_id}',              // TTL 5 min, consumed by PO creation
  supplierProducts: 'supplier-products:{supplier_id}', // TTL 5 min
  purchaseOrders: 'purchase-orders:{org_id}',   // TTL 2 min (frequent updates)
  poLines: 'po-lines:{po_id}',                  // TTL 2 min
  poStatuses: 'po-statuses:{org_id}',           // TTL 10 min (rarely changes)
}

// Cache invalidation events
'supplier.created' → Invalidate suppliers list
'supplier.updated' → Invalidate suppliers list + supplier-products
'purchase-order.created' → Invalidate PO list
'purchase-order.status_changed' → Invalidate PO list + PO detail
'po-line.created' → Invalidate PO totals, recalculate
```

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **SupplierService** | Supplier CRUD, product assignments | Supplier form, product list | Supplier objects, supplier-products links | API |
| **PurchaseOrderService** | PO CRUD, line management, totals calculation | PO header form, line items | PO objects with calculated totals | API |
| **BulkPOService** | Parse CSV/Excel, group by supplier, create draft POs | Excel file, product codes + quantities | Multiple draft POs grouped by supplier | API |
| **POApprovalService** | Approval workflow, status tracking | Approval action, rejection reason | Updated PO with approval metadata | API |
| **PONumberGenerator** | Auto-generate PO numbers | org_id, year | Unique PO number: PO-YYYY-NNNN | API |
| **TaxCalculator** | Calculate line tax, PO totals | Line items, tax_code_id | subtotal, tax_amount, total | API |
| **PlanningSettingsService** | Manage PO statuses, approval settings | Settings form | planning_settings config | API |

### Data Models and Contracts

#### Suppliers Table
```typescript
interface Supplier {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  code: string                  // Unique per org (e.g., SUP-001)
  name: string                  // Required
  contact_person?: string       // Optional
  email?: string                // Optional, valid email format
  phone?: string                // Optional
  address?: string              // Optional
  city?: string                 // Optional
  postal_code?: string          // Optional
  country?: string              // Optional (e.g., PL, UK, US)
  currency: string              // Required, enum: PLN, EUR, USD, GBP (from Epic 1)
  tax_code_id: string           // FK → tax_codes (from Epic 1)
  payment_terms: string         // Required (e.g., "Net 30", "Net 60")
  lead_time_days: number        // Required, default 7
  moq?: number                  // Minimum Order Quantity (optional)
  is_active: boolean            // Default true
  created_by: string            // FK → users
  updated_by: string            // FK → users
  created_at: Date
  updated_at: Date
}

// Unique constraint: (org_id, code)
// Indexes: org_id, code, is_active
// RLS: org_id = auth.jwt()->>'org_id'
```

#### Supplier-Products Table (Many-to-Many)
```typescript
interface SupplierProduct {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  supplier_id: string           // FK → suppliers
  product_id: string            // FK → products (from Epic 2)
  is_default: boolean           // Only one default per product
  supplier_product_code?: string // Supplier's internal code
  unit_price?: number           // Override product default price
  lead_time_days?: number       // Override supplier default lead time
  moq?: number                  // Override supplier default MOQ
  created_at: Date
  updated_at: Date
}

// Unique constraint: (org_id, supplier_id, product_id)
// Unique constraint: (org_id, product_id) WHERE is_default = true (partial unique index)
// Indexes: org_id, supplier_id, product_id, is_default
// RLS: org_id = auth.jwt()->>'org_id'
```

#### Purchase Orders Table
```typescript
interface PurchaseOrder {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  po_number: string             // Auto-generated, unique per org (PO-YYYY-NNNN)
  supplier_id: string           // FK → suppliers (required)
  warehouse_id: string          // FK → warehouses (from Epic 1, required)
  status: string                // From planning_settings.po_statuses (e.g., Draft, Submitted, Confirmed)
  expected_delivery_date: Date  // Required
  actual_delivery_date?: Date   // Populated when receiving (Epic 5)
  payment_terms?: string        // Inherited from supplier, editable
  shipping_method?: string      // Optional (e.g., Ground, Air, Sea)
  notes?: string                // Optional

  // Financial fields (all in supplier currency)
  currency: string              // Inherited from supplier
  subtotal: number              // Sum of all line totals (calculated)
  tax_amount: number            // Sum of all line taxes (calculated)
  total: number                 // subtotal + tax_amount (calculated)

  // Approval fields (if approval enabled)
  approval_status?: string      // Enum: null, 'pending', 'approved', 'rejected'
  approved_by?: string          // FK → users (Manager/Admin)
  approved_at?: Date            // Timestamp of approval
  rejection_reason?: string     // Required if rejected

  created_by: string            // FK → users
  updated_by: string            // FK → users
  created_at: Date
  updated_at: Date
}

// Unique constraint: (org_id, po_number)
// Indexes: org_id, supplier_id, warehouse_id, status, expected_delivery_date
// RLS: org_id = auth.jwt()->>'org_id'
```

#### PO Lines Table
```typescript
interface POLine {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  po_id: string                 // FK → purchase_orders
  product_id: string            // FK → products (from Epic 2)
  sequence: number              // Line order (1, 2, 3, ...)

  quantity: number              // Required
  uom: string                   // Inherited from product
  unit_price: number            // Editable, defaults from product or supplier_products
  discount_percent?: number     // Optional (0-100)

  // Calculated fields
  line_subtotal: number         // quantity × unit_price
  discount_amount: number       // line_subtotal × (discount_percent / 100)
  line_total: number            // line_subtotal - discount_amount
  tax_amount: number            // line_total × (tax_rate / 100) from supplier.tax_code_id
  line_total_with_tax: number   // line_total + tax_amount

  expected_delivery_date?: Date // Optional, defaults to PO header date
  received_qty?: number         // Populated during receiving (Epic 5)

  created_at: Date
  updated_at: Date
}

// Unique constraint: (po_id, sequence)
// Indexes: org_id, po_id, product_id
// RLS: org_id = auth.jwt()->>'org_id'
// Trigger: After INSERT/UPDATE/DELETE on po_lines → recalculate PO totals
```

#### PO Approvals Table (Audit Trail)
```typescript
interface POApproval {
  id: string                    // UUID PK
  org_id: string                // FK → organizations, RLS key
  po_id: string                 // FK → purchase_orders
  status: string                // Enum: 'pending', 'approved', 'rejected'
  approved_by?: string          // FK → users (Manager/Admin)
  approved_at?: Date            // Timestamp
  rejection_reason?: string     // Required if rejected
  comments?: string             // Optional
  created_at: Date
}

// Indexes: org_id, po_id, status
// RLS: org_id = auth.jwt()->>'org_id'
// Purpose: Full audit trail of approval history
```

#### Planning Settings Table (Partial - PO Config Only)
```typescript
interface PlanningSettings {
  id: string                    // UUID PK (one per org)
  org_id: string                // FK → organizations, RLS key

  // PO Settings
  po_statuses: POStatus[]       // JSONB array of custom statuses
  po_default_status: string     // Default status for new POs (e.g., "Draft")
  po_require_approval: boolean  // Toggle approval workflow
  po_approval_threshold?: number // Optional: approve only if total > threshold

  // Field visibility toggles
  po_payment_terms_visible: boolean
  po_shipping_method_visible: boolean
  po_notes_visible: boolean

  created_at: Date
  updated_at: Date
}

interface POStatus {
  code: string                  // Unique identifier (e.g., "draft", "submitted")
  label: string                 // Display name (e.g., "Draft", "Submitted")
  color: string                 // UI color (e.g., "gray", "blue", "green")
  is_default: boolean           // Only one default
  sequence: number              // Order in dropdown/workflow
}

// Default PO Statuses:
const DEFAULT_PO_STATUSES: POStatus[] = [
  { code: 'draft', label: 'Draft', color: 'gray', is_default: true, sequence: 1 },
  { code: 'submitted', label: 'Submitted', color: 'blue', is_default: false, sequence: 2 },
  { code: 'confirmed', label: 'Confirmed', color: 'green', is_default: false, sequence: 3 },
  { code: 'receiving', label: 'Receiving', color: 'yellow', is_default: false, sequence: 4 },
  { code: 'closed', label: 'Closed', color: 'purple', is_default: false, sequence: 5 },
]

// RLS: org_id = auth.jwt()->>'org_id'
```

### APIs and Interfaces

#### REST Endpoints

**Supplier Management**
```typescript
GET    /api/planning/suppliers
  Query: { search?, is_active? }
  Response: Supplier[]
  Auth: Purchasing, Manager, Admin
  Cache: 5 min TTL

POST   /api/planning/suppliers
  Body: CreateSupplierInput
  Response: Supplier
  Auth: Purchasing, Manager, Admin
  Validation: Zod schema (unique code, valid email, currency enum)

PUT    /api/planning/suppliers/:id
  Body: UpdateSupplierInput
  Response: Supplier
  Auth: Purchasing, Manager, Admin
  Validation: Cannot change code

DELETE /api/planning/suppliers/:id
  Response: { success: boolean }
  Auth: Manager, Admin only
  Validation: Block if has active POs

GET    /api/planning/suppliers/:id/products
  Response: SupplierProduct[]
  Auth: Purchasing, Manager, Admin

PUT    /api/planning/suppliers/:id/products
  Body: { product_ids: string[], assignments: SupplierProductInput[] }
  Response: SupplierProduct[]
  Auth: Purchasing, Manager, Admin
  Validation: Only one is_default per product
```

**Purchase Order Management**
```typescript
GET    /api/planning/purchase-orders
  Query: { search?, status?, supplier_id?, warehouse_id?, date_from?, date_to? }
  Response: PurchaseOrder[]
  Auth: Purchasing, Manager, Admin
  Cache: 2 min TTL (frequent updates)

GET    /api/planning/purchase-orders/:id
  Response: PurchaseOrder with lines[]
  Auth: Purchasing, Manager, Admin

POST   /api/planning/purchase-orders
  Body: CreatePOInput
  Response: PurchaseOrder
  Auth: Purchasing, Manager, Admin
  Side effects:
    - Generate PO number (PO-YYYY-NNNN)
    - Inherit currency, tax_code_id from supplier
    - Set default status from planning_settings
    - If approval required and total > threshold → approval_status = 'pending'

PUT    /api/planning/purchase-orders/:id
  Body: UpdatePOInput
  Response: PurchaseOrder
  Auth: Purchasing, Manager, Admin
  Validation: Cannot edit if status = 'Closed' or 'Receiving'

DELETE /api/planning/purchase-orders/:id
  Response: { success: boolean }
  Auth: Manager, Admin only
  Validation: Only if status = 'Draft' and no lines

GET    /api/planning/purchase-orders/:id/lines
  Response: POLine[]
  Auth: Purchasing, Manager, Admin

POST   /api/planning/purchase-orders/:id/lines
  Body: CreatePOLineInput
  Response: POLine
  Auth: Purchasing, Manager, Admin
  Side effects:
    - Auto-increment sequence
    - Fetch unit_price from supplier_products or product default
    - Calculate line_total, tax_amount
    - Recalculate PO totals (trigger or API call)

PUT    /api/planning/purchase-orders/:id/lines/:lineId
  Body: UpdatePOLineInput
  Response: POLine
  Auth: Purchasing, Manager, Admin
  Side effects: Recalculate line totals + PO totals

DELETE /api/planning/purchase-orders/:id/lines/:lineId
  Response: { success: boolean }
  Auth: Purchasing, Manager, Admin
  Side effects: Recalculate PO totals

PUT    /api/planning/purchase-orders/:id/status
  Body: { status: string }
  Response: PurchaseOrder
  Auth: Purchasing, Manager, Admin
  Validation: Check allowed status transitions
  Side effects: Audit log entry
```

**Bulk PO Creation**
```typescript
POST   /api/planning/purchase-orders/bulk
  Body: FormData (Excel/CSV file) OR JSON { items: BulkPOItem[] }
  Response: { draft_pos: PurchaseOrder[], errors: BulkError[] }
  Auth: Purchasing, Manager, Admin
  Process:
    1. Parse Excel/CSV: Product Code, Quantity
    2. Lookup product → default supplier (from supplier_products where is_default = true)
    3. If no default supplier → add to errors[]
    4. Group products by supplier
    5. Create draft PO per supplier with lines
    6. Return draft POs for user review

interface BulkPOItem {
  product_code: string
  quantity: number
  warehouse_id?: string         // Optional, use org default if not specified
  expected_delivery_date?: Date // Optional, default +7 days
}

interface BulkError {
  row: number
  product_code: string
  error: string                 // e.g., "No default supplier", "Product not found"
}
```

**Approval Workflow**
```typescript
PUT    /api/planning/purchase-orders/:id/approve
  Body: { action: 'approve' | 'reject', rejection_reason?: string, comments?: string }
  Response: PurchaseOrder
  Auth: Manager, Admin only
  Validation:
    - approval_status must be 'pending'
    - rejection requires rejection_reason
  Side effects:
    - Update approval_status
    - Set approved_by, approved_at
    - Create po_approvals audit record
    - If approved → can proceed to submit
    - If rejected → status back to 'Draft'
```

**Planning Settings (PO Config)**
```typescript
GET    /api/planning/settings
  Response: PlanningSettings
  Auth: Authenticated
  Cache: 10 min TTL

PUT    /api/planning/settings
  Body: UpdatePlanningSettingsInput (PO statuses, approval settings)
  Response: PlanningSettings
  Auth: Admin only
  Validation:
    - At least one default status
    - Status codes unique
    - Cannot remove status if POs exist with that status
```

#### Zod Validation Schemas

```typescript
// Supplier
const CreateSupplierSchema = z.object({
  code: z.string().regex(/^[A-Z0-9-]+$/, 'Uppercase, numbers, hyphens only'),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']),
  tax_code_id: z.string().uuid(),
  payment_terms: z.string().min(1), // e.g., "Net 30"
  lead_time_days: z.number().int().min(0).default(7),
  moq: z.number().positive().optional(),
  is_active: z.boolean().default(true),
})

// Supplier-Product Assignment
const AssignSupplierProductSchema = z.object({
  product_id: z.string().uuid(),
  is_default: z.boolean().default(false),
  supplier_product_code: z.string().optional(),
  unit_price: z.number().positive().optional(),
  lead_time_days: z.number().int().min(0).optional(),
  moq: z.number().positive().optional(),
})

// Purchase Order
const CreatePOSchema = z.object({
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  expected_delivery_date: z.date().min(new Date(), 'Cannot be in the past'),
  payment_terms: z.string().optional(),
  shipping_method: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

// PO Line
const CreatePOLineSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  expected_delivery_date: z.date().optional(),
})

// Bulk PO Item
const BulkPOItemSchema = z.object({
  product_code: z.string().min(1),
  quantity: z.number().positive(),
  warehouse_id: z.string().uuid().optional(),
  expected_delivery_date: z.date().optional(),
})

// Approval Action
const POApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(1).optional(),
  comments: z.string().max(1000).optional(),
}).refine(data => {
  if (data.action === 'reject') {
    return !!data.rejection_reason
  }
  return true
}, {
  message: 'rejection_reason required when rejecting',
  path: ['rejection_reason'],
})

// Planning Settings (PO Config)
const UpdatePlanningSettingsSchema = z.object({
  po_statuses: z.array(z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    color: z.string(),
    is_default: z.boolean(),
    sequence: z.number().int().min(1),
  })).min(1).refine(statuses => {
    const defaults = statuses.filter(s => s.is_default)
    return defaults.length === 1
  }, 'Exactly one default status required'),
  po_default_status: z.string(),
  po_require_approval: z.boolean(),
  po_approval_threshold: z.number().positive().optional(),
})
```

### Workflows and Sequencing

#### Workflow 1: Create Purchase Order (Standard Flow)
```
User: Navigate to /planning/purchase-orders → Click "Add PO"
  ↓
Step 1: Select Supplier
  - Dropdown: suppliers WHERE is_active = true
  - On selection → Inherit: currency, tax_code_id, payment_terms
  ↓
Step 2: Fill PO Header
  - warehouse_id (required, dropdown)
  - expected_delivery_date (required, date picker)
  - payment_terms (pre-filled, editable)
  - shipping_method (optional)
  - notes (optional)
  ↓
Step 3: Add PO Lines
  - Click "Add Line"
  - Select product (dropdown)
  - Enter quantity (number input)
  - unit_price pre-filled from supplier_products or product default (editable)
  - discount_percent (optional, 0-100)
  - Calculate line_total = (qty × price) - discount
  - Calculate tax_amount = line_total × tax_rate (from supplier.tax_code_id)
  - Repeat for multiple lines
  ↓
Step 4: Review Totals
  - Subtotal = SUM(line_total)
  - Tax = SUM(tax_amount)
  - Total = Subtotal + Tax
  ↓
Step 5: Save PO
  - API: POST /api/planning/purchase-orders
  - Generate PO number: PO-2025-0001
  - Set status from planning_settings.po_default_status (e.g., "Draft")
  - If approval required AND total > threshold → approval_status = 'pending'
  ↓
Step 6: Submit PO (if approval not required)
  - Change status: Draft → Submitted
  - Or if approval required: Wait for Manager approval
```

#### Workflow 2: Bulk PO Creation
```
User: Navigate to /planning/purchase-orders → Click "Bulk Create"
  ↓
Step 1: Upload Excel/CSV or Use Bulk Form
  - Template: Product Code, Quantity
  - Example: "FLOUR-001", 100
  ↓
Step 2: Parse File
  - Read rows
  - Lookup product by code
  - If product not found → Add to errors[]
  ↓
Step 3: Lookup Default Suppliers
  - Query: supplier_products WHERE product_id = X AND is_default = true
  - If no default supplier → Add to errors[]
  ↓
Step 4: Group Products by Supplier
  - Group items by supplier_id
  - Example:
    - Supplier A: [Flour 100kg, Sugar 50kg]
    - Supplier B: [Cocoa 30kg]
  ↓
Step 5: Create Draft POs
  - For each supplier group:
    - Create PO header (status = "Draft")
    - Inherit currency, tax_code_id from supplier
    - Use org default warehouse or first warehouse
    - Set expected_delivery_date = today + 7 days (or user input)
    - Create PO lines for all products in group
    - Calculate totals
  ↓
Step 6: Review Drafts
  - Show table of draft POs with totals
  - User can edit before submitting
  - Show errors[] (products without suppliers)
  ↓
Step 7: Confirm Creation
  - API: POST /api/planning/purchase-orders/bulk/confirm
  - Persist all draft POs
  - Return PO numbers
```

#### Workflow 3: PO Approval Flow
```
Purchasing User: Create PO (total > approval_threshold)
  ↓
API Check:
  - IF planning_settings.po_require_approval = true
  - AND po.total > planning_settings.po_approval_threshold (if set)
  - THEN set approval_status = 'pending'
  ↓
Manager/Admin: Navigate to /planning/purchase-orders → Filter "Pending Approval"
  ↓
Review PO:
  - View PO header, lines, totals
  - Check supplier, warehouse, expected_delivery_date
  ↓
Approve or Reject:
  - Click "Approve" → approval_status = 'approved', set approved_by, approved_at
  - Click "Reject" → approval_status = 'rejected', require rejection_reason
  ↓
If Approved:
  - PO can now be submitted (status → Submitted)
  - Purchasing notified (future: email notification)
  ↓
If Rejected:
  - PO status back to 'Draft'
  - Purchasing can edit and resubmit
  - Show rejection_reason in UI
```

#### Workflow 4: Supplier-Product Assignment
```
Admin/Purchasing: Navigate to /planning/suppliers → Select Supplier
  ↓
View Supplier Detail Page:
  - See "Products" tab
  - Click "Assign Products"
  ↓
Product Assignment Modal:
  - Multi-select dropdown: available products
  - For each product:
    - is_default toggle (only one default per product)
    - supplier_product_code (optional)
    - unit_price (optional override)
    - lead_time_days (optional override)
    - moq (optional override)
  ↓
Save Assignments:
  - API: PUT /api/planning/suppliers/:id/products
  - Validation: Only one is_default per product across all suppliers
  - If setting new default → unset previous default
  ↓
Result:
  - Products now linked to supplier
  - Bulk PO creation will use these defaults
  - PO line creation pre-fills unit_price from supplier_products
```

## Non-Functional Requirements

### Performance

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Supplier list (100 suppliers) | <200ms p95 | GET /api/planning/suppliers |
| PO list (500 POs) | <300ms p95 | GET /api/planning/purchase-orders with pagination |
| PO detail with lines (50 lines) | <250ms p95 | GET /api/planning/purchase-orders/:id |
| PO line calculation (totals recalc) | <50ms | Trigger or API call after line change |
| Bulk PO creation (100 products, 5 suppliers) | <3s p95 | POST /api/planning/purchase-orders/bulk |
| Excel file upload (1000 rows) | <5s p95 | Parse + validation + draft PO generation |
| Supplier-product lookup (default supplier) | <100ms | Query with index on is_default |
| Cache hit rate | >80% | Suppliers, PO statuses |

**Performance Optimizations:**
- **Indexes**:
  - `idx_suppliers_org_code` on (org_id, code)
  - `idx_supplier_products_default` on (org_id, product_id) WHERE is_default = true
  - `idx_po_org_status` on (org_id, status)
  - `idx_po_lines_po_id` on (po_id)
- **Caching**:
  - Suppliers cached 5 min (rarely change)
  - PO statuses cached 10 min (admin config)
  - PO lists cached 2 min (frequent updates)
- **Pagination**: PO list paginated (50 per page) if >100 POs
- **Lazy Loading**: PO lines loaded separately (not with PO list)
- **Bulk Operations**: Batch insert dla bulk PO creation (single transaction)
- **Triggers**: Database trigger dla PO totals recalculation (avoids API roundtrip)

### Security

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Multi-Tenancy Isolation** | RLS policy `org_id = auth.jwt()->>'org_id'` na wszystkich tabelach | Automated RLS test suite |
| **Role-Based Access** | Purchasing, Manager, Admin roles; approval restricted to Manager/Admin | Middleware checks role per endpoint |
| **Approval Threshold** | Admin configures threshold, system enforces | API validates po.total vs threshold |
| **PO Edit Restrictions** | Cannot edit if status = 'Closed' or 'Receiving' | API returns 403 with message |
| **Supplier Deletion Block** | Cannot delete if has active POs | FK constraint + API validation |
| **Bulk Upload Validation** | Validate all rows before creating POs | Server-side validation, show errors[] |
| **Input Validation** | Zod schemas (client + server), SQL injection prevention | All user input validated |
| **Currency Mismatch Prevention** | PO currency locked to supplier currency | Cannot change after PO creation |
| **Audit Trail** | created_by, updated_by, approved_by tracked | Logged for all changes |

**Security Tests Required:**
- ✅ RLS bypass test: User A cannot read User B's POs
- ✅ Role enforcement: Purchasing user cannot approve POs
- ✅ Approval threshold: PO >$10k requires approval
- ✅ Status transition: Cannot edit closed PO
- ✅ Bulk upload: Malicious Excel file rejected

### Reliability/Availability

| Requirement | Implementation | SLA |
|-------------|----------------|-----|
| **Uptime** | 99.9% availability (Vercel + Supabase) | 43.2 min downtime/month max |
| **Transaction Atomicity** | Bulk PO creation: all or none | Rollback on failure |
| **Idempotent Operations** | PO number generation: check existing before insert | Safe to retry |
| **Retry Logic** | Bulk PO creation: retry failed rows | Eventual success within 3 attempts |
| **Cascade Delete Protection** | FK `ON DELETE RESTRICT` dla suppliers with POs | Cannot delete if referenced |
| **Approval Audit Trail** | po_approvals table tracks all approval actions | Full history preserved |
| **Totals Recalculation** | Database trigger ensures consistency | Totals always accurate |

**Failure Scenarios Covered:**
- Bulk upload fails → Show errors[], allow user to fix and retry
- Supplier deletion with active POs → Block delete, show error count
- PO approval conflict (2 managers approve simultaneously) → Optimistic locking, first wins
- Currency mismatch → Block PO creation with clear error message
- Missing default supplier → Bulk PO skips product, adds to errors[]

### Observability

| Signal | Implementation | Retention |
|--------|----------------|-----------|
| **Application Logs** | Vercel logs (JSON structured) | 7 days free tier, 30 days Pro |
| **Error Tracking** | Console errors logged, API errors returned as RFC 7807 | Real-time monitoring |
| **Performance Metrics** | Vercel Analytics (Core Web Vitals) | 30 days |
| **API Metrics** | Response times, status codes, per endpoint | 7 days |
| **Cache Hit Rate** | Redis metrics (Upstash dashboard) | 30 days |
| **Bulk PO Success Rate** | Track % of successful vs failed rows | 30 days |
| **Approval Metrics** | Track approval time (pending → approved/rejected) | 30 days |

**Key Metrics to Monitor:**
- PO list load time (target <300ms p95)
- PO line calculation time (target <50ms p95)
- Bulk PO success rate (target >95%)
- Supplier lookup time (target <100ms p95)
- Cache hit rate (target >80%)
- Approval turnaround time (median, p95)

**Alerting Thresholds:**
- 🔴 Critical: RLS test failure (immediate Slack alert)
- 🔴 Critical: PO API 5xx error rate >1% (immediate)
- 🟡 Warning: Bulk PO failure rate >10% (daily digest)
- 🟡 Warning: PO line recalc >200ms (p95) (daily digest)
- 🟢 Info: New supplier created (daily digest)

## Dependencies and Integrations

### Epic 3 Batch 3A Requires (Foundation Data)

Epic 3 Batch 3A zależy od danych z Epic 1 (Settings) i Epic 2 (Technical):

```
Epic 1: Foundation & Settings
│
├── Organizations Table
│   └→ PO, Supplier: org_id FK (multi-tenancy isolation)
│
├── Users & Roles
│   ├→ PO: created_by, updated_by, approved_by (audit trail)
│   └→ Approval: Manager/Admin role check
│
├── Warehouses
│   └→ PO: warehouse_id FK (receiving location)
│
├── Tax Codes
│   ├→ Supplier: tax_code_id FK (tax calculation)
│   └→ PO Line: tax calculation based on supplier.tax_code_id
│
└── Module Activation Flags
    └→ Planning module enabled check (API middleware)

Epic 2: Technical Core
│
└── Products Table
    ├→ PO Line: product_id FK
    ├→ Supplier-Product: product_id FK
    ├→ Bulk PO: lookup product by code
    └→ Inherit: UoM, unit_price defaults
```

### Critical Dependencies Table

| Epic | Wymaga z Epic 3 Batch 3A | Blokujące Story | Bez tego nie działa |
|------|--------------------------|-----------------|---------------------|
| **Epic 5** (Warehouse) | Suppliers, Purchase Orders | 5.15 PO Receiving | Cannot receive without PO |
| **Epic 3** (Later Batches) | Suppliers | 3.18 Supplier-Product Assignments | Bulk PO needs default suppliers |

### Epic 3 Batch 3A Provides APIs (Consumed by Others)

| API Endpoint | Consumer Epics | Purpose | Cache TTL |
|--------------|----------------|---------|-----------|
| `GET /api/planning/suppliers` | Epic 5 (Receiving) | PO receiving, supplier lookup | 5 min |
| `GET /api/planning/purchase-orders` | Epic 5 (Receiving) | PO receiving, expected qty | 2 min |
| `GET /api/planning/purchase-orders/:id` | Epic 5 (Receiving) | PO detail, line items | 2 min |

### Epic 3 Batch 3A Consumes APIs

| API Endpoint | Provider Epic | Purpose | Required For |
|--------------|---------------|---------|--------------|
| `GET /api/settings/warehouses` | Epic 1 | PO warehouse selection | Story 3.1 |
| `GET /api/settings/tax-codes` | Epic 1 | Supplier tax code, PO tax calc | Story 3.17, 3.2 |
| `GET /api/settings/users` | Epic 1 | created_by, approved_by resolution | All stories |
| `GET /api/technical/products` | Epic 2 | PO line product selection | Story 3.2, 3.3 |

### Shared Tables (Epic 3 Batch 3A owns, others read)

| Table | Owner | Readers | Write Access | Cache Strategy |
|-------|-------|---------|--------------|----------------|
| `suppliers` | Epic 3 Batch 3A | Epic 5 | Epic 3 only | 5 min TTL, invalidate on update |
| `supplier_products` | Epic 3 Batch 3A | Epic 3 (bulk PO) | Epic 3 only | 5 min TTL, invalidate on update |
| `purchase_orders` | Epic 3 Batch 3A | Epic 5 | Epic 3 (create), Epic 5 (receiving) | 2 min TTL, invalidate on status change |
| `po_lines` | Epic 3 Batch 3A | Epic 5 | Epic 3 (create), Epic 5 (update received_qty) | 2 min TTL, invalidate on change |

### Cache Invalidation Events

```typescript
// Epic 3 Batch 3A emits events → Other epics listen and invalidate their caches

interface CacheEvent {
  event: string
  org_id: string
  entity_id: string
  timestamp: Date
}

// Events emitted by Epic 3 Batch 3A:
'supplier.created' → Invalidate supplier cache
'supplier.updated' → Invalidate supplier cache + supplier-products
'purchase-order.created' → Invalidate PO list
'purchase-order.status_changed' → Invalidate PO list + PO detail, Epic 5 refetch
'po-line.created' → Invalidate PO totals, recalculate
'po-line.updated' → Invalidate PO totals, recalculate
'po-approval.approved' → Invalidate PO list, notify purchasing user
'po-approval.rejected' → Invalidate PO list, notify purchasing user
```

### External Service Dependencies

| Service | Purpose | Criticality | Failure Handling |
|---------|---------|-------------|------------------|
| **Supabase Database** | All data storage | 🔴 CRITICAL | Cannot operate, show cached data read-only |
| **Upstash Redis** | Caching suppliers, PO statuses | 🟡 MEDIUM | Fallback to direct DB queries (slower) |
| **Vercel Edge** | Hosting, rate limiting | 🔴 CRITICAL | Entire app down, 99.9% SLA |
| **xlsx Library** | Excel parsing dla bulk PO | 🟡 MEDIUM | Fallback to CSV import, manual entry |

**Dependency Health Checks:**
- Supabase: Ping `/rest/v1/` endpoint every 5 min
- Redis: Cache miss → DB fallback (graceful degradation)

### Integration Testing Requirements

| Integration Point | Test Scenario | Expected Result |
|-------------------|---------------|-----------------|
| Supplier → Tax Code | Create supplier with tax_code_id | Tax code linked, PO lines calculate tax correctly |
| PO → Warehouse | Create PO with warehouse_id | Warehouse linked, receiving location available |
| PO Line → Product | Add line with product_id | Product linked, UoM/unit_price inherited |
| Bulk PO → Supplier Products | Upload Excel, lookup default suppliers | Products grouped by supplier, draft POs created |
| Approval → User Role | Non-manager tries to approve PO | 403 error: "Insufficient permissions" |
| PO Totals → Line Changes | Add/edit/delete line | PO totals recalculated automatically |
| Currency → Supplier | Create PO for supplier with EUR | All PO amounts in EUR, no conversion |

## Acceptance Criteria (Authoritative)

Epic 3 Batch 3A realizuje 6 Functional Requirements poprzez 6 stories (3.17, 3.1-3.5). Poniżej znajdują się atomiczne, testable acceptance criteria zgrupowane per story:

### Story 3.17: Supplier Management

**AC-17.1**: User może stworzyć supplier z code (unique per org), name, currency, tax_code_id, payment_terms, lead_time_days

**AC-17.2**: Supplier table sortowalna, filtrowalna (is_active), searchable (name/code)

**AC-17.3**: Edit supplier drawer pozwala zmienić wszystkie pola except code

**AC-17.4**: Cannot delete supplier jeśli ma active POs (FK constraint)

**AC-17.5**: Supplier detail page shows Products tab z assigned products

**AC-17.6**: Can assign products to supplier z is_default flag, supplier_product_code, unit_price override, lead_time override

**AC-17.7**: Only one is_default supplier per product (validation enforced)

### Story 3.1: Purchase Order CRUD

**AC-1.1**: User może wypełnić i zapisać PO form z supplier_id, warehouse_id, expected_delivery_date (required fields)

**AC-1.2**: PO number auto-generated format: PO-YYYY-NNNN (e.g., PO-2025-0001)

**AC-1.3**: PO inherits currency, tax_code_id, payment_terms from supplier (auto-populated, editable)

**AC-1.4**: PO status set from planning_settings.po_default_status (e.g., "Draft")

**AC-1.5**: PO list sortowalna, filtrowalna (status, supplier, warehouse, date range), searchable (PO number)

**AC-1.6**: Cannot edit PO if status = 'Closed' or 'Receiving' (validation error)

**AC-1.7**: Cannot delete PO jeśli has lines (validation error)

### Story 3.2: PO Line Management

**AC-2.1**: User może dodać line z product_id, quantity (required), unit_price pre-filled from supplier_products or product

**AC-2.2**: Line calculation: line_subtotal = qty × price, discount_amount = subtotal × (discount% / 100), line_total = subtotal - discount

**AC-2.3**: Tax calculation: tax_amount = line_total × tax_rate (from supplier.tax_code_id), line_total_with_tax = line_total + tax

**AC-2.4**: PO totals recalculated when line added/edited/deleted: subtotal = SUM(line_total), tax = SUM(tax_amount), total = subtotal + tax

**AC-2.5**: PO lines displayed w table z columns: Product, Qty, UoM, Unit Price, Discount%, Line Total, Tax, Total with Tax

**AC-2.6**: Can edit line (change qty, price, discount) → Totals recalculate automatically

**AC-2.7**: Can delete line → Totals recalculate automatically

### Story 3.3: Bulk PO Creation

**AC-3.1**: User może upload Excel/CSV file z template: Product Code, Quantity

**AC-3.2**: System parses file, lookups product by code, finds default supplier (from supplier_products where is_default = true)

**AC-3.3**: Products grouped by supplier, draft PO created per supplier group

**AC-3.4**: Draft POs shown w review table z columns: Supplier, Product Count, Total Lines, Estimated Total

**AC-3.5**: Errors shown w separate list: Product Code, Error Message (e.g., "No default supplier", "Product not found")

**AC-3.6**: User can edit draft POs before confirming (change warehouse, dates, remove lines)

**AC-3.7**: Confirm button creates all draft POs, returns PO numbers

**AC-3.8**: Bulk creation w single transaction (all or none if DB error)

### Story 3.4: PO Approval Workflow

**AC-4.1**: Admin może enable/disable approval w planning_settings.po_require_approval

**AC-4.2**: If approval enabled, PO z total > threshold → approval_status = 'pending'

**AC-4.3**: Manager/Admin can see "Pending Approval" filter w PO list

**AC-4.4**: Manager/Admin can approve/reject PO: approve sets approved_by, approved_at; reject requires rejection_reason

**AC-4.5**: Approved PO can proceed (status → Submitted), rejected PO back to 'Draft' z rejection_reason shown

**AC-4.6**: Approval history tracked w po_approvals table (full audit trail)

**AC-4.7**: Non-manager cannot approve (403 error)

### Story 3.5: Configurable PO Statuses

**AC-5.1**: Admin może add/remove/rename PO statuses w planning_settings.po_statuses

**AC-5.2**: Default statuses preloaded: Draft, Submitted, Confirmed, Receiving, Closed

**AC-5.3**: Status changes logged w audit trail z timestamp, user

**AC-5.4**: Cannot remove status if POs exist with that status (validation error)

**AC-5.5**: One status marked as default dla new POs

**AC-5.6**: PO status dropdown shows statuses w sequence order z color coding

## Traceability Mapping

Pełna mapa Stories → Components → Tests:

| Story | Components/APIs | Test Files |
|-------|-----------------|------------|
| 3.17 | SupplierService, SupplierAPI, SupplierForm | supplier-crud.spec.ts, supplier-products.e2e.ts |
| 3.1 | PurchaseOrderService, PONumberGenerator, POAPI, POForm | po-crud.spec.ts, po-creation.e2e.ts |
| 3.2 | POLineService, TaxCalculator, POLineForm, POTotals | po-lines.spec.ts, po-totals-calc.e2e.ts |
| 3.3 | BulkPOService, ExcelParser, BulkPOForm | bulk-po.spec.ts, bulk-po-creation.e2e.ts |
| 3.4 | POApprovalService, ApprovalAPI, ApprovalModal | po-approval.spec.ts, approval-workflow.e2e.ts |
| 3.5 | PlanningSettingsService, StatusConfig | po-statuses.spec.ts, status-lifecycle.e2e.ts |

### Test Coverage Matrix

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|-----------|-------------------|-----------|
| 3.17 | Supplier validation, code uniqueness | Supplier CRUD, FK constraints | Supplier creation, product assignment |
| 3.1 | PO validation, number generation | PO CRUD, currency inheritance | PO creation flow, edit, delete |
| 3.2 | Line calculation logic, tax calc | Line CRUD, totals trigger | Add/edit/delete lines, totals update |
| 3.3 | Excel parsing, grouping logic | Bulk insert, default supplier lookup | Upload Excel, review drafts, confirm |
| 3.4 | Approval validation, role check | Approval API, audit trail | Approve/reject flow, permissions |
| 3.5 | Status validation, default check | Settings CRUD, status constraints | Add/remove statuses, status lifecycle |

## Risks, Assumptions, Open Questions

### 🔴 Critical Risks

#### Risk 1: Currency Mismatch → Financial Errors
- **Likelihood**: Medium (user error)
- **Impact**: 🔴 HIGH - Incorrect pricing, financial loss
- **Root Cause**: PO created with wrong currency, prices not converted
- **Mitigation**:
  - ✅ PO currency locked to supplier currency
  - ✅ UI shows currency badge next to all amounts
  - ✅ Validation: Cannot change currency after PO creation
  - ✅ Future: Multi-currency conversion (Phase 2)
- **Detection**: Financial report mismatch, user complaints
- **Response**: Manual correction, audit affected POs

#### Risk 2: Bulk PO Creation Performance → Timeout
- **Likelihood**: Medium (large files)
- **Impact**: 🔴 MEDIUM - User frustration, partial data
- **Root Cause**: 1000+ rows Excel file, slow parsing, DB timeout
- **Mitigation**:
  - ✅ File size limit: 5MB, 1000 rows max
  - ✅ Background job dla large files (future)
  - ✅ Batch insert (100 rows per transaction)
  - ✅ Progress bar dla user feedback
- **Detection**: API timeout errors, slow query logs
- **Response**: Implement queue-based processing (Phase 2)

#### Risk 3: PO Totals Inconsistency → Audit Issues
- **Likelihood**: Low (DB trigger)
- **Impact**: 🔴 HIGH - Financial discrepancy, compliance failure
- **Root Cause**: Line changes don't trigger totals recalculation
- **Mitigation**:
  - ✅ Database trigger on po_lines → recalculate PO totals
  - ✅ API validation: Verify totals before save
  - ✅ Scheduled job: Nightly totals verification (future)
  - ✅ Unit tests: Verify calculation logic
- **Detection**: Totals mismatch report, automated tests
- **Response**: Emergency script to recalculate all PO totals

### 🟡 Medium Risks

#### Risk 4: Default Supplier Conflict → Bulk PO Failures
- **Likelihood**: Medium (data quality)
- **Impact**: 🟡 MEDIUM - Bulk PO creation partially fails
- **Root Cause**: Multiple suppliers marked as default dla same product
- **Mitigation**:
  - ✅ Unique constraint: (org_id, product_id) WHERE is_default = true
  - ✅ UI validation: Cannot set multiple defaults
  - ✅ Data migration: Fix existing duplicates
- **Detection**: Bulk PO errors[], constraint violation
- **Response**: Show clear error, prompt to fix supplier assignments

#### Risk 5: Approval Threshold Not Set → All POs Pending
- **Likelihood**: Low (admin configuration)
- **Impact**: 🟡 MEDIUM - Bottleneck, delays
- **Root Cause**: po_require_approval = true but no threshold set
- **Mitigation**:
  - ✅ Default threshold: $10,000 USD (configurable)
  - ✅ UI warning: "Approval required for all POs. Consider setting threshold."
  - ✅ Onboarding wizard: Prompt to configure threshold
- **Detection**: High pending approval count, support tickets
- **Response**: Admin adjusts threshold via settings

### 🟢 Low Risks

#### Risk 6: Excel File Format Errors → Import Failures
- **Likelihood**: Medium (user error)
- **Impact**: 🟢 LOW - User frustration, retry needed
- **Mitigation**: Clear error messages, provide template download, example data

#### Risk 7: Supplier Deletion with POs → FK Error
- **Likelihood**: Low (FK constraint)
- **Impact**: 🟢 LOW - User confusion
- **Mitigation**: UI validation, show error count, suggest archiving instead

### Assumptions

| ID | Assumption | Impact if False | Validation |
|----|------------|-----------------|------------|
| A-001 | Orgs have max 500 suppliers | Pagination needed | Query analytics |
| A-002 | POs have max 100 lines | Performance testing required | User research |
| A-003 | Bulk PO files <1000 rows | Background processing needed | Monitor file sizes |
| A-004 | Single currency per PO sufficient for MVP | Multi-currency feature required | User feedback |
| A-005 | Approval requires Manager/Admin only | Multi-level approval needed | User research |
| A-006 | Payment terms text field sufficient | Standardized list needed | User feedback |
| A-007 | Supplier lead time sufficient (no alerts) | Alert system needed | User research |

### Open Questions

| ID | Question | Decision Needed By | Owner | Impact |
|----|----------|-------------------|-------|--------|
| Q-001 | Should PO support multi-currency (convert to org currency)? | Sprint 0 | PM | Phase 2 feature |
| Q-002 | Do we need multi-level approval (2+ approvers)? | Sprint 0 | PM | Out of scope (Phase 3) |
| Q-003 | Should bulk PO support product variants (size, color)? | Sprint 0 | PM | Epic 2 dependency |
| Q-004 | Do we need supplier performance metrics (on-time, quality)? | Sprint 0 | PM | Phase 4 feature |
| Q-005 | Should PO approval send email notifications? | Sprint 0 | PM | Future enhancement |
| Q-006 | Do we allow editing PO after approval? | Sprint 0 | PM | Workflow clarification |
| Q-007 | Should supplier contact info sync with external system? | Sprint 0 | Architect | Integration scope |

## Test Strategy Summary

### Test Pyramid

```
           /\
          /E2E\ (20% - 12 tests)
         /------\
        /Integration\ (30% - 36 tests)
       /--------------\
      /    Unit Tests    \ (50% - 120 tests)
     /--------------------\
```

**Coverage Targets:**
- Unit Tests: 95% coverage (services, calculators, validators)
- Integration Tests: 70% coverage (API endpoints, DB operations)
- E2E Tests: 100% user flows (supplier, PO, bulk PO, approval)

### Unit Tests (120 tests, Vitest)

**Testing:**
- Zod validation schemas (Supplier, PO, PO Line, Bulk PO)
- Business logic (PO number generation, tax calculation, totals calculation)
- Excel parsing (xlsx library)
- React hooks (useSuppliers, usePurchaseOrders, usePOLines)
- Utility functions (grouping, formatting)

**Files:**
```
lib/api/__tests__/SupplierService.spec.ts
lib/api/__tests__/PurchaseOrderService.spec.ts
lib/api/__tests__/BulkPOService.spec.ts
lib/utils/__tests__/po-number-generator.spec.ts
lib/utils/__tests__/tax-calculator.spec.ts
lib/validation/__tests__/po-schemas.spec.ts
lib/hooks/__tests__/usePurchaseOrders.spec.ts
components/planning/__tests__/POForm.spec.tsx
```

### Integration Tests (36 tests, Vitest + Supabase Test Client)

**Testing:**
- API endpoints (GET/POST/PUT/DELETE dla suppliers, POs, lines)
- Database constraints (unique codes, FK restrictions, RLS policies)
- Triggers (PO totals recalculation)
- Bulk PO logic (grouping, draft creation)
- Approval workflow (role enforcement)

**Files:**
```
app/api/planning/__tests__/suppliers.test.ts (6 tests)
app/api/planning/__tests__/purchase-orders.test.ts (10 tests)
app/api/planning/__tests__/po-lines.test.ts (8 tests)
app/api/planning/__tests__/bulk-po.test.ts (6 tests)
app/api/planning/__tests__/po-approval.test.ts (4 tests)
app/api/planning/__tests__/planning-settings.test.ts (2 tests)
```

**Key Integration Test Scenarios:**
- Supplier creation → Tax code link → PO creation
- PO line added → Totals recalculated via trigger
- Bulk PO upload → Default supplier lookup → Draft POs created
- Approval action → Role check → Status update
- Currency inheritance → Supplier → PO → Lines

### E2E Tests (12 tests, Playwright)

**User Flows Tested:**

1. **Supplier Management** (supplier-management.e2e.ts)
   - Create supplier, assign products
   - Set default supplier per product
   - Delete supplier (blocked if has POs)

2. **Purchase Order Creation** (po-creation.e2e.ts)
   - Create PO, select supplier
   - Currency/tax inherited
   - Add multiple lines
   - Verify totals calculation

3. **Bulk PO Creation** (bulk-po-creation.e2e.ts)
   - Upload Excel file (10 products, 3 suppliers)
   - Review draft POs
   - Confirm creation

4. **Approval Workflow** (po-approval.e2e.ts)
   - Create PO >threshold → pending approval
   - Manager approves
   - Non-manager tries to approve → 403 error

5. **PO Status Lifecycle** (po-status-lifecycle.e2e.ts)
   - Draft → Submitted → Confirmed → Closed
   - Cannot edit closed PO

6. **Planning Settings** (planning-settings.e2e.ts)
   - Add custom PO status
   - Configure approval threshold
   - Toggle approval requirement

### Performance Tests

**Load Testing (k6):**
- 100 concurrent users accessing PO list
- 500 POs query (<300ms target)
- 50 PO lines per PO (<250ms target)
- Bulk PO creation (100 products) (<3s target)

**Stress Testing:**
- 10,000 POs in org (pagination)
- 1000 suppliers (index performance)
- 100 simultaneous bulk PO uploads

### Security Tests

**Automated (CI/CD):**
- RLS policy test suite (suppliers, POs, lines)
- Role enforcement (approval restricted to Manager/Admin)
- SQL injection attempts
- Currency mismatch attempts

**Manual (Pre-release):**
- Bulk upload malicious Excel file
- Currency change after PO creation
- Approval by non-manager user
- Edit closed PO

### Regression Tests

**Critical Paths (Run on every deploy):**
- Supplier creation → PO creation → Line addition → Approval flow
- Bulk PO upload → Review → Confirm
- PO totals recalculation after line change
- Status lifecycle (Draft → Closed)

**Smoke Tests (Post-deploy):**
- Supplier list loads <200ms
- PO list loads (500 POs) <300ms
- PO line calculation <50ms
- Bulk PO creation (100 products) <3s
- RLS policies active (test query fails for wrong org)

---

**Last Updated:** 2025-01-23
**Related Documents:**
- docs/epics/epic-3-planning.md (Stories 3.1-3.5, 3.17)
- docs/sprint-artifacts/EPIC_3_BATCH_PLAN_OPTIMIZED.md (Batch planning)
- docs/architecture/index-architecture.md (System architecture)
- docs/sprint-artifacts/tech-spec-epic-1.md (Template reference)
