# Module Architecture Overview

## Version
- **Date**: 2025-12-10
- **Status**: Planning Phase
- **Modules**: 11 Total (7 Core + 4 Premium/New)

---

## Purpose

This directory contains detailed architecture documentation for each of MonoPilot's 11 modules. Each module document describes:

- Module purpose and scope
- Database schema (tables, relationships)
- API endpoints and patterns
- Service layer architecture
- Frontend components and pages
- Key workflows and state machines
- Integration points with other modules

---

## Module Index

### Core Modules (Epic 1-7)

#### Epic 1: Settings Module
**File**: [settings.md](./settings.md) (Needs Documentation)

**Purpose**: Organization configuration, user management, warehouse setup

**Key Tables**: organizations, users, roles, warehouses, locations, machines

**API Endpoints**: `/api/settings/*` (13 endpoints)

**Status**: Code ~80% complete, architecture documentation needed

**Dependencies**: None (foundation module)

---

#### Epic 2: Technical Module
**File**: [technical.md](./technical.md) (Needs Documentation)

**Purpose**: Product management, BOMs, routings, allergen tracking

**Key Tables**: products, boms, bom_items, routings, routing_operations, allergens

**API Endpoints**: `/api/technical/*` (18 endpoints)

**Status**: Code ~80% complete, architecture documentation needed

**Dependencies**: Settings (warehouses, users)

**Key Patterns**:
- BOM versioning (effective dates)
- BOM snapshot pattern for work orders
- Allergen inheritance (product -> BOM -> ingredients)

---

#### Epic 3: Planning Module
**File**: [planning.md](./planning.md) (Needs Documentation)

**Purpose**: Purchase orders, transfer orders, work order planning

**Key Tables**: purchase_orders, po_lines, transfer_orders, to_lines, work_orders, wo_materials, wo_operations

**API Endpoints**: `/api/planning/*` (24 endpoints)

**Status**: Code ~70% complete, architecture documentation needed

**Dependencies**:
- Technical (products, BOMs, routings)
- Settings (warehouses, suppliers)

**Key Patterns**:
- PO approval workflow (draft -> submitted -> approved)
- BOM selection by effective date
- Material reservation vs. consumption

---

#### Epic 4: Production Module
**File**: [production.md](./production.md) (Needs Documentation)

**Purpose**: Work order execution, material consumption, output registration

**Key Tables**: wo_material_reservations, wo_outputs, wo_pauses, lp_genealogy

**API Endpoints**: `/api/production/*` (16 endpoints)

**Status**: Code ~60% complete, architecture documentation needed

**Dependencies**:
- Planning (work orders)
- Warehouse (license plates)
- Technical (BOMs, routings)

**Key Patterns**:
- Work order state machine (draft -> released -> in_progress -> completed)
- License plate reservation and consumption
- Genealogy tracking (parent LPs -> child LPs)
- Operation progress tracking

---

#### Epic 5: Warehouse Module
**File**: [warehouse.md](./warehouse.md) (Needs Documentation)

**Purpose**: License plate management, receiving (GRN), stock movements, FIFO/FEFO

**Key Tables**: license_plates, grn, grn_lines, stock_movements, lp_merges

**API Endpoints**: `/api/warehouse/*` (planned, ~20 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**:
- Settings (warehouses, locations)
- Technical (products)
- Planning (purchase orders, transfer orders)

**Key Patterns**:
- License plate (LP) as atomic inventory unit
- FIFO/FEFO picking logic
- GS1-128 barcode compliance
- ASN (Advanced Shipping Notice) integration

---

#### Epic 6: Quality Module
**File**: [quality.md](./quality.md) (Needs Documentation)

**Purpose**: QA status, quality holds, inspections, NCR, CoA, CAPA

**Key Tables**: qa_statuses, quality_holds, inspections, ncr, coa, capa

**API Endpoints**: `/api/quality/*` (planned, ~15 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**:
- Warehouse (license plates)
- Production (work orders)
- Technical (products, specifications)

**Key Patterns**:
- QA status hierarchy (pending -> passed/failed -> released/held)
- License plate hold/release workflow
- HACCP/CCP monitoring
- Corrective action tracking

---

#### Epic 7: Shipping Module
**File**: [shipping.md](./shipping.md) (Needs Documentation)

**Purpose**: Sales orders, pick lists, packing, carrier integration

**Key Tables**: sales_orders, so_lines, pick_lists, pick_list_items, shipments, carrier_tracking

**API Endpoints**: `/api/shipping/*` (planned, ~18 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**:
- Warehouse (license plates, stock)
- Quality (QA release)
- Settings (customers, carriers)

**Key Patterns**:
- Wave picking optimization
- Pick-pack-ship workflow
- GS1 label generation (SSCC-18 for pallets)
- Carrier integration (tracking, rating)

---

### Premium & New Modules (Epic 8-11)

#### Epic 8: NPD (New Product Development)
**File**: [npd.md](./npd.md) (Needs Documentation)

**Purpose**: Stage-gate workflow, trial BOMs, sample management

**Key Tables**: npd_projects, npd_stages, trial_boms, samples

**API Endpoints**: `/api/npd/*` (planned, ~12 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**:
- Technical (products, BOMs)
- Production (trial runs)

**Key Patterns**:
- Stage-gate workflow (concept -> trial -> scale-up -> launch)
- Trial BOM versioning
- Sample lifecycle

---

#### Epic 9: Finance Module
**File**: [finance.md](./finance.md) (Needs Documentation)

**Purpose**: Production costing, variance analysis, margin tracking

**Key Tables**: production_costs, cost_variance, product_margins

**API Endpoints**: `/api/finance/*` (planned, ~10 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**:
- Production (work orders, actuals)
- Technical (BOMs, standard costs)
- Planning (purchase orders)

**Key Patterns**:
- Standard vs. actual costing
- Variance analysis (material, labor, overhead)
- Margin calculation by product/customer

---

#### Epic 10: OEE Module
**File**: [oee.md](./oee.md) (Needs Documentation)

**Purpose**: OEE calculation, machine dashboard, downtime tracking

**Key Tables**: oee_metrics, machine_downtime, energy_consumption

**API Endpoints**: `/api/oee/*` (planned, ~12 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**:
- Production (work orders, operations)
- Settings (machines, lines)

**Key Patterns**:
- Real-time OEE calculation (Availability × Performance × Quality)
- Downtime categorization (planned, unplanned)
- Energy monitoring by machine/line

---

#### Epic 11: Integrations Module
**File**: [integrations.md](./integrations.md) (Needs Documentation)

**Purpose**: External system integration (ERP, EDI, portals, webhooks)

**Key Tables**: integration_configs, edi_messages, webhook_logs

**API Endpoints**: `/api/integrations/*` (planned, ~15 endpoints)

**Status**: Planned, architecture documentation needed

**Dependencies**: All modules (cross-cutting concern)

**Key Patterns**:
- Comarch Optima ERP sync (GL, costs)
- EDI gateway (X12, EDIFACT)
- Supplier/customer portals
- Webhook event bus

---

## Module Dependency Graph

```
Settings (Epic 1)
    |
    ├── Technical (Epic 2)
    |       |
    |       ├── Planning (Epic 3)
    |       |       |
    |       |       ├── Production (Epic 4)
    |       |       |       |
    |       |       |       └── OEE (Epic 10)
    |       |       |
    |       |       └── Warehouse (Epic 5)
    |       |               |
    |       |               ├── Quality (Epic 6)
    |       |               |
    |       |               └── Shipping (Epic 7)
    |       |                       |
    |       |                       └── Finance (Epic 9)
    |       |
    |       └── NPD (Epic 8)
    |
    └── Integrations (Epic 11) - connects to all

Legend:
├── Direct dependency (requires data from)
└── Cross-cutting concern (integrates with multiple)
```

---

## Common Architectural Patterns Across Modules

### 1. Multi-Tenancy (All Modules)

Every table includes `org_id`:
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  -- ... other columns
);

-- RLS policy on every table
CREATE POLICY "Tenant isolation" ON table_name
  USING (org_id = auth.jwt() ->> 'org_id');
```

### 2. API Route Structure (All Modules)

```
/api/{module}/{resource}                    # List, Create
/api/{module}/{resource}/{id}               # Get, Update, Delete
/api/{module}/{resource}/{id}/{action}      # State transitions
```

Examples:
- `POST /api/production/work-orders/{id}/start`
- `POST /api/warehouse/license-plates/{id}/move`
- `POST /api/quality/inspections/{id}/approve`

### 3. Service Layer Pattern (All Modules)

```typescript
// lib/services/{module}-service.ts
export async function createResource(input: CreateInput): Promise<ServiceResult<Resource>> {
  // 1. Get org_id from session
  const orgId = await getCurrentOrgId()

  // 2. Validate with Zod
  const validated = createResourceSchema.parse(input)

  // 3. Business logic
  // ...

  // 4. Database operation
  const { data, error } = await supabase
    .from('resources')
    .insert({ org_id: orgId, ...validated })

  return { success: true, data }
}
```

### 4. State Machine Pattern (Planning, Production, Quality, Shipping)

Modules with workflow states use consistent state transition API:

```typescript
// State machine definition
const states = {
  draft: ['submit'],
  submitted: ['approve', 'reject'],
  approved: ['start', 'cancel'],
  // ...
}

// Transition validation
function validateTransition(currentState: string, action: string): boolean {
  return states[currentState]?.includes(action) ?? false
}
```

### 5. Audit Trail (All Modules)

Standard audit fields on all tables:
```sql
created_at TIMESTAMPTZ DEFAULT now(),
created_by UUID REFERENCES users(id),
updated_at TIMESTAMPTZ DEFAULT now(),
updated_by UUID REFERENCES users(id)
```

---

## Module Implementation Status

| Epic | Module | PRD Lines | DB Tables | API Endpoints | Code % | Doc Status |
|------|--------|-----------|-----------|---------------|--------|------------|
| 1 | Settings | 703 | 6 | 13 | 80% | Needs Doc |
| 2 | Technical | 772 | 8 | 18 | 80% | Needs Doc |
| 3 | Planning | 2,793 | 10 | 24 | 70% | Needs Doc |
| 4 | Production | 1,328 | 5 | 16 | 60% | Needs Doc |
| 5 | Warehouse | 1,147 | 6 | ~20 (planned) | 0% | Needs Doc |
| 6 | Quality | 731 | 6 | ~15 (planned) | 0% | Needs Doc |
| 7 | Shipping | 1,345 | 8 | ~18 (planned) | 0% | Needs Doc |
| 8 | NPD | 1,004 | 4 | ~12 (planned) | 0% | Needs Doc |
| 9 | Finance | 892 | 3 | ~10 (planned) | 0% | Needs Doc |
| 10 | OEE | 914 | 3 | ~12 (planned) | 0% | Needs Doc |
| 11 | Integrations | 1,647 | 3 | ~15 (planned) | 0% | Needs Doc |

---

## Module Documentation Template

Each module document should follow this structure:

```markdown
# {Module Name} Architecture

## Overview
- Module purpose
- Key capabilities
- Related PRD

## Database Schema
- Tables list with relationships
- Key indexes
- RLS policies

## API Endpoints
- Endpoint list with methods
- Request/response schemas
- Auth requirements

## Service Layer
- Service classes
- Key business logic
- Validation rules

## Frontend Components
- Pages and routes
- Reusable components
- State management

## Workflows
- State machines
- Process flows
- Integration points

## Testing Strategy
- Unit test coverage
- Integration tests
- E2E test scenarios

## Performance Considerations
- Caching strategy
- Query optimization
- Scalability notes

## Security
- Authorization rules
- Data validation
- Audit logging
```

---

## Next Steps

1. **Create module architecture documents** for implemented modules (Settings, Technical, Planning, Production)
2. **Document key patterns** in each module
3. **Cross-reference** with PRDs and implementation code
4. **Review and validate** with module leads

---

## References

- Main Architecture Index: [../README.md](../README.md)
- PRD Index: [../../product/prd.md](../../product/prd.md)
- Database Schema: [../../../.claude/TABLES.md](../../../.claude/TABLES.md)
- Code Patterns: [../../../.claude/PATTERNS.md](../../../.claude/PATTERNS.md)

---

**Last Updated**: 2025-12-10
**Status**: Index created, module docs needed
