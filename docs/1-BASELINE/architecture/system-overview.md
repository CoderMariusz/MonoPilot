# MonoPilot System Architecture Overview

## Version
- **Date**: 2025-12-10
- **Status**: Current Production Architecture

---

## High-Level Architecture

```
+------------------------------------------------------------------+
|                         BROWSER CLIENT                             |
|  +--------------------+  +--------------------+  +---------------+ |
|  |   Next.js 15 App   |  |  ShadCN UI / TW   |  |  React 19     | |
|  |  (App Router SSR)  |  |   Components      |  |  Client State | |
|  +--------------------+  +--------------------+  +---------------+ |
+----------------------------------+-----------------------------------+
                                   |
                                   | HTTPS (Vercel Edge)
                                   v
+------------------------------------------------------------------+
|                         NEXT.JS API LAYER                          |
|  +--------------------+  +--------------------+  +---------------+ |
|  |   API Routes       |  |   Zod Validation  |  |  Auth Checks  | |
|  | /api/[module]/...  |  |   18 Schema Files |  |  Role-based   | |
|  +--------------------+  +--------------------+  +---------------+ |
|                                   |                                 |
|  +--------------------+  +--------------------+                     |
|  |  Service Layer     |  |  Type Definitions |                     |
|  |  35+ Services      |  |  lib/types/       |                     |
|  +--------------------+  +--------------------+                     |
+----------------------------------+-----------------------------------+
                                   |
                                   | Supabase Client (REST + Realtime)
                                   v
+------------------------------------------------------------------+
|                         SUPABASE PLATFORM                          |
|  +--------------------+  +--------------------+  +---------------+ |
|  |   PostgreSQL 15    |  |   Auth (JWT)      |  |  Edge Funcs   | |
|  |   43 Tables        |  |   Supabase Auth   |  |  Webhooks     | |
|  +--------------------+  +--------------------+  +---------------+ |
|                                   |                                 |
|  +--------------------+  +--------------------+                     |
|  |   RLS Policies     |  |   DB Functions    |                     |
|  |   ~100 Policies    |  |   RPCs (trace,    |                     |
|  |   org_id isolation |  |   merge, etc.)    |                     |
|  +--------------------+  +--------------------+                     |
+------------------------------------------------------------------+
```

---

## Component Architecture

### Frontend Layer (`apps/frontend/`)

```
apps/frontend/
  app/
    (authenticated)/      # Protected routes with auth
      dashboard/          # Main dashboard
      settings/           # Epic 1: Org config
      technical/          # Epic 2: Products, BOMs
      planning/           # Epic 3: POs, TOs, WOs
      production/         # Epic 4: WO execution
      warehouse/          # Epic 5: LP, inventory
      quality/            # Epic 6: QA (planned)
      shipping/           # Epic 7: Orders (planned)
    api/                  # API Routes (~99 endpoints)
      [module]/           # Module-scoped APIs
        [resource]/       # CRUD operations
          [id]/           # Instance operations
            [action]/     # State transitions

  lib/
    services/             # Business logic (35 services)
    validation/           # Zod schemas (18 files)
    supabase/             # Supabase clients
    types/                # TypeScript types
    hooks/                # React hooks

  components/             # UI components (70+)
    ui/                   # ShadCN primitives
    [module]/             # Module-specific components
```

### Data Layer (Supabase)

```
Database Schema (43 tables)
  +-- Settings Module
  |     organizations, users, roles, warehouses, locations, machines
  +-- Technical Module
  |     products, boms, bom_items, bom_item_alternatives
  |     routings, routing_operations, allergens, product_allergens
  +-- Planning Module
  |     purchase_orders, po_lines, transfer_orders, to_lines
  |     work_orders, wo_materials, wo_operations, suppliers
  +-- Production Module
  |     wo_material_reservations, wo_outputs, wo_pauses
  |     lp_genealogy (traceability)
  +-- Warehouse Module
  |     license_plates, grn, stock_movements
  +-- Quality Module (planned)
  |     qa_statuses, holds, inspections, ncr
  +-- Shipping Module (planned)
        sales_orders, so_lines, shipments
```

---

## Key Architectural Patterns

### 1. Multi-Tenancy Pattern

Every table includes `org_id` with RLS enforcement:

```sql
-- Example RLS policy (on all tables)
CREATE POLICY "Tenant isolation" ON products
  USING (org_id = auth.jwt() ->> 'org_id');
```

Service layer always filters by org_id:
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('org_id', orgId)  // Always present
```

### 2. License Plate (LP) Inventory Model

```
+-------------------+
|  License Plate    |
|  (atomic unit)    |
+-------------------+
| - lp_number       |  GS1-128 compliant
| - product_id      |
| - quantity        |  Immutable on creation
| - current_qty     |  Decrements on consumption
| - status          |  available|reserved|consumed|shipped|merged|quarantine
| - expiry_date     |  FEFO support
| - location_id     |  Where it is
+-------------------+
        |
        | lp_genealogy
        v
+-------------------+
|  Parent -> Child  |  Full traceability
|  production link  |  Forward/backward trace
+-------------------+
```

No loose quantity tracking - all inventory is LP-based.

### 3. BOM Snapshot Pattern

```
BOM (master)                    Work Order
+----------------+              +------------------+
| version: v1.2  |  snapshot    | bom_snapshot_id  |
| effective_date |  --------->  | wo_materials[]   |  Immutable copy
| bom_items[]    |  at WO       | wo_operations[]  |  of BOM at creation
+----------------+  creation    +------------------+
```

Work orders capture BOM state at creation time for regulatory compliance.

### 4. API Route Pattern

```
/api/{module}/{resource}                    # List, Create
/api/{module}/{resource}/{id}               # Get, Update, Delete
/api/{module}/{resource}/{id}/{action}      # State transitions

Examples:
  POST /api/production/work-orders/{id}/start
  POST /api/production/work-orders/{id}/pause
  POST /api/production/work-orders/{id}/complete
  POST /api/planning/purchase-orders/{id}/approve
```

### 5. Service Layer Pattern

All business logic in `lib/services/*-service.ts`:

```typescript
// Standard service structure
export async function createWorkOrder(input: CreateWorkOrderInput): Promise<ServiceResult<WorkOrder>> {
  // 1. Get org_id from session
  const orgId = await getCurrentOrgId()

  // 2. Validate input with Zod
  const validated = createWorkOrderSchema.parse(input)

  // 3. Business logic (BOM selection, etc.)
  const bomId = await getActiveBOMForProduct(input.product_id)

  // 4. Database operation
  const { data, error } = await supabase
    .from('work_orders')
    .insert({ org_id: orgId, ...validated })

  // 5. Related operations (copy BOM items, routing)
  await copyBOMToWOMaterials(data.id, bomId)

  return { success: true, data }
}
```

---

## Authentication & Authorization

### Auth Flow

```
Browser -> Supabase Auth -> JWT (org_id claim) -> API Route -> RLS
```

### Role Hierarchy (10 roles)

```
admin            Full access
manager          Department management
production_mgr   Production operations
warehouse_mgr    Inventory operations
quality_mgr      QA operations
operator         Production floor
picker           Warehouse picking
viewer           Read-only
guest            Limited access
api              System integrations
```

Role checks in API routes:
```typescript
const allowedRoles = ['admin', 'manager', 'production_mgr', 'operator']
if (!allowedRoles.includes(currentUser.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## Data Flow Examples

### Work Order Lifecycle

```
1. CREATE (draft)
   └─> Auto-select BOM based on date
   └─> Copy BOM items to wo_materials
   └─> Copy routing to wo_operations

2. RELEASE (released)
   └─> Validate materials available
   └─> Generate WO number: WO-YYYYMMDD-NNNN

3. START (in_progress)
   └─> Record actual_start_date
   └─> Allow material reservations

4. RESERVE MATERIALS
   └─> LP status: available -> reserved
   └─> Create lp_genealogy entry

5. REGISTER OUTPUT
   └─> Create new output LP
   └─> Link genealogy: parent LP -> child LP
   └─> Consume materials

6. COMPLETE (completed)
   └─> Record actual_end_date
   └─> Finalize quantities
```

### Traceability Query

```
Forward Trace (find affected products):
  trace_forward(lp_id) -> All child LPs produced from this material

Backward Trace (find root cause):
  trace_backward(lp_id) -> All parent LPs that contributed to this product
```

---

## Module Dependencies

```
                    Settings (Epic 1)
                         |
                    Technical (Epic 2)
                         |
         +---------------+---------------+
         |                               |
    Planning (Epic 3)              Warehouse (Epic 5)
         |                               |
   Production (Epic 4)             Quality (Epic 6)
         |                               |
      OEE (Epic 10)               Shipping (Epic 7)
                                         |
                                   Finance (Epic 9)

  Integrations (Epic 11) - connects to all modules
  NPD (Epic 8) - connects to Technical
```

---

## Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 15.5 | SSR, API routes, App Router |
| UI | React 19 + ShadCN | Modern components, accessibility |
| Styling | TailwindCSS | Rapid development, consistency |
| Validation | Zod | Runtime validation, type inference |
| Backend | Supabase | PostgreSQL + Auth + RLS in one |
| Database | PostgreSQL 15 | Industry standard, JSON support |
| Auth | Supabase Auth | JWT, MFA ready, OAuth support |
| Hosting | Vercel | Edge functions, auto-scaling |
| Testing | Vitest + Playwright | Unit + E2E coverage |

---

## Scalability Considerations

### Current Design

- **Single Supabase instance**: Handles <1000 concurrent users
- **RLS per-query**: Tenant isolation at DB level
- **Stateless API**: Horizontal scaling via Vercel

### Future Scaling Path

1. **Read replicas**: For reporting/analytics
2. **Redis cache**: For session/config caching
3. **Queue processing**: For async operations (MRP, reports)
4. **CDN**: For static assets and images

---

## Security Architecture

1. **Network**: HTTPS only, Vercel edge
2. **Authentication**: Supabase JWT, session tokens
3. **Authorization**: Role-based + RLS double-check
4. **Data isolation**: org_id on all tables, RLS policies
5. **Input validation**: Zod schemas on all endpoints
6. **Audit trail**: created_by, updated_by, timestamps

---

## References

- PRD Index: `docs/1-BASELINE/product/prd.md`
- Database Schema: `supabase/migrations/`
- API Patterns: `apps/frontend/app/api/`
- Services: `apps/frontend/lib/services/`
